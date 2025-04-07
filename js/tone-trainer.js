// Constants
const MODEL_DB_NAME = 'mandarin-model-db';
const MODEL_STORE_NAME = 'model-store';
const MODEL_KEY = 'model-data';
const MODEL_URL = 'https://r2.adarshsolanki.com/model.onnx';
const R2_BASE_AUDIO_URL = "https://r2.adarshsolanki.com/tone-perfect/";

// DOM elements
const loadModelButton = document.getElementById('loadModelButton');
const toggleButton = document.getElementById('toggle');
const updateGameButton = document.getElementById('updateGameButton');
const canvas = document.getElementById('audioVisualizer');
const ctx = canvas.getContext('2d');
const visualizerContainer = document.getElementById('visualizer-container');
const labelsContainer = document.getElementById('labels-container');
const gameContainer = document.getElementById('game-container');
const playAudioButton = document.getElementById('playAudioButton');
const scoreElement = document.getElementById('score');
const feedbackElement = document.getElementById('feedback');



// Global variables
let session;
let mediaRecorder;
let audioChunks = [];
let audioContext, source, analyser;
let isRecording = false;
let animationState = 'idle';
let shrinkFactor = 1;
let wiggleFactor = 0;
let speakerIndex = 0;
let currentTone = null;
let currentSound = null;
let spacebarPressed = false;
let correctAnswers = 0;
let totalAttempts = 0;

// Canvas setup
canvas.width = 500;
canvas.height = 200;

// Load pinyin data
const pinyinData = await fetch('../js/pinyin_dict2.json').then(response => response.json());

