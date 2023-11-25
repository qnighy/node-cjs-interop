mod options;
mod package_name;

use std::collections::HashMap;
use std::mem;

pub use crate::options::Options as TransformOptions;
use crate::{options::Options, package_name::get_package_name};
use swc_core::common::comments::{Comment, CommentKind, Comments};
use swc_core::common::{Mark, Span, Spanned, DUMMY_SP};
use swc_core::ecma::ast::*;
use swc_core::ecma::atoms::{js_word, JsWord};
use swc_core::ecma::visit::{as_folder, noop_visit_mut_type, FoldWith, VisitMut, VisitMutWith};
use swc_core::plugin::metadata::TransformPluginProgramMetadata;
use swc_core::plugin::plugin_transform;

#[derive(Debug)]
pub struct TransformVisitor<C: Comments> {
    comments: C,
    options: Options,
}

impl<C: Comments> TransformVisitor<C> {
    pub fn new(comments: C, options: Options) -> Self {
        Self { comments, options }
    }
}

impl<C: Comments> VisitMut for TransformVisitor<C> {
    fn visit_mut_script(&mut self, _n: &mut Script) {
        // Ignore
    }
    fn visit_mut_module(&mut self, n: &mut Module) {
        ModuleVisitor::new(self).process_module(n);
    }
}

#[derive(Debug)]
struct ModuleVisitor<'a, C: Comments> {
    parent: &'a TransformVisitor<C>,
    replace_map: HashMap<Id, PseudoImport>,
    import_helper_name: Option<Ident>,
    import_helper_name_t: Option<Ident>,
    prepend_body: Vec<ModuleItem>,
}

impl<'a, C: Comments> ModuleVisitor<'a, C> {
    fn new(parent: &'a TransformVisitor<C>) -> Self {
        Self {
            parent,
            replace_map: HashMap::new(),
            import_helper_name: None,
            import_helper_name_t: None,
            prepend_body: Vec::new(),
        }
    }

    fn process_module(&mut self, module: &mut Module) {
        for stmt in &mut module.body {
            self.process_module_item(stmt);
        }
        self.visit_mut_module(module);
        if !self.replace_map.is_empty() {
            module.visit_mut_with(&mut ModuleRefRewriter {
                replace_map: &self.replace_map,
            });
        }
        let mut prepend_body = mem::take(&mut self.prepend_body);
        prepend_body.reverse();
        module.body.splice(0..0, prepend_body);
    }

    fn process_module_item(&mut self, stmt: &mut ModuleItem) {
        if let ModuleItem::ModuleDecl(ModuleDecl::Import(stmt)) = stmt {
            let Some(pkg_type) = self.parent.options.applicable_source_type(&stmt.src.value) else {
                return;
            };
            // Should have been removed by transform-typescript. Just in case.
            if stmt.type_only {
                return;
            }
            if is_cjs_annotated(stmt, &self.parent.comments) {
                return;
            }
            if stmt.specifiers.is_empty() {
                return;
            }

            let macro_span = DUMMY_SP.apply_mark(Mark::new());
            let existing_ns_import = stmt
                .specifiers
                .iter()
                .find_map(|spec| spec.as_namespace())
                .map(|spec| spec.local.clone());
            let ns_import = if let Some(ns_import) = existing_ns_import {
                ns_import
            } else {
                Ident::new(JsWord::from("_ns"), macro_span)
            };

            for specifier in &stmt.specifiers {
                let expr = match specifier {
                    // ns.default
                    ImportSpecifier::Default(_) => PseudoImport::Member(
                        ns_import.clone(),
                        Ident::new(js_word!("default"), DUMMY_SP),
                    ),
                    ImportSpecifier::Named(specifier) => match &specifier.imported {
                        // ns["named"]
                        Some(ModuleExportName::Str(imported)) => {
                            PseudoImport::Member2(ns_import.clone(), imported.clone())
                        }
                        // ns.named
                        Some(ModuleExportName::Ident(imported)) => {
                            PseudoImport::Member(ns_import.clone(), imported.clone())
                        }
                        // ns.named
                        None => PseudoImport::Member(ns_import.clone(), specifier.local.clone()),
                    },
                    // No need to replace
                    ImportSpecifier::Namespace(_) => continue,
                };
                let local_id = match specifier {
                    ImportSpecifier::Named(specifier) => specifier.local.to_id(),
                    ImportSpecifier::Default(specifier) => specifier.local.to_id(),
                    ImportSpecifier::Namespace(specifier) => specifier.local.to_id(),
                };
                self.replace_map.insert(local_id, expr);
            }

            let import_helper = self.get_import_helper(pkg_type);

            // import ... from "source";
            // ->
            // import * as moduleOrig from "source";
            // const module = _interopImportCJSNamespace(moduleOrig);
            let import_original_name = Ident::new(JsWord::from("_nsOrig"), macro_span);
            self.prepend_body.push(
                Stmt::Decl(Decl::Var(Box::new(VarDecl {
                    span: Span::dummy_with_cmt(),
                    kind: VarDeclKind::Const,
                    declare: false,
                    decls: vec![VarDeclarator {
                        span: DUMMY_SP,
                        name: ns_import.into(),
                        init: Some(Box::new(
                            CallExpr {
                                span: DUMMY_SP,
                                callee: Box::new(Expr::Ident(import_helper)).into(),
                                args: if self.parent.options.loose {
                                    vec![
                                        Expr::Ident(import_original_name.clone()).into(),
                                        Expr::Lit(Lit::Bool(true.into())).into(),
                                    ]
                                } else {
                                    vec![Expr::Ident(import_original_name.clone()).into()]
                                },
                                type_args: None,
                            }
                            .into(),
                        )),
                        definite: false,
                    }],
                })))
                .into(),
            );

            stmt.specifiers = vec![ImportStarAsSpecifier {
                span: DUMMY_SP,
                local: import_original_name,
            }
            .into()];
            annotate_as_cjs(stmt, &self.parent.comments);
        }
    }

