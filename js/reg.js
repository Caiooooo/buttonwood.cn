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
    var username = "";
    var pwd = "";

    // 检查是否是可用用户模式
    var loginMode = document.getElementById("loginMode");
    if (loginMode && loginMode.value === "available") {
        // 从下拉框获取用户名
        var availableUser = document.getElementById("availableUser");
        if (availableUser) {
            username = availableUser.value.trim();
        }
        // 可用用户模式不需要密码，使用空密码
        pwd = "";
    } else {
        // 手动输入模式
        username = document.getElementById("username").value.trim();
        pwd = document.getElementById("password").value.trim();
    }

    // 可用用户模式下只需要用户名，手动输入模式需要用户名和密码
    if (username == "") {
        alert("请输入用户名！");
        return false;
    }

    if (loginMode && loginMode.value !== "available" && pwd == "") {
        alert("请输入密码！");
        return false;
    }

    //发送登陆的用户名和密码到服务器
    console.log("Connected to server with ID:", socket.id);
    socket.emit("login", username, pwd);


}
function loaduser() {
    // 收起侧边栏
    var handler = document.querySelector('.handler');
    var leftBox = document.querySelector('.left-box');

    if (handler && leftBox) {
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
    }

    //设置侧边栏信息
    var usernameElem = document.getElementById("userName");
    var userPhotoElem = document.getElementById("userPhoto");
    function getUserNameFromParam() {
        const url = window.location.search;
        const params = new URLSearchParams(url);
        return params.get('userName');
    }
    var userName = getUserNameFromParam();
    if (usernameElem && userName) {
        usernameElem.innerHTML = userName;
    }
    if (userPhotoElem && userName) {
        userPhotoElem.src = '/img/userAvatar/' + userName + '.jpg';
    }
}
//aborted
function chk() {

}

// 根据当前页面路径获取正确的前缀
function getPathPrefix() {
    var path = window.location.pathname;
    return path.includes('/tools/') ? "../" : "";
}

function getUserNameParam() {
    const url = window.location.search;
    const params = new URLSearchParams(url);
    const userName = params.get('userName');
    return userName ? ('?userName=' + encodeURIComponent(userName)) : '';
}

// jumpJs
function jumpToChat() {
    window.location.href = getPathPrefix() + "server/chat.html" + getUserNameParam();
}
function jumpToLog() {
    window.location.href = getPathPrefix() + "server/log.html" + getUserNameParam();
}
function jumpToHo() {
    window.location.href = getPathPrefix() + "index.html" + getUserNameParam();
}
function jumpToDe() {
    window.location.href = getPathPrefix() + "designIdea.html" + getUserNameParam();
}
function jumpToAr() {
    window.location.href = getPathPrefix() + "projects.html" + getUserNameParam();
}
function jumpToPh() {
    window.location.href = getPathPrefix() + "photoIdea.html" + getUserNameParam();
}
function jumpToCr() {
    window.location.href = getPathPrefix() + "createIdea.html" + getUserNameParam();
}
function jumpToAb() {
    window.location.href = getPathPrefix() + "buttonwood.html" + getUserNameParam();
}

function jumpToTools() {
    window.location.href = getPathPrefix() + "tools.html" + getUserNameParam();
}

function jumpToIn() {
    window.location.href = getPathPrefix() + "index.html" + getUserNameParam();
}
