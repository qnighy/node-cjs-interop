// Original: @node-loader/babel https://github.com/node-loader/node-loader-babel/blob/v2.0.0/lib/node-loader-babel.js
//
// MIT License
//
// Copyright (c) 2020 node-loaders
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import babel from "@babel/core";
import path from "path";
import urlModule from "url";

const { loadOptionsAsync, transformAsync } = babel;

function isBabelConfigFile(filename) {
  const basename = path.basename(filename);
  return (
    basename === ".babelrc.js" ||
    basename === ".babelrc.mjs" ||
    basename === "babel.config.js" ||
    basename === "babel.config.mjs" ||
    basename === ".babelrc" ||
    basename === ".babelrc.cjs" ||
    basename === "babel.config.cjs"
  );
}

export async function load(url, context, defaultLoad) {
  if (useLoader(url)) {
    const { source, format } = await defaultLoad(url, context, defaultLoad);

    const filename = urlModule.fileURLToPath(url);
    // Babel config files can themselves be ES modules,
    // but we cannot transform those since doing so would cause an infinite loop.
    if (isBabelConfigFile(filename)) {
      return {
        source,
        format,
      };
    }

    const options = await loadOptionsAsync({
      sourceType: format === "module" ? "module" : "script",
      root: process.cwd(),
      rootMode: "root",
      filename: filename,
      configFile: true,
    });

    const transformed = await transformAsync(source, options);

    return {
      source: transformed.code,
      format: transformed.sourceType === "module" ? "module" : "commonjs",
    };
  } else {
    return defaultLoad(url, context, defaultLoad);
  }
}

function useLoader(url) {
  return !/node_modules/.test(url) && !/node:/.test(url);
}
