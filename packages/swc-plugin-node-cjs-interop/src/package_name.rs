pub(crate) fn get_package_name(module_path: &str) -> Option<&str> {
    if module_path.is_empty() {
        return None;
    }

    let first = module_path.as_bytes()[0];
    if first == b'/' || first == b'.' {
        return None;
    }

    #[allow(clippy::collapsible_else_if)]
    if first == b'@' {
        #[allow(clippy::question_mark)]
        let index1 = if let Some(index) = module_path.find('/') {
            index
        } else {
            return None;
        };

        if let Some(index2_rel) = module_path[index1 + 1..].find('/') {
            let index2 = index1 + 1 + index2_rel;
            Some(&module_path[..index2])
        } else {
            Some(module_path)
        }
    } else {
        if let Some(index) = module_path.find('/') {
            Some(&module_path[..index])
        } else {
            Some(module_path)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty() {
        assert_eq!(get_package_name(""), None);
    }

    #[test]
    fn test_absolute_paths() {
        assert_eq!(get_package_name("/"), None);
        assert_eq!(get_package_name("/foo"), None);
        assert_eq!(get_package_name("/foo/bar"), None);
    }

    #[test]
    fn test_relative_paths() {
        assert_eq!(get_package_name("."), None);
        assert_eq!(get_package_name("./"), None);
        assert_eq!(get_package_name("./foo"), None);
        assert_eq!(get_package_name("./foo/bar"), None);
        assert_eq!(get_package_name("../foo"), None);
        assert_eq!(get_package_name("../foo/bar"), None);
    }

    #[test]
    fn test_unscoped_main_module() {
        assert_eq!(get_package_name("foo"), Some("foo"));
        assert_eq!(get_package_name("foo-bar"), Some("foo-bar"));
        assert_eq!(get_package_name("foo.bar"), Some("foo.bar"));
    }

    #[test]
    fn test_unscoped_sub_module() {
        assert_eq!(get_package_name("foo/index"), Some("foo"));
        assert_eq!(get_package_name("foo-bar/server"), Some("foo-bar"));
        assert_eq!(get_package_name("foo.bar/dist/index.js"), Some("foo.bar"));
    }

    #[test]
    fn test_scoped_main_module() {
        assert_eq!(get_package_name("@test/foo"), Some("@test/foo"));
        assert_eq!(get_package_name("@test/foo-bar"), Some("@test/foo-bar"));
        assert_eq!(get_package_name("@test/foo.bar"), Some("@test/foo.bar"));
    }

    #[test]
    fn test_scoped_sub_module() {
        assert_eq!(get_package_name("@test/foo/index"), Some("@test/foo"));
        assert_eq!(
            get_package_name("@test/foo-bar/server"),
            Some("@test/foo-bar")
        );
        assert_eq!(
            get_package_name("@test/foo.bar/dist/index.js"),
            Some("@test/foo.bar")
        );
    }

    #[test]
    fn test_scoped_incomplete() {
        assert_eq!(get_package_name("@test"), None);
    }
}
