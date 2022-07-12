const path = require('path');

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
  }
};
