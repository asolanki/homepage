import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";
env.allowLocalModels = false;

// DOM elements
const toggleButton = document.getElementById('toggle');
const audioElement = document.querySelector('audio');
const canvas = document.getElementById('audioVisualizer');
const ctx = canvas.getContext('2d');
const labelsContainer = document.getElementById('labels-container');

// load model
const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");

let mediaRecorder;
let audioChunks = [];
let audioContext, source, analyser;
let isRecording = false;

canvas.width = 500;
canvas.height = 200;

const BARS = []
const fillStyle = ctx.createLinearGradient(
  canvas.width / 2,
  0,
  canvas.width / 2,
  canvas.height
)

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
        analyser.fftSize = 2048; // FFT size for the analyser
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        drawBars(); // Start drawing bars
    } else {
        // Stop recording
        isRecording = false;
        mediaRecorder.stop();
        toggleButton.textContent = 'Start Recording';
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Model inference
            const output = await transcriber(audioUrl, { return_timestamps: true });

            // Handle transcription output
            labelsContainer.textContent = output.text; // Displaying the transcription result

            // Clean up
            URL.revokeObjectURL(audioUrl);
        };
    }
}

toggleButton.addEventListener('click', toggleRecord);

document.addEventListener('keydown', async function (event) {
    if (event.code === 'Space' && !isRecording) {
        event.preventDefault(); // Prevent default spacebar action (scrolling)
        await toggleRecord();
    }
});

document.addEventListener('keyup', async function (event) {
    if (event.code === 'Space' && isRecording) {
        event.preventDefault(); // Prevent default spacebar action (scrolling)
        await toggleRecord();
    }
});

function drawBars() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!isRecording) {
            requestAnimationFrame(draw);
            return;
        }

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
            ctx.fillRect(x, canvas.height/2 - barHeight/2, barWidth, barHeight/2);
            ctx.fillRect(x, canvas.height/2, barWidth, barHeight/2);
            x += barWidth + 1;
        }
        requestAnimationFrame(draw);
    }
    draw();
}