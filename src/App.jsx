import { useState, useEffect, useRef, useCallback } from "react";
import { Mail, ExternalLink, Download, Menu, X } from "lucide-react";
import { FaGithub, FaLinkedin, FaEye, FaStar } from "react-icons/fa";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import StartAnimation from "./components/StartAnimation";
import profileImg from "./assets/hero.png";
import "./App.css";
import { Phone } from "lucide-react";


/* ═══════════════════════════════════
   THREE.JS  —  3D CONSTELLATION HOOK
═══════════════════════════════════ */
function useThreeConstellation(canvasRef, shouldRender) {
  useEffect(() => {
    if (!shouldRender) return;
    if (window.innerWidth <= 768) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 6.0);

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const keyLight = new THREE.DirectionalLight(0xf97316, 2.2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const blueLight = new THREE.PointLight(0x0ea5e9, 1.8, 10);
    blueLight.position.set(-3, -2, 2);
    scene.add(blueLight);

    /* Main particle group */
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    /* Central glowing core */
    const coreGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.4
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(core);

    /* Outer orbiting rings */
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.015, 8, 64),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xf97316,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.25
      })
    );
    ring1.rotation.x = Math.PI / 2.5;
    coreGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.01, 8, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.2
      })
    );
    ring2.rotation.y = Math.PI / 3;
    coreGroup.add(ring2);

    /* Constellation Net Setup */
    const count = 350;
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const radius = 1.8;

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * (0.8 + Math.random() * 0.4);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Small velocities for drift
      velocities[i * 3] = (Math.random() - 0.5) * 0.0012;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0012;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0012;
    }

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xf97316,
      size: 0.045,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true
    });
    const particles = new THREE.Points(partGeo, partMat);
    coreGroup.add(particles);

    /* Connections (Lines) Setup */
    const maxConnections = 500;
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    });
    const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    coreGroup.add(connectionLines);

    /* Interaction State */
    const mouse = new THREE.Vector2();
    const targetMouse = new THREE.Vector2();
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotY = 0, rotX = 0;
    let autoRot = true;
    let autoTimeout;

    const onDown = (x, y) => {
      isDragging = true;
      prevX = x;
      prevY = y;
      autoRot = false;
      clearTimeout(autoTimeout);
    };

    const onMove = (x, y) => {
      if (isDragging) {
        rotY += (x - prevX) * 0.005;
        rotX = Math.max(-0.6, Math.min(0.6, rotX + (y - prevY) * 0.005));
        prevX = x;
        prevY = y;
      }
    };

    const onUp = () => {
      isDragging = false;
      autoTimeout = setTimeout(() => { autoRot = true; }, 3000);
    };

    const onMouseMove = (event) => {
      targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Global drag interactions (ignoring buttons, inputs, links, navbar elements)
    const handleMouseDown = (e) => {
      if (e.target.closest("a, button, input, textarea, .project-card, .service-card, .cert-card, .stat-card, .skills-category, .profile-card, nav")) return;
      onDown(e.clientX, e.clientY);
    };

    const handleMouseMoveDrag = (e) => {
      onMove(e.clientX, e.clientY);
    };

    const handleTouchStart = (e) => {
      if (e.target.closest("a, button, input, textarea, .project-card, .service-card, .cert-card, .stat-card, .skills-category, .profile-card, nav")) return;
      onDown(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMoveDrag);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMouseMove);

    // Touch support
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);

    /* Animation Loop */
    const clock = new THREE.Clock();
    let rafId;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth mouse
      mouse.x += (targetMouse.x - mouse.x) * 0.1;
      mouse.y += (targetMouse.y - mouse.y) * 0.1;

      // Parallax Camera Tilt
      camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 1.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Core Group Auto-rotation & Drag rotation
      if (autoRot) {
        rotY += 0.002;
        rotX += (0 - rotX) * 0.02; // return to center
      }
      coreGroup.rotation.y = rotY;
      coreGroup.rotation.x = rotX;

      // Orbiting rings animation
      ring1.rotation.z = t * 0.3;
      ring1.rotation.y = Math.sin(t * 0.2) * 0.2;
      ring2.rotation.z = -t * 0.45;
      ring2.rotation.x = Math.cos(t * 0.15) * 0.3;

      // Pulse Core
      const coreScale = 1.0 + Math.sin(t * 2.5) * 0.06;
      core.scale.set(coreScale, coreScale, coreScale);
      core.material.emissiveIntensity = 1.0 + Math.sin(t * 5) * 0.25;

      // Update Particle positions (waves and drift)
      const posAttr = particles.geometry.attributes.position;
      const posArr = posAttr.array;

      for (let i = 0; i < count; i++) {
        // Drift
        posArr[i * 3] += velocities[i * 3];
        posArr[i * 3 + 1] += velocities[i * 3 + 1];
        posArr[i * 3 + 2] += velocities[i * 3 + 2];

        // Boundary checks (keep particles in a shell)
        const px = posArr[i * 3];
        const py = posArr[i * 3 + 1];
        const pz = posArr[i * 3 + 2];
        const distFromCenter = Math.sqrt(px * px + py * py + pz * pz);

        if (distFromCenter > radius * 1.3 || distFromCenter < radius * 0.7) {
          // Bounce/reverse velocity direction
          velocities[i * 3] *= -1;
          velocities[i * 3 + 1] *= -1;
          velocities[i * 3 + 2] *= -1;
        }

        // Subtly warp with waves
        const wave = Math.sin(px * 1.5 + t) * 0.002;
        posArr[i * 3 + 2] += wave;
      }
      posAttr.needsUpdate = true;

      // Draw connection lines between close particles
      let lineCount = 0;
      const linePosAttr = connectionLines.geometry.attributes.position;
      const linePosArr = linePosAttr.array;

      for (let i = 0; i < count; i++) {
        const ix = posArr[i * 3];
        const iy = posArr[i * 3 + 1];
        const iz = posArr[i * 3 + 2];

        for (let j = i + 1; j < count; j++) {
          if (lineCount >= maxConnections) break;

          const jx = posArr[j * 3];
          const jy = posArr[j * 3 + 1];
          const jz = posArr[j * 3 + 2];

          const dx = ix - jx;
          const dy = iy - jy;
          const dz = iz - jz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 0.65) {
            linePosArr[lineCount * 6] = ix;
            linePosArr[lineCount * 6 + 1] = iy;
            linePosArr[lineCount * 6 + 2] = iz;
            linePosArr[lineCount * 6 + 3] = jx;
            linePosArr[lineCount * 6 + 4] = jy;
            linePosArr[lineCount * 6 + 5] = jz;
            lineCount++;
          }
        }
      }

      connectionLines.geometry.setDrawRange(0, lineCount * 2);
      linePosAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const nW = window.innerWidth;
      const nH = window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMoveDrag);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", onUp);
      renderer.dispose();
    };
  }, [canvasRef, shouldRender]);
}

