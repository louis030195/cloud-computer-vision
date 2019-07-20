'use strict'

const { resolve, join } = require('path')
const merge = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const OUTPUT_PATH = resolve(__dirname + '/build')
const INDEX_TEMPLATE = resolve(__dirname + '/index.html')

const webcomponentsjs = __dirname + '/../node_modules/@webcomponents/webcomponentsjs'

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
    entry: __dirname + '/vision-client.js',
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
    }
  }
])

const developmentConfig = merge([
  {
    devtool: 'cheap-module-source-map',
    plugins: [
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