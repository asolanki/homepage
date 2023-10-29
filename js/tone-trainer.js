import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

nv.allowLocalModels = false;

// DOM elements
const status = document.getElementById("status");
const recordButton = document.getElementById('record-button');
const labelsContainer = document.getElementById('labels-container');

// load model
status.textContent = "Loading model...";
const classifier = await pipeline("audio-classification", "asolanki/distilhubert-finetuned-mandarin");
status.textContent = "Ready";

let mediaRecorder;
let audioChunks = [];

// Start recording when the spacebar is held down
document.addEventListener('keydown', async function (event) {
    if (event.code === 'Space') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();
    }
});

// Stop recording when the spacebar is released
document.addEventListener('keyup', async function (event) {
    if (event.code === 'Space' && mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioBuffer = await blobToArrayBuffer(audioBlob);

        // Model inference
        status.textContent = 'Analysing...';
        const output = await classifier(audioBuffer, {
            // Any model-specific options here
        });
        status.textContent = '';

        // Display top 3 labels
        const topLabels = output.slice(0, 3); // Assuming output is sorted
        labelsContainer.innerHTML = '';
        topLabels.forEach(label => {
            const labelElement = document.createElement('h1');
            labelElement.textContent = label.name; // Replace with the actual property for the label name
            labelsContainer.appendChild(labelElement);
        });
    }
});

// Helper function to convert Blob to ArrayBuffer
function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}
