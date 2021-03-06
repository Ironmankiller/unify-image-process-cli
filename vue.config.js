'use strict'
const path = require('path')
const defaultSettings = require('./src/renderer/settings.js')

function resolve(dir) {
  return path.join(__dirname, dir)
}

const name = defaultSettings.title || 'Test Software' // page title

// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, Mac: sudo npm run
// You can change the port by the following method:
// port = 9527 npm run dev OR npm run dev --port = 9527
const port = process.env.port || process.env.npm_config_port || 9527 // dev port

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/main/background.js',
      builderOptions: {
        appId: "unifytest.aia.hust.edu.cn",
        productName: "统一图像测试软件",
        icon: "./public/icons/icon.ico",
        files: ["**/*", "static/*"],
		    copyright: "Copyright © 2021 hust AIA",
        extraFiles: {
          from: './preload',
          to: 'preload'
        },
        asar: true,
        mac: {
          icon: "./public/icon.png",
          target: ["zip", "dmg"],
          category: "com.unifytest-category.utilities"
        },
        win: {
          icon: "./public/icons/icon.ico",
          target: ["zip", "nsis"]
        },
        nsis: {
          oneClick: false,
          allowElevation: true,
          allowToChangeInstallationDirectory: true,
          installerIcon: "./public/icons/icon.ico",
          uninstallerIcon: "./public/icons/icon.ico",
          installerHeaderIcon: "./public/icons/icon.ico",
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          license: "./LICENSE"
        }
      }
    }
  },
	
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  devServer: {
    port: port,
    open: false,
    overlay: {
      warnings: false,
      errors: true
    },
    before: require('./mock/mock-server.js')
  },
  configureWebpack: config => {
    config.devtool = process.env.NODE_ENV==="production"? false:"source-map"
    config.entry.app = './src/renderer/main.js'
    return {
      name: name,
      resolve: {
        alias: {
          '@': resolve('src/renderer')
        }
      }
    }
  },
  chainWebpack(config) {
    // it can improve the speed of the first screen, it is recommended to turn on preload
    // it can improve the speed of the first screen, it is recommended to turn on preload
    config.plugin('preload').tap(() => [
      {
        rel: 'preload',
        // to ignore runtime.js
        // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
        fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
        include: 'initial'
      }
    ])

    // when there are many pages, it will cause too many meaningless requests
    config.plugins.delete('prefetch')

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/renderer/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/renderer/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
            // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/
            }])
            .end()
          config
            .plugin('copy').tap((args) => [[
              {
                from: './preload',
                to: 'preload',
                toType: 'dir',
                ignore: [
                  'index.html',
                  '.DS_Store'
                ]
              },
              {
                from: './public',
                to: 'public',
                toType: 'dir',
                ignore: [
                  'index.html',
                  '.DS_Store'
                ]
              }
            ]])
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial' // only package third parties that are initially dependent
                },
                elementUI: {
                  name: 'chunk-elementUI', // split elementUI into a single package
                  priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true
                }
              }
            })
          // https:// webpack.js.org/configuration/optimization/#optimizationruntimechunk
          config.optimization.runtimeChunk('single')
        }
      )
  }
}
