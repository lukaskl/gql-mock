import path from 'path'
import webpack from 'webpack'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import nodeExternals from 'webpack-node-externals'

type NodeEnv = 'development' | 'production' | 'none'

const config: webpack.Configuration = {
  entry: './src/index.ts',
  mode: (process.env.NODE_ENV || 'production') as NodeEnv,
  target: 'node',
  externals: [
    nodeExternals(),
    nodeExternals({
      modulesDir: path.resolve(__dirname, '../../node_modules'),
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['babel-loader', 'eslint-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.ts', '.js', '.webpack.js', '.web.js', '.mjs', '.js', '.json'],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      eslint: true,
    }),
  ],
}

export default config
