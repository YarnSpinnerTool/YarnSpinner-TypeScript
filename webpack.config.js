const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');


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
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      urlBase: process.env['BASE_URL'] || '',
  }),
]
};
