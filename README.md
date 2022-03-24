# 统一图像测试软件

## 开始
```
# 淘宝源下electron依然会安装失败，install前请配置代理服务器
npm config set proxy=http://代理服务器地址:代理服务器端口号

npm config set registry=http://registry.npmjs.org/

npm install

# 桌面模式
npm run dev:desktop

# web模式
npm run dev:web
```

## 构建
```
# mac环境打包
npm run build:mac

# win环境
npm run build:win

# web构建
npm run build:web
```