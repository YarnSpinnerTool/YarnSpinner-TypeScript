const path = require('path');

module.exports = {
    entry: {
        yarnspinner: {
            "import" : "./src/index.js",
            "dependOn" : 'data'
        },
        "data": './src/data.js'
    },
  output: {
    filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        minimize: true
    }
};