    fn process_dynamic_import(&mut self, mut call: ImportExprCtx<'_>) {
        let Some(source) = call.as_call().args[0].expr.as_lit().and_then(|lit| {
            if let Lit::Str(s) = lit {
                Some(s)
            } else {
                None
            }
        }) else {
            return;
        };
        let Some(pkg_type) = self.parent.options.applicable_source_type(&source.value) else {
            return;
        };
        let import_helper = self.get_import_helper(pkg_type);

        if is_cjs_annotated(call.as_call_wrapper(), &self.parent.comments) {
            return;
        }
        match &mut call {
            ImportExprCtx::AwaitImport(awaiter_path) => {
                if is_cjs_annotated(*awaiter_path, &self.parent.comments) {
                    return;
                }
                // await import("source")
                // -> _interopImportCJSNamespace(await import("source"))
                let awaiter =
                    mem::replace(*awaiter_path, Expr::Invalid(Invalid { span: DUMMY_SP }));
                annotate_as_cjs(&awaiter, &self.parent.comments);
                **awaiter_path = Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Ident(import_helper.clone()))),
                    args: if pkg_type != PackageType::TsTwisted && self.parent.options.loose {
                        vec![awaiter.into(), Expr::Lit(Lit::Bool(true.into())).into()]
                    } else {
                        vec![awaiter.into()]
                    },
                    type_args: None,
                });
            }
            ImportExprCtx::Import(call_path) => {
                // import("source")
                // -> import("source").then((ns) => _interopImportCJSNamespace(ns))
                // NOTE: strictly speaking, it does not preserve scheduling semantics of the Promise;
                //       the transform delays the execution by one cycle of microtask queue.
                //       We could add other heuristics for cases like import("source").then(...)
                //       but ultimately we cannot do so when we are not sure where the Promise goes to.
                //       As the effect is fairly minor (do not depend on microtask cycle count!),
                //       we just leave it as is for now.
                let ns = Ident::new(JsWord::from("ns"), DUMMY_SP);
                let call = mem::replace(*call_path, Expr::Invalid(Invalid { span: DUMMY_SP }));
                annotate_as_cjs(&call, &self.parent.comments);
                **call_path = Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                        span: DUMMY_SP,
                        // Explicit parentheses to get room for the #__CJS__ comment -- but seems not working
                        obj: Box::new(Expr::Paren(ParenExpr {
                            span: DUMMY_SP,
                            expr: Box::new(call),
                        })),
                        prop: MemberProp::Ident(Ident::new(JsWord::from("then"), DUMMY_SP)),
                    }))),
                    args: vec![Expr::Arrow(ArrowExpr {
                        span: DUMMY_SP,
                        params: vec![Pat::Ident(ns.clone().into())],
                        body: Box::new(BlockStmtOrExpr::Expr(Box::new(
                            CallExpr {
                                span: DUMMY_SP,
                                callee: Callee::Expr(Box::new(Expr::Ident(import_helper.clone()))),
                                args: if pkg_type != PackageType::TsTwisted
                                    && self.parent.options.loose
                                {
                                    vec![
                                        Expr::Ident(ns.clone()).into(),
                                        Expr::Lit(Lit::Bool(true.into())).into(),
                                    ]
                                } else {
                                    vec![Expr::Ident(ns.clone()).into()]
                                },
                                type_args: None,
                            }
                            .into(),
                        ))),
                        is_async: false,
                        is_generator: false,
                        type_params: None,
                        return_type: None,
                    })
                    .into()],
                    type_args: None,
                });
            }
        }
    }

    fn get_import_helper(&mut self, pkg_type: PackageType) -> Ident {
        if let Some(helper) = match pkg_type {
            PackageType::Normal => &self.import_helper_name,
            PackageType::TsTwisted => &self.import_helper_name_t,
        } {
            return helper.clone();
        }

        let macro_span = DUMMY_SP.apply_mark(Mark::new());
        let helper = Ident::new(
            JsWord::from(match pkg_type {
                PackageType::Normal => "_interopImportCJSNamespace",
                PackageType::TsTwisted => "_interopImportCJSNamespaceT",
            }),
            macro_span,
        );

        if self.parent.options.use_runtime {
            // import {
            //   interopImportCJSNamespace as _interopImportCJSNamespace,
            // } from "node-cjs-interop";
            self.prepend_body.push(
                ModuleDecl::Import(ImportDecl {
                    span: DUMMY_SP,
                    specifiers: vec![ImportNamedSpecifier {
                        span: DUMMY_SP,
                        local: helper.clone(),
                        imported: Some(
                            Ident::new(JsWord::from("interopImportCJSNamespace"), DUMMY_SP).into(),
                        ),
                        is_type_only: false,
                    }
                    .into()],
                    src: Box::new(Str::from("node-cjs-interop")),
                    type_only: false,
                    with: None,
                })
                .into(),
            );

            *match pkg_type {
                PackageType::Normal => &mut self.import_helper_name,
                PackageType::TsTwisted => &mut self.import_helper_name_t,
            } = Some(helper.clone());
            return helper;
        }

        let fn_span = DUMMY_SP.apply_mark(Mark::new());
        let ns = Ident::new(JsWord::from("ns"), fn_span);
        let loose = Ident::new(JsWord::from("loose"), fn_span);
        let ns_default = Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Box::new(ns.clone().into()),
            prop: Ident::new(js_word!("default"), DUMMY_SP).into(),
        });
        match pkg_type {
            PackageType::TsTwisted => {
                // function interopImportCJSNamespaceT(ns) {
                //   return ns.default && ns.default.__esModule ? ns : {
                //     ...ns,
                //     default: ns
                //   };
                // }
                self.prepend_body.push(
                    Stmt::Decl(Decl::Fn(FnDecl {
                        ident: helper.clone(),
                        declare: false,
                        function: Box::new(Function {
                            params: vec![ns.clone().into()],
                            decorators: vec![],
                            span: Span::dummy_with_cmt(),
                            body: Some(BlockStmt {
                                span: DUMMY_SP,
                                stmts: vec![ReturnStmt {
                                    span: DUMMY_SP,
                                    arg: Some(Box::new(
                                        CondExpr {
                                            span: DUMMY_SP,
                                            test: Box::new(
                                                BinExpr {
                                                    span: DUMMY_SP,
                                                    op: BinaryOp::LogicalAnd,
                                                    left: Box::new(ns_default.clone()),
                                                    right: Box::new(
                                                        MemberExpr {
                                                            span: DUMMY_SP,
                                                            obj: Box::new(ns_default.clone()),
                                                            prop: Ident::new(
                                                                JsWord::from("__esModule"),
                                                                DUMMY_SP,
                                                            )
                                                            .into(),
                                                        }
                                                        .into(),
                                                    ),
                                                }
                                                .into(),
                                            ),
                                            cons: Box::new(ns.clone().into()),
                                            alt: Box::new(
                                                ObjectLit {
                                                    span: DUMMY_SP,
                                                    props: vec![
                                                        PropOrSpread::Spread(SpreadElement {
                                                            dot3_token: DUMMY_SP,
                                                            expr: Box::new(ns.clone().into()),
                                                        }),
                                                        PropOrSpread::Prop(Box::new(
                                                            KeyValueProp {
                                                                key: PropName::Ident(Ident::new(
                                                                    JsWord::from("default"),
                                                                    DUMMY_SP,
                                                                )),
                                                                value: Box::new(ns.clone().into()),
                                                            }
                                                            .into(),
                                                        )),
                                                    ],
                                                }
                                                .into(),
                                            ),
                                        }
                                        .into(),
                                    )),
                                }
                                .into()],
                            }),
                            is_generator: false,
                            is_async: false,
                            type_params: None,
                            return_type: None,
                        }),
                    }))
                    .into(),
                );
            }
            PackageType::Normal => {
                // function interopImportCJSNamespace(ns, loose) {
                //   return (loose || ns.__esModule) && ns.default && ns.default.__esModule ? ns.default : ns;
                // }
                self.prepend_body.push(
                    Stmt::Decl(Decl::Fn(FnDecl {
                        ident: helper.clone(),
                        declare: false,
                        function: Box::new(Function {
                            params: vec![ns.clone().into(), loose.clone().into()],
                            decorators: vec![],
                            span: Span::dummy_with_cmt(),
                            body: Some(BlockStmt {
                                span: DUMMY_SP,
                                stmts: vec![ReturnStmt {
                                    span: DUMMY_SP,
                                    arg: Some(Box::new(
                                        CondExpr {
                                            span: DUMMY_SP,
                                            test: Box::new(
                                                BinExpr {
                                                    span: DUMMY_SP,
                                                    op: BinaryOp::LogicalAnd,
                                                    left: Box::new(
                                                        BinExpr {
                                                            span: DUMMY_SP,
                                                            op: BinaryOp::LogicalAnd,
                                                            left: Box::new(
                                                                BinExpr {
                                                                    span: DUMMY_SP,
                                                                    op: BinaryOp::LogicalOr,
                                                                    left: Box::new(
                                                                        loose.clone().into(),
                                                                    ),
                                                                    right: Box::new(
                                                                        MemberExpr {
                                                                            span: DUMMY_SP,
                                                                            obj: Box::new(
                                                                                ns.clone().into(),
                                                                            ),
                                                                            prop: Ident::new(
                                                                                JsWord::from(
                                                                                    "__esModule",
                                                                                ),
                                                                                DUMMY_SP,
                                                                            )
                                                                            .into(),
                                                                        }
                                                                        .into(),
                                                                    ),
                                                                }
                                                                .into(),
                                                            ),
                                                            right: Box::new(ns_default.clone()),
                                                        }
                                                        .into(),
                                                    ),
                                                    right: Box::new(
                                                        MemberExpr {
                                                            span: DUMMY_SP,
                                                            obj: Box::new(ns_default.clone()),
                                                            prop: Ident::new(
                                                                JsWord::from("__esModule"),
                                                                DUMMY_SP,
                                                            )
                                                            .into(),
                                                        }
                                                        .into(),
                                                    ),
                                                }
                                                .into(),
                                            ),
                                            cons: Box::new(ns_default),
                                            alt: Box::new(ns.into()),
                                        }
                                        .into(),
                                    )),
                                }
                                .into()],
                            }),
                            is_generator: false,
                            is_async: false,
                            type_params: None,
                            return_type: None,
                        }),
                    }))
                    .into(),
                );
            }
        }
        self.import_helper_name = Some(helper.clone());
        helper
    }
}

