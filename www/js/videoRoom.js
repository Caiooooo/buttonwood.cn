"use strict"

var url=location.href;
var uname = url.split("?")[1].split("=")[1];
var hWelcom = document.getElementById("vwelcome");
hWelcom.textContent+="："+uname;

var iptRoom = document.getElementById("room");
var btnEnterRoom = document.getElementById("enterRoom");
var btnLeaveRoom =document.getElementById("leaveRoom");

var videoLocal = document.getElementById("localVideo");
var videoRemote = document.getElementById("remoteVideo");

var localStream = null
var remoteStream = null;
var socket = null;
var room="";
var status = "";
var pc = null;

function getMedia(stream){
    localStream=stream;
}

function createPeerConnection() {
    if(!pc){
        console.log("create Peer conn")
        var pcConfig={
            "iceServers":[{
                "urls":"turn:110.41.55.214:3478",
                "username":"buttonwood",
                "credential":"123456"
            }]
        }

        pc = new RTCPeerConnection(pcConfig);

        pc.onicecandidate=(e)=>{
            if(e.candidate){
                console.log("candiate:",e.candidate);

                sendMessage({
                    type:"candidate",
                    label:e.candidate.sdpMLineIndex,
                    id:e.candidate.sdpMid,
                    candidate:e.candidate.candidate
                });
            }
        }
        //当媒体流到达的时候，做什么
        pc.ontrack = (e)=>{
            console.log("receive track");

            remoteStream = e.streams[0];
            console.log("remoteStream set");
            console.log(e.streams)
            videoRemote.srcObject=remoteStream;
        };
        // console.log(localStream)
        if(localStream){
            console.log("add localStream")
            localStream.getTracks().forEach((track)=>{
               pc.addTrack(track,localStream);
            });
        }
    }
}

function getOffer(desc) {
    console.log(desc);
    pc.setLocalDescription(desc);
    sendMessage(desc);
}

function mediaNegociate() {
    if(status==="joined_conn"){
        if(pc) {
            console.log("media_negociating_createOffer")
            var options = {
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            }

            pc.createOffer(options)
                .then(getOffer)
                .catch(handleErr);
        }
    }
}


function start(){
    var constraints={
        video:true,
        audio:true
    };
    // 共享屏幕
    // navigator.mediaDevices.getDisplayMedia(constraints)
    //打开摄像头
    navigator.mediaDevices.getUserMedia(constraints)
        .then(getMedia)
        .catch(handleErr);

    socket=io.connect();
    btnLeaveRoom.disabled=true;

    socket.on("vjoined",(room)=>{

        iptRoom.disabled=true;
        btnEnterRoom.disabled=true;
        btnLeaveRoom.disabled=false;

        videoLocal.srcObject = localStream;

        createPeerConnection();
        status="joined";
        console.log("vjoined:", status);
    });

    socket.on("votherjoined",(room,uname)=>{
        //建立视频连接
        console.log(uname+" votherjoined");
        if(status==="joined_unbind"){
            console.log(uname+" joined_unbind_createPeerConn");
            createPeerConnection();
        }
        // bugs here

        status="joined_conn";

        //媒体协商
        mediaNegociate();

        console.log("votherjoined:", status);
    });

    socket.on("vfull",(room)=>{
        alert("房间已满："+room);
        status="left";
        console.log("vfull",status);
    });

    socket.on("vgetdata",(room,data)=>{
        if(!data)
            return;
        //拿到候选者信息
        if(data.type==="candidate")
        {
            console.log("get Other candidate")
            var caddt = new RTCIceCandidate({
                sdpMLineIndex:data.label,
                sdpMid:data.id,
                candidate:data.candidate
            });
            pc.addIceCandidate(caddt);
        }else if(data.type==="offer"){
            console.log("get offer and setRemoteDescription");

            pc.setRemoteDescription(new RTCSessionDescription(data));

            //查询自己的媒体并answer

            pc.createAnswer()
                .then((desc)=>{
                    console.log(desc);
                    pc.setLocalDescription(desc);
                    sendMessage(desc);
                }).catch(handleErr);
        }else if (data.type==="answer"){
            console.log("get answer and setRemoteDescription")

            pc.setRemoteDescription(new RTCSessionDescription(data));
        }
    });

    socket.on("vleft",(room)=>{
        videoLocal.srcObject=null;
        videoRemote.srcObject=null;
        status="leaved";
        console.log("vleft",status);
    });

    socket.on("votherleft",(room,uname)=>{
        status="joined_unbind";
        closePeerConnection();
        videoRemote.srcObject=null;
        console.log("votherleft",status);
    });
}
start();

function sendMessage(data){
    if(socket){
        socket.emit("vdata",room,data);
    }
}

function enterRoom() {
    room = iptRoom.value.trim();
    if(room==="") {
        alert("请输入房间号");
        return;
    }

    socket.emit("vjoin",uname,room);

}


function leaveRoom() {
    if(status!="leaved"){
        socket.emit("vleave",room,uname);
        iptRoom.value="";
        iptRoom.disabled=false;
        btnEnterRoom.disabled=false;
        btnLeaveRoom.disabled=true;
        closePeerConnection();
    }
}

function closePeerConnection(){
    console.log("close RTCPeerConnection");

    if(pc){
        pc.close();
        pc=null;
    }
}




btnEnterRoom.onclick=enterRoom;
btnLeaveRoom.onclick=leaveRoom;


function handleErr(e) {
    console.log(e)
}
