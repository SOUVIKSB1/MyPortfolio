import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./StartAnimation.css";

const BOOT_MESSAGES = [
  { text: "INITIALIZING BOOT SEQUENCE...", type: "info", minProgress: 0 },
  { text: "LOADING WEB SYSTEM MODULES...", type: "info", minProgress: 10 },
  { text: "ESTABLISHING CORE DESIGN SYSTEM...", type: "success", minProgress: 22 },
  { text: "MOUNTING THREE.JS CONSTELLATION MESH...", type: "success", minProgress: 35 },
  { text: "CONNECTING GKE KUBERNETES NODES... SUCCESS", type: "success", minProgress: 48 },
  { text: "FUSING CLOUD-NATIVE STACK...", type: "info", minProgress: 60 },
  { text: "SYNCHRONIZING LIVE RECT METRICS...", type: "success", minProgress: 72 },
  { text: "INITIALIZING VERTEX AI OPTIMIZER...", type: "success", minProgress: 85 },
  { text: "COMPILING ASSETS & RENDER PATHS...", type: "info", minProgress: 92 },
  { text: "SYSTEM ACTIVE. DEPLOYING PORTFOLIO...", type: "success", minProgress: 98 },
];

const CODE_WORDS = [
  "docker build -t app .",
  "gcloud deploy --gke",
  "npm run build:prod",
  "kubectl get pods",
  "import React from 'react';",
  "const [loading, setLoading] = useState(true);",
  "def optimize_speech(audio):",
  "vertexai.init(project='sih25')",
  "class CloudInfrastructure:",
  "function useThreeConstellation()",
  "db.connect(MONGO_URI)",
  "sys.stdout.write('[OK] Connected')",
  "git commit -m 'Initial commit'",
  "terraform apply",
  "while (learning):",
  "printf('Success \\n');",
  "curl -X GET /api/v1/metrics",
  "constellation.physics.simulate()"
];

