// ==========================================
// CHAMPIONSHIP 3D CRICKET - GAME ENGINE
// ==========================================

// --- SOUND ENGINE (Synthesized procedural Web Audio) ---
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.crowdGain = null;
        this.enabled = true;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.setupCrowdAmbiance();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    setupCrowdAmbiance() {
        if (!this.ctx) return;

        // Create ambient crowd noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        noise.loop = true;

        // Bandpass filter to match crowd vocal range (approx 400Hz - 900Hz)
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 600;
        filter.Q.value = 1.0;

        // Gain node for volume control
        this.crowdGain = this.ctx.createGain();
        this.crowdGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // Soft idle hum

        noise.connect(filter);
        filter.connect(this.crowdGain);
        this.crowdGain.connect(this.ctx.destination);
        noise.start(0);
    }

    setCrowdVolume(targetVolume, duration = 0.5) {
        if (!this.ctx || !this.crowdGain || !this.enabled) return;
        this.crowdGain.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + duration);
    }

    playHitSound() {
        if (!this.ctx || !this.enabled) return;
        this.init(); // safety check
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const time = this.ctx.currentTime;
        
        // 1. Core woody "Thwack" sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.08);

        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

        // 2. High-frequency click noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 2000;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.1);
        noise.start(time);
        noise.stop(time + 0.05);
    }

    playBowledSound() {
        if (!this.ctx || !this.enabled) return;
        const time = this.ctx.currentTime;

        // Synthesize stumps rattling (multiple low frequency wooden cracks + resonance)
        for (let i = 0; i < 3; i++) {
            const delay = i * 0.02;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(300 + Math.random() * 200, time + delay);
            osc.frequency.exponentialRampToValueAtTime(60, time + delay + 0.15);

            gain.gain.setValueAtTime(0.4, time + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, time + delay + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time + delay);
            osc.stop(time + delay + 0.2);
        }

        // Noise crack
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 800;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(time);
        noise.stop(time + 0.2);
    }

    playCheerSound() {
        if (!this.ctx || !this.enabled) return;
        this.setCrowdVolume(0.35, 0.2); // Loud cheer volume
        
        // Add high-frequency cheer texture
        const time = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 2.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(time);
        noise.stop(time + 3.0);

        // Gradually fade crowd volume back down to baseline after 4 seconds
        setTimeout(() => {
            if (gameState.phase !== 'game-over') {
                this.setCrowdVolume(0.04, 1.5);
            }
        }, 3500);
    }

    playOutSound() {
        if (!this.ctx || !this.enabled) return;
        this.setCrowdVolume(0.01, 0.1); // Crowd gasps/goes silent
        
        // Synthesize crowd disappointed sigh "Aww"
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.linearRampToValueAtTime(100, time + 0.8);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.linearRampToValueAtTime(0.01, time + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.8);

        setTimeout(() => {
            if (gameState.phase !== 'game-over') {
                this.setCrowdVolume(0.04, 1.0);
            }
        }, 2000);
    }
}

const sounds = new SoundEngine();

// --- GAME STATE ---
const gameState = {
    // Match settings
    playerTeam: "IND",
    opponentTeam: "AUS",
    totalOvers: 1,
    difficulty: "medium", // easy, medium, hard
    
    // Core Scoreboard
    runs: 0,
    wickets: 0,
    ballsBowled: 0,
    target: 12,
    innings: 1, // innings 1 is AI batting, innings 2 is player batting (quick chase model)
    oppScore: 11,
    oppWickets: 0,
    
    // Ball-by-ball variables
    phase: "menu", // menu, bowling-prep, bowling-delivery, hit-flight, running, play-over-transition, game-over
    activeDeliveryType: "Fast",
    bowlerSpeed: 140,
    aimOffset: 0, // Aiming angle offset from keystrokes
    timingQuality: "", // "perfect", "good", "early", "late", "miss"
    shotType: "normal", // normal, lofted
    runsThisBall: 0,
    isBallDead: true,
    activeBatsmanIndex: 1, // 1 = Striker, 2 = Non-striker

    // Running Between Wickets
    runningActive: false,
    runningProgress: 0, // 0 to 100 percentage
    runningDirection: 1, // 1: striker to non-striker, -1: back
    batsmenSwapped: false,
    runningCompletedThisBall: 0,
    
    // Bowler characteristics
    bowlerList: {
        "IND": { name: "Bumrah", type: "Fast" },
        "AUS": { name: "Stark", type: "Fast" },
        "ENG": { name: "Archer", type: "Fast" },
        "RSA": { name: "Rabada", type: "Fast" },
        "PAK": { name: "Afridi", type: "Fast" },
        "NZL": { name: "Boult", type: "Fast" },
        "WIN": { name: "Russell", type: "Fast" }
    },
    
    // Stats for final scorecard
    stats: {
        ballsPlayed: 0,
        sixes: 0,
        fours: 0,
        dots: 0,
        singles: 0,
        doubles: 0,
        triples: 0
    }
};

// --- THREE.JS GRAPHICS VARIABLES ---
let scene, camera, renderer;
let pitch, wicketsBatsman, wicketsBowler, bailsBatsman = [], stumpsBatsman = [];
let batsman, bowler, stadium, ball;
let fielders = [];
let floodlights = [];
let landingSpotIndicator;

// Animation & Physics parameters
let ballVelocity = new THREE.Vector3();
let ballIsSpinning = false;
let ballSpinTurn = 0; // horizontal speed adjustment on bounce
let ballInFlight = false;
let isBatSwinging = false;
let swingProgress = 0; // 0 to 1
const swingDuration = 0.25; // seconds
let batInitialRotation = new THREE.Vector3();
let ballBounceLocation = new THREE.Vector3();

// Particles System
let particles = [];

// Radar map context
let radarCanvas, radarCtx;

// Input tracking
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false,
    Space: false,
    ShiftLeft: false,
    KeyR: false
};

// --- INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
    initUI();
    initRadar();
    initThreeJS();
    animate();
});

// --- UI SETUP & EVENT LISTENERS ---
function initUI() {
    // Segmented Controls selection
    setupSegmentedControl("overs-control", (val) => { gameState.totalOvers = parseInt(val); });
    setupSegmentedControl("difficulty-control", (val) => { gameState.difficulty = val; });

    // Buttons
    document.getElementById("start-game-btn").addEventListener("click", () => {
        sounds.init();
        startGame();
    });

    document.getElementById("restart-match-btn").addEventListener("click", () => {
        resetMatch();
        startGame();
    });

    document.getElementById("menu-match-btn").addEventListener("click", () => {
        showScreen("menu-screen");
    });

    // Mobile controls
    const mobileSwingBtn = document.getElementById("mobile-swing-btn");
    mobileSwingBtn.addEventListener("mousedown", triggerSwing);
    mobileSwingBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        triggerSwing();
    });

    const mobileRunBtn = document.getElementById("mobile-run-btn");
    mobileRunBtn.addEventListener("click", triggerRunning);

    // Audio setting toggle
    const audioToggle = document.getElementById("audio-toggle-btn");
    audioToggle.addEventListener("click", () => {
        sounds.enabled = !sounds.enabled;
        audioToggle.innerText = sounds.enabled ? "ON" : "OFF";
        audioToggle.classList.toggle("active", sounds.enabled);
        if (sounds.enabled) {
            sounds.init();
        } else if (sounds.crowdGain) {
            sounds.crowdGain.gain.setValueAtTime(0, sounds.ctx.currentTime);
        }
    });

    // Camera Selector
    document.getElementById("camera-select").addEventListener("change", (e) => {
        updateCameraMode(e.target.value);
    });

    // Indicator Toggle
    const indicatorToggle = document.getElementById("indicator-toggle-btn");
    indicatorToggle.addEventListener("click", () => {
        const active = indicatorToggle.innerText === "ON";
        indicatorToggle.innerText = active ? "OFF" : "ON";
        indicatorToggle.classList.toggle("active", !active);
    });

    // Settings panel
    document.getElementById("settings-btn").addEventListener("click", () => {
        document.getElementById("settings-overlay").classList.remove("hidden");
    });
    
    document.getElementById("close-settings-btn").addEventListener("click", () => {
        document.getElementById("settings-overlay").classList.add("hidden");
    });

    document.getElementById("exit-match-btn").addEventListener("click", () => {
        document.getElementById("settings-overlay").classList.add("hidden");
        showScreen("menu-screen");
        gameState.phase = "menu";
    });

    // Keyboard controls
    window.addEventListener("keydown", (e) => {
        if (["ArrowLeft", "ArrowRight", "Space", "ShiftLeft", "KeyA", "KeyD", "KeyR"].includes(e.code)) {
            // Prevent default scrolling for spaces and arrows
            if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
        }
        
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.ArrowLeft = true;
        if (e.code === "ArrowRight" || e.code === "KeyD") keys.ArrowRight = true;
        if (e.code === "Space") {
            keys.Space = true;
            triggerSwing(e.shiftKey);
        }
        if (e.code === "KeyR") {
            keys.KeyR = true;
            triggerRunning();
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.ArrowLeft = false;
        if (e.code === "ArrowRight" || e.code === "KeyD") keys.ArrowRight = false;
        if (e.code === "Space") keys.Space = false;
        if (e.code === "KeyR") keys.KeyR = false;
    });
}

