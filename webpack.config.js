const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/browser/index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: [ '.ts', ".js", ".json"]
    },
    module: {
        rules: [
            { test: /\.ts?$/, loader: "ts-loader" }
        ]
    },
    externals: {
        three: 'THREE'
    },
    plugins: [
        new webpack.IgnorePlugin(/wrtc/),
        new webpack.IgnorePlugin(/console-stamp/),
        new webpack.IgnorePlugin(/websocket/)
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