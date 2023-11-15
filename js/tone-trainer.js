import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";
env.allowLocalModels = false;

// DOM elements
const toggleButton = document.getElementById('toggle');
const audioElement = document.querySelector('audio');
const canvas = document.getElementById('audioVisualizer');
const ctx = canvas.getContext('2d');
const labelsContainer = document.getElementById('labels-container');

// Load model
const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");

let mediaRecorder;
let audioChunks = [];
let audioContext, source, analyser;
let isRecording = false;
let animationState = 'idle'; // Possible states: 'idle', 'recording', 'shrinking', 'wiggling', 'stopped'

canvas.width = 500;
canvas.height = 200;

// Function to toggle recording
async function toggleRecord() {
    if (!isRecording) {
        // Start recording
        isRecording = true;
        toggleButton.textContent = 'Stop Recording';
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.start();

        // Set up audio context and analyser for visualization
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        animationState = 'recording';
        drawBars();
    } else {
        // Stop recording
        isRecording = false;
        mediaRecorder.stop();
        toggleButton.textContent = 'Start Recording';
        animationState = 'shrinking';

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Model inference
            const output = await transcriber(audioUrl, { return_timestamps: true });

            // Handle transcription output
            labelsContainer.textContent = output.text; // Displaying the transcription result

            // Clean up
            URL.revokeObjectURL(audioUrl);
            animationState = 'stopped';
        };
    }
}

toggleButton.addEventListener('click', toggleRecord);

// Drawing function
function drawBars() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let shrinkFactor = 1; // Factor to shrink the bars, starts as 1 (full size)
    let wiggleFactor = 0; // Factor to control the wiggle animation

    function draw() {
        requestAnimationFrame(draw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * shrinkFactor;

            if (animationState === 'recording') {
                analyser.getByteFrequencyData(dataArray);
            } else if (animationState === 'shrinking') {
                shrinkFactor -= 0.01;
                if (shrinkFactor <= 0.1) {
                    animationState = 'wiggling';
                    shrinkFactor = 0.1;
                }
            } else if (animationState === 'wiggling') {
                wiggleFactor += 0.1;
                barHeight = (1 + Math.sin(wiggleFactor + i)) * 20;
            } else if (animationState === 'stopped') {
                barHeight = 10; // Fixed small height for dots
            }

            ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
            ctx.fillRect(x, canvas.height/2 - barHeight/2, barWidth, barHeight/2);
            ctx.fillRect(x, canvas.height/2, barWidth, barHeight/2);
            x += barWidth + 1;
        }
    }
    draw();
}