function setupSegmentedControl(containerId, callback) {
    const container = document.getElementById(containerId);
    const buttons = container.querySelectorAll("button");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            callback(btn.dataset.value);
        });
    });
}

function showScreen(screenId) {
    document.querySelectorAll(".overlay-screen").forEach(screen => {
        screen.classList.remove("active");
        screen.classList.add("hidden");
    });
    const activeScreen = document.getElementById(screenId);
    activeScreen.classList.remove("hidden");
    activeScreen.classList.add("active");
    
    // Hide HUD if menu or game over is showing
    const hud = document.getElementById("hud-overlay");
    if (screenId === "menu-screen" || screenId === "game-over-screen") {
        hud.classList.remove("active");
    } else {
        hud.classList.add("active");
    }
}

// --- RADAR MINI MAP ---
function initRadar() {
    radarCanvas = document.getElementById("radar-canvas");
    radarCtx = radarCanvas.getContext("2d");
}

function drawRadar() {
    if (!radarCtx) return;
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2 - 5;

    radarCtx.clearRect(0, 0, w, h);

    // 1. Draw Outer boundary
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, r, 0, Math.PI * 2);
    radarCtx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    radarCtx.lineWidth = 2;
    radarCtx.stroke();
    radarCtx.fillStyle = "rgba(0, 20, 10, 0.35)";
    radarCtx.fill();

    // 2. Draw 30-yard circle (inner circle)
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    radarCtx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    radarCtx.setLineDash([2, 3]);
    radarCtx.stroke();
    radarCtx.setLineDash([]);

    // 3. Draw Pitch
    radarCtx.fillStyle = "rgba(245, 158, 11, 0.4)";
    radarCtx.fillRect(cx - 2, cy - r * 0.25, 4, r * 0.5);

    // 4. Draw Fielders (Green dots)
    fielders.forEach(f => {
        // Map 3D coordinates to radar.
        // Game boundaries are at ~100 units radial distance.
        // Pitch center is at Z=0. Batsman is at Z=18. We should orient the radar such that
        // the batsman is at the bottom (oriented like the camera).
        // Standard view: Camera looks from Z=24 towards Z=-18.
        // So Z increases downwards, X goes right.
        const rx = cx + (f.position.x / 100) * r;
        const ry = cy + (f.position.z / 100) * r;

        radarCtx.beginPath();
        radarCtx.arc(rx, ry, 3, 0, Math.PI * 2);
        radarCtx.fillStyle = "#10b981";
        radarCtx.fill();
    });

    // 5. Draw Batsman (Blue dot)
    if (batsman) {
        const bx = cx + (batsman.position.x / 100) * r;
        const by = cy + (batsman.position.z / 100) * r;
        radarCtx.beginPath();
        radarCtx.arc(bx, by, 4, 0, Math.PI * 2);
        radarCtx.fillStyle = "#38bdf8";
        radarCtx.fill();
    }

    // 6. Draw Ball (Glowing white / yellow dot)
    if (ball && ball.visible) {
        const bx = cx + (ball.position.x / 100) * r;
        const by = cy + (ball.position.z / 100) * r;
        
        radarCtx.beginPath();
        radarCtx.arc(bx, by, 4, 0, Math.PI * 2);
        radarCtx.fillStyle = "#ffffff";
        radarCtx.shadowBlur = 10;
        radarCtx.shadowColor = "#00ffff";
        radarCtx.fill();
        radarCtx.shadowBlur = 0; // reset
    }
}

// --- MATCH MANAGEMENT ---
function startGame() {
    // Read selections
    gameState.playerTeam = document.getElementById("player-team").value;
    gameState.opponentTeam = document.getElementById("opponent-team").value;
    
    // Update HUD text
    document.getElementById("hud-player-team-lbl").innerText = gameState.playerTeam;
    document.getElementById("hud-opp-team-lbl").innerText = gameState.opponentTeam;
    
    // AI Score setting based on difficulty
    let averageOverRate = 10;
    if (gameState.difficulty === "easy") averageOverRate = 7;
    if (gameState.difficulty === "hard") averageOverRate = 14;
    
    gameState.oppScore = Math.round(gameState.totalOvers * averageOverRate + Math.random() * 5);
    gameState.target = gameState.oppScore + 1;
    
    document.getElementById("hud-target").innerText = `Chasing ${gameState.target}`;
    
    resetScoreboard();
    showScreen("hud-overlay");
    
    // Set crowd audio to ambient stadium level
    sounds.setCrowdVolume(0.04, 1.0);
    
    prepareForNextBall();
}

function resetMatch() {
    gameState.runs = 0;
    gameState.wickets = 0;
    gameState.ballsBowled = 0;
    
    gameState.stats = {
        ballsPlayed: 0,
        sixes: 0,
        fours: 0,
        dots: 0,
        singles: 0,
        doubles: 0,
        triples: 0
    };
    
    // Reconstruct stumps if damaged
    resetWickets();
    resetBatsmanPosition();
}

function resetScoreboard() {
    document.getElementById("hud-runs").innerText = gameState.runs;
    document.getElementById("hud-wickets").innerText = gameState.wickets;
    
    const oversText = Math.floor(gameState.ballsBowled / 6) + "." + (gameState.ballsBowled % 6);
    document.getElementById("hud-overs").innerText = oversText;
    
    updateRequirementsHUD();
}

function updateRequirementsHUD() {
    const ballsRemaining = (gameState.totalOvers * 6) - gameState.ballsBowled;
    const runsRequired = gameState.target - gameState.runs;
    
    const reqTextEl = document.getElementById("hud-requirement-txt");
    if (runsRequired <= 0) {
        reqTextEl.innerText = "You have won the match!";
        reqTextEl.style.color = "#10b981";
    } else if (ballsRemaining <= 0) {
        reqTextEl.innerText = `Innings over! Lost by ${runsRequired - 1} runs.`;
        reqTextEl.style.color = "#ef4444";
    } else {
        reqTextEl.innerText = `Need ${runsRequired} runs off ${ballsRemaining} ball${ballsRemaining > 1 ? 's' : ''}`;
        reqTextEl.style.color = "#ffffff";
    }
    
    // Calculate run rates
    const oversCount = Math.max(0.1, gameState.ballsBowled / 6);
    const currentRR = (gameState.runs / oversCount).toFixed(2);
    document.getElementById("hud-curr-rr").innerText = currentRR;
    
    const remainingOvers = Math.max(0.01, ballsRemaining / 6);
    const reqRR = runsRequired > 0 ? (runsRequired / remainingOvers).toFixed(2) : "0.00";
    document.getElementById("hud-req-rr").innerText = reqRR;
}