// Mapping objects
const id2tone = { 0: 3, 1: 2, 2: 4, 3: 1 };
const tone2id = { 3: 0, 2: 1, 4: 2, 1: 3 };
const id2sound = { 0: 'sa', 1: 'cao', 2: 'shao', 3: 'ke', 4: 'ken', 5: 'chu', 6: 'nong', 7: 'ao', 8: 'huai', 9: 'dang', 10: 'gei', 11: 'rang', 12: 'mu', 13: 'sheng', 14: 'liang', 15: 'ping', 16: 'gua', 17: 'fei', 18: 'seng', 19: 'cui', 20: 'rua', 21: 'bao', 22: 'chui', 23: 'chuai', 24: 'zhen', 25: 'zhai', 26: 'zuo', 27: 'nang', 28: 'qiong', 29: 'mao', 30: 'duo', 31: 'ca', 32: 'shu', 33: 'rui', 34: 'juan', 35: 'he', 36: 'zou', 37: 'hua', 38: 'gui', 39: 'xiong', 40: 'luan', 41: 'nen', 42: 'zuan', 43: 'fu', 44: 'yao', 45: 'zhang', 46: 'gao', 47: 'lao', 48: 'qing', 49: 'sui', 50: 'zen', 51: 'cu', 52: 'teng', 53: 'o', 54: 'guang', 55: 'reng', 56: 'can', 57: 'dai', 58: 'kei', 59: 'kan', 60: 'zhua', 61: 'lian', 62: 'gang', 63: 'zhu', 64: 'dao', 65: 'sou', 66: 'da', 67: 'xuan', 68: 'cuan', 69: 'jin', 70: 'huan', 71: 'gen', 72: 'mo', 73: 'piao', 74: 'du', 75: 'you', 76: 'zhan', 77: 'zhei', 78: 'cun', 79: 'er', 80: 'que', 81: 'gou', 82: 'zong', 83: 'run', 84: 'yuan', 85: 'long', 86: 'ju', 87: 'ben', 88: 'bai', 89: 'xiu', 90: 'chuo', 91: 'gun', 92: 'nei', 93: 'cou', 94: 'nve', 95: 'le', 96: 'mian', 97: 'ta', 98: 'geng', 99: 'liu', 100: 'bing', 101: 'qu', 102: 'qiao', 103: 'dan', 104: 'cen', 105: 'cai', 106: 'zhui', 107: 'pin', 108: 'sun', 109: 'pou', 110: 'tun', 111: 'sha', 112: 'si', 113: 'na', 114: 'nou', 115: 'shei', 116: 'han', 117: 'yo', 118: 'jia', 119: 'lv', 120: 'se', 121: 'jiu', 122: 'wei', 123: 'bo', 124: 'rong', 125: 'ang', 126: 'nu', 127: 'yue', 128: 'xian', 129: 'ban', 130: 'kun', 131: 'cang', 132: 'eng', 133: 'ha', 134: 'niao', 135: 'san', 136: 'niu', 137: 'yin', 138: 'heng', 139: 'qun', 140: 'jiang', 141: 'shuai', 142: 'fan', 143: 'gan', 144: 'xiang', 145: 'bang', 146: 'hao', 147: 'kuang', 148: 'jie', 149: 'wo', 150: 'kuan', 151: 'ran', 152: 'xin', 153: 'hong', 154: 'lei', 155: 'kai', 156: 'song', 157: 'cheng', 158: 'tui', 159: 'ai', 160: 'ting', 161: 'zeng', 162: 'yu', 163: 'fo', 164: 'nan', 165: 'ze', 166: 'wen', 167: 'po', 168: 'duan', 169: 'tao', 170: 'kui', 171: 'sai', 172: 'feng', 173: 'la', 174: 'kua', 175: 'te', 176: 'men', 177: 'shuan', 178: 'pao', 179: 'ru', 180: 'rou', 181: 'kong', 182: 'gai', 183: 'suo', 184: 'tiao', 185: 'biao', 186: 'deng', 187: 'zai', 188: 'shang', 189: 'shua', 190: 'bei', 191: 'che', 192: 'huang', 193: 'pa', 194: 'tong', 195: 'pi', 196: 'chong', 197: 'neng', 198: 'ce', 199: 'xi', 200: 'chao', 201: 'zheng', 202: 'zhou', 203: 'tang', 204: 'tian', 205: 'weng', 206: 'bu', 207: 'xun', 208: 'zan', 209: 'gu', 210: 'dei', 211: 'nin', 212: 'zi', 213: 'gong', 214: 'ga', 215: 'qin', 216: 'chou', 217: 'yun', 218: 'ti', 219: 'chuan', 220: 'zha', 221: 'kuai', 222: 'wang', 223: 'fou', 224: 'xie', 225: 'e', 226: 'yi', 227: 'diu', 228: 'nun', 229: 'tuo', 230: 'tie', 231: 'lan', 232: 'qiu', 233: 'zhuai', 234: 'ci', 235: 'man', 236: 'ma', 237: 'kou', 238: 'ceng', 239: 'yong', 240: 'wan', 241: 'xu', 242: 'chi', 243: 'sang', 244: 'nian', 245: 'shan', 246: 'jun', 247: 'xue', 248: 'ei', 249: 'diao', 250: 'bin', 251: 'hei', 252: 'ren', 253: 'zu', 254: 'jian', 255: 'ruo', 256: 'ning', 257: 'zhuan', 258: 'mai', 259: 'sen', 260: 'bi', 261: 'fen', 262: 'pang', 263: 'wai', 264: 'en', 265: 'kao', 266: 'shai', 267: 'shen', 268: 'ding', 269: 'di', 270: 'hen', 271: 'hai', 272: 'ling', 273: 'den', 274: 'pie', 275: 'jiong', 276: 'chang', 277: 'pu', 278: 'dou', 279: 'quan', 280: 'hang', 281: 'mei', 282: 'cha', 283: 'su', 284: 'dia', 285: 'ming', 286: 'lin', 287: 'yang', 288: 'tou', 289: 'bian', 290: 'shuang', 291: 'zhuo', 292: 'a', 293: 'chen', 294: 'zhe', 295: 'pian', 296: 'cuo', 297: 'li', 298: 'wu', 299: 'chun', 300: 'keng', 301: 'miao', 302: 'guo', 303: 'ye', 304: 'zang', 305: 'qian', 306: 'qiang', 307: 'shui', 308: 'qia', 309: 'tai', 310: 'kuo', 311: 'xiao', 312: 'chua', 313: 'me', 314: 'pen', 315: 'nai', 316: 'an', 317: 'jing', 318: 'mie', 319: 'nao', 320: 'tan', 321: 'qi', 322: 'lie', 323: 'shun', 324: 'xing', 325: 'ruan', 326: 'hou', 327: 'zhi', 328: 'lun', 329: 'zhao', 330: 'mang', 331: 'pei', 332: 'pan', 333: 'fang', 334: 'lia', 335: 'miu', 336: 'ou', 337: 'leng', 338: 'ri', 339: 'shi', 340: 'lve', 341: 'ni', 342: 'dun', 343: 'fa', 344: 'qie', 345: 'guan', 346: 'die', 347: 'zhuang', 348: 'lai', 349: 'dui', 350: 'zui', 351: 'guai', 352: 'kang', 353: 'chai', 354: 'xia', 355: 'tu', 356: 'nuo', 357: 'dong', 358: 'ku', 359: 'pai', 360: 'she', 361: 'ne', 362: 'dian', 363: 'ya', 364: 'ying', 365: 'shou', 366: 'lou', 367: 'za', 368: 'meng', 369: 'mou', 370: 'suan', 371: 're', 372: 'zao', 373: 'chan', 374: 'cong', 375: 'yan', 376: 'zun', 377: 'lu', 378: 'jiao', 379: 'hui', 380: 'zhong', 381: 'ji', 382: 'liao', 383: 'ba', 384: 'mi', 385: 'sao', 386: 'rao', 387: 'hu', 388: 'wa', 389: 'de', 390: 'bie', 391: 'zhun', 392: 'huo', 393: 'nuan', 394: 'nv', 395: 'luo', 396: 'peng', 397: 'nie', 398: 'ka', 399: 'niang', 400: 'zei', 401: 'jue', 402: 'ge', 403: 'shuo', 404: 'beng', 405: 'lang', 406: 'hun', 407: 'tuan', 408: 'min', 409: 'chuang' }
const sound2id = { 'sa': 0, 'cao': 1, 'shao': 2, 'ke': 3, 'ken': 4, 'chu': 5, 'nong': 6, 'ao': 7, 'huai': 8, 'dang': 9, 'gei': 10, 'rang': 11, 'mu': 12, 'sheng': 13, 'liang': 14, 'ping': 15, 'gua': 16, 'fei': 17, 'seng': 18, 'cui': 19, 'rua': 20, 'bao': 21, 'chui': 22, 'chuai': 23, 'zhen': 24, 'zhai': 25, 'zuo': 26, 'nang': 27, 'qiong': 28, 'mao': 29, 'duo': 30, 'ca': 31, 'shu': 32, 'rui': 33, 'juan': 34, 'he': 35, 'zou': 36, 'hua': 37, 'gui': 38, 'xiong': 39, 'luan': 40, 'nen': 41, 'zuan': 42, 'fu': 43, 'yao': 44, 'zhang': 45, 'gao': 46, 'lao': 47, 'qing': 48, 'sui': 49, 'zen': 50, 'cu': 51, 'teng': 52, 'o': 53, 'guang': 54, 'reng': 55, 'can': 56, 'dai': 57, 'kei': 58, 'kan': 59, 'zhua': 60, 'lian': 61, 'gang': 62, 'zhu': 63, 'dao': 64, 'sou': 65, 'da': 66, 'xuan': 67, 'cuan': 68, 'jin': 69, 'huan': 70, 'gen': 71, 'mo': 72, 'piao': 73, 'du': 74, 'you': 75, 'zhan': 76, 'zhei': 77, 'cun': 78, 'er': 79, 'que': 80, 'gou': 81, 'zong': 82, 'run': 83, 'yuan': 84, 'long': 85, 'ju': 86, 'ben': 87, 'bai': 88, 'xiu': 89, 'chuo': 90, 'gun': 91, 'nei': 92, 'cou': 93, 'nve': 94, 'le': 95, 'mian': 96, 'ta': 97, 'geng': 98, 'liu': 99, 'bing': 100, 'qu': 101, 'qiao': 102, 'dan': 103, 'cen': 104, 'cai': 105, 'zhui': 106, 'pin': 107, 'sun': 108, 'pou': 109, 'tun': 110, 'sha': 111, 'si': 112, 'na': 113, 'nou': 114, 'shei': 115, 'han': 116, 'yo': 117, 'jia': 118, 'lv': 119, 'se': 120, 'jiu': 121, 'wei': 122, 'bo': 123, 'rong': 124, 'ang': 125, 'nu': 126, 'yue': 127, 'xian': 128, 'ban': 129, 'kun': 130, 'cang': 131, 'eng': 132, 'ha': 133, 'niao': 134, 'san': 135, 'niu': 136, 'yin': 137, 'heng': 138, 'qun': 139, 'jiang': 140, 'shuai': 141, 'fan': 142, 'gan': 143, 'xiang': 144, 'bang': 145, 'hao': 146, 'kuang': 147, 'jie': 148, 'wo': 149, 'kuan': 150, 'ran': 151, 'xin': 152, 'hong': 153, 'lei': 154, 'kai': 155, 'song': 156, 'cheng': 157, 'tui': 158, 'ai': 159, 'ting': 160, 'zeng': 161, 'yu': 162, 'fo': 163, 'nan': 164, 'ze': 165, 'wen': 166, 'po': 167, 'duan': 168, 'tao': 169, 'kui': 170, 'sai': 171, 'feng': 172, 'la': 173, 'kua': 174, 'te': 175, 'men': 176, 'shuan': 177, 'pao': 178, 'ru': 179, 'rou': 180, 'kong': 181, 'gai': 182, 'suo': 183, 'tiao': 184, 'biao': 185, 'deng': 186, 'zai': 187, 'shang': 188, 'shua': 189, 'bei': 190, 'che': 191, 'huang': 192, 'pa': 193, 'tong': 194, 'pi': 195, 'chong': 196, 'neng': 197, 'ce': 198, 'xi': 199, 'chao': 200, 'zheng': 201, 'zhou': 202, 'tang': 203, 'tian': 204, 'weng': 205, 'bu': 206, 'xun': 207, 'zan': 208, 'gu': 209, 'dei': 210, 'nin': 211, 'zi': 212, 'gong': 213, 'ga': 214, 'qin': 215, 'chou': 216, 'yun': 217, 'ti': 218, 'chuan': 219, 'zha': 220, 'kuai': 221, 'wang': 222, 'fou': 223, 'xie': 224, 'e': 225, 'yi': 226, 'diu': 227, 'nun': 228, 'tuo': 229, 'tie': 230, 'lan': 231, 'qiu': 232, 'zhuai': 233, 'ci': 234, 'man': 235, 'ma': 236, 'kou': 237, 'ceng': 238, 'yong': 239, 'wan': 240, 'xu': 241, 'chi': 242, 'sang': 243, 'nian': 244, 'shan': 245, 'jun': 246, 'xue': 247, 'ei': 248, 'diao': 249, 'bin': 250, 'hei': 251, 'ren': 252, 'zu': 253, 'jian': 254, 'ruo': 255, 'ning': 256, 'zhuan': 257, 'mai': 258, 'sen': 259, 'bi': 260, 'fen': 261, 'pang': 262, 'wai': 263, 'en': 264, 'kao': 265, 'shai': 266, 'shen': 267, 'ding': 268, 'di': 269, 'hen': 270, 'hai': 271, 'ling': 272, 'den': 273, 'pie': 274, 'jiong': 275, 'chang': 276, 'pu': 277, 'dou': 278, 'quan': 279, 'hang': 280, 'mei': 281, 'cha': 282, 'su': 283, 'dia': 284, 'ming': 285, 'lin': 286, 'yang': 287, 'tou': 288, 'bian': 289, 'shuang': 290, 'zhuo': 291, 'a': 292, 'chen': 293, 'zhe': 294, 'pian': 295, 'cuo': 296, 'li': 297, 'wu': 298, 'chun': 299, 'keng': 300, 'miao': 301, 'guo': 302, 'ye': 303, 'zang': 304, 'qian': 305, 'qiang': 306, 'shui': 307, 'qia': 308, 'tai': 309, 'kuo': 310, 'xiao': 311, 'chua': 312, 'me': 313, 'pen': 314, 'nai': 315, 'an': 316, 'jing': 317, 'mie': 318, 'nao': 319, 'tan': 320, 'qi': 321, 'lie': 322, 'shun': 323, 'xing': 324, 'ruan': 325, 'hou': 326, 'zhi': 327, 'lun': 328, 'zhao': 329, 'mang': 330, 'pei': 331, 'pan': 332, 'fang': 333, 'lia': 334, 'miu': 335, 'ou': 336, 'leng': 337, 'ri': 338, 'shi': 339, 'lve': 340, 'ni': 341, 'dun': 342, 'fa': 343, 'qie': 344, 'guan': 345, 'die': 346, 'zhuang': 347, 'lai': 348, 'dui': 349, 'zui': 350, 'guai': 351, 'kang': 352, 'chai': 353, 'xia': 354, 'tu': 355, 'nuo': 356, 'dong': 357, 'ku': 358, 'pai': 359, 'she': 360, 'ne': 361, 'dian': 362, 'ya': 363, 'ying': 364, 'shou': 365, 'lou': 366, 'za': 367, 'meng': 368, 'mou': 369, 'suan': 370, 're': 371, 'zao': 372, 'chan': 373, 'cong': 374, 'yan': 375, 'zun': 376, 'lu': 377, 'jiao': 378, 'hui': 379, 'zhong': 380, 'ji': 381, 'liao': 382, 'ba': 383, 'mi': 384, 'sao': 385, 'rao': 386, 'hu': 387, 'wa': 388, 'de': 389, 'bie': 390, 'zhun': 391, 'huo': 392, 'nuan': 393, 'nv': 394, 'luo': 395, 'peng': 396, 'nie': 397, 'ka': 398, 'niang': 399, 'zei': 400, 'jue': 401, 'ge': 402, 'shuo': 403, 'beng': 404, 'lang': 405, 'hun': 406, 'tuan': 407, 'min': 408, 'chuang': 409 }
const speakers = ["FV2", "MV1", "FV1", "MV3", "FV3", "MV2"];

