import HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import { Configuration as WebpackConfiguration } from "webpack";
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const rootPath = path.resolve(__dirname, "..");

const WINDOW_NAMES = ["search", "write", "settings", "intro"];
const windowConfigs: WebpackConfiguration[] = WINDOW_NAMES.map((windowName) => {
  return {
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx"],
      mainFields: ["main", "module", "browser"],
      plugins: [new TsconfigPathsPlugin()],
    },
    entry: {
      main: path.resolve(rootPath, "src/renderer", windowName, "index.tsx"),
    },
    output: {
      path: path.resolve(rootPath, "dist/renderer"),
      filename: windowName + "-scripts.bundle.js",
    },
    target: "electron-renderer",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.(js|ts|tsx)$/,
          exclude: /node_modules/,
          include: /src/,
          use: {
            loader: "ts-loader",
          },
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
        {
          test: /\.module.(s(a|c)ss)$/i,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true,
              },
            },
            "sass-loader",
          ],
        },
        {
          test: /\.s(a|c)ss$/i,
          exclude: /\.module.(s(a|c)ss)$/i,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(
          rootPath,
          "src/renderer",
          windowName,
          "index.html"
        ),
        filename: windowName + "-index.html",
      }),
    ],
  };
});

const preloadConfigs: WebpackConfiguration[] = WINDOW_NAMES.map(
  (windowName) => {
    return {
      resolve: {
        extensions: [".ts", ".js"],
        mainFields: ["main", "module", "browser"],
        plugins: [new TsconfigPathsPlugin()],
      },
      entry: {
        preload: path.resolve(
          rootPath,
          "src/renderer",
          windowName,
          "preload.ts"
        ),
      },
      output: {
        path: path.resolve(rootPath, "dist/renderer"),
        filename: windowName + "-preload.bundle.js",
      },
      target: "electron-preload",
      devtool: "source-map",
      module: {
        rules: [
          {
            test: /\.(js|ts|tsx)$/,
            exclude: /node_modules/,
            include: /src/,
            use: {
              loader: "ts-loader",
            },
          },
        ],
      },
    };
  }
);

export default [...windowConfigs, ...preloadConfigs];