function prepareForNextBall() {
    gameState.phase = "bowling-prep";
    gameState.isBallDead = false;
    gameState.runsThisBall = 0;
    gameState.runningActive = false;
    gameState.runningProgress = 0;
    gameState.runningDirection = 1;
    gameState.batsmenSwapped = false;
    gameState.runningCompletedThisBall = 0;
    gameState.timingQuality = "";
    gameState.shotType = "normal";
    
    // Hide tracker
    document.getElementById("running-tracker").classList.add("hidden");
    document.getElementById("mobile-run-btn").classList.add("disabled");
    document.getElementById("mobile-run-btn").disabled = true;
    document.getElementById("mobile-run-btn").classList.remove("active-run");
    document.getElementById("mobile-swing-btn").classList.remove("disabled");
    document.getElementById("mobile-swing-btn").disabled = false;
    
    // Hide visual feedback alerts
    hideFeedbackText();
    
    // Reset wickets and ball
    resetWickets();
    resetBatsmanPosition();
    
    // Setup bowler
    setupNextBowler();
    
    // Camera to batting view
    updateCameraMode("batting");
    
    // Position ball in Bowler's hand
    ball.position.set(0, 2.5, -18);
    ball.visible = true;
    ballInFlight = false;
    
    // Position bowler back at crease
    bowler.position.set(0, 0, -25);
    
    // Generate AI Bowler Delivery
    generateBowlerDelivery();
    
    // Trigger Bowler animation after a short pause
    setTimeout(() => {
        if (gameState.phase === "bowling-prep") {
            bowlerRunUp();
        }
    }, 1200);
}

function setupNextBowler() {
    const activeBowler = gameState.bowlerList[gameState.opponentTeam];
    document.getElementById("hud-bowler-name").innerText = activeBowler.name + ` (${activeBowler.type})`;
    
    // Speeds based on type
    if (activeBowler.type === "Fast") {
        gameState.bowlerSpeed = Math.round(135 + Math.random() * 20); // 135 to 155 km/h
    } else {
        gameState.bowlerSpeed = Math.round(90 + Math.random() * 15);  // 90 to 105 km/h
    }
    
    document.getElementById("hud-ball-speed").innerText = `-- km/h`;
}

function generateBowlerDelivery() {
    // Types: Normal, Spin, Swing, Yorker, Bouncer
    const deliveryTypes = ["Fast-Normal", "Fast-Inswing", "Fast-Outswing", "Spin-OffBreak", "Spin-LegBreak", "Yorker", "Bouncer"];
    
    // Bias based on bowler speed / type
    const activeBowler = gameState.bowlerList[gameState.opponentTeam];
    let selectedType = "";
    
    if (activeBowler.type === "Fast") {
        const list = ["Fast-Normal", "Fast-Inswing", "Fast-Outswing", "Yorker", "Bouncer"];
        selectedType = list[Math.floor(Math.random() * list.length)];
    } else {
        const list = ["Spin-OffBreak", "Spin-LegBreak", "Yorker"];
        selectedType = list[Math.floor(Math.random() * list.length)];
    }
    
    gameState.activeDeliveryType = selectedType;
    
    // Set target bounce coordinate on pitch
    // Pitch goes from Z=-20 to Z=20. Batsman is at Z=18.
    let targetZ = 12 + Math.random() * 4; // Good length (Z=12 to Z=16)
    let targetX = -0.5 + Math.random() * 1.0; // Slightly off-center
    
    if (selectedType === "Yorker") {
        targetZ = 16.8 + Math.random() * 0.8; // Lands near crease
    } else if (selectedType === "Bouncer") {
        targetZ = 7 + Math.random() * 3; // Lands short
    }
    
    ballBounceLocation.set(targetX, 0.15, targetZ);
    
    // Display landing spot indicator if settings enable it
    const showIndicator = document.getElementById("indicator-toggle-btn").classList.contains("active");
    if (showIndicator) {
        landingSpotIndicator.position.copy(ballBounceLocation);
        landingSpotIndicator.position.y = 0.05; // hover slightly above pitch
        
        // Colors: Green for Good length, Red for Yorker/Full, Yellow for Bouncer/Short
        let color = 0x10b981; // green
        if (selectedType === "Yorker") color = 0xef4444; // red
        if (selectedType === "Bouncer") color = 0xf59e0b; // orange/yellow
        
        landingSpotIndicator.material.color.setHex(color);
        landingSpotIndicator.visible = true;
        
        // Fade indicator for Medium difficulty during delivery, and hide instantly for Hard
        if (gameState.difficulty === "medium") {
            gsap.to(landingSpotIndicator.material, {
                opacity: 0,
                duration: 1.0,
                delay: 0.2,
                onComplete: () => { landingSpotIndicator.visible = false; }
            });
        } else if (gameState.difficulty === "hard") {
            landingSpotIndicator.visible = false;
        } else {
            landingSpotIndicator.material.opacity = 0.7; // Keep solid on easy
        }
    } else {
        landingSpotIndicator.visible = false;
    }
}

function bowlerRunUp() {
    gameState.phase = "bowling-delivery";
    
    // Bowler runs forward from Z=-25 to Z=-18
    gsap.to(bowler.position, {
        z: -18,
        duration: 1.2,
        ease: "power1.inOut",
        onUpdate: () => {
            // Bob up/down to simulate running
            bowler.position.y = Math.abs(Math.sin(bowler.position.z * 1.5)) * 0.2;
        },
        onComplete: () => {
            bowler.position.y = 0;
            releaseBall();
        }
    });
}

function releaseBall() {
    ballInFlight = true;
    
    // Calculate initial speed in Z
    const speedKmh = gameState.bowlerSpeed;
    document.getElementById("hud-ball-speed").innerText = `${speedKmh} km/h`;
    
    // Scale speed (140 km/h is approx 39 m/s. Let's scale it down for game units: 40 units/sec)
    const zSpeed = 25 + (speedKmh - 90) * 0.25; 
    
    // Time to travel to landing bounce point
    const distZ = ballBounceLocation.z - ball.position.z;
    const flightTime = distZ / zSpeed;
    
    // Calculate required vertical launch velocity to hit the target bounce Z and bounce height
    // y = y0 + vy*t - 0.5*g*t^2 -> vy = (y - y0 + 0.5*g*t^2) / t
    const gravity = 9.8;
    const vy = (ballBounceLocation.y - ball.position.y + 0.5 * gravity * flightTime * flightTime) / flightTime;
    
    // Calculate horizontal launch velocity
    const vx = (ballBounceLocation.x - ball.position.x) / flightTime;
    
    ballVelocity.set(vx, vy, zSpeed);
    
    // Spin / Swing adjustments
    ballIsSpinning = false;
    ballSpinTurn = 0;
    
    if (gameState.activeDeliveryType.startsWith("Spin")) {
        ballIsSpinning = true;
        // turn amount on bounce
        ballSpinTurn = (gameState.activeDeliveryType === "Spin-OffBreak") ? 3.0 : -3.0; // right-hander perspective
    }
}

// --- BATTING AND SWING MECHANICS ---
function triggerSwing(lofted = false) {
    if (gameState.phase !== "bowling-delivery" || isBatSwinging || gameState.isBallDead) return;
    
    isBatSwinging = true;
    swingProgress = 0;
    gameState.shotType = lofted || keys.ShiftLeft ? "lofted" : "normal";
    
    // Dynamic bat swing rotation animation
    const batGroup = batsman.getObjectByName("batGroup");
    if (!batGroup) return;

    // Standard stance angles
    const startRotX = batInitialRotation.x;
    const startRotY = batInitialRotation.y;
    const startRotZ = batInitialRotation.z;

    // Swing backlift to follow through
    gsap.killTweensOf(batGroup.rotation);
    
    // Timeline of swing: Backlift -> Strike -> Follow-through -> Return
    const tl = gsap.timeline({
        onComplete: () => {
            isBatSwinging = false;
            // Back to stance slowly
            gsap.to(batGroup.rotation, {
                x: startRotX,
                y: startRotY,
                z: startRotZ,
                duration: 0.6
            });
        }
    });

    // Backlift/Strike
    tl.to(batGroup.rotation, {
        x: startRotX + (gameState.shotType === "lofted" ? -1.8 : -1.2), // steep vertical rotation
        y: startRotY + 0.8,
        z: startRotZ + 0.5,
        duration: 0.12,
        ease: "power2.out"
    });
    
    // Follow through
    tl.to(batGroup.rotation, {
        x: startRotX + 0.5,
        y: startRotY - 1.2,
        z: startRotZ - 0.5,
        duration: 0.18,
        ease: "power1.inOut",
        onStart: checkBatBallCollision
    });
}

