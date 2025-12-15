// const TOTAL_IMAGES = 5; // Removed in favor of explicit list
const ASSET_PATH = 'assets/';

// List of actual files present in assets folder
const AVAILABLE_IMAGES = [
    'gaurav.jpeg',
    'img001.jpeg',
    'img002.jpg',
    'preview-merged.jpeg',
    'shailesh+gaurav.jpeg',
    'shailesh.jpeg',
    'sudheer+tarun.jpeg',
    'sudheer.jpeg',
    'tarun.jpeg'
];

// --- STATE ---
let currentA = null;
let currentB = null;
let gameData = [];
let currentRoundIndex = 0;

// --- DOM ELEMENTS ---
const screens = {
    intro: document.getElementById('intro-screen'),
    selection: document.getElementById('selection-screen'),
    merge: document.getElementById('merge-screen'),
    reveal: document.getElementById('reveal-screen')
};

const mosaicGrid = document.getElementById('mosaic-grid');
const canvas = document.getElementById('merge-canvas');
const ctx = canvas.getContext('2d');
const splitBtn = document.getElementById('split-btn'); // Renamed from revealBtn
const resetBtn = document.getElementById('reset-btn');

const splitContainer = document.getElementById('split-container');
const splitLeft = document.getElementById('split-left');
const splitRight = document.getElementById('split-right');
const stormOverlay = document.getElementById('storm-overlay');

// Reveal elements
const revealImgA = document.getElementById('reveal-img-a');
const revealImgB = document.getElementById('reveal-img-b');
const revealNameA = document.getElementById('reveal-name-a');
const revealNameB = document.getElementById('reveal-name-b');

// --- HELPERS ---
const pad = (num) => String(num).padStart(3, '0');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// const getRandomId = () => Math.floor(Math.random() * TOTAL_IMAGES) + 1;
const getRandomImage = () => AVAILABLE_IMAGES[Math.floor(Math.random() * AVAILABLE_IMAGES.length)];

// --- AUDIO MANAGER (Procedural Sci-Fi Sounds) ---
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Safe volume
        this.masterGain.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Generic Oscillator Helper
    playTone(freq, type, duration, startTime = 0, vol = 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    // 1. High-tech Button Click
    playClick() {
        this.resume();
        // Double chirp
        this.playTone(1200, 'sine', 0.1, 0, 0.5);
        this.playTone(2000, 'square', 0.05, 0.05, 0.3);
    }

    // 2. Holographic Hover
    playHover() {
        this.resume();
        // Very short high tick
        this.playTone(800, 'triangle', 0.05, 0, 0.1);
    }

    // 3. Screen Transition (Whoosh)
    playTransition() {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Noise buffer would be better, but frequency sweep works for "energy"
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    // 4. Scanning Loop (Rhythmic Data)
    startScanningSound() {
        this.resume();
        this.isScanning = true;
        this.scanInterval = setInterval(() => {
            if (!this.isScanning) return;
            // Random data blips
            const freq = 800 + Math.random() * 800;
            this.playTone(freq, 'sine', 0.05, 0, 0.1);
        }, 100);
    }

    stopScanningSound() {
        this.isScanning = false;
        if (this.scanInterval) clearInterval(this.scanInterval);
    }

    // 5. Energy Buildup (Split/Merge) - Suspenseful Heartbeat & Riser
    playEnergyBuildup() {
        this.resume();
        const duration = 3.5; // Extended for suspense
        const now = this.ctx.currentTime;

        // 1. HEARTBEAT (Thumping Bass)
        const beatCount = 5;
        for (let i = 0; i < beatCount; i++) {
            const time = now + (i * 0.6); // 600ms gap approx
            // Thump 1 (Lub)
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.frequency.setValueAtTime(60, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
            g.gain.setValueAtTime(0.6, time);
            g.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.2);

            // Thump 2 (Dub) - lighter
            const osc2 = this.ctx.createOscillator();
            const g2 = this.ctx.createGain();
            osc2.frequency.setValueAtTime(50, time + 0.15);
            osc2.frequency.exponentialRampToValueAtTime(25, time + 0.25);
            g2.gain.setValueAtTime(0.4, time + 0.15);
            g2.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            osc2.connect(g2);
            g2.connect(this.masterGain);
            osc2.start(time + 0.15);
            osc2.stop(time + 0.35);
        }

        // 2. TENSION RISER (High pitch whine + wobble)
        const riserOsc = this.ctx.createOscillator();
        const riserGain = this.ctx.createGain();
        riserOsc.type = 'triangle';
        riserOsc.frequency.setValueAtTime(200, now);
        // Slowly rise then accelerate
        riserOsc.frequency.linearRampToValueAtTime(800, now + duration * 0.8);
        riserOsc.frequency.exponentialRampToValueAtTime(2000, now + duration);

        // Tremolo/Wobble effect
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5, now);
        lfo.frequency.linearRampToValueAtTime(20, now + duration);
        lfo.connect(lfoGain);
        lfoGain.gain.value = 500; // Modulation depth
        lfoGain.connect(riserOsc.frequency);
        lfo.start(now);
        lfo.stop(now + duration);

        riserGain.gain.setValueAtTime(0, now);
        riserGain.gain.linearRampToValueAtTime(0.2, now + duration);

        riserOsc.connect(riserGain);
        riserGain.connect(this.masterGain);
        riserOsc.start(now);
        riserOsc.stop(now + duration);

        // 3. CLIMAX CYMBAL/CRASH (White Noise)
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.5, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < this.ctx.sampleRate * 1.5; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        const noiseGain = this.ctx.createGain();

        // Trigger at end
        noiseGain.gain.setValueAtTime(0, now + duration - 0.1);
        noiseGain.gain.linearRampToValueAtTime(0.5, now + duration);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration + 1.2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now + duration); // Boom at the end
    }
}

