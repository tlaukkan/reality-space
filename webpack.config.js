const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/browser/index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [    {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-env"]
                }
            }
        }, {
            test: /\.ts$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-typescript"]
                }
            }
        }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'static' }
        ]),
        new webpack.IgnorePlugin(/wrtc/, /console-stamp/, /websocket/, /signaling-server/)
    ],
    devServer: {
        compress: true,
        port: 3001,
        proxy: {
            '/api': 'http://localhost:3000'
        }
    },
    mode: "production"
};