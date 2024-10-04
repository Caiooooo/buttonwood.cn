"use strict"

var hWelcom = document.getElementById("welcome");
var url = location.href;
var uname = url.split("?")[1].split("=")[1];

hWelcom.textContent="欢迎来到聊天大厅："+uname;

var taMsgList = document.getElementById("msglist");
var iptMsg = document.getElementById("msg");
var btnSend = document.getElementById("btnSend");
iptMsg.addEventListener("keyup",function (event){
    event.preventDefault();
    if(event.keyCode.valueOf()===13)btnSend.click();
});
var btnGotoVideo = document.getElementById("gotoVideoRoom");
var btnLeave = document.getElementById("leave");


var socket = null;
var room = "bwDefaultRoom"
function start(){
    socket = io.connect();

    socket.on("cjoined",(uname)=>{
        taMsgList.value="欢迎"+uname+"进入大厅\n";
    });
    socket.on("cotherJoined",(uname)=>{
        taMsgList.value+="用户"+uname+"进入大厅\n";
    });

    socket.on("cgetmessage",(uname,msg)=>{
        taMsgList.value+=uname+":"+msg+"\n";
    });

    socket.on("cleft",()=>{
        history.back();
    });
    socket.on("cotherleft",(uname)=>{
        taMsgList.value+="用户"+uname+"离开大厅\n";
    });

    socket.emit("cjoin",room,uname);
}
start();
function sendMsg(){
    if(iptMsg.value.trim()===""){
        return;
    }
    var msgStr = iptMsg.value;
    iptMsg.value="";
    socket.emit("cmessage", room, uname, msgStr);
}
function gotoVideo(){
    window.location.href="videoRoom.html?uname="+uname;
}


btnSend.onclick = sendMsg;
btnLeave.onclick = function (){
    socket.emit("cleave",room,uname);
};
btnGotoVideo.onclick=gotoVideo;