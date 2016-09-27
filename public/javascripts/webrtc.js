;(function(window, $){
var isInitiator = false
  ,isChannelReady = false
  ,isStarted = false
  ,localStream
  ,remoteStream
  ,localVideo = document.getElementById('local-video')
  ,remoteVideo = document.getElementById('remote-video')
  ,miniVideo = document.getElementById('mini-video')
  
  ,pc
  ,pcConfig = {
    iceServers: [
        {urls: "stun:23.21.150.121"},
        {urls: "stun:stun.l.google.com:19302"}
        
    ]
  }
  ,room = ''
  ,socket = '';

var WebRTC = {

  initialize : function() {
    var that = this;
    
    //判断url 是 / or /r/4597714
    if(this.getRoomIdFromUrl() === undefined) {
      $("#room-selection").removeClass('hidden');
      
      $("#random-button").on("click", function() {
        $("#room-id-input").val(that.createRandom());
      });
      
      $("#join-button").on("click", function() {
        var id = $("#room-id-input").val();
        if(id === '') {
          $("#room-id-input").focus();
          return false;
        }
        location.href = window.location.href+'r/'+id;
      });

    } else {
      this.fullScreen(document.documentElement);
      room = this.getRoomIdFromUrl();
      socket = io.connect();
      this.socketEvent();
      this.getUserMedia();
      this.onBeforeUnload();
    }

   
    
    
  },

  
  

  socketEvent : function() {
    var that = this;
    if (room !== '') {
      socket.emit('create or join', room);
      console.log('Attempted to create or  join room', room);
    }

    socket.on('created', function(room) {
      console.log('Created room ' + room);
      isInitiator = true;
    });

    socket.on('full', function(room) {
      console.log('Room ' + room + ' is full');
      
      return false;
    });

    socket.on('join', function (room){
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      isChannelReady = true;

      

    });

    socket.on('joined', function(room) {
      console.log('joined: ' + room);
      isChannelReady = true;

    });

    socket.on('log', function(array) {
      console.log.apply(console, array);
    });

    // This client receives a message
    socket.on('message', function(message) {
      console.log('Client received message:', message);
      if (message === 'got user media') {
        that.startPeerConnection();
      } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
          that.startPeerConnection();
        }
        //4.B将A的offer信令中所包含的的SDP描述符(message)提取出来，通过PC所提供的setRemoteDescription()方法交给B的PC实例
        pc.setRemoteDescription(new RTCSessionDescription(message));
        that.pcCreateAnswer();
      } else if (message.type === 'answer' && isStarted) {
        //8.A接收到B的answer信令后，将其中B的SDP描述符提取出来，调用setRemoteDescripttion()方法交给A自己的PC实例
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && isStarted) {
        //14.A或B接收到对方通过服务器中转所发送过来ICE Candidate信令时，将其解析并获得网络候选，将其通过PC实例的addIceCandidate()方法加入到PC实例中
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      } else if (message === 'bye' && isStarted) {
        that.handleRemoteHangup();
      }
    });



  },

  getUserMedia : function() {
    var that = this;
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    })
    .then(function(stream) {
      console.log('Adding local stream.');
      localVideo.src = window.URL.createObjectURL(stream);
      localStream = stream;
      that.sendMessage('got user media');
      if (isInitiator) {
        that.startPeerConnection();
      }

    })
    .catch(function(e) {
      alert('getUserMedia() error: ' + e.name);
    });
  },

  sendMessage : function(message) {
    console.log('client sending message: ', message);
    socket.emit('message',room, message);
  },

  startPeerConnection : function() {
    var that = this;
    console.log('>>>>>>> startPeerConnection() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
      console.log('>>>>>> creating peer connection');
      try {
          //创建PeerConnection实例
          pc = new RTCPeerConnection(pcConfig);
          
          //10.通过在这一系列的信令交换之后，A和B所创建的PC实例都包含A和B的SDP描述符了，完成了两件事的第一件。我们还需要完成第二件事——获取连接两端主机的网络地址
          
          //11.A、B各创建配置了ICE服务器的PC实例，并为其添加onicecandidate事件回调
          //12.当网络候选可用时，将会调用onicecandidate函数
          pc.onicecandidate = function (event) {
            
            console.log('icecandidate event: ', event);
            if (event.candidate) {
              //13.在回调函数内部，A或B将网络候选的消息封装在ICE Candidate信令中，通过服务器中转，传递给对方
              that.sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
              });
            } else {
              console.log('End of candidates.');
            }
          }
          
          //15.这样连接就创立完成了，可以向RTCPeerConnection中通过addStream()加入流来传输媒体流数据。将流加入到RTCPeerConnection实例中后，对方就可以通过onaddstream所绑定的回调函数监听到了。调用addStream()可以在连接完成之前，在连接建立之后，对方一样能监听到媒体流
          pc.onaddstream = function (event) {
            console.log('Remote stream added.');
            remoteVideo.src = window.URL.createObjectURL(event.stream);
            
            //交换本地和远程视频，让远程在localVideo显示，本地视频在miniVideo显示
            $("#videos").attr("class","active");
            $("#mini-video").attr("class","active");
            $("#remote-video").attr("class","active");
            $("#local-video").attr("class","");
            miniVideo.src = localVideo.src;
            localVideo.src = window.URL.createObjectURL(event.stream);
            
            
            remoteStream = event.stream;
          }

          pc.onremovestream = function(event) {
            console.log('Remote stream removed. Event: ', event);
          }
          console.log('Created RTCPeerConnnection');

          //向pc中加入需要发送的流
          pc.addStream(localStream);
          isStarted = true;
          
          if (isInitiator) {
              that.pcCreateOffer();
          }
      } catch (e) {
          console.log('Failed to create PeerConnection, exception: ' + e.message);
          alert('Cannot create RTCPeerConnection object.');
          return;
      }
      
    }
  },

  pcCreateOffer : function() {
    var that = this;
    console.log('Sending offer to peer');
    //1.A通过PC所提供的createOffer()方法建立一个包含A的SDP描述符的offer信令
    pc.createOffer(function(offer) {
        //2.A通过PC所提供的setLocalDescription()方法，将A的SDP描述符交给A的PC实例
        pc.setLocalDescription(offer, function(){
            //3.A将offer信令通过服务器发送给B
            that.sendMessage(offer);
        }, that.errorHandler);
        console.log('create offer and send message', offer);
        
    }, that.errorHandler);
  
  },

  pcCreateAnswer : function() {
    var that = this;
    console.log('Sending answer to peer.');
    //5.B通过PC所提供的createAnswer()方法建立一个包含B的SDP描述符answer信令
    pc.createAnswer().then(function(answer) {
        //6.B通过PC所提供的setLocalDescription()方法，将B的SDP描述符交给B的PC实例
        pc.setLocalDescription(answer, function(){
            //7.B将answer信令通过服务器发送给A
            that.sendMessage(answer);
        }, that.errorHandler);
        console.log('create answer and send message', answer);
        
    }, that.errorHandler);
  },


  errorHandler : function(err) {
    console.log('This is error:', err);
  },
  onBeforeUnload : function() {
    var that = this;
    window.onbeforeunload = function() {
      that.sendMessage('bye');
    };
  },
  hangup : function() {
    var that = this;
    console.log('Hanging up.');
    that.stop();
    that.sendMessage('bye');
  },
  handleRemoteHangup : function() {
    var that = this;
    console.log('Session terminated.');
    that.stop();
    isInitiator = false;
  },
  stop : function() {
    isStarted = false;
    // isAudioMuted = false;
    // isVideoMuted = false;
    pc.close();
    pc = null;
  },
  
  getRoomIdFromUrl : function() {
    return window.location.pathname.split('/')[2];
  },

  //todo 
  createRandom : function () {
    return (new Date()-0).toString().substring(4);
  },

  fullScreen : function(element) {
    
    if(element.requestFullscreen) {  
      element.requestFullscreen();  
    } else if(element.mozRequestFullScreen) {  
      element.mozRequestFullScreen();  
    } else if(element.webkitRequestFullscreen) {  
      element.webkitRequestFullscreen();  
    } else if(element.msRequestFullscreen) {  
      element.msRequestFullscreen();  
    }  
  }

};

window.WebRTC = WebRTC;
WebRTC.initialize();

}(window, jQuery));



///////////////////////////////////////////