const audioManager = new AudioManager();

// --- INITIALIZATION ---
async function init() {
    createFloatingShards();

    // UI Audio Bindings
    document.addEventListener('click', () => audioManager.resume()); // Ensure context unlock

    // Bind all buttons for generic click sound
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', () => audioManager.playHover());
        btn.addEventListener('click', () => audioManager.playClick());
    });

    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', startSelectionPhase);
    // Explicitly add hover for start button just in case, or to add a special sound if desired later
    startBtn.addEventListener('mouseenter', () => {
        // We can use the same hover sound, but ensure resume is called
        audioManager.resume();
        audioManager.playHover();
    });

    splitBtn.addEventListener('click', triggerStormSplit);
    resetBtn.addEventListener('click', resetGame);

    // Load Game Data
    try {
        const response = await fetch('game_data.json');
        gameData = await response.json();
        console.log("Game Data Loaded:", gameData);
    } catch (e) {
        console.error("Failed to load game data:", e);
    }
}

function resetGame() {
    // Reset Split/Merge State
    splitBtn.classList.remove('hidden');
    canvas.style.opacity = 1;

    // Ensure infusion class is gone
    const sphere = document.querySelector('.energy-sphere');
    if (sphere) sphere.classList.remove('infusing');

    // Hide split container (legacy, but good to keep clean)
    splitContainer.classList.add('hidden');
    splitContainer.style.opacity = 1;
    splitContainer.style.transition = 'none';
    splitLeft.style.transform = 'none';
    splitRight.style.transform = 'none';

    // Clear any active screens to be safe
    Object.values(screens).forEach(s => s.classList.remove('active'));

    // Advance Round (Sequential)
    if (gameData.length > 1) {
        currentRoundIndex = (currentRoundIndex + 1) % gameData.length;
    } else {
        currentRoundIndex = 0;
    }

    // Start Selection
    startSelectionPhase();
}

function createFloatingShards() {
    const container = document.querySelector('.floating-shards');
    container.innerHTML = '';
    for (let i = 0; i < 15; i++) {
        const shard = document.createElement('div');
        shard.className = 'shard';
        shard.style.left = Math.random() * 100 + 'vw';
        shard.style.animationDelay = Math.random() * 5 + 's';
        shard.style.width = (Math.random() * 50 + 30) + 'px';
        shard.style.height = shard.style.width;

        const img = document.createElement('img');
        img.src = `${ASSET_PATH}${getRandomImage()}`;
        shard.appendChild(img);
        container.appendChild(shard);
    }
}

// --- PHASE 1 -> 2: SELECTION (MOSAIC) ---
async function startSelectionPhase() {
    switchScreen('selection');
    audioManager.playTransition();

    // Start Scanning Audio
    audioManager.startScanningSound();

    // Text-to-Speech Announcement
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Scanning infinite realities.");
        utterance.rate = 0.9; // Slightly slower for dramatic effect
        utterance.pitch = 1.0; // Natural pitch

        // Wait for voices to be loaded (sometimes async in Chrome)
        const findVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            console.log("Available Voices:", voices.map(v => v.name));

            const robotVoice = voices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('zira'));
            if (robotVoice) {
                utterance.voice = robotVoice;
            }

            // Force robotic pitch
            utterance.pitch = 0.6;
            utterance.rate = 1.0;

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = findVoice;
        } else {
            findVoice();
        }
    }

    // 1. Populate full screen grid
    mosaicGrid.innerHTML = '';
    const items = [];
    for (let i = 0; i < 150; i++) {
        const div = document.createElement('div');
        div.className = 'mosaic-item';
        const img = document.createElement('img');
        img.src = `${ASSET_PATH}${getRandomImage()}`;
        img.className = 'mosaic-item';
        div.appendChild(img);
        mosaicGrid.appendChild(div);
        items.push(img);
    }

    // 2. Animate "Phasing"
    const phasingInterval = setInterval(() => {
        const idx = Math.floor(Math.random() * items.length);
        const item = items[idx];
        item.classList.add('phasing');
        setTimeout(() => item.classList.remove('phasing'), 300);
    }, 100);

    let roundData = null;
    if (gameData && gameData.length > 0) {
        roundData = gameData[currentRoundIndex];
    }

    // Drama wait
    await sleep(4000);
    clearInterval(phasingInterval);
    audioManager.stopScanningSound(); // Stop Loop

    startMergePhase(roundData);
}

