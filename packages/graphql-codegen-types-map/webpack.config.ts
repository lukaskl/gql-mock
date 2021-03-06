import path from 'path'
import webpack from 'webpack'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { CleanupPackageJsonPlugin } from './cleanup-package-json'

type NodeEnv = 'development' | 'production' | 'none'

const config: webpack.Configuration = {
  entry: './src/index.ts',
  mode: (process.env.NODE_ENV || 'production') as NodeEnv,
  target: 'node',
  devtool: 'source-map',
  externals: [
    nodeExternals(),
    nodeExternals({
      modulesDir: path.resolve(__dirname, '../../node_modules'),
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: '',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compiler: 'ttypescript',
            },
          },
          'eslint-loader',
        ],
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    plugins: [],
    extensions: ['.ts'],
  },
  plugins: [
    new CleanupPackageJsonPlugin(),
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin({
      eslint: true,
    }),
  ],
}

export default config
