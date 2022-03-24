'use strict'
const path = require('path')
import { app, protocol, BrowserWindow, ipcMain, screen, Tray } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true }}
])

async function createWindow() {
  // Create the browser window.
  const size = screen.getPrimaryDisplay().workAreaSize
  const width = parseInt(size.width * 0.9)
  const height = parseInt(size.height * 0.9)
  const win = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      contextIsolation: true,
      nodeIntegration: process.env.NODE_ENV !== 'production',
      webSecurity: false, // it will disable the same-origin policy(unsafe).
      preload: path.resolve(__dirname, 'preload.js')
    },
    show: false
  })

  win.on('ready-to-show', function() {
    win.show() // 初始化后再显示
  })

  // 页面加载完
  win.webContents.on('did-finish-load', function() {
    win.webContents.send('loaded', win.getMaximumSize())
  })

  // 最小化
  ipcMain.on('minimize', () => {
    try {
      win.minimize()
    } catch (err) {
      console.log(err)
    }
  })

  // 最大化
  ipcMain.on('maximize', () => {
    try {
      win.maximize()
    } catch (err) {
      console.log(err)
    }
  })

  // 还原
  ipcMain.on('unmaximize', () => {
    try {
      win.unmaximize()
    } catch (err) {
      console.log(err)
    }
  })

  // 关闭窗口
  ipcMain.on('close', () => {
    try {
      win.close()
    } catch (err) {
      console.log(err)
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    console.log('load page: ', process.env.WEBPACK_DEV_SERVER_URL)
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
    const cookieInstance = win.webContents.session.cookies
    cookieInstance.on('changed', (e, cookie, cause, removed) => {
      // let obj = { e, cookie, cause, removed }
      win.loadURL('app://./index.html')
    })
  }
}
// 忽略无效证书
app.commandLine.appendSwitch('ignore-certificate-errors')

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let tray
app.on('ready', async() => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    console.log('开发模式:', VUEJS_DEVTOOLS)
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  } else {
    // 设置托盘
    tray = new Tray(path.resolve(__dirname, 'public/icon.png'))
    tray.setContextMenu(null)
    tray.setToolTip('unify image process')
    tray.setTitle('unify image process')
  }
  createWindow()
})

// 监听从渲染进程发来的消息
ipcMain.on('quit', () => {
  app.quit()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// //创建代理
// var express = require('express');
// var proxy = require('http-proxy-middleware');
// var expressApp = express();
// expressApp.use(
//   //给每个需要请求管理后台的地址加上前缀，用于过滤识别
//   '/vue-element-admin/*',
//   proxy(
//     {
//       //指定后台的接收地址，生产环境需要另配，这里指定了开发环境配置
//       target: process.env.NODE_ENV === 'production' ? 'http://TODO' : 'http://localhost:9527',
//     }
//   )
// );
// expressApp.listen(9527);