enum ImportExprCtx<'a> {
    Import(&'a mut Expr),
    AwaitImport(&'a mut Expr),
}

impl<'a> ImportExprCtx<'a> {
    fn as_call(&self) -> &CallExpr {
        self.as_call_wrapper().as_call().unwrap()
    }
    fn as_call_wrapper(&self) -> &Expr {
        match self {
            ImportExprCtx::Import(call) => call,
            ImportExprCtx::AwaitImport(awaiter) => &awaiter.as_await_expr().unwrap().arg,
        }
    }
    // fn as_mut_call(&mut self) -> &mut CallExpr {
    //     self.as_mut_call_wrapper().as_mut_call().unwrap()
    // }
    // fn as_mut_call_wrapper(&mut self) -> &mut Expr {
    //     match self {
    //         ImportExprCtx::Import(call) => call,
    //         ImportExprCtx::AwaitImport(awaiter) => &mut awaiter.as_mut_await_expr().unwrap().arg,
    //     }
    // }
}

impl<'a, C: Comments> VisitMut for ModuleVisitor<'a, C> {
    noop_visit_mut_type!();

    fn visit_mut_expr(&mut self, n: &mut Expr) {
        if let Some(awaiter) = n.as_mut_await_expr() {
            if let Some(call) = awaiter.arg.as_mut_call() {
                if is_import_expr(call) {
                    // Skip processing the call expression
                    call.visit_mut_children_with(self);
                    self.process_dynamic_import(ImportExprCtx::AwaitImport(n));
                    return;
                }
            }
        }
        n.visit_mut_children_with(self);
        if let Some(call) = n.as_mut_call() {
            if is_import_expr(call) {
                self.process_dynamic_import(ImportExprCtx::Import(n));
            }
        }
    }
}

fn is_import_expr(expr: &CallExpr) -> bool {
    expr.callee.is_import() && !expr.args.is_empty() && expr.args[0].spread.is_none()
}

#[derive(Debug, Clone)]
enum PseudoImport {
    #[allow(dead_code)]
    Ident(Ident),
    Member(Ident, Ident),
    Member2(Ident, Str),
}

impl PseudoImport {
    fn to_expr(&self) -> Expr {
        match self {
            PseudoImport::Ident(x) => x.clone().into(),
            PseudoImport::Member(obj, prop) => MemberExpr {
                span: DUMMY_SP,
                obj: Box::new(obj.clone().into()),
                prop: prop.clone().into(),
            }
            .into(),
            PseudoImport::Member2(obj, prop) => MemberExpr {
                span: DUMMY_SP,
                obj: Box::new(obj.clone().into()),
                prop: ComputedPropName {
                    span: DUMMY_SP,
                    expr: Box::new(Lit::Str(prop.clone()).into()),
                }
                .into(),
            }
            .into(),
        }
    }

    fn to_expr_value(&self) -> Expr {
        let expr = self.to_expr();
        if matches!(
            self,
            PseudoImport::Member(_, _) | PseudoImport::Member2(_, _)
        ) {
            // (0, foo.bar)
            SeqExpr {
                span: DUMMY_SP,
                exprs: vec![Box::new(Lit::Num(0.into()).into()), Box::new(expr)],
            }
            .into()
        } else {
            expr
        }
    }

    fn to_jsx_object(&self) -> JSXObject {
        match self {
            PseudoImport::Ident(x) => x.clone().into(),
            PseudoImport::Member(obj, prop) => Box::new(JSXMemberExpr {
                obj: obj.clone().into(),
                prop: prop.clone(),
            })
            .into(),
            PseudoImport::Member2(..) => {
                panic!("Unimplemented: arbitrary Unicode import + JSX")
            }
        }
    }

    fn to_jsx_element_name(&self) -> JSXElementName {
        match self {
            PseudoImport::Ident(x) => x.clone().into(),
            PseudoImport::Member(obj, prop) => JSXMemberExpr {
                obj: obj.clone().into(),
                prop: prop.clone(),
            }
            .into(),
            PseudoImport::Member2(..) => {
                panic!("Unimplemented: arbitrary Unicode import + JSX")
            }
        }
    }
}

#[derive(Debug)]
struct ModuleRefRewriter<'a> {
    replace_map: &'a HashMap<Id, PseudoImport>,
}

