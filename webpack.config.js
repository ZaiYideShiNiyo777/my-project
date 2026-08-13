const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[hash].js',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  devServer: {
    port: 3001,
    hot: true,
    historyApiFallback: true,
    // 本地预览时静态托管 assets/(视频/图片相对路径素材),与部署后 dist/assets 行为一致
    before(app) {
      app.use('/assets', require('express').static(path.resolve(__dirname, 'assets')));
    },
  },
};
