(() => {
  "use strict";

  /* =========================================================
     SENTRA — EXPERIENCE CONTROLLER + ADAPTIVE SOUND
     ========================================================= */

  const track = document.querySelector(".track");
  const scenes = [...document.querySelectorAll(".scene")];

  const progressCurrent = document.querySelector(".progress-current");
  const progressTotal = document.querySelector(".progress-total");
  const progressBar = document.querySelector(".progress-line span");

  const dateElement = document.querySelector("[data-date]");
  const timeElement = document.querySelector("[data-time]");

  const loader = document.querySelector(".loader");
  const loaderProgress = document.querySelector(".loader-progress span");
  const loaderStatus = document.querySelector(".loader-status");
  const loaderChecks = [...document.querySelectorAll(".loader-check")];

  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");

  let sceneIndex = 0;
  let sceneCount = scenes.length;

  let isAnimating = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragCurrentX = 0;
  let dragStartScene = 0;

  let wheelLock = false;
  let touchStartX = 0;
  let touchStartY = 0;

  let loaderFinished = false;
  let loaderTimer = null;

  /* =========================================================
     AUDIO
     ========================================================= */

  let audioContext = null;
  let soundEnabled = true;
  let audioUnlocked = false;
  let soundControl = null;

  let scannerOscillator = null;
  let scannerGain = null;
  let scannerRunning = false;

  let lastNetworkSound = 0;

  function getAudioContext() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;

      if (!AudioCtx) {
        return null;
      }

      audioContext = new AudioCtx();
    }

    return audioContext;
  }

  function unlockAudio() {
    if (!soundEnabled) return;

    const ctx = getAudioContext();

    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    audioUnlocked = true;
  }

  function nowTime() {
    const ctx = getAudioContext();
    return ctx ? ctx.currentTime : 0;
  }

  function createGain(value = 0.08) {
    const ctx = getAudioContext();
    if (!ctx) return null;

    const gain = ctx.createGain();
    gain.gain.value = value;
    gain.connect(ctx.destination);

    return gain;
  }

  function tone({
    frequency = 440,
    duration = 0.08,
    type = "sine",
    volume = 0.04,
    attack = 0.005,
    release = 0.08,
    detune = 0
  } = {}) {
    if (!soundEnabled || !audioUnlocked) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.detune.setValueAtTime(detune, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(volume, 0.0002),
      ctx.currentTime + attack
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration + release
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration + release + 0.02);
  }

  function noiseBurst({
    duration = 0.12,
    volume = 0.025,
    filterFrequency = 1800
  } = {}) {
    if (!soundEnabled || !audioUnlocked) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(
      1,
      bufferSize,
      ctx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = "bandpass";
    filter.frequency.value = filterFrequency;
    filter.Q.value = 1.4;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      ctx.currentTime + 0.008
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration
    );

    source.buffer = buffer;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + duration + 0.02);
  }

  function clickSound() {
    tone({
      frequency: 1250,
      duration: 0.035,
      type: "square",
      volume: 0.025,
      attack: 0.001,
      release: 0.025
    });

    tone({
      frequency: 720,
      duration: 0.025,
      type: "sine",
      volume: 0.012,
      attack: 0.001,
      release: 0.02,
      detune: -20
    });
  }

  function soundBoot() {
    if (!soundEnabled || !audioUnlocked) return;

    tone({
      frequency: 110,
      duration: 0.16,
      type: "sine",
      volume: 0.035,
      attack: 0.015,
      release: 0.12
    });

    setTimeout(() => {
      tone({
        frequency: 220,
        duration: 0.18,
        type: "sine",
        volume: 0.025,
        attack: 0.01,
        release: 0.14
      });
    }, 90);

    setTimeout(() => {
      clickSound();
    }, 210);
  }

  function soundSystemCheck() {
    if (!soundEnabled || !audioUnlocked) return;

    clickSound();

    setTimeout(() => {
      tone({
        frequency: 660,
        duration: 0.055,
        type: "sine",
        volume: 0.018,
        attack: 0.003,
        release: 0.04
      });
    }, 100);
  }

  function soundSystemReady() {
    if (!soundEnabled || !audioUnlocked) return;

    tone({
      frequency: 392,
      duration: 0.08,
      type: "sine",
      volume: 0.025
    });

    setTimeout(() => {
      tone({
        frequency: 587.33,
        duration: 0.12,
        type: "sine",
        volume: 0.035
      });
    }, 100);

    setTimeout(() => {
      tone({
        frequency: 783.99,
        duration: 0.16,
        type: "sine",
        volume: 0.045
      });
    }, 210);
  }

  function soundTransition() {
    if (!soundEnabled || !audioUnlocked) return;

    noiseBurst({
      duration: 0.09,
      volume: 0.018,
      filterFrequency: 1500
    });

    tone({
      frequency: 180,
      duration: 0.08,
      type: "sine",
      volume: 0.012
    });

    setTimeout(() => {
      clickSound();
    }, 80);
  }

  function startScannerSound() {
    if (!soundEnabled || !audioUnlocked || scannerRunning) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    scannerOscillator = ctx.createOscillator();
    scannerGain = ctx.createGain();

    scannerOscillator.type = "sine";

    scannerOscillator.frequency.setValueAtTime(
      170,
      ctx.currentTime
    );

    scannerOscillator.frequency.linearRampToValueAtTime(
      820,
      ctx.currentTime + 1.5
    );

    scannerOscillator.frequency.linearRampToValueAtTime(
      210,
      ctx.currentTime + 3.0
    );

    scannerGain.gain.setValueAtTime(0.0001, ctx.currentTime);

    scannerGain.gain.linearRampToValueAtTime(
      0.022,
      ctx.currentTime + 0.18
    );

    scannerGain.gain.linearRampToValueAtTime(
      0.0001,
      ctx.currentTime + 3.0
    );

    scannerOscillator.connect(scannerGain);
    scannerGain.connect(ctx.destination);

    scannerOscillator.start();

    scannerRunning = true;

    setTimeout(() => {
      if (scannerOscillator) {
        try {
          scannerOscillator.stop();
        } catch (_) {}
      }

      scannerOscillator = null;
      scannerGain = null;
      scannerRunning = false;
    }, 3050);

    setTimeout(() => {
      if (soundEnabled && audioUnlocked) {
        tone({
          frequency: 1180,
          duration: 0.045,
          type: "sine",
          volume: 0.025
        });
      }
    }, 1500);
  }

  function stopScannerSound() {
    if (!scannerOscillator) return;

    try {
      scannerOscillator.stop();
    } catch (_) {}

    scannerOscillator = null;
    scannerGain = null;
    scannerRunning = false;
  }

  function soundDetection() {
    if (!soundEnabled || !audioUnlocked) return;

    tone({
      frequency: 92,
      duration: 0.17,
      type: "sine",
      volume: 0.035,
      attack: 0.008,
      release: 0.16
    });

    setTimeout(() => {
      clickSound();
    }, 170);

    setTimeout(() => {
      tone({
        frequency: 520,
        duration: 0.055,
        type: "square",
        volume: 0.022
      });
    }, 270);
  }

  function soundAccessGranted() {
    if (!soundEnabled || !audioUnlocked) return;

    tone({
      frequency: 740,
      duration: 0.07,
      type: "sine",
      volume: 0.025
    });

    setTimeout(() => {
      tone({
        frequency: 1046.5,
        duration: 0.12,
        type: "sine",
        volume: 0.04
      });
    }, 90);
  }

  function soundAlert() {
    if (!soundEnabled || !audioUnlocked) return;

    tone({
      frequency: 68,
      duration: 0.28,
      type: "sine",
      volume: 0.045,
      attack: 0.015,
      release: 0.18
    });

    setTimeout(() => {
      tone({
        frequency: 58,
        duration: 0.22,
        type: "sine",
        volume: 0.035
      });
    }, 240);
  }

  function soundMaintenance() {
    if (!soundEnabled || !audioUnlocked) return;

    clickSound();

    setTimeout(() => {
      tone({
        frequency: 330,
        duration: 0.06,
        type: "square",
        volume: 0.018
      });
    }, 130);

    setTimeout(() => {
      clickSound();
    }, 260);
  }

  function soundNetwork() {
    if (!soundEnabled || !audioUnlocked) return;

    const current = performance.now();

    if (current - lastNetworkSound < 650) {
      return;
    }

    lastNetworkSound = current;

    tone({
      frequency: 520,
      duration: 0.045,
      type: "sine",
      volume: 0.012
    });

    setTimeout(() => {
      tone({
        frequency: 780,
        duration: 0.045,
        type: "sine",
        volume: 0.014
      });
    }, 80);
  }

  function soundFinal() {
    if (!soundEnabled || !audioUnlocked) return;

    tone({
      frequency: 392,
      duration: 0.08,
      type: "sine",
      volume: 0.025
    });

    setTimeout(() => {
      tone({
        frequency: 659.25,
        duration: 0.1,
        type: "sine",
        volume: 0.03
      });
    }, 110);

    setTimeout(() => {
      tone({
        frequency: 783.99,
        duration: 0.17,
        type: "sine",
        volume: 0.04
      });
    }, 220);
  }

  function createSoundControl() {
    if (soundControl) return;

    soundControl = document.createElement("button");
    soundControl.id = "sentraSoundControl";
    soundControl.type = "button";
    soundControl.textContent = "SOUND / ON";

    document.body.appendChild(soundControl);

    soundControl.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!soundEnabled) {
        soundEnabled = true;
        unlockAudio();

        soundControl.textContent = "SOUND / ON";

        tone({
          frequency: 620,
          duration: 0.08,
          type: "sine",
          volume: 0.025
        });
      } else {
        soundEnabled = false;
        stopScannerSound();

        soundControl.textContent = "SOUND / OFF";
      }
    });
  }

  function playSceneSound(index) {
    if (!soundEnabled || !audioUnlocked) return;

    stopScannerSound();

    switch (index) {
      case 0:
        clickSound();
        break;

      case 1:
        startScannerSound();
        break;

      case 2:
        soundDetection();
        break;

      case 3:
        soundAccessGranted();
        break;

      case 4:
        soundAlert();
        break;

      case 5:
        soundMaintenance();
        break;

      case 6:
        soundNetwork();
        break;

      case 7:
        soundFinal();
        break;
    }
  }

  /* =========================================================
     FIRST USER INTERACTION
     ========================================================= */

  function firstInteraction() {
    if (!audioUnlocked) {
      unlockAudio();

      if (!loaderFinished) {
        soundBoot();
      }
    }
  }

  window.addEventListener(
    "pointerdown",
    firstInteraction,
    { passive: true, once: false }
  );

  window.addEventListener(
    "touchstart",
    firstInteraction,
    { passive: true, once: false }
  );

  window.addEventListener(
    "keydown",
    firstInteraction,
    { passive: true, once: false }
  );

  /* =========================================================
     CLOCK
     ========================================================= */

  function updateClock() {
    const now = new Date();

    if (dateElement) {
      dateElement.textContent = new Intl.DateTimeFormat(
        "ru-RU",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }
      ).format(now);
    }

    if (timeElement) {
      timeElement.textContent = new Intl.DateTimeFormat(
        "ru-RU",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      ).format(now);
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* =========================================================
     LOADER
     ========================================================= */

  function updateLoader(step) {
    if (!loaderChecks.length) return;

    loaderChecks.forEach((item, index) => {
      item.classList.remove("active", "done");

      const state = item.querySelector(".loader-check-state");

      if (index < step) {
        item.classList.add("done");

        if (state) {
          state.textContent = "OK";
        }
      } else if (index === step) {
        item.classList.add("active");

        if (state) {
          state.textContent = "CHECK";
        }
      } else {
        if (state) {
          state.textContent = "WAIT";
        }
      }
    });
  }

  function finishLoader() {
    if (loaderFinished) return;

    loaderFinished = true;

    if (loader) {
      loader.classList.add("ready");
    }

    if (loaderProgress) {
      loaderProgress.style.width = "100%";
    }

    if (loaderStatus) {
      loaderStatus.textContent = "СИСТЕМА ГОТОВА";
    }

    soundSystemReady();

    setTimeout(() => {
      if (!loader) return;

      loader.style.opacity = "0";
      loader.style.pointerEvents = "none";

      setTimeout(() => {
        loader.style.display = "none";
      }, 700);
    }, 800);
  }

  function runLoader() {
    if (!loader) {
      loaderFinished = true;
      return;
    }

    const totalSteps = Math.max(loaderChecks.length, 5);
    const stepDuration = 690;

    let currentStep = 0;

    updateLoader(0);

    if (loaderStatus) {
      loaderStatus.textContent = "СИСТЕМА ЗАПУСКАЕТСЯ";
    }

    if (loaderProgress) {
      loaderProgress.style.width = "0%";
    }

    loaderTimer = setInterval(() => {
      if (currentStep < totalSteps) {
        updateLoader(currentStep);

        if (loaderStatus) {
          const current = loaderChecks[currentStep];

          if (current) {
            const text =
              current.querySelector(".loader-check-name");

            if (text) {
              loaderStatus.textContent =
                text.textContent.trim();
            }
          }
        }

        soundSystemCheck();

        currentStep++;

        if (loaderProgress) {
          const percent =
            Math.min(
              (currentStep / totalSteps) * 100,
              100
            );

          loaderProgress.style.width =
            `${percent}%`;
        }
      } else {
        clearInterval(loaderTimer);
        loaderTimer = null;

        updateLoader(totalSteps);

        if (loaderStatus) {
          loaderStatus.textContent = "СИСТЕМА ГОТОВА";
        }

        finishLoader();
      }
    }, stepDuration);
  }

  /* =========================================================
     SCENE ACTIVATION
     ========================================================= */

  function setSceneActive(index) {
    scenes.forEach((scene, i) => {
      scene.classList.toggle("active", i === index);
    });

    if (progressCurrent) {
      progressCurrent.textContent =
        String(index + 1).padStart(2, "0");
    }

    if (progressTotal) {
      progressTotal.textContent =
        String(sceneCount).padStart(2, "0");
    }

    if (progressBar) {
      progressBar.style.width =
        `${((index + 1) / sceneCount) * 100}%`;
    }

    playSceneSound(index);
  }

  function applyScene(index, animate = true) {
    if (!track) return;

    const offset = index * 100;

    track.style.transition = animate
      ? "transform 720ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none";

    track.style.transform =
      `translate3d(-${offset}vw, 0, 0)`;

    setSceneActive(index);
  }

  function goToScene(index, animate = true) {
    if (sceneCount <= 0) return;

    const nextIndex = Math.max(
      0,
      Math.min(index, sceneCount - 1)
    );

    if (nextIndex === sceneIndex) {
      return;
    }

    if (isAnimating) {
      return;
    }

    isAnimating = animate;

    soundTransition();

    sceneIndex = nextIndex;

    applyScene(sceneIndex, animate);

    if (animate) {
      setTimeout(() => {
        isAnimating = false;
      }, 760);
    } else {
      isAnimating = false;
    }

    updateHash();
  }

  function updateHash() {
    try {
      history.replaceState(
        null,
        "",
        `#scene-${sceneIndex + 1}`
      );
    } catch (_) {}
  }

  function readHash() {
    const match =
      window.location.hash.match(
        /scene-(\d+)/i
      );

    if (!match) return 0;

    const number = parseInt(match[1], 10);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(number - 1, sceneCount - 1)
    );
  }

  /* =========================================================
     WHEEL
     ========================================================= */

  function handleWheel(event) {
    event.preventDefault();

    if (wheelLock || isAnimating) {
      return;
    }

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (Math.abs(delta) < 10) {
      return;
    }

    wheelLock = true;

    if (delta > 0) {
      goToScene(sceneIndex + 1);
    } else {
      goToScene(sceneIndex - 1);
    }

    setTimeout(() => {
      wheelLock = false;
    }, 800);
  }

  window.addEventListener(
    "wheel",
    handleWheel,
    { passive: false }
  );

  /* =========================================================
     POINTER DRAG
     ========================================================= */

  function pointerDown(event) {
    if (
      event.target.closest("a") ||
      event.target.closest("button")
    ) {
      return;
    }

    isDragging = true;
    dragStartX = event.clientX;
    dragCurrentX = event.clientX;
    dragStartScene = sceneIndex;

    if (track) {
      track.style.transition = "none";
    }
  }

  function pointerMove(event) {
    if (!isDragging || !track) {
      return;
    }

    dragCurrentX = event.clientX;

    const delta =
      dragCurrentX - dragStartX;

    const viewportWidth =
      window.innerWidth;

    const base =
      dragStartScene * viewportWidth;

    const position =
      base - delta;

    const maxPosition =
      (sceneCount - 1) * viewportWidth;

    const clamped =
      Math.max(
        0,
        Math.min(position, maxPosition)
      );

    track.style.transform =
      `translate3d(-${clamped}px, 0, 0)`;
  }

  function pointerUp() {
    if (!isDragging) {
      return;
    }

    isDragging = false;

    const delta =
      dragCurrentX - dragStartX;

    const threshold =
      Math.min(
        window.innerWidth * 0.16,
        180
      );

    if (Math.abs(delta) > threshold) {
      if (delta < 0) {
        goToScene(dragStartScene + 1);
      } else {
        goToScene(dragStartScene - 1);
      }
    } else {
      applyScene(sceneIndex, true);
    }
  }

  window.addEventListener(
    "pointerdown",
    pointerDown,
    { passive: true }
  );

  window.addEventListener(
    "pointermove",
    pointerMove,
    { passive: true }
  );

  window.addEventListener(
    "pointerup",
    pointerUp,
    { passive: true }
  );

  window.addEventListener(
    "pointercancel",
    pointerUp,
    { passive: true }
  );

  /* =========================================================
     TOUCH
     ========================================================= */

  function touchStart(event) {
    if (!event.touches.length) return;

    const touch =
      event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function touchEnd(event) {
    if (!event.changedTouches.length) {
      return;
    }

    const touch =
      event.changedTouches[0];

    const deltaX =
      touch.clientX - touchStartX;

    const deltaY =
      touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 35) {
      return;
    }

    if (
      Math.abs(deltaX) <=
      Math.abs(deltaY)
    ) {
      return;
    }

    if (deltaX < 0) {
      goToScene(sceneIndex + 1);
    } else {
      goToScene(sceneIndex - 1);
    }
  }

  window.addEventListener(
    "touchstart",
    touchStart,
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    touchEnd,
    { passive: true }
  );

  /* =========================================================
     KEYBOARD
     ========================================================= */

  function handleKeyboard(event) {
    if (
      event.target &&
      (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      )
    ) {
      return;
    }

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        goToScene(sceneIndex + 1);
        break;

      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        goToScene(sceneIndex - 1);
        break;

      case "Home":
        event.preventDefault();
        goToScene(0);
        break;

      case "End":
        event.preventDefault();
        goToScene(sceneCount - 1);
        break;

      case "Escape":
        if (menu) {
          menu.classList.remove("open");
        }
        break;
    }
  }

  window.addEventListener(
    "keydown",
    handleKeyboard
  );

  /* =========================================================
     MOBILE MENU
     ========================================================= */

  if (menuButton && menu) {
    menuButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        unlockAudio();

        menu.classList.toggle("open");
      }
    );
  }

  document.addEventListener(
    "click",
    (event) => {
      if (!menu || !menuButton) {
        return;
      }

      if (
        menu.classList.contains("open") &&
        !menu.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        menu.classList.remove("open");
      }
    }
  );

  /* =========================================================
     NETWORK
     ========================================================= */

  const networkSvg =
    document.querySelector(".network-svg");

  const networkNodes =
    [...document.querySelectorAll(".network-node")];

  const networkSignals =
    [...document.querySelectorAll(".network-signal")];

  let networkAnimationFrame = null;
  let networkStartTime = performance.now();

  function animateNetwork(time) {
    if (!networkSvg) {
      return;
    }

    const elapsed =
      (time - networkStartTime) / 1000;

    networkSignals.forEach((signal, index) => {
      const path =
        document.querySelector(
          `.network-line[data-index="${index}"]`
        );

      if (!path) return;

      const length =
        path.getTotalLength();

      const speed =
        0.16 + index * 0.025;

      const progress =
        (elapsed * speed) % 1;

      const point =
        path.getPointAtLength(
          progress * length
        );

      signal.setAttribute(
        "cx",
        point.x
      );

      signal.setAttribute(
        "cy",
        point.y
      );
    });

    if (
      sceneIndex === 6 &&
      elapsed > 0.2
    ) {
      soundNetwork();
    }

    networkAnimationFrame =
      requestAnimationFrame(
        animateNetwork
      );
  }

  if (networkSvg) {
    networkAnimationFrame =
      requestAnimationFrame(
        animateNetwork
      );
  }

  /* =========================================================
     PARALLAX
     ========================================================= */

  const images =
    [...document.querySelectorAll(".media-frame img")];

  function applyParallax(event) {
    if (!window.matchMedia("(min-width: 1100px)").matches) {
      return;
    }

    const x =
      (event.clientX / window.innerWidth - 0.5);

    const y =
      (event.clientY / window.innerHeight - 0.5);

    images.forEach((image) => {
      image.style.transform =
        `scale(1.01) translate3d(${x * 5}px, ${y * 3}px, 0)`;
    });
  }

  window.addEventListener(
    "pointermove",
    applyParallax,
    { passive: true }
  );

  /* =========================================================
     RESIZE
     ========================================================= */

  let resizeTimer = null;

  function handleResize() {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      applyScene(sceneIndex, false);
    }, 120);
  }

  window.addEventListener(
    "resize",
    handleResize
  );

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    sceneCount = scenes.length;

    if (progressTotal) {
      progressTotal.textContent =
        String(sceneCount).padStart(2, "0");
    }

    createSoundControl();

    sceneIndex = readHash();

    applyScene(
      sceneIndex,
      false
    );

    runLoader();
  }

  init();
})();
