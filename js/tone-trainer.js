// import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";
// env.allowLocalModels = false;

// import * as ort from "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.10.0/ort.min.js";
// import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/esm/ort.min.js";



// DOM elements
const toggleButton = document.getElementById('toggle');
const audioElement = document.querySelector('audio');
const canvas = document.getElementById('audioVisualizer');
const ctx = canvas.getContext('2d');
const labelsContainer = document.getElementById('labels-container');

// Load model
labelsContainer.textContent = "Loading model...";
// const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
const session = await ort.InferenceSession.create("https://r2.adarshsolanki.com/model.onnx");
labelsContainer.textContent = "Ready";

let mediaRecorder;
let audioChunks = [];
let audioContext, source, analyser;
let isRecording = false;
let animationState = 'idle'; // Possible states: 'idle', 'recording', 'shrinking', 'wiggling', 'stopped'
let shrinkFactor = 1; // Factor to shrink the bars
let wiggleFactor = 0; // Factor for the wiggle animation

canvas.width = 500;
canvas.height = 200;

async function toggleRecord() {
    if (!isRecording) {
        // Start recording
        isRecording = true;
        toggleButton.textContent = 'Stop Recording';
        animationState = 'recording';
        shrinkFactor = 1;
        wiggleFactor = 0;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.start();

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);

            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioData = new Int16Array(arrayBuffer);
            const inputTensor = new ort.Tensor('float32', audioData, [1, audioData.length]);
            const feeds = { 'audio': inputTensor }; // Replace 'input_tensor' with your model's input name



            // // Model inference
            // const output = await transcriber(audioUrl, { return_timestamps: true });

            const output = await session.run(feeds);

            // Handle transcription output
            labelsContainer.textContent = output.text;

            // Clean up
            URL.revokeObjectURL(audioUrl);
            animationState = 'stopped';
        };

        if (!audioContext) {
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
        }
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        drawBars();
    } else {
        // Stop recording
        isRecording = false;
        mediaRecorder.stop();
        toggleButton.textContent = 'Start Recording';
        animationState = 'shrinking';
    }
}

toggleButton.addEventListener('click', toggleRecord);

function drawBars() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if(animationState !== 'stopped') {
            requestAnimationFrame(draw);
        }
        
        analyser.getByteFrequencyData(dataArray);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        let barHeight;
        
        for(let i = 0; i < bufferLength; i++) {

            if(animationState === 'shrinking') {
                barHeight = dataArray[i] * shrinkFactor;
                shrinkFactor -= 0.001;
                if(shrinkFactor <= 0.1) {
                    animationState = 'wiggling';
                }
            } else if(animationState === 'wiggling') {
                barHeight = 10 + 5 * Math.sin(wiggleFactor + i * 0.05);
            } else if(animationState === 'stopped') {
                barHeight = 10; // Fixed small height for dots
            } else {
                barHeight = dataArray[i];
            }

            ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight / 2);
            ctx.fillRect(x, canvas.height / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
        }
        
        // Increase wiggleFactor after each redraw
        wiggleFactor += 0.05; 
    }

    draw();
}