function checkBatBallCollision() {
    if (!ballInFlight || gameState.isBallDead) return;

    // batsman is at Z = 18. Batting stroke timing window: when ball is between Z = 16.5 and Z = 19.2
    const ballZ = ball.position.z;
    const ballY = ball.position.y;
    const ballX = ball.position.x;
    
    // Batsman X position
    const batX = batsman.position.x;
    
    // Hitting window checks
    const targetStrikeZ = 18.0;
    const thresholdZ = 1.35; // Hitting window bounds
    
    if (Math.abs(ballZ - targetStrikeZ) < thresholdZ) {
        // Height check (Must not be too high to play, or must be lofted)
        if (ballY > 2.0 && gameState.shotType === "normal") {
            showFeedback("Too High!", "early"); // too bouncy, missed
            return;
        }
        
        // Reach check (batsman left/right limits)
        const reachDist = Math.abs(ballX - batX);
        if (reachDist > 1.3) {
            showFeedback("Wide / Out of Reach", "early");
            return;
        }
        
        // Calculate timing quality
        const timingDiff = ballZ - targetStrikeZ; // - values: too early, + values: too late
        let quality = "miss";
        let timingClass = "feedback-miss";
        
        const absDiff = Math.abs(timingDiff);
        if (absDiff < 0.25) {
            quality = "PERFECT!";
            timingClass = "feedback-perfect";
        } else if (absDiff < 0.6) {
            quality = "GOOD";
            timingClass = "feedback-good";
        } else if (timingDiff < 0) {
            quality = "TOO EARLY";
            timingClass = "feedback-early";
        } else {
            quality = "TOO LATE";
            timingClass = "feedback-late";
        }
        
        gameState.timingQuality = quality.toLowerCase().replace("!", "");
        
        // Hit physics computation!
        sounds.playHitSound();
        triggerHitDust();
        
        // Calculate shot launch angle
        // Player aim: Left arrow deflects left (leg-side for right hander), Right arrow to off-side
        let baseAngle = Math.PI; // straight down the pitch (towards Z = -18)
        
        if (keys.ArrowLeft || keys.KeyA) {
            baseAngle += 0.45; // angle to the right / leg-side (onside)
        } else if (keys.ArrowRight || keys.KeyD) {
            baseAngle -= 0.45; // angle to the left / off-side
        }
        
        // Add random variation or slice based on timing
        // Early timing drags the ball leg side, late pushes it to off side
        baseAngle += timingDiff * 0.6;
        
        // Output velocity speed
        let speedMult = 1.0;
        if (quality.includes("PERFECT")) speedMult = 1.6;
        else if (quality.includes("GOOD")) speedMult = 1.25;
        else speedMult = 0.55; // early/late hits have low power
        
        const baseSpeed = 16 + Math.random() * 8;
        const outSpeed = baseSpeed * speedMult;
        
        // Vertical launch angle
        let launchAngle = 0.05; // flat ground shot
        if (gameState.shotType === "lofted") {
            launchAngle = (quality.includes("PERFECT") || quality.includes("GOOD")) ? 0.45 : 0.2; // lofted upward angle
        }
        
        // Update ball velocities
        ballVelocity.x = Math.sin(baseAngle) * outSpeed * Math.cos(launchAngle);
        ballVelocity.z = Math.cos(baseAngle) * outSpeed * Math.cos(launchAngle);
        ballVelocity.y = outSpeed * Math.sin(launchAngle);
        
        // Spin/air resistance
        ballIsSpinning = false;
        
        // UI alerts
        showFeedback(quality, timingClass);
        
        // Transition game phase
        gameState.phase = "hit-flight";
        updateCameraMode("follow");
        
        // Activate "RUN" buttons
        document.getElementById("mobile-run-btn").classList.remove("disabled");
        document.getElementById("mobile-run-btn").disabled = false;
        document.getElementById("mobile-run-btn").classList.add("active-run");
        
        // Stats increment
        gameState.stats.ballsPlayed++;
    }
}

function showFeedback(text, cssClass) {
    const feedbackPanel = document.getElementById("timing-feedback");
    feedbackPanel.innerText = text;
    feedbackPanel.className = `feedback-text show ${cssClass}`;
    
    // Sound cheer/sigh context
    if (cssClass === "feedback-perfect" || cssClass === "feedback-good") {
        // cheer slightly after the hit
        setTimeout(() => {
            if (gameState.phase !== 'game-over') sounds.playCheerSound();
        }, 150);
    }
}

function hideFeedbackText() {
    document.getElementById("timing-feedback").className = "feedback-text";
    document.getElementById("shot-feedback").className = "feedback-text";
}

// --- RUNNING LOGIC ---
function triggerRunning() {
    if (gameState.isBallDead || gameState.phase === "bowling-prep" || gameState.phase === "bowling-delivery") return;
    
    if (!gameState.runningActive) {
        gameState.runningActive = true;
        gameState.runningProgress = 0;
        gameState.runningDirection = 1;
        gameState.batsmenSwapped = false;
        
        // Show overlay tracker
        document.getElementById("running-tracker").classList.remove("hidden");
        document.getElementById("running-status-lbl").innerText = "RUNNING...";
        document.getElementById("mobile-run-btn").innerText = "TURN BACK (R)";
    } else {
        // Turn around batsman (Run back crease)
        gameState.runningDirection *= -1;
        document.getElementById("running-status-lbl").innerText = "TURNING BACK...";
    }
}

function updateRunningState(dt) {
    if (!gameState.runningActive || gameState.isBallDead) return;
    
    // Progress increase rate (takes ~2.2 seconds to run single)
    const runSpeed = 45; // percentage per second
    gameState.runningProgress += runSpeed * dt * gameState.runningDirection;
    
    // Clamp running bounds
    if (gameState.runningProgress >= 100) {
        gameState.runningProgress = 100;
        
        // Run completed!
        gameState.runningCompletedThisBall++;
        gameState.runs++;
        gameState.runsThisBall++;
        document.getElementById("hud-runs").innerText = gameState.runs;
        updateRequirementsHUD();
        
        // Play soft coin/score synthesiser beep
        playRunAudioBeep();
        
        // Toggle running direction for the turn around
        gameState.runningDirection = -1;
        document.getElementById("running-status-lbl").innerText = "RUN COMPLETING...";
        
        // Check win condition instantly
        checkMatchResult();
        
    } else if (gameState.runningProgress <= 0) {
        gameState.runningProgress = 0;
        
        if (gameState.runningCompletedThisBall > 0 && gameState.runningDirection === -1) {
            // Returned to striker crease, run completed!
            gameState.runningCompletedThisBall++;
            gameState.runs++;
            gameState.runsThisBall++;
            document.getElementById("hud-runs").innerText = gameState.runs;
            updateRequirementsHUD();
            
            playRunAudioBeep();
            
            gameState.runningDirection = 1;
            document.getElementById("running-status-lbl").innerText = "RUN COMPLETING...";
            
            checkMatchResult();
        }
    }
    
    // Update tracker UI fill width
    document.getElementById("running-progress-fill").style.width = `${gameState.runningProgress}%`;
    
    // Animate striker and non-striker dots moving in opposite directions
    const runnerDot1 = document.getElementById("runner-batsman-1");
    const runnerDot2 = document.getElementById("runner-batsman-2");
    
    runnerDot1.style.left = `${gameState.runningProgress}%`;
    runnerDot2.style.left = `${100 - gameState.runningProgress}%`;
    
    // Physically move 3D batsman models on the pitch to visually represent running!
    // Creases are at Z=18 and Z=-18
    const progressZ = 18 - (36 * (gameState.runningProgress / 100));
    batsman.position.z = progressZ;
}

