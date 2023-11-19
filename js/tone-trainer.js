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

            // Ensure the byte length is a multiple of 2
            const byteLength = arrayBuffer.byteLength - (arrayBuffer.byteLength % 2);
            const audioDataInt16 = new Int16Array(arrayBuffer, 0, byteLength / 2);

            // Convert Int16Array to Float32Array
            let audioDataFloat32 = new Float32Array(audioDataInt16.length);
            for (let i = 0; i < audioDataInt16.length; i++) {
                audioDataFloat32[i] = audioDataInt16[i] / 32768.0; // Normalize the audio data
            }

            // pad or trim to 2s (32000 samples)
            if (audioDataFloat32.length > 32000) {
                audioDataFloat32 = audioDataFloat32.slice(0, 32000);
            }
            if (audioDataFloat32.length < 32000) {
                const paddedAudioData = new Float32Array(32000);
                paddedAudioData.set(audioDataFloat32);
                audioDataFloat32 = paddedAudioData;
            }
            
            


            const inputTensor = new ort.Tensor('float32', audioDataFloat32, [1, 32000]);
            const feeds = { 'onnx::Unsqueeze_0': inputTensor };



            // // Model inference
            // const output = await transcriber(audioUrl, { return_timestamps: true });
            let output
            try {
                output = await session.run(feeds);
                // Process the output
            } catch (error) {
                console.error('Error during model inference:', error);
            }
            // Handle transcription output
            console.log(output)
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