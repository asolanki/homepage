import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

env.allowLocalModels = false;

// DOM elements
const status = document.getElementById("status");
const recordButton = document.getElementById('record-button');
const labelsContainer = document.getElementById('labels-container');

const visualizerContainer = document.getElementById('visualizer-container');
const audioVisualizer = document.getElementById('audioVisualizer');


// load model
status.textContent = "Loading model...";
const classifier = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny");
status.textContent = "Ready";

let mediaRecorder;
let audioChunks = [];
let audioContext, source, analyser;

// Start recording when the spacebar is held down
document.addEventListener('keydown', async function (event) {
    if (event.code === 'Space' && (!mediaRecorder || mediaRecorder.state === 'inactive')) {
        visualizerContainer.style.background = '#d1f4d1'; // Start recording UI feedback
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        // Prepare for waveform visualization
        audioContext = new AudioContext();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        source.connect(analyser);
        drawWaveform();

        mediaRecorder.start();
    }
});

// Stop recording when the spacebar is released
document.addEventListener('keyup', async function (event) {
    if (event.code === 'Space' && mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        visualizerContainer.style.background = '#f2d1d1'; // Processing UI feedback

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioBuffer = await blobToArrayBuffer(audioBlob);

        // Model inference
        status.textContent = 'Analysing...';
        const output = await classifier(audioBuffer, {
            // Model-specific options
        });
        status.textContent = '';

        // Update UI based on results
        // (Modify this part according to your actual output processing logic)
        visualizerContainer.style.background = output.length > 0 ? '#c8e6c9' : '#ffcdd2'; // Success or error color

        // Display top 3 labels
        const topLabels = output.slice(0, 3); // Assuming output is sorted
        labelsContainer.innerHTML = '';
        topLabels.forEach(label => {
            const labelElement = document.createElement('h1');
            labelElement.textContent = label.name; // Replace with actual label property
            labelsContainer.appendChild(labelElement);
        });
    }
});

// Helper functions
function blobToArrayBuffer(blob) {
    // ... (Your existing function)
}

function drawWaveform() {
    const canvas = audioVisualizer;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#031d44';

        ctx.beginPath();
        let sliceWidth = WIDTH * 1.0 / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * HEIGHT/2;

            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height/2);
        ctx.stroke();
    }

    draw();
}