function playRunAudioBeep() {
    if (!sounds.ctx || !sounds.enabled) return;
    const time = sounds.ctx.currentTime;
    const osc = sounds.ctx.createOscillator();
    const gain = sounds.ctx.createGain();
    osc.frequency.setValueAtTime(600, time);
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(gain);
    gain.connect(sounds.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.2);
}

// --- PHYSICS ENGINE AND DYNAMICS LOOP ---
function updatePhysics(dt) {
    if (particles.length > 0) updateParticles(dt);

    if (!ballInFlight || gameState.isBallDead) return;
    
    // 1. Gravity and Drag
    const gravity = 9.8;
    ballVelocity.y -= gravity * dt;
    
    // Drag coefficient (outfield wind / friction slows ball down)
    const drag = 0.15;
    ballVelocity.x -= ballVelocity.x * drag * dt;
    ballVelocity.z -= ballVelocity.z * drag * dt;
    
    // Apply velocity to position
    ball.position.x += ballVelocity.x * dt;
    ball.position.y += ballVelocity.y * dt;
    ball.position.z += ballVelocity.z * dt;
    
    // Rotate ball mesh slightly to represent flight roll
    ball.rotation.x += ballVelocity.z * 0.1 * dt;
    
    // 2. Pitch Bouncing check
    // Pitch dimensions: X: -2 to 2, Z: -20 to 20
    const ballRadius = 0.15;
    if (ball.position.y <= ballRadius && Math.abs(ball.position.x) < 2.0 && Math.abs(ball.position.z) < 20.0) {
        ball.position.y = ballRadius;
        
        // Invert Y velocity with rebound restitution
        const bounceRestitution = 0.68;
        ballVelocity.y = -ballVelocity.y * bounceRestitution;
        
        // Apply spin break rotation
        if (ballIsSpinning) {
            ballVelocity.x += ballSpinTurn;
            ballIsSpinning = false; // spin wears off after bounce
        }
        
        triggerBounceDust(ball.position);
    }
    
    // Ground roll boundary (if it rolls past pitch)
    if (ball.position.y < ballRadius) {
        ball.position.y = ballRadius;
        ballVelocity.y = 0;
        // Grass friction coefficient
        const grassFriction = 0.35;
        ballVelocity.x -= ballVelocity.x * grassFriction * dt;
        ballVelocity.z -= ballVelocity.z * grassFriction * dt;
    }
    
    // 3. Stumps Collisions check (Bowler's delivery hitting batsman wickets)
    // Batsman wickets centered at X=0, Z=18, Height=1.0. Bounding box check:
    if (gameState.phase === "bowling-delivery" && ball.position.z >= 17.5 && ball.position.z <= 18.2) {
        if (Math.abs(ball.position.x) < 0.25 && ball.position.y < 1.05) {
            // Clean bowled!
            triggerBowledWicket();
            return;
        }
    }
    
    // 4. Outfield Boundary checks (runs boundary)
    const outfieldRadius = 85.0;
    const distFromCenter = Math.hypot(ball.position.x, ball.position.z);
    
    if (distFromCenter >= outfieldRadius) {
        triggerBoundary();
        return;
    }
    
    // 5. Fielding Interceptions
    updateFieldersState(dt);
    
    // 6. Dot ball / ball slow stop dead condition
    const speed = ballVelocity.length();
    if (speed < 0.5 && ball.position.y <= ballRadius && gameState.phase === "hit-flight" && !gameState.isBallDead) {
        // AI fielders will catch or return it. If speed dies, mark ball dead.
        declareBallDead("Dot ball");
    }
}

function triggerBowledWicket() {
    ballInFlight = false;
    ballVelocity.set(0, 0, 0);
    
    sounds.playBowledSound();
    sounds.playOutSound();
    
    // Knock off bails and tilt stumps
    stumpsBatsman.forEach((stump, idx) => {
        gsap.to(stump.rotation, {
            x: -0.2 - Math.random() * 0.2,
            z: (idx - 1) * 0.15 + (Math.random() - 0.5) * 0.1,
            duration: 0.3,
            ease: "bounce.out"
        });
    });
    
    bailsBatsman.forEach(bail => {
        // Fly away
        gsap.to(bail.position, {
            x: bail.position.x + (Math.random() - 0.5) * 2,
            y: bail.position.y + 1.5 + Math.random() * 1,
            z: bail.position.z + 1 + Math.random() * 2,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                // fall down
                gsap.to(bail.position, {
                    y: 0.05,
                    duration: 0.4,
                    ease: "bounce.out"
                });
            }
        });
        gsap.to(bail.rotation, {
            x: Math.random() * 5,
            y: Math.random() * 5,
            duration: 0.8
        });
    });
    
    showFeedback("WICKET! BOWLED", "feedback-miss");
    gameState.wickets++;
    gameState.ballsBowled++;
    gameState.stats.ballsPlayed++;
    gameState.stats.dots++;
    
    resetScoreboard();
    
    gameState.isBallDead = true;
    
    setTimeout(() => {
        if (!checkMatchResult()) {
            prepareForNextBall();
        }
    }, 3000);
}

function triggerBoundary() {
    ballInFlight = false;
    ballVelocity.set(0, 0, 0);
    ball.visible = false;
    
    // Determine boundary size
    // Did it bounce? If y coordinate hit grass pitch before boundary
    let boundaryRuns = 4;
    let timingClass = "feedback-boundary";
    
    // If it never touched ground during launch (y > 0.15) before boundary
    // Simple heuristic: if launch speed was high and lofted, and Z velocity kept it airborne
    if (gameState.shotType === "lofted" && (gameState.timingQuality === "perfect" || gameState.timingQuality === "good")) {
        boundaryRuns = 6;
    }
    
    gameState.runs += boundaryRuns;
    gameState.runsThisBall = boundaryRuns;
    document.getElementById("hud-runs").innerText = gameState.runs;
    
    if (boundaryRuns === 6) {
        gameState.stats.sixes++;
        showFeedback("6 RUNS! MAJESTIC SHOT", timingClass);
        triggerWinFireworks();
    } else {
        gameState.stats.fours++;
        showFeedback("4 RUNS! BEAUTIFUL BOUNDARY", timingClass);
    }
    
    sounds.playCheerSound();
    gameState.ballsBowled++;
    
    resetScoreboard();
    
    gameState.isBallDead = true;
    
    setTimeout(() => {
        if (!checkMatchResult()) {
            prepareForNextBall();
        }
    }, 3500);
}

function declareBallDead(reason) {
    ballInFlight = false;
    ballVelocity.set(0, 0, 0);
    gameState.isBallDead = true;
    
    if (gameState.runsThisBall === 0) {
        gameState.stats.dots++;
    } else if (gameState.runsThisBall === 1) gameState.stats.singles++;
    else if (gameState.runsThisBall === 2) gameState.stats.doubles++;
    else if (gameState.runsThisBall === 3) gameState.stats.triples++;
    
    gameState.ballsBowled++;
    resetScoreboard();
    
    // Display feedback of final runs
    const shotFeed = document.getElementById("shot-feedback");
    if (gameState.runsThisBall > 0) {
        shotFeed.innerText = `Scored ${gameState.runsThisBall} Run${gameState.runsThisBall > 1 ? 's' : ''}`;
        shotFeed.className = "feedback-text show feedback-perfect";
    } else {
        shotFeed.innerText = "Dot Ball";
        shotFeed.className = "feedback-text show feedback-late";
    }
    
    setTimeout(() => {
        if (!checkMatchResult()) {
            prepareForNextBall();
        }
    }, 2000);
}