// https://github.com/swc-project/swc/blob/v1.2.216/crates/swc_ecma_transforms_module/src/module_ref_rewriter.rs
impl<'a> VisitMut for ModuleRefRewriter<'a> {
    noop_visit_mut_type!();

    fn visit_mut_prop(&mut self, n: &mut Prop) {
        match n {
            Prop::Shorthand(shorthand) => {
                // { foo } -> { foo: bar.baz }
                if let Some(expr) = self.replace_map.get(&shorthand.to_id()) {
                    let expr = expr.to_expr();
                    *n = KeyValueProp {
                        key: shorthand.clone().into(),
                        value: Box::new(expr),
                    }
                    .into()
                }
            }
            _ => n.visit_mut_children_with(self),
        }
    }

    fn visit_mut_expr(&mut self, n: &mut Expr) {
        match n {
            Expr::Ident(_) => {
                // foo -> bar.baz
                self.replace_ident(n, false);
            }

            _ => n.visit_mut_children_with(self),
        };
    }

    fn visit_mut_callee(&mut self, n: &mut Callee) {
        match n {
            Callee::Expr(e) if e.is_ident() => {
                // foo() -> (0, bar.baz)()
                self.replace_ident(e, true);
            }

            _ => n.visit_mut_children_with(self),
        }
    }

