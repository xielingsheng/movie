const { merge } = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')

const common = require('./webpack.common')
const { PROJECT_PATH, SERVER_HOST, SERVER_PORT } = require('../constant')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  output: {
    filename: 'js/[name].js',
    path: path.resolve(PROJECT_PATH, './dist/admin'),
  },
  devServer: {
    host: SERVER_HOST,
    port: SERVER_PORT,
    stats: 'errors-only',
    clientLogLevel: 'none',
    compress: true,
    open: true,
    hot: true,
    noInfo: true,
    proxy: {
      '/api': 'http://127.0.0.1:80',
    },
    historyApiFallback: true,
  },
  plugins: [
    // 实际上只开启 hot：true 就会自动识别有无声明该插件，没有则自动引入，但是怕有隐藏问题这里还是手动加上了
    new webpack.HotModuleReplacementPlugin(),
  ],
})