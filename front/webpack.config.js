'use strict'

const { resolve, join } = require('path')
const merge = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const OUTPUT_PATH = join(__dirname, 'build')
const INDEX_TEMPLATE = join(__dirname, 'index.html')

const webcomponentsjs = join(__dirname, '/../node_modules/@webcomponents/webcomponentsjs')

const Dotenv = require('dotenv-webpack')

const assets = [
]
const polyfills = [
  {
    from: resolve(`${webcomponentsjs}/webcomponents-*.js`),
    to: join(OUTPUT_PATH, 'vendor'),
    flatten: true
  },
  {
    from: resolve(`${webcomponentsjs}/bundles/*.js`),
    to: join(OUTPUT_PATH, 'vendor', 'bundles'),
    flatten: true
  },
  {
    from: resolve(`${webcomponentsjs}/custom-elements-es5-adapter.js`),
    to: join(OUTPUT_PATH, 'vendor'),
    flatten: true
  }
]

const commonConfig = merge([
  {
    entry: __dirname + '/cloud-computer-vision.js',
    output: {
      path: OUTPUT_PATH,
      filename: '[name].[chunkhash:8].js'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'to-string-loader',
            'css-loader'
          ]
        },
        {
          test: /\.png|\.gif|\.txt$/,
          use: [
            {
              loader: 'file-loader'
            }
          ]
        }
      ]
    }/*,
    node: { // https://github.com/webpack-contrib/css-loader/issues/447
      fs: 'empty',
      child_process: 'empty',
      net: 'empty',
      tls: 'empty'
    }*/
  }
])

const developmentConfig = merge([
  {
    devtool: 'cheap-module-source-map',
    plugins: [
      new Dotenv(),
      new CopyWebpackPlugin([...polyfills, ...assets]),
      new HtmlWebpackPlugin({
        template: INDEX_TEMPLATE
      })
    ],

    devServer: {
      contentBase: OUTPUT_PATH,
      compress: true,
      overlay: true,
      port: 3000,
      historyApiFallback: true,
      host: 'localhost'
    }
  }
])

const productionConfig = merge([
  {
    devtool: 'nosources-source-map',
    plugins: [
      new Dotenv(),
      new CleanWebpackPlugin({ verbose: true }),
      new CopyWebpackPlugin([...polyfills, ...assets]),
      new HtmlWebpackPlugin({
        template: INDEX_TEMPLATE,
        filename: 'index.html',
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true
        }
      })
    ]
  }
])

module.exports = mode => {
  if (mode === 'production') {
    return merge(commonConfig, productionConfig, { mode })
  }

  return merge(commonConfig, developmentConfig, { mode })
}