function triggerFielderWicket(type = "CATCH") {
    ballInFlight = false;
    ballVelocity.set(0, 0, 0);
    gameState.isBallDead = true;
    
    sounds.playOutSound();
    
    gameState.wickets++;
    gameState.ballsBowled++;
    gameState.stats.ballsPlayed++;
    gameState.stats.dots++;
    
    resetScoreboard();
    
    if (type === "CATCH") {
        showFeedback("OUT! CAUGHT!", "feedback-miss");
    } else {
        showFeedback("OUT! RUN OUT!", "feedback-miss");
    }
    
    setTimeout(() => {
        if (!checkMatchResult()) {
            prepareForNextBall();
        }
    }, 3000);
}

function checkMatchResult() {
    const ballsRemaining = (gameState.totalOvers * 6) - gameState.ballsBowled;
    const runsRequired = gameState.target - gameState.runs;
    
    if (runsRequired <= 0) {
        // Player wins!
        triggerEndGame(true);
        return true;
    }
    
    if (gameState.wickets >= 10 || ballsRemaining <= 0) {
        // Player loses!
        triggerEndGame(false);
        return true;
    }
    
    return false;
}

function triggerEndGame(playerWon) {
    gameState.phase = "game-over";
    
    // UI Screen configs
    const resultTitle = document.getElementById("game-result-title");
    const resultSub = document.getElementById("game-result-subtitle");
    
    if (playerWon) {
        resultTitle.innerText = "CHAMPIONS! YOU WON";
        resultTitle.className = "result-title winner-text";
        const wicketsLeft = 10 - gameState.wickets;
        resultSub.innerText = `Defeated ${gameState.opponentTeam} by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}!`;
        sounds.playCheerSound();
        triggerWinFireworks();
    } else {
        resultTitle.innerText = "MATCH LOST";
        resultTitle.className = "result-title loser-text";
        resultSub.innerText = `${gameState.opponentTeam} won by ${gameState.target - gameState.runs - 1} runs.`;
        sounds.playOutSound();
    }
    
    // Scorecard details
    document.getElementById("summary-opp-team-name").innerText = gameState.opponentTeam;
    document.getElementById("summary-opp-score").innerText = `${gameState.oppScore}/0`;
    document.getElementById("summary-opp-overs").innerText = `${gameState.totalOvers}.0`;
    
    document.getElementById("summary-player-team-name").innerText = gameState.playerTeam;
    document.getElementById("summary-player-score").innerText = `${gameState.runs}/${gameState.wickets}`;
    const oversText = Math.floor(gameState.ballsBowled / 6) + "." + (gameState.ballsBowled % 6);
    document.getElementById("summary-player-overs").innerText = oversText;
    
    // Stats layout
    document.getElementById("stats-total-balls").innerText = gameState.stats.ballsPlayed;
    document.getElementById("stats-sixes").innerText = gameState.stats.sixes;
    document.getElementById("stats-fours").innerText = gameState.stats.fours;
    document.getElementById("stats-dots").innerText = gameState.stats.dots;
    
    setTimeout(() => {
        showScreen("game-over-screen");
    }, 1500);
}

// --- AI FIELDERS LOGIC ---
function updateFieldersState(dt) {
    if (gameState.phase !== "hit-flight") return;
    
    // Find closest fielder to the ball projection
    let closestFielder = null;
    let minDist = 9999;
    
    fielders.forEach(f => {
        const d = Math.hypot(f.position.x - ball.position.x, f.position.z - ball.position.z);
        if (d < minDist) {
            minDist = d;
            closestFielder = f;
        }
    });
    
    // Run closest fielder toward ball
    if (closestFielder) {
        // Difficulty controls fielder run speed
        let runSpeed = 16.0;
        if (gameState.difficulty === "easy") runSpeed = 11.0;
        if (gameState.difficulty === "hard") runSpeed = 22.0;
        
        // Calculate angle to ball
        const dx = ball.position.x - closestFielder.position.x;
        const dz = ball.position.z - closestFielder.position.z;
        const angle = Math.atan2(dx, dz);
        
        // Move fielder
        closestFielder.position.x += Math.sin(angle) * runSpeed * dt;
        closestFielder.position.z += Math.cos(angle) * runSpeed * dt;
        
        // Simple leg bobbing while running
        closestFielder.position.y = Math.abs(Math.sin(closestFielder.position.x * 2)) * 0.15;
        
        // Check interception collision
        const ballDist = Math.hypot(ball.position.x - closestFielder.position.x, ball.position.z - closestFielder.position.z);
        
        if (ballDist < 1.4) {
            closestFielder.position.y = 0; // stop bob
            
            // Catch Check
            const untouchedByGround = ball.position.y > 0.6 && ballVelocity.y !== 0; // ball hasn't bounced and is high
            
            if (untouchedByGround) {
                // Out caught!
                triggerFielderWicket("CATCH");
            } else {
                // Fielded! Ball is picked up.
                ballInFlight = false;
                ballVelocity.set(0, 0, 0);
                
                // Animate throwing ball back to wickets
                animateBallThrow(closestFielder);
            }
        }
    }
}

function animateBallThrow(fielder) {
    sounds.playRunAudioBeep(); // indicator beep
    
    // Decide which crease to throw to (Striker or Non-striker end stumps)
    // Batsman end is Z=18, Bowler end is Z=-18. Check which crease is furthest from the runner
    const runningProgressVal = gameState.runningProgress;
    let targetZ = 18.0;
    
    if (runningProgressVal > 50) {
        targetZ = -18.0; // throw to bowler end since striker is close to non-striker
    }
    
    // Throw duration
    const throwTime = 0.8;
    
    // Position ball at fielder hand
    ball.position.copy(fielder.position);
    ball.position.y = 1.0;
    ball.visible = true;
    
    gsap.killTweensOf(ball.position);
    gsap.to(ball.position, {
        x: 0,
        y: 0.5,
        z: targetZ,
        duration: throwTime,
        ease: "power1.out",
        onUpdate: () => {
            // Give throw an arc height curve
            const timeRatio = gsap.getProperty(ball.position, "z");
            // simple parabolic offset
        },
        onComplete: () => {
            // Check run-out!
            // If the batsman is currently running (not safe in crease: runningProgress must be exactly 0 or 100)
            const runnerSafe = (gameState.runningProgress === 0 || gameState.runningProgress === 100);
            
            if (gameState.runningActive && !runnerSafe) {
                // Trigger Run Out!
                triggerFielderWicket("RUNOUT");
            } else {
                // Safe crease, ball is officially dead
                declareBallDead("Ball returned");
            }
        }
    });
}

// --- THREE.JS STADIUM CREATION ---
function initThreeJS() {
    const container = document.getElementById("game-container");
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060814);
    scene.fog = new THREE.FogExp2(0x060814, 0.007);
    
    // Camera
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Sunlight / Overhead Stadium lights
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(0, 50, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.002;
    scene.add(sunLight);
    
    // Build Stadium elements
    createOutfield();
    createWickets();
    createBatsman();
    createBowler();
    createFielders();
    createBall();
    createStadiumStructure();
    
    // Window Resize
    window.addEventListener("resize", onWindowResize);
}

function updateCameraMode(mode) {
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.rotation);

    if (mode === "batting") {
        // Behind stumps looking down pitch
        // Striker stands at Z=18. Camera stands at Z=25, looking at bowler end Z=-18
        gsap.to(camera.position, {
            x: 0,
            y: 3.5,
            z: 24.5,
            duration: 1.0,
            ease: "power2.out",
            onUpdate: () => {
                camera.lookAt(0, 1.2, 0);
            }
        });
    } else if (mode === "follow" && ball) {
        // Camera moves slightly to side and tracks ball flight
        gsap.to(camera.position, {
            x: 18,
            y: 12,
            z: 10,
            duration: 1.5,
            ease: "power1.inOut",
            onUpdate: () => {
                camera.lookAt(ball.position);
            }
        });
    } else if (mode === "broadcast") {
        // Side TV broadcast angle
        gsap.to(camera.position, {
            x: -45,
            y: 22,
            z: 0,
            duration: 1.5,
            ease: "power1.inOut",
            onUpdate: () => {
                camera.lookAt(0, 0, 0);
            }
        });
    }
}

