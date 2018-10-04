module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'browserify', 'karma-typescript'],
        files: [
            'src/common/**/*.js',
            'src/browser/**/*.js',
            'src/common/**/*.ts',
            'src/browser/**/*.ts',
            'test/common/**/*.js',
            'test/browser/**/*.js',
            'test/common/**/*.ts',
            'test/browser/**/*.ts'
        ],
        exclude: [
            'src/browser/index.js'
        ],
        preprocessors: {
            './src/**/*.js': ['browserify'],
            './src/**/*.ts': ['karma-typescript'],
            './test/**/*.js': ['browserify'],
            './test/**/*.ts': ['karma-typescript']
        },
        browserify: {
            debug: true,
            paths: ['src', 'test'],
            "transform": [
                [
                    "babelify",
                    {
                        presets: ["@babel/preset-env"],
                    }
                ]
            ]
        },
        karmaTypescriptConfig: {
            paths: ['src', 'test'],
            compilerOptions: {
                sourceMap: true,
                target: 'es6'
            },
            bundlerOptions: {
                addNodeGlobals: true,
                sourceMap: true
            },
            tsconfig: './tsconfig.json'
        },
        reporters: ['progress'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['Chrome'],
        autoWatch: false,
        singleRun: true,
        concurrency: Infinity,
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: ['-headless'],
            },
        },
    })
}