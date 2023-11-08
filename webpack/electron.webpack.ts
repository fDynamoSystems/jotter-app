import * as path from "path";
import { Configuration } from "webpack";
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const rootPath = path.resolve(__dirname, "..");

const config: Configuration = {
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    plugins: [new TsconfigPathsPlugin()],
  },
  devtool: "source-map",
  entry: path.resolve(rootPath, "src/main", "index.ts"),
  output: {
    path: path.resolve(rootPath, "dist"),
    filename: "[name].js",
  },
  target: "electron-main",
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
  node: {
    __dirname: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(rootPath, "src/static"),
          to: path.resolve(rootPath, "dist/static"),
        },
      ],
      options: {
        concurrency: 100,
      },
    }),
  ],
};

export default config;
