
let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
const checkboxTheme = document.querySelector('#theme')
let client = {}
output = document.getElementById('output'),

//get stream
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        socket.emit('NewClient')
        video.srcObject = stream
        video.play()


      talk.addEventListener('click', function(ev){
          console.log("recognition started");
          speechrecognition();
      })

        //used to initialize a peer
      function InitPeer(type) {
          let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false })
          peer.on('stream', function (stream) {
              CreateVideo(stream)
          })
          //This isn't working in chrome; works perfectly in firefox.
          // peer.on('close', function () {
          //     document.getElementById("peerVideo").remove();
          //     peer.destroy()
          // })
          peer.on('data', function (data) {
              let decodedData = new TextDecoder('utf-8').decode(data)
              let peervideo = document.querySelector('#peerVideo')
          })
          return peer
      }

        //for peer of type init
        function MakePeer() {
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function (data) {
                if (!client.gotAnswer) {
                    socket.emit('Offer', data)
                }
            })
            client.peer = peer
        }

        //for peer of type not init
        function FrontAnswer(offer) {
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', data)
            })
            peer.signal(offer)
            client.peer = peer
        }

        function SignalAnswer(answer) {
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
        }

        function CreateVideo(stream) {
            CreateDiv()

            let video = document.createElement('video')
            video.id = 'peerVideo'
            video.srcObject = stream
            video.setAttribute('class', 'embed-responsive-item')
            document.querySelector('#peerDiv').appendChild(video)
            video.play()

        }

        function SessionActive() {
            document.write('Session Active. Please come back later')
        }



        function RemovePeer() {
            document.getElementById("peerVideo").remove();
            if (client.peer) {
                client.peer.destroy()
            }
        }

        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)
        socket.on('Disconnect', RemovePeer)

    })
    .catch(err => document.write(err))

checkboxTheme.addEventListener('click', () => {
    if (checkboxTheme.checked == true) {
        document.body.style.backgroundColor = '#212529'
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#fff"
        }

    }
    else {
        document.body.style.backgroundColor = '#fff'
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#212529"
        }
    }
}
)


function CreateDiv() {
    let div = document.createElement('div')
    div.setAttribute('class', "centered")
    document.querySelector('#peerDiv').appendChild(div)
    if (checkboxTheme.checked == true)
        document.querySelector('#muteText').style.color = "#fff"
}

/*speech recognition*/
function speechrecognition(){
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.addEventListener('result', e => {
        const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
        socket.emit('chat', transcript)
    });
    recognition.addEventListener('end', recognition.start);
    recognition.start();
}

socket.on('chat', function(data){
    console.log(data)
    output.innerHTML = data;
});