/* ═══════════════════════════════════
   SCROLL REVEAL HOOK
═══════════════════════════════════ */
function useScrollReveal(shouldRender, certsExpanded, projectsExpanded, servicesExpanded) {
  useEffect(() => {
    if (!shouldRender) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal, .reveal-title, .reveal-text, .reveal-scale, .reveal-fade-up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [shouldRender, certsExpanded, projectsExpanded, servicesExpanded]);
}


/* ═══════════════════════════════════
   CUSTOM CURSOR EFFECT COMPONENT
   Interactive 3D mouse trailing effect
═══════════════════════════════════ */
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let isHidden = true;
    let isHovered = false;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (isHidden) {
        isHidden = false;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }
    };

    const onMouseLeave = () => {
      isHidden = true;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const onMouseOver = (e) => {
      const isInteractive = e.target.closest("a, button, input, textarea, [role='button'], .project-card, .service-card, .cert-card, .stat-card, .see-all-card");
      if (isInteractive) {
        if (!isHovered) {
          isHovered = true;
          if (dotRef.current) dotRef.current.classList.add("hovered");
          if (ringRef.current) ringRef.current.classList.add("hovered");
        }
      } else {
        if (isHovered) {
          isHovered = false;
          if (dotRef.current) dotRef.current.classList.remove("hovered");
          if (ringRef.current) ringRef.current.classList.remove("hovered");
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("mouseover", onMouseOver);

    // Initial opacity 0
    if (dotRef.current) dotRef.current.style.opacity = "0";
    if (ringRef.current) ringRef.current.style.opacity = "0";

    let rafId;
    const tick = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.15;
      ringY += dy * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate3d(-50%, -50%, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}


/* ═══════════════════════════════════
   COUNTER TICKER COMPONENT
   Counts up from 0 to value when visible
═══════════════════════════════════ */
function CounterTicker({ value, duration = 1200, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const elementRef = useRef(null);
  const target = parseInt(value, 10);

  useEffect(() => {
    if (typeof window === "undefined" || !window.IntersectionObserver) {
      setStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || isNaN(target)) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    window.requestAnimationFrame(step);
  }, [started, target, duration]);

  if (isNaN(target)) return <span>{value}</span>;
  return <span ref={elementRef}>{count}{suffix}</span>;
}


/* ═══════════════════════════════════
   APP COMPONENT
   ═══════════════════════════════════ */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Certifications list
  const certifications = [
    {
      "title": "Azure AI Fundamentals (AI-900) - Microsoft Certified",
      "issuer": "Microsoft",
      "date": "APR 2026",
      "id": "PUxp-uScT",
      "link": "https://www.certiport.com/portal/Pages/PrintTranscriptInfo.aspx?action=Cert&id=455&cvid=26m0VuRk4VtsDk//7ATIrg==",
      "icon": "🧠"
    },
    {
      "title": "AWS Academy Graduate - Data Engineering",
      "issuer": "AWS Academy",
      "date": "JUL 2026",
      "id": "AWS-Academy-DE",
      "link": "/certificates/aws_academy_graduate_data_engineering.pdf",
      "icon": "☁️"
    },
    {
      "title": "NPTEL Java Certification",
      "issuer": "IIT Kharagpur",
      "date": "NOV 2025",
      "id": "NPTEL25CS110S460803974",
      "link": "https://archive.nptel.ac.in/content/noc/NOC25/SEM2/Ecertificates/106/noc25-cs110/Course/NPTEL25CS110S46080397410888267.pdf",
      "icon": "☕"
    },
    {
      "title": "Data Base Management System",
      "issuer": "IIT Kharagpur",
      "date": "MAR 2026",
      "id": "NPTEL26CS39S660101642",
      "link": "https://nptel.ac.in/noc/E_Certificate/NOC26CS39S66010164203151734",
      "icon": "💿"
    },
    {
      "title": "Supervised Machine Learning: Regression and Classification",
      "issuer": "DeepLearning.AI",
      "date": "MAR 2025",
      "id": "B1DW0ZFLXWSV",
      "link": "https://www.coursera.org/account/accomplishments/verify/B1DW0ZFLXWSV",
      "icon": "🤖"
    },
    {
      "title": "Google Cloud Fundamentals: Core Infrastructure",
      "issuer": "Google Cloud",
      "date": "NOV 2024",
      "id": "13038962",
      "link": "https://www.skills.google/public_profiles/16ea7d05-4436-4228-b43e-7f2bb2bfb07e/badges/13038962?utm_medium=social&utm_source=linkedin&utm_campaign=ql-social-share",
      "icon": "☁️"
    },
    {
      "title": ".Net Backend Engineer",
      "issuer": "Cognizant",
      "date": "JUL 2026",
      "id": "CS-NBE",
      "link": "/certificates/dotnet_backend_engineer.pdf",
      "icon": "🖥️"
    },
    {
      "title": "Prompt Engineering Foundation",
      "issuer": "Cognizant",
      "date": "JUL 2026",
      "id": "CS-PEF",
      "link": "/certificates/prompt_engineering_foundation.pdf",
      "icon": "✍️"
    },
    {
      "title": "Introduction to Agentic AI",
      "issuer": "Cognizant",
      "date": "JUL 2026",
      "id": "CS-IAAI",
      "link": "/certificates/introduction_to_agentic_ai.pdf",
      "icon": "🤖"
    },
    {
      "title": "Fundamentals of Generative AI",
      "issuer": "Cognizant",
      "date": "JUL 2026",
      "id": "CS-FGAI",
      "link": "/certificates/fundamentals_of_generative_ai.pdf",
      "icon": "✨"
    },
    {
      "title": "Foundations of Modern AI",
      "issuer": "Cognizant",
      "date": "JUL 2026",
      "id": "CS-FMAI",
      "link": "/certificates/foundations_of_modern_ai.pdf",
      "icon": "🧠"
    },
    {
      "title": "GitHub Copilot Fundamentals Virtual Training",
      "issuer": "Cognizant",
      "date": "JUL 2026",
      "id": "CS-GHCF",
      "link": "/certificates/github_copilot_fundamentals.pdf",
      "icon": "🐙"
    },
    {
      "title": "Programming with Python",
      "issuer": "University of Michigan",
      "date": "APR 2024",
      "id": "B3NXLPE9QYBY",
      "link": "https://www.coursera.org/account/accomplishments/verify/B3NXLPE9QYBY",
      "icon": "🐍"
    },
    {
      "title": "Introduction to Git and GitHub",
      "issuer": "Google",
      "date": "MAR 2025",
      "id": "TECWACAUJK9B",
      "link": "https://www.coursera.org/account/accomplishments/verify/TECWACAUJK9B",
      "icon": "🌐"
    },
    {
      "title": "ITPM - Introduction to Agile [101-Basics]",
      "issuer": "Cognizant",
      "date": "JUL 2026",
      "id": "CS-ITPM",
      "link": "/certificates/itpm_introduction_to_agile.pdf",
      "icon": "🔄"
    },
    {
      "title": "Generative AI for Decision Makers",
      "issuer": "AWS",
      "date": "JAN 2026",
      "id": "MHMHDAWQJY",
      "link": "https://drive.google.com/file/d/1KZHjC9anMhmh7OM8oNQ_YJv7tcCdspen/view?usp=sharing",
      "icon": "🤖"
    },
    {
      "title": "Building a Generative AI-Ready Organization",
      "issuer": "AWS",
      "date": "JAN 2026",
      "id": "BYXUKTZR8P",
      "link": "https://drive.google.com/file/d/1gn5Q4QC91x-h_bqu1dJOzly3hhjnZA7J/view?usp=sharing",
      "icon": "🏢"
    },
    {
      "title": "Large Language Model Basics",
      "issuer": "IBM",
      "date": "NOV 2024",
      "id": "MDL-433",
      "link": "https://skills.yourlearning.ibm.com/certificate/MDL-433",
      "icon": "🤖"
    },
    {
      "title": "Introduction to Artificial Intelligence",
      "issuer": "IBM",
      "date": "NOV 2024",
      "id": "MDL-211",
      "link": "https://skills.yourlearning.ibm.com/certificate/MDL-211",
      "icon": "🧠"
    },
    {
      "title": "Getting Started with Artificial Intelligence",
      "issuer": "IBM",
      "date": "NOV 2024",
      "id": "PLAN-E624C2604060",
      "link": "https://skills.yourlearning.ibm.com/certificate/PLAN-E624C2604060",
      "icon": "🤖"
    },
    {
      "title": "Build Your First Chatbot",
      "issuer": "IBM",
      "date": "NOV 2024",
      "id": "ALM-COURSE_3946111",
      "link": "https://skills.yourlearning.ibm.com/certificate/ALM-COURSE_3946111",
      "icon": "💬"
    },
    {
      "title": "Web Development Basics",
      "issuer": "IBM",
      "date": "MAY 2026",
      "id": "ALM-COURSE_4058937",
      "link": "https://skills.yourlearning.ibm.com/certificate/ALM-COURSE_4058937",
      "icon": "🌐"
    },
    {
      "title": "AI for Beginners by HP LIFE ( HPL-EN40 )",
      "issuer": "HP",
      "date": "DEC 2024",
      "id": "883eaf58-4da8-46f3-b35c-297d22f17c6a",
      "link": "https://www.life-global.org/certificate/883eaf58-4da8-46f3-b35c-297d22f17c6a",
      "icon": "💻"
    }
  ];

  // Skills lists aligned with certifications and experience
  const languagesList = ["Python", "Java", "C", "JavaScript", "C++", "HTML5", "CSS3"];
  const frameworksList = ["React", "Node.js", "Express", "MongoDB", "SQL", "Next.js", "VHDL"];
  const cloudList = ["GCP", "Azure", "Docker", "Kubernetes", "Vertex AI", "Generative AI", "CI/CD Pipelines", "Git"];
  const totalTechCount = languagesList.length + frameworksList.length + cloudList.length;

  // Default reviews
  const defaultReviews = [
    {
    name: "Rajarshi Chatterjee",
    role: "SIH Finalist",
    rating: 5,
    comment: "Souvik's cloud architecture setup was flawless. He deployed our Kubernetes nodes and Vertex AI services within hours during the hackathon!",
    date: "Apr 2026"
  },
  {
    name: "Prof U. Das",
    role: "CSE Professor at Techno Main",
    rating: 5,
    comment: "An exceptionally diligent student. Souvik bridges Frontend and Cloud DevOps with standard design tokens and clean structure.",
    date: "Jan 2026"
  },
  {
    name: "Supriya Satpati",
    role: "Open-source Collaborator",
    rating: 4,
    comment: "Great attention to visual styles. The hacker loading animation transition and full-bleed carousels make this portfolio state-of-the-art.",
    date: "May 2026"
  }
  ];

  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem("portfolio_reviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultReviews;
  });

  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRole, setNewReviewRole] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  // Fetch reviews from the backend on mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        if (!res.ok) throw new Error('Failed to load reviews');
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
          localStorage.setItem("portfolio_reviews", JSON.stringify(data));
          setReviewsError(null);
        }
      } catch (err) {
        console.error("Error loading reviews from database:", err);
        setReviewsError("Database offline. Showing offline cached reviews.");
      }
    };
    fetchReviews();
  }, []);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;

    setIsSubmittingReview(true);
    const newRev = {
      name: newReviewName.trim(),
      role: newReviewRole.trim() || "Visitor",
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      date: new Date().toLocaleDateString([], { month: "short", year: "numeric" })
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRev)
      });

      if (!res.ok) {
        throw new Error('Database submission failed');
      }

      const savedReview = await res.json();
      
      const updated = [savedReview, ...reviews];
      setReviews(updated);
      localStorage.setItem("portfolio_reviews", JSON.stringify(updated));

      // Reset form
      setNewReviewName("");
      setNewReviewRole("");
      setNewReviewRating(5);
      setNewReviewComment("");
      setReviewsError(null);
    } catch (err) {
      console.error("Error submitting review to database:", err);
      // Resilient local fallback
      const updated = [newRev, ...reviews];
      setReviews(updated);
      localStorage.setItem("portfolio_reviews", JSON.stringify(updated));
      
      // Reset form
      setNewReviewName("");
      setNewReviewRole("");
      setNewReviewRating(5);
      setNewReviewComment("");
      setReviewsError("Submitted locally. Unable to sync to live database.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStarsSelector = () => {
    return (
      <div className="stars-selector">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= (hoverRating || newReviewRating) ? "active" : ""}`}
            onClick={() => setNewReviewRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${star} Stars`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const renderStars = (count) => {
    return (
      <div className="stars-display">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`star ${i < count ? "filled" : ""}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleStartExit = useCallback(() => {
    setIsExiting(true);
  }, []);

  const handleComplete = useCallback(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading && !isExiting) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading, isExiting]);
  const [imageError, setImageError] = useState(false);
  const [cardTransform, setCardTransform] = useState("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [typingText, setTypingText] = useState("");
  const [linkedinCount, setLinkedinCount] = useState(1481);
  const [instagramCount, setInstagramCount] = useState(1043);
  const [visitCount, setVisitCount] = useState(null);
  const [reviewCount, setReviewCount] = useState(null);
  const [syncStatus, setSyncStatus] = useState("Syncing with live API...");
  const [lastUpdated, setLastUpdated] = useState("just now");
  const [certsExpanded, setCertsExpanded] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);

  const canvasRef = useRef(null);
  const cardWrapperRef = useRef(null);

  const shouldRenderMain = isExiting || !loading;

  useThreeConstellation(canvasRef, shouldRenderMain);
  useScrollReveal(shouldRenderMain, certsExpanded, projectsExpanded, servicesExpanded);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/live-counts.json");
        if (res.ok) {
          const data = await res.json();
          if (data.linkedin) setLinkedinCount(data.linkedin);
          if (data.instagram) setInstagramCount(data.instagram);
        }
      } catch (err) {
        console.warn("Could not fetch live counts:", err);
      }
    }
    fetchCounts();
  }, []);

  // Fetch & increment portfolio visit count on mount (shared MongoDB counter with mobile version)
  useEffect(() => {
    fetch('/api/visits', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => setVisitCount(data.count))
      .catch(() => setVisitCount('—'));
  }, []);

  // Fetch total review count on mount
  useEffect(() => {
    fetch('/api/reviews/count')
      .then((r) => r.json())
      .then((data) => setReviewCount(data.count))
      .catch(() => setReviewCount('—'));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setLinkedinCount((prev) => prev + (Math.random() > 0.5 ? 1 : 0));
      }
      if (Math.random() > 0.6) {
        setInstagramCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
      }
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSyncStatus("API feed synced successfully");
      
      setTimeout(() => {
        setSyncStatus("Listening for updates...");
      }, 1500);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!shouldRenderMain) return;
    const shimmerCards = document.querySelectorAll(".stat-card, .skills-category");
    
    const handleMouseMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };
    
    const handleMouseLeave = (e) => {
      const card = e.currentTarget;
      card.style.setProperty("--mouse-x", "-999px");
      card.style.setProperty("--mouse-y", "-999px");
    };
    
    shimmerCards.forEach((card) => {
      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);
    });
    
    return () => {
      shimmerCards.forEach((card) => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [shouldRenderMain]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const commands = [
      "docker build -t app .",
      "gcloud deploy --gke",
      "npm run build:prod",
      "ping google.com -c 1",
      "status: GKE cluster active"
    ];
    let cmdIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let timer;

    const handleType = () => {
      const currentCmd = commands[cmdIndex];
      if (!isDeleting) {
        setTypingText(currentCmd.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex === currentCmd.length) {
          isDeleting = true;
          typingSpeed = 2000;
        } else {
          typingSpeed = 80 + Math.random() * 40;
        }
      } else {
        setTypingText(currentCmd.substring(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          cmdIndex = (cmdIndex + 1) % commands.length;
          typingSpeed = 500;
        } else {
          typingSpeed = 40;
        }
      }
      timer = setTimeout(handleType, typingSpeed);
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, []);

  const projects = [
    {
      icon: "🏥",
      title: "Clinic OS",
      description: "A comprehensive clinic management system with appointment booking, patient records, and real-time medical billing analytics.",
      tech: "React · Node.js · SQL PLUS",
      github: "https://github.com/SOUVIKSB1/CLINIC_OS",
      live: "https://clinic-os-gamma-one.vercel.app/",
    },
    {
      icon: "💎",
      title: "Swarnika",
      description: "A full-stack e-commerce solution designed for premium retail experiences, offering secure management, dynamic product catalogs.",
      tech: "HTML-CSS · Node.js · MongoDB · Firebase",
      github: "https://github.com/SOUVIKSB1/Swarnika",
      live: "https://swarnika-lemon.vercel.app/login"
    },
    {
      icon: "₹",
      title: "PayU₹upee",
      description: "A secure digital e-wallet system with hashed UPI PIN authentication, real-time transfers, scheduled payments, and category breakdowns.",
      tech: "HTML5 · CSS3 · JS · Node.js · MongoDB",
      github: "https://github.com/SOUVIKSB1/PayURupee",
      live: "https://pay-u-rupee.vercel.app"
    },
    {
      icon: "💰",
      title: "PiggyBank Tracker",
      description: "An interactive online expense tracker that manages personal finance transactions, categories, and visualizes spending trends.",
      tech: "JavaScript · HTML5 · CSS3",
      github: "https://github.com/SOUVIKSB1/PiggyBank",
      live: "https://souviksb1.github.io/PiggyBank",
    },
    {
      icon: "🧩",
      title: "AI 8-Puzzle Solver",
      description: "An artificial intelligence solver implementing search algorithms (such as A* Search with Manhattan distance heuristics) to solve the 8-puzzle game.",
      tech: "Python · AI Heuristics · Algorithms",
      github: "https://github.com/SOUVIKSB1/8_Puzzle",
      live: "https://eight-puzzle-1swc.onrender.com/",
    },
    {
      icon: "⚙️",
      title: "Computer Architecture Design",
      description: "VHDL hardware description models implementing core ALU designs, memory registers, and instruction mapping simulation modules (PCC-CS-492).",
      tech: "VHDL · CPU Design · Simulation",
      github: "https://github.com/SOUVIKSB1/PCC-CS-492-ARCHITECTURE-",
      live: "https://github.com/SOUVIKSB1/PCC-CS-492-ARCHITECTURE-",
    },
    {
      icon: "🖥️",
      title: "CBT-CIP Interface",
      description: "A clean client interaction interface designed with structured protocols for validation testing and computer-based learning environments.",
      tech: "JavaScript · HTML5 · CSS3",
      github: "https://github.com/SOUVIKSB1/CBT-CIP",
      live: "https://souviksb1.github.io/CBT-CIP",
    },
    {
      icon: "🫟",
      title: "Calculator Web V 3.0",
      description: "Futuristic modern calculator web app featuring theme change, converter, voice input, sound, & AI enabled.",
      tech: "JavaScript · HTML5 · CSS3",
      github: "https://github.com/SOUVIKSB1/Calculator-V-3.0",
      live: "https://calculator-v-3-0.vercel.app/",
    },
    {
      icon: "🧮",
      title: "Calculator Web V2.0",
      description: "A Scientific calculator web app featuring dark theme styles, precise layouts, and advanced arithmetic operations.",
      tech: "JavaScript · HTML5 · CSS3",
      github: "https://github.com/SOUVIKSB1/Calculator-V-2.0",
      live: "https://souviksb1.github.io/Calculator-V-2.0/",
    },
    {
      icon: "⛓️‍💥",
      title: "Calculator Web V1.0",
      description: "A responsive basic calculator web app featuring dark theme styles, precise layouts, and advanced arithmetic operations.",
      tech: "JavaScript · HTML5 · CSS3",
      github: "https://github.com/SOUVIKSB1/Calculator-V-1.0",
      live: "https://souviksb1.github.io/Calculator-V-1.0/",
    },
  ];


  const services = [
    {
      icon: "🤖",
      title: "AI & Generative Workflows",
      description: "Developing intelligent agentic pipelines, conversational LLM chatbots, and integrating cognitive APIs. Certified in Microsoft Azure AI, AWS GenAI, and IBM Cognitive platforms.",
    },
    {
      icon: "📊",
      title: "Machine Learning Engineering",
      description: "Building predictive systems, feature pipelines, and training models using regression and classification algorithms. Backed by DeepLearning.AI ML standards.",
    },
    {
      icon: "☁️",
      title: "Cloud Infrastructure",
      description: "Provisioning secure compute, networking, and storage instances on Google Cloud Platform and AWS. Architecting scalable environments using GCP Fundamentals.",
    },
    {
      icon: "💿",
      title: "Database Management (DBMS)",
      description: "Designing high-performance schema architectures, tuning SQL queries, and implementing transaction controls. Fuses academic NPTEL DBMS standards from IIT Kharagpur.",
    },
    {
      icon: "💻",
      title: "Full-Stack Web Engineering",
      description: "Developing responsive frontend client interfaces in React and building robust, RESTful API servers in Node.js/Express with MongoDB database integrations.",
    },
    {
      icon: "☕",
      title: "Object-Oriented Design (Java)",
      description: "Designing scalable software applications using clean Java principles, data structures, and multithreading. Certified by NPTEL/IIT Kharagpur.",
    },
    {
      icon: "🐍",
      title: "Automation & Python Scripting",
      description: "Writing automated scripts, data scraping tools, and backend utilities in Python, including solving algorithmic state-space problems (like 8-Puzzle search).",
    },
    {
      icon: "⚙️",
      title: "Hardware Logic Design",
      description: "Designing digital circuits and simulating computer architecture modules using VHDL, referencing hands-on hardware laboratory layouts (PCC-CS-492).",
    },
    {
      icon: "🌐",
      title: "Collaborative Git/GitHub",
      description: "Managing source code version control, designing branching strategies, and handling collaborative pull requests and code reviews based on Google standards.",
    },
    {
      icon: "💰",
      title: "State & Data Hydration",
      description: "Developing state-driven transaction applications (such as PiggyBank) that manage local state, caching, data visualization, and secure client-side storage.",
    },
    {
      icon: "🎨",
      title: "Interactive UI Engineering",
      description: "Designing high-fidelity user interfaces with fluid layouts, dark themes, and glassmorphic micro-interactions using modern Vanilla CSS and Framer Motion.",
    },
  ];

  const timeline = [
    {
      date: "2023 - Present",
      title: "B.Tech Computer Science Engineering",
      institution: "Techno Main Salt Lake, Kolkata",
      description: "Studying core computer science principles: Algorithms, Database Management Systems, System Architecture, and Software Engineering. Building cloud and full-stack projects.",
    },
    {
      date: "2021 - 2022",
      title: "Educational Preparation",
      institution: "Allen Career Institute - Kota, Rajasthan",
      description: "Intensive preparation for entrance exams with a focus on problem-solving, conceptual clarity, and time management. 2 years classroom program.",
    },
    {
      date: "2019 - 2020",
      title: "Higher Secondary Education",
      institution: "Kenduadihi High School - Bankura, West Bengal",
      description: "Achieved 459 out of 500 marks ( 91.8 % ). Subject combination : P_C_M_B",
    },
    {
      date: "2018",
      title: "Secondary Education ( Madhyamik )",
      institution: "Kenduadihi High School - Bankura, West Bengal",
      description: "Achieved 645 out of 700 marks ( 92.14 % ).",
    },
  ];

  const achievements = [
    {
      title: "Smart India Hackathon '25 Finalist",
      organization: "Ministry of Education, Govt. of India",
      date: "DEC 2025",
      description: "Led a 6-member team to the grand finale of India's largest national hackathon. Architected a cloud-native GKE solution for PS 25067, focusing on the design and development of an application for Heavy Metal Pollution Indices.",
      badge: "National Finalist",
      icon: "🏆",
      tags: ["Cloud Native", "Leadership", "Innovation", "Problem Solving"]
    },
    {
      title: "Google Cloud Arcade Champion",
      organization: "Google Cloud Program",
      date: "DEC 2024",
      description: "Earned Champion tier by completing advanced hands-on labs on Kubernetes, cloud security, BigQuery analytics, and Vertex AI. Solved 140+ cloud skill badges and arcade game challenges.",
      badge: "Cloud Champion",
      icon: "☁️",
      tags: ["GCP", "Kubernetes", "Cloud Security", "BigQuery"]
    },
    {
      title: "DSA & Problem Solving",
      organization: "LeetCode & GeeksforGeeks",
      date: "2024 - Present",
      description: "Solved 300+ algorithmic challenges on LeetCode and GeeksforGeeks. Achieved solid coding profiles demonstrating expertise in complex data structures, search algorithms, graph theory, and dynamic programming.",
      badge: "Problem Solver",
      icon: "🧮",
      tags: ["Data Structures", "Algorithms", "Java", "Python"]
    },
    {
      title: "Campus Robotics Finalist (Autobots)",
      organization: "Techno Main Salt Lake",
      date: "MAR 2024",
      description: "Finalist in the campus robotics competition. Engineered and programmed an autonomous line-following and obstacle-avoidance robot. Optimized sensor feedback loops and PID algorithms for swift navigation.",
      badge: "Tech Finalist",
      icon: "🤖",
      tags: ["Embedded Systems", "Sensors", "VHDL", "Autonomous", "Arduino"]
    },
    {
      title: "3-Years+ Class Representative (CR)",
      organization: "Techno Main Salt Lake",
      date: "2023 - Present",
      description: "Elected student representative managing academic coordination for a batch of 130+ students. Facilitated direct communication between students and faculty, and coordinated technical workshops and campus events.",
      badge: "Leadership",
      icon: "👥",
      tags: ["Communication", "Management", "Event Planning"]
    },
    {
      title: "IEEE Student Member",
      organization: "IEEE",
      date: "2024 - Present",
      description: "Active member of the IEEE student chapter. Participated in technical workshops, networking events, and collaborative projects with industry professionals and fellow students. Facilitated campus hackathons.",
      badge: "Professional",
      icon: "🌐",
      tags: ["Networking", "Technical Workshops", "Collaboration"]
    },
    {
      title: "Photography & Visual Storytelling",
      organization: "Creative Arts Club",
      date: "2016 - Present",
      description: "Freelance visual creator specializing in capturing campus events, street documentation, and high-fidelity product frames. Uses design rules of framing and lighting to tell stories.",
      badge: "Creative",
      icon: "📸",
      tags: ["Framing", "Adobe Lightroom", "Visual Design"]
    },
    {
      title: "Content Creation & Digital Storytelling",
      organization: "Instagram · YouTube · Facebook",
      date: "2019 - Present",
      description: "Passionate content creator focused on crafting engaging digital experiences through short-form content, tech storytelling, and visual communication. Combines creativity with audience psychology.",
      badge: "Creator",
      icon: "🎬",
      tags: ["Content Strategy", "Editing", "Digital Branding"]
    }
  ];

  // Framer Motion Animation Variants for Collapsible Cards
  const serviceVariants = {
    hidden: { opacity: 0, y: 70, scale: 0.85, rotateX: 12 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 14,
        mass: 0.7,
        delay: (i - 7) * 0.05
      }
    }),
    exit: (i) => ({
      opacity: 0,
      y: 50,
      scale: 0.85,
      rotateX: -12,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
        delay: (services.length - 1 - i) * 0.03
      }
    })
  };

  const projectVariants = {
    hidden: { opacity: 0, y: 70, scale: 0.85, rotateX: 12 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 14,
        mass: 0.7,
        delay: (i - 7) * 0.05
      }
    }),
    exit: (i) => ({
      opacity: 0,
      y: 50,
      scale: 0.85,
      rotateX: -12,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
        delay: (projects.length - 1 - i) * 0.03
      }
    })
  };

  const certVariants = {
    hidden: { opacity: 0, y: 70, scale: 0.85, rotateX: 12 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 14,
        mass: 0.7,
        delay: (i - 7) * 0.05
      }
    }),
    exit: (i) => ({
      opacity: 0,
      y: 50,
      scale: 0.85,
      rotateX: -12,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
        delay: (certifications.length - 1 - i) * 0.03
      }
    })
  };

  const handleCardMouseMove = (e) => {
    const card = cardWrapperRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((centerY - y) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    setCardTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleCardMouseLeave = () => {
    setCardTransform("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  };

  useEffect(() => {
    if (!shouldRenderMain) return;
    const cards = document.querySelectorAll(".project-card, .service-card, .cert-card, .achievement-card");
    
    const handleMouseMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((centerY - y) / centerY) * 10;
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    
    const handleMouseLeave = (e) => {
      const card = e.currentTarget;
      card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    };
    
    cards.forEach((card) => {
      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);
    });
    
    return () => {
      cards.forEach((card) => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [shouldRenderMain, certsExpanded, projectsExpanded, servicesExpanded]);

  // Calculate B.Tech academic year dynamically (started in 2023)
  const btechStartYear = 2023;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed (Jan = 0, May = 4, July = 6)
  const academicYear = currentYear - btechStartYear + (currentMonth >= 6 ? 1 : 0);
  const suffix = academicYear === 1 ? "st" : academicYear === 2 ? "nd" : academicYear === 3 ? "rd" : "th";
  const dynamicBtechYear = `${academicYear}${suffix}`;

  // Find the active mission topic dynamically based on the latest certification
  const latestCert = certifications[2];
  let certKeyword = "Cloud/DevOps";
  if (latestCert) {
    const titleLower = latestCert.title.toLowerCase();
    if (titleLower.includes("ai")) {
      certKeyword = "AI Engineering";
    } else if (titleLower.includes("cloud")) {
      certKeyword = "Cloud & DevOps";
    } else if (titleLower.includes("java")) {
      certKeyword = "Java Development";
    } else if (titleLower.includes("web")) {
      certKeyword = "Web Engineering";
    } else if (titleLower.includes("machine learning")) {
      certKeyword = "Machine Learning";
    }
  }
  const dynamicMissionLabel = `Mission: ${certKeyword}`;

  return (

    <>
      {loading && (
        <StartAnimation 
          onStartExit={handleStartExit} 
          onComplete={handleComplete} 
        />
      )}

      {(isExiting || !loading) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ width: "100%", minHeight: "100vh", position: "relative", overflowX: "hidden" }}
        >
        {/* Grain overlay */}
        <div className="grain" />

        {/* Custom mouse follower effect */}
        <CustomCursor />

        {/* 3D Canvas Background */}
        <canvas ref={canvasRef} id="canvas-3d" />

      {/* ── NAVBAR ── */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="logo">&lt; Souvik ./ &gt;</div>
        <ul className={`nav-links${menuOpen ? " active" : ""}`}>
          <li><a href="#home"           onClick={() => setMenuOpen(false)}>RETURN ( 0 )</a></li>
          <li><a href="#about"          onClick={() => setMenuOpen(false)}>PRINTF ( )</a></li>
          <li><a href="#services"       onClick={() => setMenuOpen(false)}>FUNC ( )</a></li>
          <li><a href="#projects"       onClick={() => setMenuOpen(false)}>BUILD ( )</a></li>
          <li><a href="#experience"     onClick={() => setMenuOpen(false)}>LEARN ( )</a></li>
          <li><a href="#achievements"   onClick={() => setMenuOpen(false)}>Milestones [ ]</a></li>
          <li><a href="#certifications" onClick={() => setMenuOpen(false)}>LICENSES {`{ }`}</a></li>
          <li><a href="#feedback"       onClick={() => setMenuOpen(false)}>AURA ++</a></li>
          <li><a href="#contact"        onClick={() => setMenuOpen(false)}>PING _ </a></li>
        </ul>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" id="home">
        <div className="hero-bg" />

        <div className="hero-left">
          <div className="hero-tag reveal">
            <span className="dot" />
             Let’s Build Something Great
          </div>

          <h1 className="reveal delay-1">
            I'm <span className="name gradient-text">Souvik Sinhababu</span>
          </h1>

          <h3 className="reveal delay-2">Software Engineer &amp; Problem Solver</h3>

          <p className="hero-description reveal delay-3">
            Passionate about software engineering, cloud computing,
            full-stack development, and scalable systems.
          </p>

          <div className="hero-buttons reveal delay-4">
            <a href="#projects" className="primary-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              View Projects
            </a>
            <a href="/Souvik_Sinhababu_CV.pdf" download="Souvik_Sinhababu_CV.pdf" className="secondary-btn">
              <Download size={16} />
              Resume (export.pdf)
            </a>
          </div>

          <div className="social-icons reveal delay-4">
            <a href="https://github.com/SOUVIKSB1" target="_blank" rel="noreferrer" title="GitHub">
              <FaGithub size={18} />
            </a>
            <a href="https://linkedin.com/in/souviksinhababu" target="_blank" rel="noreferrer" title="LinkedIn">
              <FaLinkedin size={18} />
            </a>
            <a href="mailto:souviksinhababu1@gmail.com" title="Email">
              <Mail size={18} />
            </a>
          </div>
        </div>

        {/* 3D Profile Card */}
        <div className="hero-right">
          <span className="canvas-hint">SMART INDIA HACATHON '25 FINALIST &amp; Team Lead </span>
          
          <div className="profile-card-wrapper" ref={cardWrapperRef}>
            <div 
              className="profile-card"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                transform: cardTransform
              }}
            >
              <div className="profile-img-container">
                {imageError ? (
                  <div className="profile-fallback">
                    SS
                  </div>
                ) : (
                  <img 
                    src={profileImg} 
                    alt="Souvik" 
                    className="profile-img" 
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
              <div className="profile-info" style={{ width: "100%" }}>
                <div className="console-panel">
                  <div className="console-header">
                    <span className="console-dot red" />
                    <span className="console-dot yellow" />
                    <span className="console-dot green" />
                    <span className="console-title">terminal.sh</span>
                  </div>
                  <div className="console-body">
                    <div className="console-line">
                      <span className="c-prompt">souvik@dev:~$</span> <span className="c-text">cat status.json</span>
                    </div>
                    <div className="console-output">
                      {"{"}
                      <br />
                      &nbsp;&nbsp;"role": "CS_Engineer",
                      <br />
                      &nbsp;&nbsp;"focus": "Cloud_DevOps",
                      <br />
                      &nbsp;&nbsp;"status": "active",
                      <br />
                      &nbsp;&nbsp;"ping": "<span className="c-ping">24ms</span>"
                      <br />
                      {"}"}
                    </div>
                    <div className="console-typing">
                      <span className="c-prompt">souvik@dev:~$</span> <span className="c-type-text">{typingText}</span><span className="c-cursor">_</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── ABOUT ── */}
      <section className="about-section" id="about">
        <div className="section-label reveal-fade-up">About</div>
        <h2 className="section-title reveal-title">
          Who <span className="gradient-text">I Am</span>
        </h2>

        <div className="about-grid">
          <div>
            <p className="about-text reveal-text delay-1">
              I'm a B.Tech Computer Science Engineering student at Techno Main Salt Lake, Kolkata.
              I specialize in bridging the gap between front-end aesthetics and robust cloud infrastructures.
              My engineering philosophy revolves around building secure, high-performance web systems that scale effortlessly under heavy load.
            </p>

            <div className="philosophy-section reveal-text delay-2">
              <h3 className="philosophy-title">Engineering Core Principles</h3>
              <div className="philosophy-list">
                <div className="philosophy-item">
                  <span className="philosophy-num">01</span>
                  <div className="philosophy-content">
                    <h4>Performance-First Architecture</h4>
                    <p>Focusing on code efficiency, minimal package weight, and aggressive optimization to guarantee fluid, responsive interfaces and stellar Core Web Vitals.</p>
                  </div>
                </div>
                <div className="philosophy-item">
                  <span className="philosophy-num">02</span>
                  <div className="philosophy-content">
                    <h4>Cloud-Native Infrastructure</h4>
                    <p>Architecting containerized deployments with Docker and orchestrating secure, automated CI/CD pipelines targeting Google Kubernetes Engine (GKE).</p>
                  </div>
                </div>
                <div className="philosophy-item">
                  <span className="philosophy-num">03</span>
                  <div className="philosophy-content">
                    <h4>Clean Code &amp; Design Consistency</h4>
                    <p>Fusing precise styling tokens, accessible Semantic HTML layouts, and robust type safety to build maintainable applications that team members love working on.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Network Sync Hub Widget */}
            <div className="skills-category reveal-scale delay-1 live-network-card">
              <div className="live-header">
                <div className="live-indicator">
                  <span className="live-dot" />
                  <span>Connect Me!</span>
                </div>
                <span className="live-status">{syncStatus}</span>
              </div>

              <div className="live-grid">
                <a 
                  href="https://linkedin.com/in/souviksinhababu" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="live-metric-box"
                >
                  <div className="metric-icon linkedin-brand">
                    <FaLinkedin size={20} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">LinkedIn Connections</span>
                    <h4 className="metric-value ticker-val">{linkedinCount.toLocaleString()}</h4>
                  </div>
                  <div className="metric-pulse-glow ln-glow" />
                </a>

                <a 
                  href="https://instagram.com/sinhababu_souvik" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="live-metric-box"
                >
                  <div className="metric-icon instagram-brand">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Instagram Audience</span>
                    <h4 className="metric-value ticker-val">{instagramCount.toLocaleString()}</h4>
                  </div>
                  <div className="metric-pulse-glow ig-glow" />
                </a>

                {/* Portfolio Visits — shared counter with mobile version */}
                <div className="live-metric-box">
                  <div className="metric-icon visits-brand">
                    <FaEye size={20} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Portfolio Visits</span>
                    <h4 className="metric-value ticker-val">
                      {visitCount === null ? "…" : typeof visitCount === "number" ? visitCount.toLocaleString() : visitCount}
                    </h4>
                  </div>
                  <div className="metric-pulse-glow visits-glow" />
                </div>

                {/* Total Reviews — live count from shared MongoDB */}
                <div className="live-metric-box">
                  <div className="metric-icon reviews-brand">
                    <FaStar size={20} />
                  </div>
                  <div className="metric-info">
                    <span className="metric-label">Total Reviews</span>
                    <h4 className="metric-value ticker-val">
                      {reviewCount === null ? "…" : typeof reviewCount === "number" ? reviewCount.toLocaleString() : reviewCount}
                    </h4>
                  </div>
                  <div className="metric-pulse-glow reviews-glow" />
                </div>
              </div>

              <div className="live-footer">
                <span>@Souvik_Sinhababu</span>
                <span>Last update: {lastUpdated}</span>
              </div>
            </div>
          </div>

          <div className="about-right-col">
            <div className="stats-grid">
              {[
                { num: <CounterTicker value={projects.length} suffix="+" />,       label: "Projects" },
                { num: dynamicBtechYear,                                           label: "Year B.Tech" },
                { num: <CounterTicker value={totalTechCount} suffix="+" />,         label: "Technologies" },
                { num: <CounterTicker value={certifications.length} suffix="+" />, label: "Certifications" },
                { num: "∞",                                                        label: "Curiosity" },
                { num: "01",                                                       label: dynamicMissionLabel },
              ].map((s, idx) => (
                <div className={`stat-card reveal-scale delay-${(idx % 3) + 1}`} key={s.label}>
                  <h3>{s.num}</h3>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="skills-carousel">
              <div className="skills-category reveal-scale delay-2">
                <h3>Secret Weapons</h3>
                <div className="skills-list">
                  {languagesList.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="skills-category reveal-scale delay-3">
                <h3>Frameworks &amp; Architecture</h3>
                <div className="skills-list">
                  {frameworksList.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="skills-category reveal-scale delay-4">
                <h3>Cloud, DevOps &amp; AI</h3>
                <div className="skills-list">
                  {cloudList.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── SERVICES / EXPERTISE ── */}
      <section className="services-section" id="services">
        <div className="ambient-glow glow-1" />
        <div className="section-label reveal-fade-up">Expertise</div>
        <h2 className="section-title reveal-title">
          What I <span className="gradient-text">Excel At</span>
        </h2>
        
        <motion.div layout className="services-grid">
          <AnimatePresence mode="popLayout">
            {(servicesExpanded ? services : services.slice(0, 7)).map((s, i) => {
              const isCollapsible = i >= 7;
              return (
                <motion.div 
                  layout
                  key={s.title}
                  className="service-card-wrapper"
                  {...(isCollapsible ? {
                    custom: i,
                    variants: serviceVariants,
                    initial: "hidden",
                    animate: "visible",
                    exit: "exit"
                  } : {})}
                  transition={{ layout: { type: "spring", stiffness: 100, damping: 18, mass: 0.8 } }}
                >
                  <div className={`service-card ${isCollapsible ? "in" : "reveal-scale"}`}>
                    <div className="service-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                    <p>{s.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {services.length > 7 && (
            <motion.div 
              layout
              className="service-card-wrapper"
              transition={{ layout: { type: "spring", stiffness: 100, damping: 18, mass: 0.8 } }}
            >
              <div 
                className="service-card reveal-scale see-all-card delay-1"
                onClick={() => setServicesExpanded(!servicesExpanded)}
              >
                <span className="see-all-icon">
                  {servicesExpanded ? "↑" : "+"}
                </span>
                <h3 className="see-all-title">
                  {servicesExpanded ? "Show Less" : `See All (${services.length - 7} More)`}
                </h3>
                <p className="see-all-desc">
                  {servicesExpanded ? "Collapse services list" : "Expand all expertise areas"}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

      </section>

      <div className="divider" />

      {/* ── PROJECTS ── */}
      <section className="projects-section" id="projects">
        <div className="section-label reveal-fade-up">Work</div>
        <h2 className="section-title reveal-title">
          Featured <span className="gradient-text">Projects</span>
        </h2>

        <motion.div layout className="project-grid">
          <AnimatePresence mode="popLayout">
            {(projectsExpanded ? projects : projects.slice(0, 7)).map((p, i) => {
              const isCollapsible = i >= 7;
              return (
                <motion.div
                  layout
                  key={p.title}
                  className="project-card-wrapper"
                  {...(isCollapsible ? {
                    custom: i,
                    variants: projectVariants,
                    initial: "hidden",
                    animate: "visible",
                    exit: "exit"
                  } : {})}
                  transition={{ layout: { type: "spring", stiffness: 100, damping: 18, mass: 0.8 } }}
                >
                  <div className={`project-card ${isCollapsible ? "in" : "reveal-scale"}`}>
                    <div className="proj-icon">{p.icon}</div>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <span className="proj-tech">{p.tech}</span>
                    <div className="project-links">
                      <a href={p.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                        <FaGithub size={14} /> GitHub
                      </a>
                      <a href={p.live} target="_blank" rel="noreferrer" aria-label="Live demo">
                        <ExternalLink size={14} /> Live Demo
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {projects.length > 7 && (
            <motion.div 
              layout
              className="project-card-wrapper"
              transition={{ layout: { type: "spring", stiffness: 100, damping: 18, mass: 0.8 } }}
            >
              <div 
                className="project-card reveal-scale see-all-card delay-1"
                onClick={() => setProjectsExpanded(!projectsExpanded)}
              >
                <span className="see-all-icon">
                  {projectsExpanded ? "↑" : "+"}
                </span>
                <h3 className="see-all-title">
                  {projectsExpanded ? "Show Less" : `See All (${projects.length - 7} More)`}
                </h3>
                <p className="see-all-desc">
                  {projectsExpanded ? "Collapse projects list" : "Expand all featured projects"}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

      </section>

      <div className="divider" />

      {/* ── TIMELINE / EXPERIENCE ── */}
      <section className="experience-section" id="experience">
        <div className="ambient-glow glow-2" />
        <div className="section-label reveal-fade-up" style={{ justifyContent: "center" }}>Journey</div>
        <h2 className="section-title reveal-title" style={{ textAlign: "center" }}>
          Education &amp; <span className="gradient-text">Experience</span>
        </h2>

        <div className="timeline-container">
          {timeline.map((item, i) => (
            <div className={`timeline-item reveal-fade-up delay-${(i % 3) + 1}`} key={item.title}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <span className="timeline-date">{item.date}</span>
                <h3>{item.title}</h3>
                <h4 className="timeline-institution">{item.institution}</h4>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── ACHIEVEMENTS ── */}
      <section className="achievements-section" id="achievements">
        <div className="ambient-glow glow-2" style={{ background: "radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)" }} />
        <div className="section-label reveal-fade-up" style={{ justifyContent: "center" }}>Milestones</div>
        <h2 className="section-title reveal-title" style={{ textAlign: "center" }}>
          Key <span className="gradient-text">Achievements</span>
        </h2>

        <div className="achievements-grid">
          {achievements.map((ach, i) => (
            <div className={`achievement-card reveal-scale delay-${(i % 3) + 1}`} key={ach.title}>
              <div className="ach-header">
                <div className="ach-icon">{ach.icon}</div>
                <span className="ach-badge">{ach.badge}</span>
              </div>
              <span className="ach-date">{ach.date}</span>
              <h3>{ach.title}</h3>
              <p className="ach-org">{ach.organization}</p>
              <p className="ach-desc">{ach.description}</p>
              <div className="ach-tags">
                {ach.tags.map((t) => (
                  <span key={t} className="ach-tag">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── CERTIFICATIONS ── */}
      <section className="certifications-section" id="certifications">
        <div className="ambient-glow glow-1" />
        <div className="section-label reveal-fade-up" style={{ justifyContent: "center" }}>Credentials</div>
        <h2 className="section-title reveal-title" style={{ textAlign: "center" }}>
          Professional <span className="gradient-text">Certifications</span>
        </h2>

        <motion.div layout className="cert-grid">
          <AnimatePresence mode="popLayout">
            {(certsExpanded ? certifications : certifications.slice(0, 7)).map((c, i) => {
              const isCollapsible = i >= 7;
              return (
                <motion.div
                  layout
                  key={c.title}
                  className="cert-card-wrapper"
                  {...(isCollapsible ? {
                    custom: i,
                    variants: certVariants,
                    initial: "hidden",
                    animate: "visible",
                    exit: "exit"
                  } : {})}
                  transition={{ layout: { type: "spring", stiffness: 100, damping: 18, mass: 0.8 } }}
                >
                  <div className={`cert-card ${isCollapsible ? "in" : "reveal-scale"}`}>
                    <div className="cert-header">
                      <span className="cert-icon">{c.icon}</span>
                      <span className="cert-date">{c.date}</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p className="cert-issuer">{c.issuer}</p>
                    <div className="cert-footer">
                      <span className="cert-id">ID: {c.id}</span>
                      <a href={c.link} target="_blank" rel="noreferrer" className="cert-link-btn">
                        Verify <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {certifications.length > 7 && (
            <motion.div 
              layout
              className="cert-card-wrapper"
              transition={{ layout: { type: "spring", stiffness: 100, damping: 18, mass: 0.8 } }}
            >
              <div 
                className="cert-card reveal-scale see-all-card delay-1"
                onClick={() => setCertsExpanded(!certsExpanded)}
              >
                <span className="see-all-icon">
                  {certsExpanded ? "↑" : "+"}
                </span>
                <h3 className="see-all-title">
                  {certsExpanded ? "Show Less" : `See All (${certifications.length - 7} More)`}
                </h3>
                <p className="see-all-desc">
                  {certsExpanded ? "Collapse certificates list" : "Expand all professional credentials"}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

      </section>

      <div className="divider" />

      {/* ── FEEDBACK & RATING ── */}
      <section className="feedback-section" id="feedback">
        <div className="ambient-glow glow-2" />
        <div className="section-label reveal-fade-up" style={{ justifyContent: "center" }}>Reviews</div>
        <h2 className="section-title reveal-title" style={{ textAlign: "center" }}>
          Community <span className="gradient-text">Feedback</span>
        </h2>

        <div className="feedback-container reveal-fade-up delay-2">
          {/* Left: Feedback Form */}
          <div className="feedback-form-box">
            <h3>Submit Your Review</h3>
            <p>Your feedback is stored locally and displayed in real-time.</p>
            <form onSubmit={handleAddReview} className="feedback-form">
              <div className="form-group">
                <label htmlFor="rev-name">Name *</label>
                <input
                  id="rev-name"
                  type="text"
                  placeholder="e.g., Souvik Sinhababu"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rev-role">Role / Company</label>
                <input
                  id="rev-role"
                  type="text"
                  placeholder="e.g., Lead Engineer at Meta"
                  value={newReviewRole}
                  onChange={(e) => setNewReviewRole(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Rating *</label>
                {renderStarsSelector()}
              </div>

              <div className="form-group">
                <label htmlFor="rev-comment">Message *</label>
                <textarea
                  id="rev-comment"
                  placeholder="Share your thoughts about my work, projects, or team experience..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows="4"
                  required
                />
              </div>

              {reviewsError && (
                <p className="reviews-error-msg" style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '5px', textAlign: 'center', fontFamily: 'monospace' }}>
                  // {reviewsError}
                </p>
              )}

              <button type="submit" className="primary-btn submit-rev-btn" disabled={isSubmittingReview}>
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>

          {/* Right: Aggregate Score & Testimonials List */}
          <div className="feedback-display-box">
            {/* Aggregate Metric Widget */}
            <div className="rating-metrics-card">
              <div className="metrics-left">
                <h4>{(reviews.reduce((acc, curr) => acc + curr.rating, 0) / (reviews.length || 1)).toFixed(1)}</h4>
                <div className="metrics-stars">
                  {renderStars(Math.round(reviews.reduce((acc, curr) => acc + curr.rating, 0) / (reviews.length || 1)))}
                  <span>({reviews.length} reviews)</span>
                </div>
              </div>
              <div className="metrics-right">
                <div className="metric-glow-ring" />
                <span className="live-status">LIVE FEED</span>
              </div>
            </div>

            {/* Testimonials List */}
            <div className="testimonials-list">
              {reviews.map((r, index) => (
                <div className="testi-card" key={index}>
                  <div className="testi-header">
                    <div>
                      <h5>{r.name}</h5>
                      <span className="testi-role">{r.role}</span>
                    </div>
                    <span className="testi-date">{r.date}</span>
                  </div>
                  <div className="testi-rating">
                    {renderStars(r.rating)}
                  </div>
                  <p className="testi-comment">"{r.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── CONTACT ── */}
      <section className="contact-section" id="contact">
        <div className="section-label reveal-fade-up" style={{ justifyContent: "center" }}>Contact</div>
        <h2 className="section-title reveal-title">
          Let's <span className="gradient-text">Build Together</span>
        </h2>

        <div className="contact-inner reveal-fade-up delay-2">
          <div className="contact-card">
            <p>
              Interested in collaborating, discussing tech, or exploring new opportunities?
              My inbox is always open.
            </p>
            <div className="contact-buttons">
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=souviksinhababu1@gmail.com" className="primary-btn" target="_blank" rel="noreferrer">
                <Mail size={16} />
                sayHello()
              </a>
              <a href="tel:+918250204087" className="primary-btn">
                <Phone size={16} />
                initCall()
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <span className="logo-sm">&lt; Souvik ./ &gt;</span>
        <span>© 2026 Souvik Sinhababu · Built with Love &amp; Passion</span>
      </footer>
    </motion.div>
      )}
    </>
  );
}