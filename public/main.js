
const video = document.querySelector('video');
var knn;
var featureExtractor
var predLenght;

var canvas1 = document.getElementById('canvas1')
var context = canvas1.getContext('2d');
var canvas2 = document.getElementById('canvas2')
var context2 = canvas2.getContext('2d');

var model;
const modelParams = {
    flipHorizontal: true,   // flip e.g for video 
    imageScaleFactor: 1.0,  // reduce input image size for gains in speed.
    maxNumBoxes: 20,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.79,    // confidence threshold for predictions.
}

handTrack.load(modelParams).then(lmodel => {
    console.log("loading model")
    model = lmodel;
})


navigator.getUserMedia = navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia;

handTrack.startVideo(video).then( status => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }
  video.width = IMAGE_SIZE
  video.height = IMAGE_SIZE
  const stream = navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': true
  });
  video.srcObject = stream;
  gstream = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
      video.play()
    };
  });
});


function runDectection()    {
  let arr;
  model.detect(video).then(predictions => {
      console.log(predictions)
      model.renderPredictions(predictions, canvas1, context, video)
      predLenght = predictions.length;
      if(predictions.length >0)   {
          for(let i=0; i< predictions.length; i++)    { 
              arr = predictions[i].bbox;
              context2.drawImage(canvas1, arr[0], arr[1], arr[2]+20, arr[3]+20,arr[0], arr[1], arr[2]+20, arr[3]+20);
          }
      }
  })
}

function clearCanvas()  {
  context2.clearRect(0, 0, 224, 224)
}



const IMAGE_SIZE = 224;
var Peer = require('simple-peer');
var socket = io();
var client = {};
var gstream = null
/*navigator.mediaDevices.getUserMedia({ video: true, audio: false })
.then(stream => {
    gstream = stream;
    video.srcObject = stream;
    video.width = IMAGE_SIZE;
    video.height = IMAGE_SIZE;
});*/


//import {KNNImageClassifier} from 'deeplearn-knn-image-classifier';
//import * as dl from 'deeplearn';



//import { constant } from '@tensorflow/tfjs-layers/dist/exports_initializers';


const TOPK = 10;

const predictionThreshold = 0.85

var words = ['hello', 'send', 'other']
var name = null



