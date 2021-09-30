const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const entry = path.join(__dirname, 'src', 'index.js');
const html = path.join(__dirname, 'src', 'index.html');
const dist = path.join(__dirname, 'dist');

module.exports = {
  entry,
  output: {
    path: dist,
    filename: 'index.js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: html,
          to: dist,
        },
      ],
    }),
  ],
  devtool: 'source-map',
  resolve: {
    extensions: ['.js'],
  },
  devServer: {
    static: {
      directory: dist,
    },
    hot: false,
  },
};
