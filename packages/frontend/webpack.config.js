const path = require('path');
const glob = require('glob')

const HtmlWebpackPlugin = require('html-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');

const PATHS = {
  src: path.join(__dirname, 'src')
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: {
      ...(isProduction ? {
        yarnspinner: {
          "import": "./src/index.ts",
        },
        entry: { "import": "./src/entrypoint.ts" },
      } : {
        yarnspinner: {
          "import": "./src/index.ts",
          "dependOn": 'data',
        },
        entry: { "import": "./src/entrypoint.ts" },
        data: {
          "import": './src/dev-load-static-data.ts'
        }
      }),
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
        {
          test: /\.svg$/i,
          type: 'asset/inline',
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
      minimize: true,
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true
          }
        }
      },
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
      new PurgecssPlugin({
        paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true }),
      }),
      new HTMLInlineCSSWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        inject: true,
        urlBase: process.env['BASE_URL'] || '',
      }),
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/yarnspinner/]),
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/data/]),
    ]
  }
};