// Database functions
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(MODEL_DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(MODEL_STORE_NAME);
        };
    });
}

// Model loading
async function loadModel() {
    const loaderContainer = document.getElementById('loader-container');
    loaderContainer.style.display = 'block';
    loadModelButton.style.display = 'none';

    try {
        const db = await openDB();
        const modelData = await getModelData(db);
        
        const modelArrayBuffer = modelData.buffer.slice(modelData.byteOffset, modelData.byteOffset + modelData.byteLength);
        session = await ort.InferenceSession.create(modelArrayBuffer);
        
        labelsContainer.textContent = "Model loaded successfully! Hit SPACE or red button below to record.";
        visualizerContainer.style.display = 'block';
    } catch (error) {
        labelsContainer.textContent = "Failed to load model.";
        console.error("Error loading model:", error);
    } finally {
        loaderContainer.style.display = 'none';
        gameContainer.style.display = 'block';
    }
}

async function getModelData(db) {
    const transaction = db.transaction(MODEL_STORE_NAME, 'readonly');
    const store = transaction.objectStore(MODEL_STORE_NAME);
    
    const cachedModel = await new Promise((resolve, reject) => {
        const request = store.get(MODEL_KEY);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    if (cachedModel instanceof Uint8Array && cachedModel.byteLength > 0) {
        labelsContainer.textContent = "Loading cached model...";
        return cachedModel;
    } else {
        labelsContainer.textContent = "Downloading model. This may take a while...";
        const response = await fetch(MODEL_URL);
        const arrayBuffer = await response.arrayBuffer();
        const modelData = new Uint8Array(arrayBuffer);
        
        await storeModel(db, modelData);
        return modelData;
    }
}

async function storeModel(db, modelData) {
    const writeTransaction = db.transaction(MODEL_STORE_NAME, 'readwrite');
    const writeStore = writeTransaction.objectStore(MODEL_STORE_NAME);
    await writeStore.put(modelData, MODEL_KEY);
}

// Audio recording and processing
async function toggleRecord(start) {
    if (start && !isRecording) {
        await startRecording();
    } else if (!start && isRecording) {
        stopRecording();
    }
}

async function startRecording() {
    // clear state when starting a new recording
    feedbackElement.textContent = '';
    feedbackElement.style.visibility = 'hidden';
    labelsContainer.innerHTML = ''; 

    isRecording = true;
    toggleButton.textContent = 'Stop Recording';
    animationState = 'recording';
    shrinkFactor = 1;
    wiggleFactor = 0;

    try { 
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = handleStopRecording;
        mediaRecorder.start();

        setupAudioContext(stream);
        drawBars();
    } catch (err) {
        console.error("Error accessing microphone:", err);
        labelsContainer.textContent = "Error: Could not access microphone. Please check permissions.";
        isRecording = false; // Reset recording state
        toggleButton.textContent = 'Start Recording';
        animationState = 'stopped'; // Ensure animation stops
    }
}

function stopRecording() {
    isRecording = false;
    mediaRecorder.stop();
    toggleButton.textContent = 'Start Recording';
    animationState = 'shrinking';
}

function setupAudioContext(stream) {
    if (!audioContext) {
        audioContext = new AudioContext({ sampleRate: 16000 });
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
    }
    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
}

async function handleStopRecording() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioBuffer = await processAudio(audioBlob);
    const inputTensor = prepareInputTensor(audioBuffer);
    const output = await runModelInference(inputTensor);
    displayResults(output);
}

async function processAudio(audioBlob) {
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    const monoAudioData = convertToMono(audioBuffer);
    return resampleAudio(monoAudioData, audioContext.sampleRate, 16000);
}

function convertToMono(audioBuffer) {
    const audioData = audioBuffer.getChannelData(0);
    if (audioBuffer.numberOfChannels === 2) {
        const rightChannel = audioBuffer.getChannelData(1);
        return audioData.map((val, index) => (val + rightChannel[index]) / 2);
    }
    return audioData;
}

async function resampleAudio(audioData, fromSampleRate, toSampleRate) {
    const offlineCtx = new OfflineAudioContext(1, audioData.length * toSampleRate / fromSampleRate, toSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = offlineCtx.createBuffer(1, audioData.length, fromSampleRate);
    source.buffer.copyToChannel(audioData, 0);
    source.connect(offlineCtx.destination);
    source.start(0);
    return (await offlineCtx.startRendering()).getChannelData(0);
}

function prepareInputTensor(audioData) {
    let finalAudioData = new Float32Array(32000);
    finalAudioData.set(audioData.slice(0, 32000));
    return new ort.Tensor('float32', finalAudioData, [1, 32000]);
}

async function runModelInference(inputTensor) {
    try {
        return await session.run({ 'onnx::Unsqueeze_0': inputTensor });
    } catch (error) {
        console.error('Error during model inference:', error);
    }
}

function displayResults(output) {
    // Ensure currentTone is treated as a number for comparison and lookup
    const targetToneNum = parseInt(currentTone);

    // Analyze predictions using the new function
    const toneAnalysis = analyzePrediction(output["1425"], id2tone, targetToneNum, tone2id);
    const soundAnalysis = analyzePrediction(output["1427"], id2sound, currentSound, sound2id);

    // Generate granular feedback
    const feedbackResult = generateFeedback(targetToneNum, currentSound, toneAnalysis, soundAnalysis);

    // Display Top 3 probabilities
    let resultsHTML = `
        <div class="results-container">
            <div class="tone-results">
                <h4>Tone Results:</h4>
                <ul>${toneAnalysis.top3Html}</ul>
            </div>
            <div class="sound-results">
                <h4>Sound Results:</h4>
                <ul>${soundAnalysis.top3Html}</ul>
            </div>
        </div>
    `;
    labelsContainer.innerHTML = resultsHTML;
    animationState = 'stopped'; // Stop visualizer animation

    // Display Granular Feedback
    feedbackElement.textContent = feedbackResult.message;
    // Set class based on correctness level
    if (feedbackResult.level === 'perfect' || feedbackResult.level === 'good') {
        feedbackElement.className = 'feedback correct';
        correctAnswers++; // Only increment score if overall correct
    } else {
        feedbackElement.className = 'feedback incorrect';
    }
    feedbackElement.style.visibility = 'visible'; // Make feedback visible

    totalAttempts++;
    updateScore();

    // Note: We're not hiding feedback automatically anymore
    // The feedback will stay visible until the next recording starts
}

// Utility functions
function softmax(arr) {
    // Ensure input is an array of numbers
    const numericArr = arr.map(Number).filter(n => !isNaN(n));
    if (numericArr.length === 0) {
        console.error("Invalid input to softmax:", arr);
        return []; // Return empty or handle error appropriately
    }
    const maxLogit = Math.max(...numericArr);
    const scores = numericArr.map((logit) => Math.exp(logit - maxLogit));
    const sum = scores.reduce((a, b) => a + b, 0);
    // Handle potential division by zero if sum is 0
    return scores.map((score) => (sum === 0 ? 0 : score / sum));
}

// NEW function to analyze model output
function analyzePrediction(tensor, idMapping, targetLabel, labelToIdMapping) {
    const logits = Array.from(tensor.data); // Ensure it's a standard array
    const probabilities = softmax(logits);

    // Check if probabilities array is valid
    if (!probabilities || probabilities.length === 0 || probabilities.some(isNaN)) {
        console.error("Softmax returned invalid probabilities:", probabilities);
        // Return a default structure or throw an error
        return {
            probabilities: [],
            predictedLabel: null,
            predictedProbability: 0,
            targetProbability: 0,
            sortedProbabilities: [],
            top3Html: "<li>Error processing results</li>",
            isCorrect: false,
            targetIndex: -1,
            predictedIndex: -1
        };
    }

    const indexedProbabilities = probabilities.map((p, index) => ({ index, probability: p }));
    const sortedProbabilities = indexedProbabilities.sort((a, b) => b.probability - a.probability);

    const topPrediction = sortedProbabilities[0];
    const predictedIndex = topPrediction ? topPrediction.index : -1;
    const predictedLabel = predictedIndex !== -1 ? idMapping[predictedIndex] : null;
    const predictedProbability = topPrediction ? topPrediction.probability : 0;

    // Find the probability of the actual target label
    // Use the reverse mapping (labelToIdMapping) to find the target index
    const targetIndex = labelToIdMapping ? labelToIdMapping[targetLabel] : -1;
    const targetProbability = (targetIndex !== -1 && targetIndex < probabilities.length) ? probabilities[targetIndex] : 0;

    // Generate Top 3 HTML
    const top3Results = sortedProbabilities.slice(0, 3);
    const top3Html = top3Results.map(({ index, probability }) => {
        const label = idMapping[index];
        // Ensure label is comparable (convert targetLabel if necessary)
        const isTarget = String(label) === String(targetLabel);
        const highlight = isTarget ? 'style="background-color: lightblue;"' : '';
        // Check if label exists before trying to access properties or display it
        const displayLabel = label !== undefined && label !== null ? label : `Unknown Index ${index}`;
        return `<li ${highlight}>${(probability * 100).toFixed(2)}%: ${displayLabel}</li>`;
    }).join('');

    // Determine correctness based on the top prediction matching the target
    const isCorrect = predictedLabel !== null && String(predictedLabel) === String(targetLabel);

    return {
        probabilities, // Full array
        predictedLabel, // Label with highest probability
        predictedProbability, // Probability of the top prediction
        targetProbability, // Probability of the correct label
        sortedProbabilities, // Array of {index, probability} sorted
        top3Html, // HTML for display
        isCorrect, // Boolean if top prediction matches target
        targetIndex, // Index of the target label
        predictedIndex // Index of the predicted label
    };
}

function generateFeedback(targetTone, targetSound, toneAnalysis, soundAnalysis) {
    const {
        predictedLabel: predictedTone,
        predictedProbability: predictedToneProb,
        targetProbability: targetToneProb,
        sortedProbabilities: sortedTones,
        isCorrect: toneCorrect
    } = toneAnalysis;

    const {
        predictedLabel: predictedSound,
        predictedProbability: predictedSoundProb,
        targetProbability: targetSoundProb,
        sortedProbabilities: sortedSounds,
        isCorrect: soundCorrect
    } = soundAnalysis;

    let feedback = "";
    let correctnessLevel = 'both_wrong'; // Default
    let closeCallPrefix = "";

    // --- Check for "Close Calls" ---
    // Check if target tone was 2nd prediction with significant probability
    if (!toneCorrect && sortedTones.length > 1) {
        const secondTonePrediction = sortedTones[1];
        if (id2tone[secondTonePrediction.index] === targetTone && secondTonePrediction.probability > 0.20) {
            closeCallPrefix = "Close! ";
        }
    }
    // Check if target sound was 2nd prediction with significant probability
    if (!soundCorrect && sortedSounds.length > 1) {
        const secondSoundPrediction = sortedSounds[1];
         if (id2sound[secondSoundPrediction.index] === targetSound && secondSoundPrediction.probability > 0.20) {
             // Only add "Close!" once, even if both were close
             if (!closeCallPrefix) closeCallPrefix = "Close! ";
         }
    }

    // --- Determine Feedback Message ---
    if (toneCorrect && soundCorrect) {
        if (targetToneProb > 0.7 && targetSoundProb > 0.7) { // Use target prob for high confidence check
            feedback = `Excellent! Perfect '${targetSound}${targetTone}'.`;
            correctnessLevel = 'perfect';
        } else {
            feedback = `Good! That was '${targetSound}${targetTone}'.`;
            correctnessLevel = 'good';
        }
    } else if (soundCorrect && !toneCorrect) {
        correctnessLevel = 'tone_wrong';
        if (predictedToneProb > 0.6) { // Confident wrong tone prediction
             feedback = `Right sound ('${targetSound}'), but that sounded clearly like tone ${predictedTone}. Aim for the tone ${targetTone} pattern.`;
        } else {
             // Less confident wrong tone, check if target was close
             const targetToneRank = sortedTones.findIndex(p => id2tone[p.index] === targetTone);
             if (targetToneRank === 1 && sortedTones[1].probability > 0.2) { // Target was 2nd guess
                 feedback = `Right sound ('${targetSound}'), but the tone wasn't quite right (sounded like ${predictedTone}). You were close to tone ${targetTone}! Try again.`;
             } else {
                 feedback = `Right sound ('${targetSound}'), but the tone wasn't quite right. Listen to the example and try the tone ${targetTone} pattern again. It sounded a bit like tone ${predictedTone}.`;
             }
        }
    } else if (!soundCorrect && toneCorrect) {
        correctnessLevel = 'sound_wrong';
         feedback = `You got the tone ${targetTone} right! But the sound was closer to '${predictedSound}'. Focus on pronouncing '${targetSound}'.`;
    } else { // Both incorrect
        correctnessLevel = 'both_wrong';
        feedback = `Let's try that again. Listen closely to the example for '${targetSound}${targetTone}'.`;
        // Optional: Add more detail if one part was closer than the other
        const targetToneRank = sortedTones.findIndex(p => id2tone[p.index] === targetTone);
        const targetSoundRank = sortedSounds.findIndex(p => id2sound[p.index] === targetSound);

        if (targetToneRank === 1 && sortedTones[1].probability > 0.2) {
             feedback += ` You were closer on the tone (${targetTone}).`;
        } else if (targetSoundRank === 1 && sortedSounds[1].probability > 0.2) {
             feedback += ` You were closer on the sound ('${targetSound}').`;
        }
    }

    return {
        message: closeCallPrefix + feedback,
        level: correctnessLevel
    };
}

function processOutputs(toneTensor, soundTensor, id2tone, id2sound) {
    const toneResults = processIndividualOutput(toneTensor, id2tone);
    const soundResults = processIndividualOutput(soundTensor, id2sound);

    let resultsHTML = `
        <div class="results-container">
            <div class="tone-results">
                <h4>Tone Results:</h4>
                <ul>${toneResults.html}</ul>
            </div>
            <div class="sound-results">
                <h4>Sound Results:</h4>
                <ul>${soundResults.html}</ul>
            </div>
        </div>
    `;

    return {
        html: resultsHTML,
        toneCorrect: toneResults.correct,
        soundCorrect: soundResults.correct
    };
}

function processIndividualOutput(tensor, idMapping) {
    const logits = Object.values(tensor.data);
    const probabilities = softmax(logits);
    const indexedProbabilities = probabilities.map((p, index) => [index, p]);
    const sortedProbabilities = indexedProbabilities.sort((a, b) => b[1] - a[1]);
    const top3Results = sortedProbabilities.slice(0, 3);

    let correct = false;
    const html = top3Results.map(([index, probability]) => {
        const label = idMapping[index];
        const isMatch = (label === parseInt(currentTone) || label === currentSound);
        const highlight = isMatch ? 'style="background-color: lightblue;"' : '';
        if (isMatch && probability > 0.5) {
            correct = true;
        }
        return `<li ${highlight}>${(probability * 100).toFixed(2)}%: ${label}</li>`;
    }).join('');

    return { html, correct };
}

function getRandomPinyin() {
    const keys = Object.keys(pinyinData);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    currentSound = randomKey.slice(0, -1);
    currentTone = randomKey.slice(-1);

    const characters = pinyinData[randomKey].character_simplified
        .replace(/[\[\]']/g, "");

    return {
        sound: currentSound,
        tone: currentTone,
        characters: characters,
        pinyin: pinyinData[randomKey].pinyin,
        speaker: pinyinData[randomKey].speaker
    };
}

function updatePinyinDisplay() {
    // Clear previous feedback when getting a new word
    feedbackElement.textContent = '';
    feedbackElement.style.visibility = 'hidden';
    labelsContainer.innerHTML = ''; // Also clear previous probability lists

    const { pinyin, tone, characters } = getRandomPinyin();
    document.getElementById('pinyinText').textContent = `${pinyin} (tone ${tone})`;
    document.getElementById('charactersText').textContent = characters;
}

function getNextSpeaker() {
    const nextSpeaker = speakers[speakerIndex];
    speakerIndex = (speakerIndex + 1) % speakers.length;
    return nextSpeaker;
}

function getAudioUrl() {
    const randomSpeaker = getNextSpeaker();
    return `${R2_BASE_AUDIO_URL}${currentSound}${currentTone}_${randomSpeaker}_MP3.mp3`;
}

async function playAudio() {
    const audioUrl = getAudioUrl();
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";

    try {
        await audio.play();
        console.log("Audio played successfully");
    } catch (error) {
        console.error("Error playing audio: ", error);
        if (error.name === 'NotSupportedError' || error.name === 'NotFoundError') {
            console.error("Audio file not found or not supported. Please check the file path and format.");
        }
    }
}

function updateScore() {
    scoreElement.textContent = `Score: ${correctAnswers}/${totalAttempts}`;
}

// Visualization
function drawBars() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (animationState !== 'stopped') {
            requestAnimationFrame(draw);
        }

        analyser.getByteFrequencyData(dataArray);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            let barHeight = getBarHeight(dataArray[i]);

            ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
            ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight / 2);
            ctx.fillRect(x, canvas.height / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
        }

        wiggleFactor += 0.01;
    }
    
    draw();
}

function getBarHeight(dataValue) {
    switch (animationState) {
        case 'shrinking':
            shrinkFactor -= 0.001;
            if (shrinkFactor <= 0.1) animationState = 'wiggling';
            return dataValue * shrinkFactor;
        case 'wiggling':
            return 10 + 10 * Math.sin(wiggleFactor);
        case 'stopped':
            return 10;
        default:
            return dataValue;
    }
}

// Event listeners
toggleButton.addEventListener('click', () => toggleRecord(true));
loadModelButton.addEventListener('click', loadModel);
updateGameButton.addEventListener('click', updatePinyinDisplay);
playAudioButton.addEventListener('click', playAudio);
document.getElementById('showPinyinToggle').addEventListener('change', function() {
    document.getElementById('pinyinDisplay').style.display = this.checked ? 'block' : 'none';
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && session) { // Check if model is loaded
        event.preventDefault(); // Prevent scrolling
        if (!spacebarPressed) {
            spacebarPressed = true;
            // Clear feedback immediately when space is pressed to record
            feedbackElement.textContent = '';
            feedbackElement.style.visibility = 'hidden';
            labelsContainer.innerHTML = '';
            toggleRecord(true);
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'Space' && session) { // Check if model is loaded
        event.preventDefault(); // Prevent any default behavior
        if (spacebarPressed) { // Only stop if we started with space
             spacebarPressed = false;
             toggleRecord(false);
        }
    }
});

document.addEventListener('scroll', (event) => {
    if (spacebarPressed) {
        event.preventDefault();
        window.scrollTo(window.scrollX, window.scrollY);
    }
});

// Initialize
updatePinyinDisplay();
updateScore();