function createOutfield() {
    // Large circle for green field
    const fieldGeom = new THREE.CylinderGeometry(100, 100, 0.5, 64);
    const fieldMat = new THREE.MeshStandardMaterial({
        color: 0x14532d, // Deep grass green
        roughness: 0.9,
        metalness: 0.1
    });
    
    const outfield = new THREE.Mesh(fieldGeom, fieldMat);
    outfield.position.y = -0.25;
    outfield.receiveShadow = true;
    scene.add(outfield);
    
    // Draw lighter grass stripes for realism
    for (let i = -80; i <= 80; i += 10) {
        if (i === 0) continue;
        const stripeGeom = new THREE.BoxGeometry(200, 0.05, 5);
        const stripeMat = new THREE.MeshBasicMaterial({
            color: 0x166534,
            transparent: true,
            opacity: 0.15
        });
        const stripe = new THREE.Mesh(stripeGeom, stripeMat);
        stripe.position.set(0, 0.01, i);
        scene.add(stripe);
    }
    
    // Create Pitch: 4 units wide, 40 units long (Z=-20 to 20)
    const pitchGeom = new THREE.BoxGeometry(4.2, 0.04, 40);
    const pitchMat = new THREE.MeshStandardMaterial({
        color: 0xdfc49c, // dusty brown clay
        roughness: 0.95
    });
    pitch = new THREE.Mesh(pitchGeom, pitchMat);
    pitch.position.set(0, 0.01, 0);
    pitch.receiveShadow = true;
    scene.add(pitch);
    
    // Draw Crease Lines (white lines paint)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Bowling Crease (Z = -18) and Batting Crease (Z = 18)
    for (let zVal of [-18, 18]) {
        // Crease line across pitch
        const crGeom = new THREE.BoxGeometry(4.2, 0.01, 0.15);
        const crLine = new THREE.Mesh(crGeom, lineMat);
        crLine.position.set(0, 0.04, zVal);
        scene.add(crLine);
        
        // Pop crease line
        const popGeom = new THREE.BoxGeometry(0.1, 0.01, 2.5);
        const popL = new THREE.Mesh(popGeom, lineMat);
        popL.position.set(-2.0, 0.04, zVal - 1.25 * Math.sign(zVal));
        scene.add(popL);
        
        const popR = popL.clone();
        popR.position.x = 2.0;
        scene.add(popR);
    }
}

function createWickets() {
    // Batsman wickets are at Z=18, Bowler wickets are at Z=-18
    wicketsBatsman = new THREE.Group();
    wicketsBowler = new THREE.Group();
    
    const stumpMat = new THREE.MeshStandardMaterial({
        color: 0xeab308, // wood yellow
        roughness: 0.5,
        metalness: 0.1
    });
    
    // Create 3 Stumps
    const stumpGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
    
    for (let i = 0; i < 3; i++) {
        const xPos = -0.16 + i * 0.16;
        
        // Striker stumps
        const stumpB = new THREE.Mesh(stumpGeom, stumpMat);
        stumpB.position.set(xPos, 0.5, 0);
        stumpB.castShadow = true;
        stumpB.receiveShadow = true;
        stumpsBatsman.push(stumpB);
        wicketsBatsman.add(stumpB);
        
        // Bowler stumps
        const stumpBowl = new THREE.Mesh(stumpGeom, stumpMat);
        stumpBowl.position.set(xPos, 0.5, 0);
        stumpBowl.castShadow = true;
        wicketsBowler.add(stumpBowl);
    }
    
    // Create 2 Bails
    const bailGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6);
    
    const bailL = new THREE.Mesh(bailGeom, stumpMat);
    bailL.position.set(-0.09, 1.02, 0);
    bailL.rotation.z = Math.PI / 2;
    bailL.castShadow = true;
    bailsBatsman.push(bailL);
    wicketsBatsman.add(bailL);
    
    const bailR = bailL.clone();
    bailR.position.x = 0.09;
    bailsBatsman.push(bailR);
    wicketsBatsman.add(bailR);
    
    const bailBowlL = bailL.clone();
    wicketsBowler.add(bailBowlL);
    
    const bailBowlR = bailR.clone();
    wicketsBowler.add(bailBowlR);
    
    // Position Groups on Pitch
    wicketsBatsman.position.set(0, 0, 18.0);
    wicketsBowler.position.set(0, 0, -18.0);
    
    scene.add(wicketsBatsman);
    scene.add(wicketsBowler);
}

function resetWickets() {
    // Restore rotations/positions of batsman wickets
    stumpsBatsman.forEach((stump, idx) => {
        stump.rotation.set(0, 0, 0);
        stump.position.set(-0.16 + idx * 0.16, 0.5, 0);
    });
    
    bailsBatsman[0].position.set(-0.09, 1.02, 0);
    bailsBatsman[0].rotation.set(0, 0, Math.PI / 2);
    
    bailsBatsman[1].position.set(0.09, 1.02, 0);
    bailsBatsman[1].rotation.set(0, 0, Math.PI / 2);
}

function createBatsman() {
    batsman = new THREE.Group();
    
    // White pads legs
    const padMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const legGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.9, 12);
    
    const legL = new THREE.Mesh(legGeom, padMat);
    legL.position.set(-0.25, 0.45, 0);
    legL.castShadow = true;
    batsman.add(legL);
    
    const legR = legL.clone();
    legR.position.x = 0.25;
    batsman.add(legR);
    
    // Body Torso (blue/green jersey)
    const jerseyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 }); // Blue jersey
    const bodyGeom = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 12);
    const body = new THREE.Mesh(bodyGeom, jerseyMat);
    body.position.set(0, 1.3, 0);
    body.castShadow = true;
    batsman.add(body);
    
    // Head & Helmet
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const headGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0, 1.8, 0);
    batsman.add(head);
    
    // Helmet shell
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); // Dark blue
    const helmetGeom = new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const helmet = new THREE.Mesh(helmetGeom, helmetMat);
    helmet.position.set(0, 1.83, 0);
    helmet.rotation.x = -0.2;
    batsman.add(helmet);
    
    // Cricket Bat Group (Handles pivots cleanly)
    const batGroup = new THREE.Group();
    batGroup.name = "batGroup";
    
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb5a642, roughness: 0.6 }); // willow
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    // Blade
    const bladeGeom = new THREE.BoxGeometry(0.15, 0.85, 0.06);
    const blade = new THREE.Mesh(bladeGeom, woodMat);
    blade.position.y = -0.425; // center offset
    blade.castShadow = true;
    batGroup.add(blade);
    
    // Rubber Handle
    const handleGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8);
    const handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.y = 0.2;
    batGroup.add(handle);
    
    // Pivot placement (placed at batsmans hands)
    batGroup.position.set(-0.35, 1.25, 0.4);
    
    // Default Stance Rotation (swing idle)
    batInitialRotation.set(0.6, 0.4, -0.8);
    batGroup.rotation.copy(batInitialRotation);
    
    batsman.add(batGroup);
    
    // Batsman Stance Positioning
    resetBatsmanPosition();
    scene.add(batsman);
}

function resetBatsmanPosition() {
    batsman.position.set(0.4, 0, 17.5); // Guard position
    batsman.rotation.y = -Math.PI / 2.3; // Stand side-on
}

