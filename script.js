(() => {
  "use strict";

  const experience = document.getElementById("experience");
  const scenes = [...document.querySelectorAll(".scene")];

  const loader = document.getElementById("loader");
  const loaderProgress = document.getElementById("loaderProgress");
  const loaderProgressBar = document.getElementById("loaderProgressBar");
  const loaderReady = document.getElementById("loaderReady");
  const loaderChecks = [...document.querySelectorAll(".loader-check")];

  const currentSceneEl = document.getElementById("currentScene");
  const progressBar = document.getElementById("progressBar");
  const clock = document.getElementById("clock");

  const menu = document.getElementById("menu");
  const menuButton = document.getElementById("menuButton");
  const menuScenes = [...document.querySelectorAll(".menu-scene")];

  const totalScenes = scenes.length;

  let currentScene = 0;
  let isMoving = false;
  let pointerDown = false;
  let pointerStartX = 0;
  let pointerStartTranslate = 0;
  let currentTranslate = 0;
  let targetTranslate = 0;
  let lastSceneSound = -1;

  let audioContext = null;
  let audioUnlocked = false;


  /* =========================================
     AUDIO
  ========================================= */

  function initAudio() {
    if (audioContext) return audioContext;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;

      if (!AudioCtx) {
        return null;
      }

      audioContext = new AudioCtx();
      return audioContext;
    } catch (error) {
      return null;
    }
  }


  function unlockAudio() {
    const ctx = initAudio();

    if (!ctx) {
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    audioUnlocked = true;
  }


  function createTone({
    frequency = 440,
    duration = 0.08,
    volume = 0.035,
    type = "sine",
    delay = 0
  } = {}) {

    const ctx = initAudio();

    if (!ctx || !audioUnlocked) {
      return;
    }

    try {
      const now = ctx.currentTime + delay;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(volume, 0.0002),
        now + 0.012
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + duration
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + duration + 0.025);
    } catch (error) {
      // Audio is decorative. Navigation must never depend on it.
    }
  }


  function soundClick() {
    createTone({
      frequency: 760,
      duration: 0.045,
      volume: 0.035,
      type: "square"
    });
  }


  function soundScan() {
    createTone({
      frequency: 390,
      duration: 0.07,
      volume: 0.025,
      type: "sine"
    });

    createTone({
      frequency: 720,
      duration: 0.045,
      volume: 0.02,
      type: "sine",
      delay: 0.09
    });
  }


  function soundDetection() {
    createTone({
      frequency: 170,
      duration: 0.22,
      volume: 0.035,
      type: "sine"
    });

    createTone({
      frequency: 540,
      duration: 0.055,
      volume: 0.03,
      type: "square",
      delay: 0.2
    });

    createTone({
      frequency: 680,
      duration: 0.055,
      volume: 0.03,
      type: "square",
      delay: 0.29
    });
  }


  function soundAccess() {
    createTone({
      frequency: 620,
      duration: 0.06,
      volume: 0.035,
      type: "square"
    });

    createTone({
      frequency: 940,
      duration: 0.1,
      volume: 0.03,
      type: "sine",
      delay: 0.09
    });
  }


  function soundWarning() {
    createTone({
      frequency: 120,
      duration: 0.3,
      volume: 0.04,
      type: "sine"
    });

    createTone({
      frequency: 180,
      duration: 0.2,
      volume: 0.025,
      type: "sine",
      delay: 0.2
    });
  }


  function soundService() {
    createTone({
      frequency: 280,
      duration: 0.045,
      volume: 0.028,
      type: "square"
    });

    createTone({
      frequency: 340,
      duration: 0.045,
      volume: 0.022,
      type: "square",
      delay: 0.09
    });

    createTone({
      frequency: 410,
      duration: 0.055,
      volume: 0.025,
      type: "square",
      delay: 0.18
    });
  }


  function soundNetwork() {
    createTone({
      frequency: 310,
      duration: 0.07,
      volume: 0.025,
      type: "sine"
    });

    createTone({
      frequency: 460,
      duration: 0.07,
      volume: 0.025,
      type: "sine",
      delay: 0.12
    });

    createTone({
      frequency: 680,
      duration: 0.14,
      volume: 0.035,
      type: "sine",
      delay: 0.25
    });
  }


  function soundReady() {
    createTone({
      frequency: 420,
      duration: 0.08,
      volume: 0.025,
      type: "sine"
    });

    createTone({
      frequency: 660,
      duration: 0.1,
      volume: 0.03,
      type: "sine",
      delay: 0.1
    });

    createTone({
      frequency: 880,
      duration: 0.16,
      volume: 0.035,
      type: "sine",
      delay: 0.22
    });
  }


  function playSceneSound(index) {
    unlockAudio();

    if (lastSceneSound === index) {
      return;
    }

    lastSceneSound = index;

    window.setTimeout(() => {
      switch (index) {
        case 0:
          soundClick();
          break;

        case 1:
          soundScan();
          break;

        case 2:
          soundDetection();
          break;

        case 3:
          soundAccess();
          break;

        case 4:
          soundWarning();
          break;

        case 5:
          soundService();
          break;

        case 6:
          soundNetwork();
          break;

        case 7:
          soundReady();
          break;
      }
    }, 80);
  }


  /* =========================================
     CLOCK
  ========================================= */

  function updateClock() {
    if (!clock) return;

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    clock.textContent = `${hours}:${minutes}:${seconds}`;
  }

  updateClock();
  window.setInterval(updateClock, 1000);


  /* =========================================
     SCENE STATE
  ========================================= */

  function setSceneActive(index) {
    scenes.forEach((scene, sceneIndex) => {
      scene.classList.toggle("is-active", sceneIndex === index);
    });

    currentScene = index;

    if (currentSceneEl) {
      currentSceneEl.textContent = String(index + 1).padStart(2, "0");
    }

    if (progressBar) {
      const percentage =
        ((index + 1) / totalScenes) * 100;

      progressBar.style.width = `${percentage}%`;
    }

    menuScenes.forEach((item, itemIndex) => {
      item.classList.toggle("is-current", itemIndex === index);
    });

    playSceneSound(index);
  }


  /* =========================================
     TRANSLATION
  ========================================= */

  function getTranslateForScene(index) {
    return -(index * window.innerWidth);
  }


  function applyTransform(value) {
    currentTranslate = value;

    experience.style.transform =
      `translate3d(${value}px, 0, 0)`;
  }


  function goToScene(index, force = false) {
    index = Math.max(
      0,
      Math.min(totalScenes - 1, index)
    );

    if (isMoving && !force) {
      return;
    }

    if (index === currentScene && !force) {
      return;
    }

    isMoving = true;

    currentScene = index;
    targetTranslate = getTranslateForScene(index);

    experience.style.transition =
      "transform 850ms cubic-bezier(.22,.61,.36,1)";

    applyTransform(targetTranslate);

    setSceneActive(index);

    window.setTimeout(() => {
      isMoving = false;
      experience.style.transition = "";
    }, 870);
  }


  /* =========================================
     WHEEL / TRACKPAD
  ========================================= */

  let wheelLocked = false;
  let wheelAccumulator = 0;

  function handleWheel(event) {
    event.preventDefault();

    if (menu.classList.contains("is-open")) {
      return;
    }

    wheelAccumulator +=
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (wheelLocked) {
      return;
    }

    if (Math.abs(wheelAccumulator) < 18) {
      return;
    }

    const direction =
      wheelAccumulator > 0 ? 1 : -1;

    wheelAccumulator = 0;
    wheelLocked = true;

    goToScene(currentScene + direction, true);

    window.setTimeout(() => {
      wheelLocked = false;
    }, 900);
  }

  experience.addEventListener(
    "wheel",
    handleWheel,
    { passive: false }
  );


  /* =========================================
     POINTER DRAG
  ========================================= */

  function handlePointerDown(event) {
    if (menu.classList.contains("is-open")) {
      return;
    }

    pointerDown = true;
    pointerStartX = event.clientX;
    pointerStartTranslate = currentTranslate;

    experience.classList.add("is-dragging");

    experience.style.transition = "";

    unlockAudio();

    try {
      experience.setPointerCapture(event.pointerId);
    } catch (error) {}
  }


  function handlePointerMove(event) {
    if (!pointerDown) {
      return;
    }

    const delta = event.clientX - pointerStartX;

    let next = pointerStartTranslate + delta;

    const minTranslate =
      -((totalScenes - 1) * window.innerWidth);

    next = Math.max(
      minTranslate,
      Math.min(0, next)
    );

    applyTransform(next);
  }


  function handlePointerUp(event) {
    if (!pointerDown) {
      return;
    }

    pointerDown = false;

    experience.classList.remove("is-dragging");

    try {
      experience.releasePointerCapture(event.pointerId);
    } catch (error) {}

    const moved =
      currentTranslate - pointerStartTranslate;

    const threshold =
      Math.min(130, window.innerWidth * 0.18);

    if (Math.abs(moved) > threshold) {

      if (moved < 0) {
        goToScene(currentScene + 1, true);
      } else {
        goToScene(currentScene - 1, true);
      }

    } else {
      goToScene(currentScene, true);
    }
  }


  experience.addEventListener(
    "pointerdown",
    handlePointerDown
  );

  experience.addEventListener(
    "pointermove",
    handlePointerMove
  );

  experience.addEventListener(
    "pointerup",
    handlePointerUp
  );

  experience.addEventListener(
    "pointercancel",
    handlePointerUp
  );


  /* =========================================
     KEYBOARD
  ========================================= */

  document.addEventListener("keydown", (event) => {

    unlockAudio();

    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    if (menu.classList.contains("is-open")) {
      return;
    }

    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown" ||
      event.key === " "
    ) {
      event.preventDefault();
      goToScene(currentScene + 1);
    }

    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();
      goToScene(currentScene - 1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      goToScene(0, true);
    }

    if (event.key === "End") {
      event.preventDefault();
      goToScene(totalScenes - 1, true);
    }
  });


  /* =========================================
     RESIZE
  ========================================= */

  window.addEventListener("resize", () => {
    currentTranslate =
      getTranslateForScene(currentScene);

    targetTranslate = currentTranslate;

    experience.style.transition = "none";

    applyTransform(currentTranslate);

    window.requestAnimationFrame(() => {
      experience.style.transition = "";
    });
  });


  /* =========================================
     MENU
  ========================================= */

  function openMenu() {
    menu.classList.add("is-open");
    menuButton.classList.add("is-open");
    document.body.classList.add("menu-open");

    soundClick();
  }


  function closeMenu() {
    menu.classList.remove("is-open");
    menuButton.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }


  menuButton.addEventListener("click", () => {
    unlockAudio();

    if (menu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });


  menuScenes.forEach((item) => {
    item.addEventListener("click", () => {

      unlockAudio();

      const index =
        Number(item.dataset.scene);

      closeMenu();

      window.setTimeout(() => {
        goToScene(index, true);
      }, 100);
    });
  });


  /* =========================================
     NATURAL AUDIO UNLOCK
  ========================================= */

  [
    "pointerdown",
    "touchstart",
    "keydown"
  ].forEach((eventName) => {
    document.addEventListener(
      eventName,
      unlockAudio,
      {
        passive: true,
        once: false
      }
    );
  });


  /* =========================================
     LOADER
  ========================================= */

  function updateLoaderProgress(value) {
    value = Math.max(0, Math.min(100, value));

    loaderProgress.textContent =
      `${Math.round(value)}%`;

    loaderProgressBar.style.width =
      `${value}%`;
  }


  function runLoaderCheck(index) {

    const item = loaderChecks[index];

    if (!item) {
      return;
    }

    item.classList.add("is-active");

    const state =
      item.querySelector(".check-state");

    if (state) {
      state.textContent = "ПРОВЕРКА";
    }

    soundClick();

    window.setTimeout(() => {

      item.classList.remove("is-active");
      item.classList.add("is-done");

      if (state) {
        state.textContent = "ГОТОВО";
      }

    }, 430);
  }


  function runLoader() {

    updateLoaderProgress(0);

    const checkDuration = 520;
    const totalDuration =
      loaderChecks.length * checkDuration;

    loaderChecks.forEach((item) => {
      item.classList.remove("is-active", "is-done");

      const state =
        item.querySelector(".check-state");

      if (state) {
        state.textContent = "ОЖИДАНИЕ";
      }
    });

    loaderReady.classList.remove("is-visible");

    loaderChecks.forEach((_, index) => {

      window.setTimeout(() => {

        runLoaderCheck(index);

        const progress =
          ((index + 1) / loaderChecks.length) * 100;

        updateLoaderProgress(progress);

      }, index * checkDuration);
    });

    window.setTimeout(() => {

      loaderReady.classList.add("is-visible");

      soundReady();

    }, totalDuration + 180);

    window.setTimeout(() => {

      loader.classList.add("is-hidden");

    }, totalDuration + 950);
  }


  /* =========================================
     INITIAL STATE
  ========================================= */

  setSceneActive(0);

  currentTranslate = 0;
  targetTranslate = 0;

  experience.style.transition = "none";
  applyTransform(0);

  window.setTimeout(() => {
    experience.style.transition = "";
  }, 100);

  runLoader();

})();