// --- PHASE 2 -> 3: MERGE (SPHERE) ---
async function startMergePhase(roundData) {
    switchScreen('merge');
    audioManager.playTransition();

    // Load and Merge
    try {
        // Fallback if no specific data
        const mergedSrc = roundData ? roundData["split the indenties image"] : 'assets/preview-merged.jpg';

        // Update Clue Text
        const clueText = document.getElementById('clue-text');
        const clueContainer = document.getElementById('clue-overlay');
        const sphereWrapper = document.getElementById('sphere-wrapper');
        const mergeControls = document.getElementById('merge-controls');

        if (clueText) {
            const lText = (roundData && roundData["left text"]) ? roundData["left text"] : "HR";
            const rText = (roundData && roundData["right text"]) ? roundData["right text"] : "AI";
            clueText.textContent = `${lText} X ${rText}`;
        }

        // Transition Logic: Show Clue -> Wait 5s -> Show Sphere
        if (clueContainer && sphereWrapper && mergeControls) {
            // Initial State: Show Clue, Hide Sphere
            clueContainer.classList.remove('hidden');
            sphereWrapper.classList.add('faded-out');
            mergeControls.classList.add('faded-out');

            // Wait 5 seconds
            await sleep(5000);

            // Swap
            clueContainer.classList.add('hidden');
            sphereWrapper.classList.remove('faded-out');
            mergeControls.classList.remove('faded-out');
        }

        const previewImg = new Image();
        previewImg.src = mergedSrc;
        await new Promise((r, e) => {
            previewImg.onload = r;
            previewImg.onerror = r; // Proceed anyway
        });

        // Draw merged result with full visibility (no crop)
        // 1. Calculate natural aspect ratio
        const ratio = previewImg.width / (previewImg.height || 1); // Avoid div by zero

        // 2. Set canvas dimensions to match this ratio
        // We keep height fixed at 600 (or higher for resolution) and adjust width
        const baseHeight = 600;
        canvas.height = baseHeight;
        canvas.width = baseHeight * ratio;

        // 3. Update CSS container to match this ratio so it doesn't stretch/distort
        // We wait a tick to ensure DOM is ready if needed, but synchronous is fine usually
        const sphere = document.querySelector('.energy-sphere');
        if (sphere) {
            sphere.style.aspectRatio = `${ratio}`;
        }

        // 4. Draw FULL image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);

        // Prepare Split Animation Assets (Legacy visual backup)
        const dataUrl = canvas.toDataURL();
        splitLeft.style.backgroundImage = `url(${dataUrl})`;
        splitRight.style.backgroundImage = `url(${dataUrl})`;

        // Setup Reveal Data
        // Map JSON keys to UI:
        // "split the indenties image" -> Center
        // "qleft image" -> Left
        // "right image" -> Right
        // "text" -> Name

        document.getElementById('reveal-img-merged').src = mergedSrc;

        if (roundData) {
            revealImgA.src = roundData["qleft image"];
            revealImgB.src = roundData["right image"];

            revealNameA.textContent = roundData["left text"] || "HR";
            revealNameB.textContent = roundData["right text"] || "AI";

            const centerName = document.querySelector('.center-card .hero-name');
            if (centerName) centerName.textContent = "FUSION COMPLETE";
        } else {
            // Fallback
            revealImgA.src = `assets/img001.jpg`;
            revealImgB.src = `assets/img002.jpg`;
            revealNameA.textContent = "HR";
            revealNameB.textContent = "AI";
        }

    } catch (e) {
        console.error("Merge failed", e);
    }
}

// --- PHASE 3 -> 4: STORM SPLIT ---
async function triggerStormSplit() {
    splitBtn.classList.add('hidden');
    audioManager.playEnergyBuildup(); // Big sci-fi sound

    const sphere = document.querySelector('.energy-sphere');
    sphere.classList.add('infusing');

    // Wait 3.5 seconds to match the audio drama
    await sleep(3500);

    screens.merge.classList.remove('active');
    screens.merge.classList.add('hidden');
    sphere.classList.remove('infusing');

    screens.reveal.classList.remove('hidden');
    screens.reveal.classList.add('active');

    audioManager.playTransition(); // Reveal transition
}

// --- UTILS ---
function switchScreen(name) {
    if (screens[name].classList.contains('active')) return; // Dedup

    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    const target = screens[name];
    target.classList.remove('hidden');
    void target.offsetWidth;
    target.classList.add('active');
}

function loadImage(filename) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = `${ASSET_PATH}${filename}`;
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Fallback
            const p = new Image();
            p.src = 'https://placehold.co/400x400/000/FFF?text=VOID';
            p.onload = () => resolve(p);
        };
    });
}

// Run
init();
