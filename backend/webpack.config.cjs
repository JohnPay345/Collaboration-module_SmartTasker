const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  target: 'node',
  mode: isProduction ? 'production' : 'development',
  entry: './app.js',
  experiments: {
    outputModule: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    clean: true,
    module: true,
    chunkFormat: 'module'
  },
  externals: [nodeExternals({
    importType: 'module'
  })],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  node: '18'
                },
                modules: false
              }]
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new Dotenv({
      path: './.env',
      safe: true,
      systemvars: true
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'package.json',
          to: 'package.json',
          transform(content) {
            const pkg = JSON.parse(content);
            pkg.type = 'module';
            return JSON.stringify(pkg, null, 2);
          }
        },
        {
          from: 'uploads',
          to: 'uploads',
          noErrorOnMissing: true
        }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],
  optimization: {
    minimize: isProduction
  },
  devtool: isProduction ? false : 'source-map',
  resolve: {
    extensions: ['.js'],
    alias: {
      '#root': path.resolve(__dirname, './'),
      '#models': path.resolve(__dirname, './models'),
      '#controllers': path.resolve(__dirname, './controllers'),
      '#routes': path.resolve(__dirname, './routes'),
      '#utils': path.resolve(__dirname, './utils'),
      '#service': path.resolve(__dirname, './service')
    }
  }
}; 