const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

module.exports = {
  entry: {
    yarnspinner: {
      "import": "./src/index.ts",
      "dependOn": 'data',
    },
    "data": './src/data.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/, // or /\.css$/i if you aren't using sass
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: true
  },
  devServer: {
    static: './dist',
    watchFiles: ['src/**/*'],
  },
  devtool: 'source-map',
  mode: 'development',
  performance: {
    // TODO: The generated artifact is designed to be all-in-one, so while
    // keeping the file size small is desirable, we'll disable performance hints
    // for now.
    hints: false
  },
  plugins: [

    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new HTMLInlineCSSWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      urlBase: process.env['BASE_URL'] || '',
  }),
]
};
