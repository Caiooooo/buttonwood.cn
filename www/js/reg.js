"use strict"
let socket = null;
var usrName;

function reg() {
    var username = document.getElementById("username").value.trim();
    var pwd = document.getElementById("password").value.trim();
    var repwd = document.getElementById("repassword").value.trim();
    if (username == "") {
        alert("用户名不能为空！");
        return false;
    }
    if (pwd == "" || repwd == "") {
        alert("密码不能为空！");
        return false;
    }
    if (pwd != repwd) {
        alert("两次输入不一致！");
        return false;
    }
    socket.emit("regist", username, pwd);
}

function login() {

    //检验输入是否正确
    var username = document.getElementById("username").value.trim();
    var pwd = document.getElementById("password").value.trim();
    if (username == "" || pwd == "") {
        alert("输入不能为空！");
        return false;
    }

    //发送登陆的用户名和密码到服务器
    console.log("Connected to server with ID:", socket.id);
    socket.emit("login", username, pwd);


}
function loaduser(){
    // 收起侧边栏
    var handler = document.querySelector('.handler');
    var leftBox = document.querySelector('.left-box');
    handler.addEventListener("click", function () {
        if (!this.classList.contains('close')) {
            leftBox.style.width = 0;
            handler.style.left = "5px";
            this.classList.add('close');
        } else {
            leftBox.style.width = 210 + 'px';
            handler.style.left = "215px";
            this.classList.remove('close');
        }
    });
    //设置侧边栏信息
    var username = document.getElementById("userName");
    var url = location.href;

    try {
        // get Params
        // username.innerHTML = url.split("?")[1].split("=")[1];
    } catch (error) {
        username.innerHTML = "bw"; // 处理错误时的备用内容
    }
    usrName = username;
    if (username.innerHTML === "") {
        var userImage = document.querySelector(".user-info img").src = "bw";
    }
}
//aborted
function chk(){

}
startSocket();
function startSocket(){
    socket = io.connect();

    //监听从服务器发来的消息
    socket.on('connect', function() {
        console.log("Connected to server with ID:", socket.id);
    });
    socket.on("loginsuc", (uname)=>{
        window.location.href = "chat.html?uname="+uname;
    });

    socket.on("loginfailed",()=>{
        alert("账户密码不正确或用户不存在，请重新输入！");
        jumpToLog();
    });

    socket.on("serverErr",()=>{
        alert("服务器连接异常");
    });

    socket.on("samename",()=>{
        alert("用户名已存在!");
        jumpToIn();
    });

    socket.on("registsuc",()=>{
        jumpToLog();
        alert("注册成功!");
    });


}








// jumpJs
function jumpToChat(){
    window.location.href="chat.html"
}
function jumpToLog() {
    window.location.href = "log.html";
}
function jumpToHo() {
    window.location.href = "home.html";
}
function jumpToDe() {
    window.location.href = "designIdea.html";
}
function jumpToAr() {
    window.location.href = "projects.html";
}
function jumpToPh() {
    window.location.href = "photoIdea.html";
}
function jumpToCr() {
    window.location.href = "createIdea.html";
}
function jumpToAb() {
    window.location.href = "aboutUs.html";
}

function jumpToIn() {
    window.location.href = "index.html";
}