function createBowler() {
    bowler = new THREE.Group();
    
    // Clothes details
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.8 }); // Yellow or opponent kit
    const pantMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.8 });
    
    const legGeom = new THREE.CylinderGeometry(0.15, 0.13, 0.9, 8);
    const legL = new THREE.Mesh(legGeom, pantMat);
    legL.position.set(-0.2, 0.45, 0);
    bowler.add(legL);
    
    const legR = legL.clone();
    legR.position.x = 0.2;
    bowler.add(legR);
    
    const torsoGeom = new THREE.CylinderGeometry(0.28, 0.22, 0.8, 10);
    const torso = new THREE.Mesh(torsoGeom, shirtMat);
    torso.position.set(0, 1.3, 0);
    bowler.add(torso);
    
    const headGeom = new THREE.SphereGeometry(0.18, 12, 12);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8 });
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0, 1.85, 0);
    bowler.add(head);
    
    // Bowler starting position
    bowler.position.set(0, 0, -25);
    bowler.rotation.y = 0; // facing batsman
    
    scene.add(bowler);
}

function createFielders() {
    // 9 fielders capsules distributed in the field
    const positions = [
        { x: 35, z: -45 },  // Long-off
        { x: -35, z: -45 }, // Long-on
        { x: 50, z: -10 },  // Deep Cover
        { x: -50, z: -10 }, // Deep Mid-wicket
        { x: 60, z: 20 },   // Deep Point
        { x: -60, z: 20 },  // Deep Square Leg
        { x: 25, z: 45 },   // Third man
        { x: -25, z: 45 },  // Fine leg
        { x: 18, z: 12 }    // Slip / Gully
    ];
    
    const fielderGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
    const fielderMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.8 }); // Opponent blue pants
    
    positions.forEach((pos, idx) => {
        const fGroup = new THREE.Group();
        
        const fLegs = new THREE.Mesh(fielderGeom, fielderMat);
        fLegs.position.y = 0.9;
        fLegs.castShadow = true;
        fGroup.add(fLegs);
        
        // Caps / Helmets
        const capGeom = new THREE.SphereGeometry(0.32, 10, 10);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
        const cap = new THREE.Mesh(capGeom, capMat);
        cap.position.y = 1.8;
        fGroup.add(cap);
        
        fGroup.position.set(pos.x, 0, pos.z);
        fGroup.lookAt(0, 0, 18); // Face batsman
        
        scene.add(fGroup);
        fielders.push(fGroup);
    });
}

function createBall() {
    // Red/White leather cricket ball
    const ballGeom = new THREE.SphereGeometry(0.15, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, // White ball (ODI/T20 format)
        roughness: 0.4,
        metalness: 0.1
    });
    ball = new THREE.Mesh(ballGeom, ballMat);
    ball.castShadow = true;
    ball.position.set(0, 2.5, -18);
    scene.add(ball);
    
    // Landing circle indicator
    const indGeom = new THREE.RingGeometry(0.01, 0.6, 16);
    const indMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    landingSpotIndicator = new THREE.Mesh(indGeom, indMat);
    landingSpotIndicator.rotation.x = Math.PI / 2; // parallel to floor
    landingSpotIndicator.visible = false;
    scene.add(landingSpotIndicator);
}

function createStadiumStructure() {
    // Ring stands representing stadium seating
    const standGeom = new THREE.TorusGeometry(105, 12, 16, 48);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    stadium = new THREE.Mesh(standGeom, standMat);
    stadium.rotation.x = Math.PI / 2;
    stadium.position.y = 4.0;
    scene.add(stadium);
    
    // Floodlights - 4 tall pillars at diagonals
    const lightAngles = [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
    
    lightAngles.forEach((angle, idx) => {
        const pillarGroup = new THREE.Group();
        const dist = 110;
        const px = Math.sin(angle) * dist;
        const pz = Math.cos(angle) * dist;
        
        // Pillar Rod
        const rodGeom = new THREE.CylinderGeometry(0.8, 1.2, 40, 8);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0x4b5563 });
        const rod = new THREE.Mesh(rodGeom, rodMat);
        rod.position.y = 20;
        rod.castShadow = true;
        pillarGroup.add(rod);
        
        // Light panel top
        const boxGeom = new THREE.BoxGeometry(6, 4, 2);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.position.set(0, 40, 0);
        pillarGroup.add(box);
        
        // Glowing faces (mesh basic neon white)
        const glowGeom = new THREE.PlaneGeometry(5.6, 3.6);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.set(0, 40, 1.01);
        pillarGroup.add(glow);
        
        pillarGroup.position.set(px, 0, pz);
        pillarGroup.lookAt(0, 10, 0); // Point towards pitch center
        
        scene.add(pillarGroup);
        floodlights.push(pillarGroup);
    });
}

// --- PARTICLE EFFECTS SYSTEM ---
function triggerBounceDust(pos) {
    const particleCount = 8;
    const geom = new THREE.SphereGeometry(0.04, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xdfc49c, transparent: true, opacity: 0.8 }); // clay dust
    
    for (let i = 0; i < particleCount; i++) {
        const p = new THREE.Mesh(geom, mat.clone());
        p.position.copy(pos);
        
        // Velocity explosion
        p.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                0.5 + Math.random() * 1.5,
                (Math.random() - 0.5) * 1.5
            ),
            age: 0,
            life: 0.3 + Math.random() * 0.3
        };
        
        scene.add(p);
        particles.push(p);
    }
}

function triggerHitDust() {
    if (!ball) return;
    const particleCount = 12;
    const geom = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }); // glowing white
    
    for (let i = 0; i < particleCount; i++) {
        const p = new THREE.Mesh(geom, mat.clone());
        p.position.copy(ball.position);
        
        p.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6
            ),
            age: 0,
            life: 0.2 + Math.random() * 0.3
        };
        
        scene.add(p);
        particles.push(p);
    }
}

function triggerWinFireworks() {
    // Generate beautiful colored celebration sparks
    const colors = [0xff007f, 0x00f2fe, 0x39ff14, 0xffff00, 0xa855f7];
    const particleCount = 30;
    
    // Spawn at random location above pitch
    const center = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        15 + Math.random() * 10,
        (Math.random() - 0.5) * 30
    );
    
    const geom = new THREE.SphereGeometry(0.08, 6, 6);
    const col = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1.0 });
    
    for (let i = 0; i < particleCount; i++) {
        const p = new THREE.Mesh(geom, mat.clone());
        p.position.copy(center);
        
        const speed = 5 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        p.userData = {
            velocity: new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            ),
            age: 0,
            life: 0.8 + Math.random() * 0.8
        };
        
        scene.add(p);
        particles.push(p);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.addScaledVector(p.userData.velocity, dt);
        p.userData.velocity.y -= 3.0 * dt; // gravity deceleration
        p.userData.age += dt;
        
        // Fade out
        const ratio = 1 - (p.userData.age / p.userData.life);
        p.material.opacity = Math.max(0, ratio);
        
        if (p.userData.age >= p.userData.life) {
            scene.remove(p);
            p.material.dispose();
            p.geometry.dispose();
            particles.splice(i, 1);
        }
    }
}

// --- CORE RENDER LOOP ---
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    
    const timeNow = performance.now();
    const dt = Math.min((timeNow - lastTime) / 1000, 0.1); // clamp high spikes
    lastTime = timeNow;
    
    // 1. Controls Crease Movements (Arrow keys adjust batsman stance offset)
    if (gameState.phase === "bowling-delivery" && !gameState.isBallDead) {
        let moveSpeed = 4.0; // units per second
        if (keys.ArrowLeft || keys.KeyA) {
            batsman.position.x = Math.max(-1.4, batsman.position.x - moveSpeed * dt);
        }
        if (keys.ArrowRight || keys.KeyD) {
            batsman.position.x = Math.min(1.4, batsman.position.x + moveSpeed * dt);
        }
    }
    
    // 2. Physics & Fielders state
    updatePhysics(dt);
    
    // 3. Running between wickets state
    updateRunningState(dt);
    
    // 4. Update HUD and visual overlays
    drawRadar();
    
    // 5. Render Scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    const container = document.getElementById("game-container");
    if (!container || !renderer) return;
    
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
