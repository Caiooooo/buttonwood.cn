# 使用nodejs子域名搭建jupyterlab时的关键配置

使用nodejs子域名搭建jupyterlab时需要解决跨域问题，如xxx.com/lab 反向代理到 xxx.com:8888时需要解决一些跨域问题，不然会出现只有UI没有响应的情况，具体查看可以看对应的日志排查，下面我将展示jupyter_lab的配置和nodejs的配置。

~/.jupyter/jupyter_lab_config.py配置文件

```python

c = get_config()  #noqa
c.NotebookApp.ip = '*'
c.NotebookApp.open_browser = False
c.NotebookApp.port = 8888
c.NotebookApp.base_url='/jupyter/'
c.NotebookApp.notebook_dir = '/root/jupyterLab'
c.NotebookApp.allow_remote_access = True
c.NotebookApp.allow_root = True
c.ServerApp.allow_origin='*'            #关键，解决跨域问题
c.ServerApp.tornado_settings={
}
c.PAMAuthenticator.encoding = 'utf8'

```

nodejs反向代理
```javascript
const cors = require('cors');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
var express=require("express");
logger.level="info";

const { createProxyMiddleware } = require('http-proxy-middleware');

var app = express();
app.use(cors());

app.use('/jupyter', createProxyMiddleware({
    target: 'http://127.0.0.1:8888/jupyter/',
    changeOrigin: true,  // 确保`Host`头设置为目标服务器
    ws: true,  // 如果需要支持 WebSocket
    secure: false, //如果是自己认证的ssl证书
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Connection', 'upgrade');  // 确保 Connection 头设置为 upgrade
        proxyReq.setHeader('Upgrade', 'websocket');  // 确保 Upgrade 头设置为 websocket
    },
    pathRewrite: {
        '^/jupyter': '',  // 确保请求路径正确
    },
    onProxyReqWs: (proxyReq, req, socket, options) => {
        // 在必要时修改请求头
        proxyReq.setHeader('origin', 'https://buttonwood.cn');
    },
    onError: (err, req, res) => {
        res.status(500).send('Proxy error');
    }
}));
```