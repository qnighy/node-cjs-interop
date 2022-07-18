use std::path::PathBuf;

use swc_ecma_parser::{EsConfig, Syntax};
use swc_ecma_transforms_testing::test_fixture;
use swc_ecma_transforms_typescript::strip;
use swc_plugin::{ast::as_folder, chain, syntax_pos::Mark};
use swc_plugin_node_cjs_interop::{TransformOptions, TransformVisitor};

#[testing::fixture("tests/fixtures/basic/*/input.mjs")]
fn test_basic(input: PathBuf) {
    let output = input.with_file_name("output.mjs");
    test_fixture(
        Syntax::Es(EsConfig::default()),
        &|t| {
            as_folder(TransformVisitor::new(
                t.comments.clone(),
                TransformOptions {
                    packages: vec!["mod".to_owned(), "mod1".to_owned(), "mod2".to_owned()],
                    use_runtime: false,
                },
            ))
        },
        &input,
        &output,
    );
}

#[testing::fixture("tests/fixtures/package-filtering/*/input.mjs")]
fn test_package_filtering(input: PathBuf) {
    let output = input.with_file_name("output.mjs");
    test_fixture(
        Syntax::Es(EsConfig::default()),
        &|t| {
            as_folder(TransformVisitor::new(
                t.comments.clone(),
                TransformOptions {
                    packages: vec![
                        "foo".to_owned(),
                        "bar".to_owned(),
                        "@scoped/foo".to_owned(),
                        "@scoped/bar".to_owned(),
                    ],
                    use_runtime: false,
                },
            ))
        },
        &input,
        &output,
    );
}

#[testing::fixture("tests/fixtures/use-runtime/*/input.mjs")]
fn test_use_runtime(input: PathBuf) {
    let output = input.with_file_name("output.mjs");
    test_fixture(
        Syntax::Es(EsConfig::default()),
        &|t| {
            as_folder(TransformVisitor::new(
                t.comments.clone(),
                TransformOptions {
                    packages: vec!["mod".to_owned(), "mod1".to_owned(), "mod2".to_owned()],
                    use_runtime: true,
                },
            ))
        },
        &input,
        &output,
    );
}

#[testing::fixture("tests/fixtures/with-react/*/input.mjs")]
fn test_with_react(input: PathBuf) {
    let output = input.with_file_name("output.mjs");
    test_fixture(
        Syntax::Es(EsConfig {
            jsx: true,
            ..Default::default()
        }),
        &|t| {
            as_folder(TransformVisitor::new(
                t.comments.clone(),
                TransformOptions {
                    packages: vec!["mod".to_owned(), "mod2".to_owned()],
                    use_runtime: false,
                },
            ))
        },
        &input,
        &output,
    );
}

#[testing::fixture("tests/fixtures/with-typescript/*/input.mts")]
fn test_with_typescript(input: PathBuf) {
    let output = input.with_file_name("output.mjs");
    test_fixture(
        Syntax::Typescript(Default::default()),
        &|t| {
            chain!(
                as_folder(TransformVisitor::new(
                    t.comments.clone(),
                    TransformOptions {
                        packages: vec!["mod".to_owned()],
                        use_runtime: false,
                    },
                )),
                strip(Mark::new())
            )
        },
        &input,
        &output,
    );
}
