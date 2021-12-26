# `node-cjs-interop-finder`: list packages eligible for `babel-plugin-node-cjs-interop`

Helps configuring [`babel-plugin-node-cjs-interop`](https://npmjs.com/package/babel-plugin-node-cjs-interop).

## Usage

```
npx node-cjs-interop-finder
```

It searches packages in `dependencies` and `devDependencies`, and estimates their module types. It prints the list of packages in Babel's simulated ESM format.

It prints two package lists: for Node.js and for module bundlers like Webpack.

You don't need to specify all packages in the list; in most cases you only need the plugin when importing default exports.
