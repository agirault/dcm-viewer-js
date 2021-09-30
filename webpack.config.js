const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const entry = path.join(__dirname, 'src', 'index.js');
const html = path.join(__dirname, 'src', 'index.html');
const style = path.join(__dirname, 'src', 'style.css');
const itkWebWorkers = path.join('itk', 'WebWorkers', 'ImageIO.worker.js');
const itkImageIOs = path.join('itk', 'ImageIOs');
const nodeModules = path.join(__dirname, 'node_modules');
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
        {
          from: style,
          to: dist,
        },
        {
          from: path.join(nodeModules, itkWebWorkers),
          to: path.join(dist, itkWebWorkers),
        },
        {
          from: path.join(nodeModules, itkImageIOs, '*DICOM*'),
          to: path.join(dist, itkImageIOs, '[name][ext]'),
        },
        {
          from: path.join(nodeModules, itkImageIOs, '*GDCM*'),
          to: path.join(dist, itkImageIOs, '[name][ext]'),
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
