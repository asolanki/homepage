import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";
env.allowLocalModels = false;

// DOM elements
const status = document.getElementById("status");
const toggleButton = document.getElementById('toggle');
const audioElement = document.querySelector('audio');
const canvas = document.getElementById('audioVisualizer');
const ctx = canvas.getContext('2d');
const labelsContainer = document.getElementById('labels-container');

// load model
status.textContent = "Loading model...";
const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
status.textContent = "Ready";

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
            status.textContent = 'Transcribing...';
            const output = await transcriber(audioUrl, { return_timestamps: true });
            status.textContent = 'Transcription Complete';

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


// import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

// env.allowLocalModels = false;

// // DOM elements
// const status = document.getElementById("status");
// const visualizerContainer = document.getElementById('visualizer-container');
// const audioVisualizer = document.getElementById('audioVisualizer');
// const labelsContainer = document.getElementById('labels-container');

// // load model
// status.textContent = "Loading model...";
// const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
// status.textContent = "Ready";

// let mediaRecorder;
// let audioChunks = [];
// let audioContext, source, analyser;
// let isRecording = false;
// let drawVisual; // For the animation frame
// let lastWaveformData = null;

// document.addEventListener('keydown', async function (event) {
//     if (event.code === 'Space' && (!mediaRecorder || mediaRecorder.state === 'inactive')) {
//         isRecording = true;
//         visualizerContainer.style.background = '#d1f4d1'; // Start recording UI feedback
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
//         audioChunks = [];
//         mediaRecorder = new MediaRecorder(stream);

//         mediaRecorder.ondataavailable = event => {
//             audioChunks.push(event.data);
//         };

//         // Prepare for waveform visualization
//         audioContext = new AudioContext();
//         source = audioContext.createMediaStreamSource(stream);
//         analyser = audioContext.createAnalyser();
//         source.connect(analyser);
//         drawWaveform();

//         mediaRecorder.start();
//     }
// });

// document.addEventListener('keyup', async function (event) {
//     if (event.code === 'Space' && mediaRecorder && mediaRecorder.state === 'recording') {
//         isRecording = false;
//         mediaRecorder.stop();
//         visualizerContainer.style.background = '#f2d1d1'; // Processing UI feedback

//         solidifyWaveform();

//         mediaRecorder.onstop = async () => {
//             const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
//             const audioUrl = URL.createObjectURL(audioBlob);

//             // Model inference
//             status.textContent = 'Transcribing...';
//             const output = await transcriber(audioUrl, { return_timestamps: true });
//             status.textContent = 'Transcription Complete';

//             // Handle transcription output
//             labelsContainer.textContent = output.text; // Displaying the transcription result

//             // Clean up
//             URL.revokeObjectURL(audioUrl);
//             animateProcessing();
//         };
//     }
// });

// // Helper function to convert Blob to ArrayBuffer
// function blobToArrayBuffer(blob) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.onerror = reject;
//         reader.readAsArrayBuffer(blob);
//     });
// }


// function drawWaveform() {
//     const canvas = audioVisualizer;
//     const ctx = canvas.getContext('2d');
//     const bufferLength = analyser.frequencyBinCount;
//     const dataArray = new Uint8Array(bufferLength);
//     const WIDTH = canvas.width;
//     const HEIGHT = canvas.height;

//     function draw() {
//         if (!isRecording) {
//             lastWaveformData = dataArray.slice(); // Save the last waveform data
//             cancelAnimationFrame(drawVisual);
//             return;
//         }

//         drawVisual = requestAnimationFrame(draw);

//         analyser.getByteTimeDomainData(dataArray);

//         ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear the canvas
//         ctx.lineWidth = 2;
//         ctx.strokeStyle = 'rgba(3, 29, 68, 0.6)'; // Lighter color for live waveform

//         ctx.beginPath();
//         let sliceWidth = WIDTH * 1.0 / bufferLength;
//         let x = 0;

//         for (let i = 0; i < bufferLength; i++) {
//             let v = dataArray[i] / 128.0;
//             let y = v * HEIGHT / 2;

//             if (i === 0) {
//                 ctx.moveTo(x, y);
//             } else {
//                 ctx.lineTo(x, y);
//             }

//             x += sliceWidth;
//         }

//         ctx.lineTo(canvas.width, canvas.height / 2);
//         ctx.stroke();
//     }

//     draw();
// }

// // Function to solidify the waveform
// function solidifyWaveform() {
//     const canvas = audioVisualizer;
//     const ctx = canvas.getContext('2d');
//     const WIDTH = canvas.width;
//     const HEIGHT = canvas.height;

//     ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear the canvas before redrawing
//     ctx.lineWidth = 2;
//     ctx.strokeStyle = '#031d44'; // Darker color for the solidified waveform

//     if (lastWaveformData) {
//         ctx.beginPath();
//         let sliceWidth = WIDTH * 1.0 / lastWaveformData.length;
//         let x = 0;

//         for (let i = 0; i < lastWaveformData.length; i++) {
//             let v = lastWaveformData[i] / 128.0;
//             let y = v * HEIGHT / 2;

//             if (i === 0) {
//                 ctx.moveTo(x, y);
//             } else {
//                 ctx.lineTo(x, y);
//             }

//             x += sliceWidth;
//         }

//         ctx.lineTo(canvas.width, canvas.height / 2);
//         ctx.stroke();
//     }
// }

// function animateProcessing() {
//     let opacity = 0.1;
//     let increasing = true;
    
//     function animate() {
//         if (!increasing && opacity <= 0.1) {
//             increasing = true;
//         } else if (increasing && opacity >= 1) {
//             increasing = false;
//         }

//         opacity += increasing ? 0.05 : -0.05;
//         visualizerContainer.style.background = `rgba(255, 0, 0, ${opacity})`; // Red pulsating effect

//         if (status.textContent === 'Transcribing...') {
//             requestAnimationFrame(animate);
//         } else {
//             // Reset to original state after processing is done
//             visualizerContainer.style.background = '';
//         }
//     }

//     animate();
// }