    fn visit_mut_opt_call(&mut self, n: &mut OptCall) {
        if n.callee.is_ident() {
            // foo?.() -> (0, bar.baz)?.()
            self.replace_ident(&mut n.callee, true);
        }
        n.visit_mut_children_with(self);
    }

    fn visit_mut_tagged_tpl(&mut self, n: &mut TaggedTpl) {
        if n.tag.is_ident() {
            // foo`` -> (0, bar.baz)``
            self.replace_ident(&mut n.tag, true);
        }
        n.visit_mut_children_with(self);
    }

    fn visit_mut_jsx_element_name(&mut self, n: &mut JSXElementName) {
        match n {
            // <Foo /> -> <bar.baz />
            JSXElementName::Ident(ref_ident)
                if !(ref_ident.as_ref() as &str)
                    .starts_with(|ch: char| ch.is_ascii_lowercase()) =>
            {
                if let Some(expr) = self.replace_map.get(&ref_ident.to_id()) {
                    *n = expr.to_jsx_element_name();
                }
            }
            _ => n.visit_mut_children_with(self),
        }
    }

    fn visit_mut_jsx_object(&mut self, n: &mut JSXObject) {
        match n {
            // <foo.bar /> -> <baz.quux.bar />
            JSXObject::Ident(ref_ident) => {
                if let Some(expr) = self.replace_map.get(&ref_ident.to_id()) {
                    *n = expr.to_jsx_object();
                }
            }
            _ => n.visit_mut_children_with(self),
        }
    }
}

