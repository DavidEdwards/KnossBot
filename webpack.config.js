module.exports = {
  target: 'web',
  entry: {
    /*cli: './src/cli.js',
    cli2: './src/cli2.js',*/
    main: './src/index.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
  },
  module: {
    rules: [{
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.json$/i,
        loader: 'json5-loader',
        type: 'javascript/auto',
      },
    ],
  },
  externals: {
    //puppeteer: 'require("playwright")',
  },
};