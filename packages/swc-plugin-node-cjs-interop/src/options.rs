use serde::Deserialize;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct Options {
    #[serde(default)]
    pub packages: Vec<String>,
    #[serde(default)]
    pub use_runtime: bool,
}