impl<'a> ModuleRefRewriter<'a> {
    fn replace_ident(&self, n: &mut Expr, callee: bool) {
        let ref_ident = n.as_ident().unwrap();
        if let Some(expr) = self.replace_map.get(&ref_ident.to_id()) {
            let expr = if callee {
                expr.to_expr_value()
            } else {
                expr.to_expr()
            };
            *n = expr;
        }
    }
}

fn is_cjs_annotated<N: Spanned, C: Comments>(node: &N, comments: &C) -> bool {
    let leading_comments = comments.get_leading(node.span().lo());
    if let Some(leading_comments) = leading_comments {
        leading_comments
            .iter()
            .any(|comment| comment.text.contains("#__CJS__"))
    } else {
        false
    }
}

fn annotate_as_cjs<N: Spanned, C: Comments>(node: &N, comments: &C) {
    if !is_cjs_annotated(node, comments) {
        comments.add_leading(
            node.span().lo(),
            Comment {
                kind: CommentKind::Block,
                span: DUMMY_SP,
                text: "#__CJS__".into(),
            },
        );
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
enum PackageType {
    Normal,
    TsTwisted,
}

impl Options {
    fn applicable_source_type(&self, source: &str) -> Option<PackageType> {
        let source_package = get_package_name(source);
        if let Some(source_package) = source_package {
            if self.packages.iter().any(|pkg| pkg == source_package) {
                Some(PackageType::Normal)
            } else if self.packages_t.iter().any(|pkg| pkg == source_package) {
                Some(PackageType::TsTwisted)
            } else {
                None
            }
        } else {
            None
        }
    }
}

#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let comments = metadata
        .comments
        .expect("the plugin needs access to comments");
    let options: Options = serde_json::from_str(
        &metadata
            .get_transform_plugin_config()
            .expect("Invalid config"),
    )
    .expect("Invalid config");
    program.fold_with(&mut as_folder(TransformVisitor::new(comments, options)))
}
