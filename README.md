# dortc

> docrtc 是用WebRTC 实现视频通话的轮子。 WebRTC（http://webrtc.org/） 是 google主推的一个项目，旨在使得浏览器能为实时通信（RTC）提供简单的JavaScript接口。有了它，直接通过浏览器的 Web 页面就可以实现音视频聊天功能，无需任何插件。

# 示例和使用方法

1. 安装Node.js及npm环境

2. 下载源码到本地 : git clone https://github.com/entere/dortc.git

3. cd docrtc && npm install

4. 运行命令 DEBUG=docrtc* npm start

5. 在firefox中访问localhost:3000 查看效果 

6. [请使用新版firefox 【点此】 查看](http://localhost:3000)


# WebRTC交互过程

要用WebRTC建立一个p2p通道需要经历二个步骤：

### 一、获得本机SDP描述符并交换

1. A和B打开浏览器后都调用getUserMedia获取本地视频流，在浏览器上播放；

2. B先进入房间，此时房间中没有其他用户，B在房间下建立属于自己的节点，且监听自己的信箱；

3. A进入房间，发现B已存在，此时A通过PC所提供的createOffer()方法建立一个包含A的SDP描述符的offer信令；

4. A通过PC所提供的setLocalDescription()方法，将A的SDP描述符交给A的PC实例(就是存储到本地)；

5. A将offer信令通过服务器发送到B的信箱，同时，A也监听自己的信箱；

6. B发现信箱下有信件，查知此信为A的offer，于是将offer信令中所包含的的SDP描述符提取出来，通过PC所提供的setRemoteDescription()方法交给B的PC实例(就是存储到本地)；

7. B通过PC所提供的createAnswer()方法建立一个包含B的SDP描述符的answer信令；

8. B通过PC所提供的setLocalDescription()方法，将B的SDP描述符交给B的PC实例(就是存储到本地)；

9. B将answer信令通过服务器发送到A的信箱；

10. A接收到B的answer信令后，将其中B的SDP描述符提取出来，调用setRemoteDescripttion()方法交给A的PC实例(就是存储到本地)；

通过在这一系列的信令交换之后，A和B所创建的PC实例都包含A和B的SDP描述符了，完成了两件事的第一件。我们还需要完成第二件事——获取连接两端主机的网络地址

### 二、过ICE框架建立NAT/防火墙穿越的连接，连接两段主机的网络地址

这个网络地址应该是能从外界直接访问，WebRTC使用ICE框架来获得这个地址。RTCPeerConnection在创立的时候可以将ICE服务器的地址传递进去，如：

```javascript
var iceServerConfig = {
    iceServers: [
        {urls: "stun:23.21.150.121"},
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}
    ]
}
var pc = new RTCPeerConnection(iceServerConfig);
```

当然这个地址也需要交换，还是以AB两位为例，交换的流程如下（RTCPeerConnection简称PC）：

1. A、B各创建配置了ICE服务器的PC实例，并为其添加onicecandidate事件回调

2. 当网络候选可用时，将会调用onicecandidate函数

3. 在回调函数内部，A或B将网络候选的消息封装在ICE Candidate信令中，通过服务器中转，传递给对方

4. 甲或乙接收到对方通过服务器中转所发送过来ICE Candidate信令时，将其解析并获得网络候选，将其通过PC实例的addIceCandidate()方法加入到PC实例中

这样连接就创立完成了，可以向RTCPeerConnection中通过addStream()加入流来传输媒体流数据。将流加入到RTCPeerConnection实例中后，对方就可以通过onaddstream所绑定的回调函数监听到了。调用addStream()可以在连接完成之前，在连接建立之后，对方一样能监听到媒体流


# 参考

[WebRTC codelab](https://codelabs.developers.google.com/codelabs/webrtc-web/#0)
[Getting Started With WebRTC](http://html5rocks.com/en/tutorials/webrtc/basics)
[developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
[天镶的博客](http://lingyu.wang/#/)
[apprtc](https://apprtc.appspot.com/)