class Spark {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5 - 1.5; // slight upward velocity
    this.size = Math.random() * 2.2 + 0.8;
    this.color = color;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.025 + 0.012;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.03; // slight gravity
    this.alpha -= this.decay;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 5;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export default function StartAnimation({ onStartExit, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isFadingContent, setIsFadingContent] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const progressContainerRef = useRef(null);
  const terminalRef = useRef(null);
  const progressRef = useRef(0);

  // Sync callbacks to mutable refs to prevent resetting the progress timer loop on parent state updates
  const onStartExitRef = useRef(onStartExit);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onStartExitRef.current = onStartExit;
    onCompleteRef.current = onComplete;
  }, [onStartExit, onComplete]);

  // Sync state progress value to ref for the 60fps canvas loop
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Simulated progress loader - runs exactly once on mount
  useEffect(() => {
    let start = null;
    const duration = 2800; // 2.8 seconds loading

    const updateProgress = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progressValue = Math.min((elapsed / duration) * 100, 100);

      setProgress(progressValue);

      if (progressValue < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Step 1: Fade out content, logs, canvas (takes 450ms)
        const timer1 = setTimeout(() => {
          setIsFadingContent(true);
        }, 400);

        // Step 2: Fade out entire overlay screen and trigger main page reveal
        const timer2 = setTimeout(() => {
          setIsExiting(true);
          if (onStartExitRef.current) onStartExitRef.current();
        }, 850);

        // Step 3: Unmount loader after exit animation concludes
        const timer3 = setTimeout(() => {
          if (onCompleteRef.current) onCompleteRef.current();
        }, 2050); // 850ms + 1200ms transition time

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    };

    requestAnimationFrame(updateProgress);
  }, []);

  // Append logs based on progress
  useEffect(() => {
    const activeLogs = BOOT_MESSAGES.filter(
      (msg) => progress >= msg.minProgress
    );
    if (activeLogs.length !== logs.length) {
      setLogs(activeLogs);
    }
  }, [progress, logs.length]);

  // Scroll terminal logs to bottom locally (prevents page-level scroll shifting)
  useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }, [logs]);

  // Particle, matrix, and thunderstorm animation canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let sparks = [];
    const codeStreams = [];
    
    // Thunderstorm state
    let lightningFlash = 0;
    let lightningBolt = null;
    let boltDuration = 0;
    let boltColor = "#f97316";

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Increased coding lines by decreasing spacing to 110px
      const colCount = Math.max(8, Math.floor(canvas.width / 110));
      codeStreams.length = 0;
      for (let i = 0; i < colCount; i++) {
        codeStreams.push({
          x: i * 110 + Math.random() * 25,
          y: Math.random() * -canvas.height,
          speed: Math.random() * 1.0 + 0.4,
          words: Array.from({ length: 8 }, () => CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]),
          spacing: 24,
          type: Math.random() > 0.5 ? "orange" : "blue"
        });
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const loop = () => {
      // Clear canvas with trails for glows
      ctx.fillStyle = "rgba(3, 4, 7, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Denser Coding Streams
      ctx.font = "10px monospace";
      codeStreams.forEach((stream, idx) => {
        if (stream.type === "blue") {
          ctx.fillStyle = idx % 2 === 0 ? "rgba(14, 165, 233, 0.08)" : "rgba(2, 132, 199, 0.04)";
        } else {
          ctx.fillStyle = idx % 2 === 0 ? "rgba(249, 115, 22, 0.08)" : "rgba(124, 45, 18, 0.04)";
        }
        
        stream.words.forEach((word, wIdx) => {
          ctx.fillText(word, stream.x, stream.y - (wIdx * stream.spacing));
        });
        
        stream.y += stream.speed;
        if (stream.y - (stream.words.length * stream.spacing) > canvas.height) {
          stream.y = Math.random() * -100;
          stream.speed = Math.random() * 1.0 + 0.4;
          stream.words = Array.from({ length: 8 }, () => CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]);
        }
      });

      // 2. Thunderstorm Lightning Generator in "Small Chunks"
      if (Math.random() < 0.005 && lightningFlash === 0) {
        lightningFlash = Math.random() * 0.3 + 0.15; 
        boltDuration = Math.floor(Math.random() * 10) + 6; 
        boltColor = Math.random() > 0.5 ? "#f97316" : "#0ea5e9";
        
        // Build localized short lightning bolt segments
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * (canvas.height * 0.6);
        const endY = startY + Math.random() * 200 + 120;
        
        const segments = [];
        let curX = startX;
        let curY = startY;
        
        while (curY < endY && curY < canvas.height) {
          const nextY = curY + Math.random() * 35 + 15;
          const nextX = curX + (Math.random() - 0.5) * 35;
          segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
          curX = nextX;
          curY = nextY;
        }
        lightningBolt = segments;
      }

      // Draw lightning flash overlay
      if (lightningFlash > 0) {
        ctx.fillStyle = boltColor === "#f97316" 
          ? `rgba(249, 115, 22, ${lightningFlash * 0.12})`
          : `rgba(14, 165, 233, ${lightningFlash * 0.12})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        lightningFlash -= 0.015;
      }

      // Draw short localized lightning bolt path
      if (lightningBolt && boltDuration > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = boltColor;
        
        ctx.beginPath();
        lightningBolt.forEach((seg, i) => {
          if (i === 0) ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();

        // Draw smaller branching electric channels
        ctx.strokeStyle = boltColor === "#f97316" ? "rgba(249, 115, 22, 0.55)" : "rgba(14, 165, 233, 0.55)";
        ctx.lineWidth = 0.8;
        lightningBolt.forEach((seg, i) => {
          if (i % 2 === 0 && Math.random() > 0.5) {
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x1 + (Math.random() - 0.5) * 30, seg.y1 + Math.random() * 30);
            ctx.stroke();
          }
        });

        ctx.restore();
        boltDuration--;
        if (boltDuration === 0) lightningBolt = null;
      }

      // 3. Emit sparks from logo center
      const logo = logoRef.current;
      if (logo) {
        const rect = logo.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        if (Math.random() > 0.25) {
          const color = Math.random() > 0.5 ? "#f97316" : "#0ea5e9";
          sparks.push(new Spark(cx, cy, color));
        }
      }

      // 4. Emit sparks from progress bar loader tip
      const progressContainer = progressContainerRef.current;
      if (progressContainer) {
        const rect = progressContainer.getBoundingClientRect();
        const px = rect.left + (progressRef.current / 100) * rect.width;
        const py = rect.top + rect.height / 2;
        
        if (progressRef.current > 0 && progressRef.current < 100) {
          const color = Math.random() > 0.5 ? "#0ea5e9" : "#f97316";
          sparks.push(new Spark(px, py, color));
          if (Math.random() > 0.7) {
            sparks.push(new Spark(px, py, "#ffffff"));
          }
        }
      }

      // 5. Update and Draw Sparks
      sparks = sparks.filter((spark) => spark.alpha > 0);
      sparks.forEach((spark) => {
        spark.update();
        spark.draw(ctx);
      });

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className={`intro-loader-overlay ${isExiting ? "exit" : ""}`}>
      {/* Cyber Grid background */}
      <div className={`intro-grid ${isFadingContent ? "fade-out" : ""}`} />

      {/* Sparks & Matrix Rain Canvas */}
      <canvas ref={canvasRef} className={`intro-particle-canvas ${isFadingContent ? "fade-out" : ""}`} />
      
      {/* Ambient hacker glows */}
      <div className={`intro-glow intro-glow-orange ${isFadingContent ? "fade-out" : ""}`} />
      <div className={`intro-glow intro-glow-blue ${isFadingContent ? "fade-out" : ""}`} />
      <div className={`intro-glow intro-glow-center ${isFadingContent ? "fade-out" : ""}`} />

      {/* CRT Monitor lines */}
      <div className={`intro-scanlines ${isFadingContent ? "fade-out" : ""}`} />

      <div className={`intro-content ${isFadingContent ? "fade-out-content" : ""}`}>
        {/* Vector SVG Monogram: < S O U V I K ./ > */}
        <svg 
          ref={logoRef}
          viewBox="0 0 260 100" 
          className="intro-logo-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* < left bracket */}
          <motion.path
            d="M 30,35 L 10,50 L 30,65"
            fill="none"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="intro-logo-bracket"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* SOUVIK Text */}
          <motion.text
            x="48"
            y="59"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            fontFamily="'Consolas', 'Courier New', monospace"
            fontSize="26"
            fontWeight="bold"
            letterSpacing="5"
            className="intro-logo-text"
            initial={{ strokeDasharray: 200, strokeDashoffset: 200, fill: "rgba(255,255,255,0)" }}
            animate={{ 
              strokeDashoffset: 0, 
              fill: "rgba(255, 255, 255, 0.95)",
              textShadow: "0 0 10px rgba(249, 115, 22, 0.6)"
            }}
            transition={{ 
              stroke: { duration: 2, ease: "easeInOut" },
              fill: { delay: 1.8, duration: 0.8 },
            }}
          >
            SOUVIK
          </motion.text>

          {/* ./ Slash Dot */}
          <motion.path
            d="M 180,63 L 195,35"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="intro-logo-bracket"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
          />
          <motion.circle
            cx="205"
            cy="61"
            r="3"
            fill="#0ea5e9"
            className="intro-logo-dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.4 }}
          />

          {/* > right bracket */}
          <motion.path
            d="M 230,35 L 250,50 L 230,65"
            fill="none"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="intro-logo-bracket"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>

        {/* Console Simulated Terminal Logs */}
        <div ref={terminalRef} className="intro-terminal">
          {logs.map((log, index) => (
            <div className="terminal-line" key={index}>
              {log.type === "success" ? (
                <span className="terminal-success">[ OK ]</span>
              ) : (
                <span className="terminal-info">[ INF ]</span>
              )}
              <span className="terminal-text">{log.text}</span>
            </div>
          ))}
        </div>

        {/* Progress Fill Bar */}
        <div className="intro-progress-container">
          <div className="intro-progress-header">
            <span>Booting Portfolio Node</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="intro-progress-bar">
            <div 
              ref={progressContainerRef}
              className="intro-progress-fill" 
              style={{ width: `${progress}%` }}
            >
              {/* Plasma Spark pointer at the end of progress */}
              {progress > 0 && progress < 100 && (
                <div className="intro-progress-spark" />
              )}
            </div>
          </div>
        </div>

        <div className="intro-status-text">
          GKE CLUSTER STATUS: READY | REGION: ASIA-SOUTH1
        </div>
      </div>
    </div>
  );
}