class Main  {
    constructor()   {
        this.meassage = []
        this.wcs = document.getElementsByClassName("wcs");
        this.ddMode = document.getElementById("dd-mode");
        this.normalMode = document.getElementById("normal-mode")
        this.mode = null
        this.trainingListDiv = document.getElementById("training-list")

        this.predResults = document.getElementById("subs")

        this.infoTexts = [];
        this.training = -1; // -1 when no class is being trained
        this.videoPlaying = false;

        this.previousPrediction = -1
        this.currentPredictedWords = []
        this.round = 0
        


        // variables to restrict prediction rate
        this.now;
        this.then = Date.now()
        this.startTime = this.then;
        this.fps = 1 //framerate - number of prediction per second
        this.fpsInterval = 1000/(this.fps);
        this.elapsed = 0;

        this.trainingListDiv = document.getElementById("training-list")
        this.exampleListDiv = document.getElementById("example-list")

        //knn = null
        //featureExtractor = null
        

        // Get video element that will contain the webcam image

        this.addWordForm = document.getElementById("add-word")




        // add word to training example set
        this.addWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let word = document.getElementById("new-word").value.trim().toLowerCase();

            if(word && !words.includes(word)){
                //console.log(word)
                words.splice(words.length-1,0,word) //insert at penultimate index in array
                this.createButtonList(false)
                this.updateExampleCount()
                //console.log(words)

                document.getElementById("new-word").value = ''

                // console.log(words)

            } else {
                alert("Duplicate word or no word entered")
            }

            return
        })

    

        this.updateExampleCount()


        this.createTrainingBtn()

        this.createButtonList(false)

    }

    welcomeScreen()    {
        this.trainingListDiv.style.display = "none"
        video.style.display = "none"
        this.ddMode.addEventListener("click", () => {
            console.log("mode: deaf-dumb")
            for (let i=0;i<this.wcs.length;i+=1){
                this.wcs[i].style.display = 'none';
            }
            let nameInput = document.getElementById("name")
            name = nameInput.value
            name = name.toUpperCase() + ": " 
            this.trainingScreen()
        })
        this.normalMode.addEventListener("click", () => {
            console.log("mode: normal")
            for (let i=0;i<this.wcs.length;i+=1){
                this.wcs[i].style.display = 'none';
            }
            /*let video = document.createElement('video')
            video.id = 'localVideo'
            video.srcObject = gstream
            video.setAttribute('class', 'embed-responsive-item')
            document.querySelector('#localDiv').appendChild(video)*/
            video.style.display = "block"

            let talk = document.getElementById("mpb-button")
            talk.innerHTML = "click to start speaking"
            talk.addEventListener("click", () => {
              console.log("started speech recognition");
              speechrecognition()
            })
            let nameInput = document.getElementById("name")
            name = nameInput.value
            name = name.toUpperCase() + ": " 
            videoCall()
        })
    }

    trainingScreen()   {
        this.trainingListDiv.style.display = "block"
        video.style.display = "block"
        video.play()
        this.videoPlaying = true
    }

    createTrainingBtn(){
      this.nominee = new Array(words.length).fill(0)
        var div = document.getElementById("action-btn")
        div.innerHTML = ""
    
        const trainButton = document.createElement('button')
        trainButton.id = "train-button"
        trainButton.innerText = "Training >>>"
        div.appendChild(trainButton);
    
    
        trainButton.addEventListener('mousedown', () => {
    
          if(words.length == 3){
            var proceed = confirm("You have not added any words.\n\nThe only query you can currently make is: 'hello'")
    
            if(!proceed) return
          }
    
          console.log("ready to train")
          this.createButtonList(true)
          this.addWordForm.innerHTML = ''
          this.loadKNN()
          this.createVideoCallButton()
          /*
    
          this.textLine.innerText = "Step 2: Train"
    
          let subtext = document.createElement('span')
          subtext.innerHTML = "<br/>Time to associate signs with the words"
          subtext.classList.add('subtext')
          this.textLine.appendChild(subtext)
          */
            /*const callButton = document.createElement('button')//start video calling
            callButton.innerText = "Video Call"
            this.trainingListDiv.appendChild(callButton)
            callButton.addEventListener('click', () => {
                this.trainingListDiv.style.display = "none"
                const trainStreamDiv = document.getElementById('train-stream')
                trainStreamDiv.style.display = "none"
                videoCall();
            })*/
        })
    }
    
    async loadKNN(){

        knn = knnClassifier.create()
        featureExtractor = await mobilenet.load();
        /*featureExtractor =  await ml5.featureExtractor("MobileNet", () => {
          console.log("lodeded knn and mobilenet");
            this.startTraining()
        });*/
        // Load knn model
    }

    createButtonList(showBtn){
        //showBtn - true: show training btns, false:show only text
    
        // Clear List
        this.exampleListDiv.innerHTML = ""
    
        // Create training buttons and info texts
        for(let i=0;i<words.length; i++){
          this.createButton(i, showBtn)
        }
    }

    createButton(i, showBtn){
        const div = document.createElement('div');
        this.exampleListDiv.appendChild(div);
        div.style.marginBottom = '10px';
    
        // Create Word Text
        const wordText = document.createElement('span')
    
        if(i==0 && !showBtn){
          wordText.innerText = words[i].toUpperCase()
        } else if(i==words.length-1 && !showBtn){
          wordText.innerText = words[i].toUpperCase()
        } else {
          wordText.innerText = words[i].toUpperCase()+" "
          wordText.style.fontWeight = "bold"
        }
    
    
        div.appendChild(wordText);
    
        if(showBtn){
          // Create training button
          const button = document.createElement('button')
          button.innerText = "Add Example"//"Train " + words[i].toUpperCase()
          div.appendChild(button);
    
          // Listen for mouse events when clicking the button
          button.addEventListener('click', async () => {
          for(let j=0; j<30; j++) { 
            await this.sleep(1000)
              clearCanvas();
              runDectection();
              this.training = i;
              // Get image data from video element
          const image = tf.browser.fromPixels(canvas2);
          //console.log(image.dataSync())
          const logits = featureExtractor.infer(image);
          //logits.print();
          // Train class if one of the buttons is held down
          if(predLenght>0)  {
            knn.addExample(logits, this.training);
          }
            // Add current image to classifier
            
      
    
          const exampleCount = knn.getClassExampleCount()
          //console.log(exampleCount);
    
          //if(Math.max(...exampleCount) > 0){
              if(exampleCount[i] > 0){
                this.infoTexts[i].innerText = ` ${exampleCount[i]} examples`
              }
            
          //}
          }
          });
    
          // Create clear button to emove training examples
          const btn = document.createElement('button')
          btn.innerText = "Clear"//`Clear ${words[i].toUpperCase()}`
          div.appendChild(btn);
    
          btn.addEventListener('mousedown', () => {
            console.log("clear training data for this label")
            knn.clearLabel(i)
            this.infoTexts[i].innerText = " 0 examples"
          })
    
          // Create info text
          const infoText = document.createElement('span')
          infoText.innerText = " 0 examples";
          div.appendChild(infoText);
          this.infoTexts.push(infoText);
        }
    }

    
    
   

    updateExampleCount(){
        var p = document.getElementById('count')
        p.innerText = `Training: ${words.length} words`
    }



    createVideoCallButton(){
      let div = document.getElementById("action-btn")
      div.innerHTML = ""
      const videoCallButton = document.createElement('button')
      div.appendChild(videoCallButton)
      videoCallButton.innerText = "Start VideoCalling >>>"

      const loadBtn = document.createElement('button')
      div.appendChild(loadBtn)
      loadBtn.innerText = "load model"

      loadBtn.addEventListener("click", () => {
        this.trainingListDiv.style.display = "none"
        knn.load("model1.json");
        videoCall();
        this.createPredictBtn()
      })


      videoCallButton.addEventListener("click", () => {
        this.trainingListDiv.style.display = "none"
        videoCall();
        this.createPredictBtn()
      })
    }
    
    createPredictBtn(){
      let div = document.getElementById("action-btn")
      div.innerHTML = ""
      const saveBtn = document.createElement('button')
      div.appendChild(saveBtn)
      saveBtn.innerText = "save model"

      saveBtn.addEventListener("click", () => {
        knn.save("model1.json");
      })

        var predButton = document.getElementById("mpb-button")
        predButton.innerHTML = "start predicting"
    
        predButton.addEventListener('click', () => {
            console.log("start predicting")
            const exampleCount = knn.getClassExampleCount()
            //console.log(exampleCount)
          // check if training has been done
          //if(Math.max(...exampleCount) > 0){
            // if wake word has not been trained
            if(exampleCount[0] == 0){
              alert(
                `You haven't added examples for the wake word HELLO`
                )
              return
            }
    
            // if the catchall phrase other hasnt been trained
            if(exampleCount[words.length-1] == 0){
              alert(
                `You haven't added examples for the catchall sign OTHER.\n\nCapture yourself in idle states e.g hands by your side, empty background etc.\n\nThis prevents words from being erroneously detected.`)
              return
            }
    
            let proceed = confirm("Remember to sign the wake word hello both at the beginning and end of your query.\n\ne.g Alexa, what's the weather (Alexa)")
    
            if(!proceed) return
            
            
            //this.textLine.classList.remove("intro-steps")
            //this.textLine.innerText = "Sign your query"
            this.startPredicting()
          /*} else {
            alert(
              `You haven't added any examples yet.\n\nPress and hold on the "Add Example" button next to each word while performing the sign in front of the webcam.`
              )
          }*/
        })
    }
      
    startPredicting(){
        // stop training
        //knn.load("model.json", () => {
          this.pred = requestAnimationFrame(this.predict.bind(this))
        //})
        
    }

    pausePredicting(){
        console.log("pause predicting")
        cancelAnimationFrame(this.pred)
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    

    async predict (){
        clearCanvas();
        this.now = Date.now()
        this.elapsed = this.now - this.then
    
        if(this.elapsed > this.fpsInterval){
          this.then = this.now - (this.elapsed % this.fpsInterval);
          if(this.videoPlaying){
            const exampleCount = knn.getClassExampleCount();
            runDectection()
            const image = tf.browser.fromPixels(canvas2);
            const logits = featureExtractor.infer(image)
            //if(Math.max(...exampleCount) > 0){
            if(predLenght>0)  {
              knn.predictClass(logits, 10).then((res) => {
                if(res.confidences[res.classIndex] > predictionThreshold &&
                  res.classIndex != this.previousPrediction &&
                  res.classIndex != words.length-1){
                  console.log(words[res.classIndex]);
                  this.previousPrediction = res.classIndex;
                  
                  //console.log(words[res.classIndex])
                  /*if(res == 'send') {
                    socket.emit('chat', name + this.message);
                    this.meassage = [];
                  }
                  else  {   
                    this.message = this.message + ' ' + words[res.classIndex];
                  }*/
                  
                }
              }).then(logits.dispose(),image.dispose())
            }
            
            /*} else {
              image.dispose()
            }*/
              /*.then((res) => *//*{
                for(let i=0;i<words.length;i++){
                  // if matches & is above threshold & isnt same as prev prediction
                  // and is not the last class which is a catch all class
                  if(res.classIndex == i && res.confidences[i] > predictionThreshold && res.classIndex != this.previousPrediction){
                    console.log(words[i])
                    if(words[i] == 'send')  {
                      
                      socket.emit('chat', name + this.meassage)
                      this.message = []
                    }
                    if(words[i] != 'other') {
                      this.message = this.meassage + ' ' + words[i];
                    }
                    
                    // set previous prediction so it doesnt get called again
                    this.previousPrediction = res.classIndex;
    
                  }
                }
              }).then(() => logits.dispose())*/
              
          }
        }
        this.pred = requestAnimationFrame(this.predict.bind(this))
      }

}



async function videoCall()    {
        socket.emit('NewClient')
        //used to initialize a peer
      function InitPeer(type) {
          let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: gstream, trickle: false })
          peer.on('stream', function (stream) {
              CreateVideo(stream)
          })
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
            let video = document.createElement('video')
            video.id = 'peerVideo'
            video.srcObject = stream
            video.setAttribute('class', 'embed-responsive-item')
            document.querySelector('#peerDiv').appendChild(video)
            video.play()
            console.log("started session successfully")
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
        socket.emit('chat',name + transcript)
    });
    recognition.addEventListener('end', recognition.start);
    recognition.start();
}

socket.on('chat', function(data){
  let messageBox = document.getElementById("message")
  messageBox.innerHTML = data
});



var main = null
window.addEventListener('load', () => {
    main = new Main()
    main.welcomeScreen()
})