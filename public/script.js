const socket = io('/')
const videoGrid = document.getElementById('video-grid')


myPeer = new Peer(undefined, {})
let ownVideo;
let currentPeer;

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {

  ownVideo = stream;
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
      currentPeer = call.peerConnection
    })
  })


  socket.on('user-connected', userId => {
    console.log('New User Connected: ' + userId)
    const fc = () => connectToNewUser(userId, stream)
    timerid = setTimeout(fc, 1000 )
    })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
    currentPeer = call.peerConnection
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}


const btn = document.getElementById("mute/unmute");

const muteUnmute = () =>{
    if(ownVideo.getAudioTracks()[0].enabled){
      ownVideo.getAudioTracks()[0].enabled = false;
      btn.innerHTML="Unmute";
    }
    else{
      ownVideo.getAudioTracks()[0].enabled = true;
      btn.innerHTML="Mute"
    }
}

btn.addEventListener('click', muteUnmute);


const pause = document.getElementById("pause");

const pauseVideo = () => {
  if(ownVideo.getVideoTracks()[0].enabled){
      ownVideo.getVideoTracks()[0].enabled = false;
      pause.innerHTML="Resume";
  }
  else {
      ownVideo.getVideoTracks()[0].enabled = true;
      pause.innerHTML = "Pause";
  }
}


pause.addEventListener('click', pauseVideo)


var send = document.getElementById("send");
var message = document.getElementById("message");
var output = document.getElementById("output");
var handle = document.getElementById("handle");

send.addEventListener('click', function(){
  socket.emit("chat-msg", {
    message: message.value,
    handle: handle.value
    });

    message.value = '';
});

socket.on("chat-msg", function (data) {
  output.innerHTML +=
    "<p><strong>" + data.handle + ":</strong>" + data.message + "</p>";
});

document.getElementById("shareScreen").addEventListener('click', (e) => {
  navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: "always"
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    }
  }).then((stream) => {
      let vid = stream.getVideoTracks()[0];
      vid.onended =function(){
        shareStop();
      }
      let send = currentPeer.getSenders().find(function(s){
        return s.track.kind == vid.kind
      })
      send.replaceTrack(vid)
  }).catch((error) => {
      console.log(error);
  })
})

function shareStop() {
    let vid = ownVideo.getVideoTracks()[0];
    let send = currentPeer.getSenders().find(function(s){
      return s.track.kind == vid.kind;
    })

    send.replaceTrack(vid);
}
