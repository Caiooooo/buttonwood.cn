# packet tracer路由器配置chap认证
拓扑图如下图所示，左边的路由器为Router1
<br>![](blog/img/pac1.png)<br>

为ISP的广域网链路配置 PPP协议，实现CHAP验证，密码为 soft。

在Router1的机器中，注意hostname必须和当前路由名字一致：
<br>![](blog/img/pac2.png)<br>
配置相连Router信息，完成双向CHAP验证，注意username必须和相邻路由名字一致。
<br>![](blog/img/pac3.png)<br>
Router2、Router3类似。

完成配置后，通过ping各地址和查看端口信息可以确认PPPoE协议已经配置成功。
<br>![](blog/img/pac4.png)<br>