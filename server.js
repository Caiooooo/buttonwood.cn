"use strict";

var http=require("http");
var https=require("https");
var fs = require("fs");
//自己安装的
var sqlite3 = require("sqlite3");
var log4js = require("log4js");
var socketIo=require("socket.io");
var logger = log4js.getLogger();
const cors = require('cors');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
var express=require("express");
const path = require('path');
logger.level="info";

const { createProxyMiddleware } = require('http-proxy-middleware');

// const child = spawn('node', ['www/js/blog.js']);

var app = express();

const blogDirectory = 'www/blog';

// 创建一个路由来获取所有文件名
app.get('/api/files', (req, res) => {
    fs.readdir(blogDirectory, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read directory' });
        }
        // 过滤掉目录，仅返回文件
        const fileNames = files.filter(file => fs.statSync(path.join(blogDirectory, file)).isFile());
        res.json(fileNames);
    });
});

app.use(cors());

app.use('/jupyter', createProxyMiddleware({
    target: 'http://127.0.0.1:8888/jupyter/',
    changeOrigin: true,  // 确保`Host`头设置为目标服务器
    ws: true,  // 如果需要支持 WebSocket
    secure: false,
    onProxyReq: (proxyReq, req, res) => {
        // 设置自定义的请求头

        proxyReq.setHeader('Connection', 'upgrade');  // 确保 Connection 头设置为 upgrade
        proxyReq.setHeader('Upgrade', 'websocket');  // 确保 Upgrade 头设置为 websocket
    },
    timeout: 60000,  // 1分钟请求超时
    proxyTimeout: 60000,  // 1分钟代理超时
    pathRewrite: {
        '^/jupyter': '',  // 确保请求路径正确
    },
    onProxyReqWs: (proxyReq, req, socket, options) => {
        // 在必要时修改请求头
        proxyReq.setHeader('origin', 'https://buttonwood.cn');
        socket.setTimeout(60000);  // 1 minute

        // When the timeout is reached, destroy the connection
        socket.on('timeout', () => {
            ws.close();
            socket.destroy();
        });
    },
}));

// app.use('/', express.static('static'));
app.use(express.static("./www",{index:"home.html"}));
var opt = {
    key:fs.readFileSync("./ssl/sslServer.key"),
    cert:fs.readFileSync("./ssl/sslServer.crt")
}

// var httpServer=http.createServer(app)
//     .listen(80, "0.0.0.0")

var httpApp = express();
httpApp.get('*', function(req, res) {
    res.redirect('https://' + req.headers.host + req.url);
});
http.createServer(httpApp).listen(80, "0.0.0.0");

var httpsServer=https.createServer(opt,app)
    .listen(443, "0.0.0.0")

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});


//数据库
var db = null;


var io = socketIo.listen(httpsServer);
io.sockets.on("connection",(socket)=>{
    logger.info("connection:",socket.id);
    logger.info("IP:", socket.request.connection.remoteAddress|| socket.handshake.address)
    //开始监听身份验证相关信号
    socket.on("login", function (uname, pwd){
        logger.info("login", uname, pwd);
        db.all("select * from users where name=? and pwd=?",
            [uname, pwd],function (e, rows){
            if(e){
                logger.info(e);
                socket.emit("serverErr");
            }else{
                if(rows.length===1){
                    socket.emit("loginsuc",uname);
                }else{
                    socket.emit("loginfailed");
                }
            }

        });
    });

    socket.on("regist",(uname,pwd)=>{
        sql = "select * from users where name=?";
        db.all(sql,[uname],(e,rows)=>{
            if(e){
                logger.info(e);
                socket.emit("serverErr");
            }else{
                if(rows.length===1){
                    socket.emit("samename");
                }else{
                    // 注册成功
                    sql = "insert into users(name, pwd) values(?,?)";
                    db.run(sql,[uname,pwd],(e)=>{
                        if(e){
                            logger.info(e);
                            socket.emit("serverErr");
                        }else{
                            socket.emit("registsuc");
                        }
                    })
                }
            }
        });
    });

    //开始监听聊天大厅相关
    socket.on("cjoin",(room,uname)=>{
        logger.info("cjoin",room,uname);
        socket.join(room);

        socket.emit("cjoined",uname);
        socket.to(room).emit("cotherJoined",uname);

    });

    socket.on("cmessage",(room,uname,msg)=>{
        logger.info("cmessage",room,uname,msg);
        io.in(room).emit("cgetmessage",uname,msg);

    });

    socket.on("cleave",(room,uname)=>{
        logger.info("cleave",room,uname);
        socket.leave(room);

        socket.emit("cleft");
        socket.to(room).emit("cotherleft",uname);
    });

    // 1v1视频聊天室的消息
    socket.on("vjoin",(uname,room)=>{
        logger.info("vjoin",room,uname);
        socket.join(room);

        var myRoom = io.sockets.adapter.rooms[room];
        var users = Object.keys(myRoom.sockets).length;
        logger.info(room+" users="+users);
        if(users>2){
            socket.leave(room);
            socket.emit("vfull",room);
        }else{
            socket.emit("vjoined",room);
            if(users===2){
                socket.to(room).emit("votherjoined",room,uname);
            }
        }

    });

    socket.on("vdata",(room,data)=>{
       logger.info("vdata",data);
       socket.to(room).emit("vgetdata",room,data);
    });

    socket.on("vleave",(room,uname)=>{
        if(room==="" || uname ==="")return 0;
        var myRoom = io.sockets.adapter.rooms[room];
        var users = Object.keys(myRoom.sockets).length;
        logger.info("vleave users=",(users-1));
        socket.leave(room);
        socket.emit("vleft",room)
        socket.to(room).emit("votherleft",room,uname);
    });
});



var sql = null;
db = new sqlite3.Database("test.db",(e)=> {
    if(e)
        logger.info(e);
    else
        logger.info("create database successfully");
});
db.serialize(()=> {
    db.run("create table if not exists users(id integer primary key autoincrement," +
        "name char(50) unique, pwd char(200))", (e) => {
        if(e)
            logger.info(e);
        else
            logger.info("create table users successfully")
    })

    // sql = "insert into users(name, pwd) values('admin','123456')";
    // db.exec(sql,(e)=>{
    //     if(e)
    //         logger.info(e);
    //     else
    //         logger.info("insert admin successfully");
    // })
    sql="select * from users";
    db.all(sql,(e,rows)=>{
        if(e)
            logger.info(e);
        else
            logger.info(rows)
    })
});