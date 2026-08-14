(() => {
  "use strict";


  /* =========================================
     ELEMENTS
  ========================================= */

  const experience =
    document.getElementById("experience");

  const scenes =
    [...document.querySelectorAll(".scene")];

  const loader =
    document.getElementById("loader");

  const loaderProgress =
    document.getElementById("loaderProgress");

  const loaderProgressBar =
    document.getElementById("loaderProgressBar");

  const loaderReady =
    document.getElementById("loaderReady");

  const loaderChecks =
    [...document.querySelectorAll(".loader-check")];

  const currentSceneEl =
    document.getElementById("currentScene");

  const progressBar =
    document.getElementById("progressBar");

  const clock =
    document.getElementById("clock");

  const menu =
    document.getElementById("menu");

  const menuButton =
    document.getElementById("menuButton");

  const menuScenes =
    [...document.querySelectorAll(".menu-scene")];


  /* =========================================
     STATE
  ========================================= */

  const totalScenes =
    scenes.length;

  let currentScene = 0;

  let currentTranslate = 0;

  let isDragging = false;

  let dragStartX = 0;

  let dragStartTranslate = 0;

  let wheelTimeout = null;

  let audioContext = null;

  let audioUnlocked = false;

  let lastSceneSound = -1;


  /* =========================================
     AUDIO
  ========================================= */

  function initAudio() {

    if (audioContext) {
      return audioContext;
    }

    try {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return null;
      }

      audioContext =
        new AudioContext();

      return audioContext;

    } catch (error) {

      return null;
    }
  }


  function unlockAudio() {

    const ctx =
      initAudio();

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

    const ctx =
      initAudio();

    if (!ctx || !audioUnlocked) {
      return;
    }

    try {

      const now =
        ctx.currentTime + delay;

      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

      oscillator.type =
        type;

      oscillator.frequency.setValueAtTime(
        frequency,
        now
      );

      gain.gain.setValueAtTime(
        0.0001,
        now
      );

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

      oscillator.stop(
        now + duration + 0.025
      );

    } catch (error) {}
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

    if (!clock) {
      return;
    }

    const now =
      new Date();

    const hours =
      String(now.getHours())
        .padStart(2, "0");

    const minutes =
      String(now.getMinutes())
        .padStart(2, "0");

    const seconds =
      String(now.getSeconds())
        .padStart(2, "0");

    clock.textContent =
      `${hours}:${minutes}:${seconds}`;
  }

  updateClock();

  window.setInterval(
    updateClock,
    1000
  );


  /* =========================================
     SCENE POSITION
  ========================================= */

  function getSceneTranslate(index) {

    return -(
      index *
      window.innerWidth
    );
  }


  function updateSceneUI(index) {

    currentScene = index;

    if (currentSceneEl) {

      currentSceneEl.textContent =
        String(index + 1)
          .padStart(2, "0");
    }

    if (progressBar) {

      progressBar.style.width =
        `${((index + 1) / totalScenes) * 100}%`;
    }

    menuScenes.forEach(
      (item, itemIndex) => {

        item.classList.toggle(
          "is-current",
          itemIndex === index
        );

      }
    );
  }


  function activateScene(index) {

    scenes.forEach(
      (scene, sceneIndex) => {

        scene.classList.toggle(
          "is-active",
          sceneIndex === index
        );

      }
    );

    updateSceneUI(index);

    playSceneSound(index);
  }


  function setTranslate(value) {

    currentTranslate =
      value;

    experience.style.transform =
      `translate3d(${value}px, 0, 0)`;
  }


  /* =========================================
     MAIN NAVIGATION
  ========================================= */

  function goToScene(index) {

    const nextIndex =
      Math.max(
        0,
        Math.min(
          totalScenes - 1,
          index
        )
      );

    const nextTranslate =
      getSceneTranslate(nextIndex);

    currentScene =
      nextIndex;

    experience.style.transition =
      "transform 780ms cubic-bezier(.22,.61,.36,1)";

    setTranslate(
      nextTranslate
    );

    activateScene(
      nextIndex
    );

    window.clearTimeout(
      goToScene.transitionTimer
    );

    goToScene.transitionTimer =
      window.setTimeout(() => {

        experience.style.transition =
          "";

      }, 820);
  }


  /* =========================================
     WHEEL / TRACKPAD
  ========================================= */

  function handleWheel(event) {

    if (
      menu.classList.contains("is-open")
    ) {
      return;
    }

    event.preventDefault();

    unlockAudio();

    if (wheelTimeout) {
      return;
    }

    const delta =
      Math.abs(event.deltaX) >
      Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (Math.abs(delta) < 4) {
      return;
    }

    const direction =
      delta > 0
        ? 1
        : -1;

    goToScene(
      currentScene + direction
    );

    wheelTimeout =
      window.setTimeout(() => {

        wheelTimeout = null;

      }, 650);
  }


  window.addEventListener(
    "wheel",
    handleWheel,
    {
      passive: false
    }
  );


  /* =========================================
     MOUSE / TOUCH DRAG
  ========================================= */

  function pointerDown(event) {

    if (
      menu.classList.contains("is-open")
    ) {
      return;
    }

    isDragging = true;

    dragStartX =
      event.clientX;

    dragStartTranslate =
      currentTranslate;

    experience.classList.add(
      "is-dragging"
    );

    experience.style.transition =
      "none";

    unlockAudio();

    try {

      experience.setPointerCapture(
        event.pointerId
      );

    } catch (error) {}
  }


  function pointerMove(event) {

    if (!isDragging) {
      return;
    }

    const delta =
      event.clientX -
      dragStartX;

    const minTranslate =
      -(
        (totalScenes - 1) *
        window.innerWidth
      );

    let next =
      dragStartTranslate +
      delta;

    next =
      Math.max(
        minTranslate,
        Math.min(
          0,
          next
        )
      );

    setTranslate(next);
  }


  function pointerUp(event) {

    if (!isDragging) {
      return;
    }

    isDragging = false;

    experience.classList.remove(
      "is-dragging"
    );

    try {

      experience.releasePointerCapture(
        event.pointerId
      );

    } catch (error) {}

    const delta =
      currentTranslate -
      dragStartTranslate;

    const threshold =
      Math.max(
        45,
        Math.min(
          150,
          window.innerWidth * 0.16
        )
      );

    if (
      Math.abs(delta) >
      threshold
    ) {

      if (delta < 0) {

        goToScene(
          currentScene + 1
        );

      } else {

        goToScene(
          currentScene - 1
        );
      }

      return;
    }

    goToScene(
      currentScene
    );
  }


  experience.addEventListener(
    "pointerdown",
    pointerDown
  );

  experience.addEventListener(
    "pointermove",
    pointerMove
  );

  experience.addEventListener(
    "pointerup",
    pointerUp
  );

  experience.addEventListener(
    "pointercancel",
    pointerUp
  );


  /* =========================================
     KEYBOARD
  ========================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      unlockAudio();

      if (
        event.key === "Escape"
      ) {

        closeMenu();

        return;
      }

      if (
        menu.classList.contains("is-open")
      ) {
        return;
      }

      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown" ||
        event.key === " "
      ) {

        event.preventDefault();

        goToScene(
          currentScene + 1
        );
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp"
      ) {

        event.preventDefault();

        goToScene(
          currentScene - 1
        );
      }

      if (
        event.key === "Home"
      ) {

        event.preventDefault();

        goToScene(0);
      }

      if (
        event.key === "End"
      ) {

        event.preventDefault();

        goToScene(
          totalScenes - 1
        );
      }

    }
  );


  /* =========================================
     RESIZE
  ========================================= */

  window.addEventListener(
    "resize",
    () => {

      const translate =
        getSceneTranslate(
          currentScene
        );

      experience.style.transition =
        "none";

      setTranslate(
        translate
      );

      window.requestAnimationFrame(
        () => {

          experience.style.transition =
            "";

        }
      );

    }
  );


  /* =========================================
     MENU
  ========================================= */

  function openMenu() {

    unlockAudio();

    menu.classList.add(
      "is-open"
    );

    menuButton.classList.add(
      "is-open"
    );

    soundClick();
  }


  function closeMenu() {

    menu.classList.remove(
      "is-open"
    );

    menuButton.classList.remove(
      "is-open"
    );
  }


  menuButton.addEventListener(
    "click",
    () => {

      unlockAudio();

      if (
        menu.classList.contains("is-open")
      ) {

        closeMenu();

      } else {

        openMenu();
      }

    }
  );


  menuScenes.forEach(
    (item) => {

      item.addEventListener(
        "click",
        () => {

          unlockAudio();

          const index =
            Number(
              item.dataset.scene
            );

          closeMenu();

          window.setTimeout(
            () => {

              goToScene(index);

            },
            100
          );

        }
      );

    }
  );


  /* =========================================
     AUDIO UNLOCK
  ========================================= */

  [
    "pointerdown",
    "touchstart",
    "keydown"
  ].forEach(
    (eventName) => {

      document.addEventListener(
        eventName,
        unlockAudio,
        {
          passive: true
        }
      );

    }
  );


  /* =========================================
     LOADER
  ========================================= */

  function updateLoaderProgress(
    value
  ) {

    const safeValue =
      Math.max(
        0,
        Math.min(
          100,
          value
        )
      );

    loaderProgress.textContent =
      `${Math.round(safeValue)}%`;

    loaderProgressBar.style.width =
      `${safeValue}%`;
  }


  function runLoaderCheck(
    index
  ) {

    const item =
      loaderChecks[index];

    if (!item) {
      return;
    }

    item.classList.add(
      "is-active"
    );

    const state =
      item.querySelector(
        ".check-state"
      );

    if (state) {
      state.textContent =
        "ПРОВЕРКА";
    }

    soundClick();

    window.setTimeout(
      () => {

        item.classList.remove(
          "is-active"
        );

        item.classList.add(
          "is-done"
        );

        if (state) {

          state.textContent =
            "ГОТОВО";
        }

      },
      430
    );
  }


  function runLoader() {

    updateLoaderProgress(0);

    loaderChecks.forEach(
      (item) => {

        item.classList.remove(
          "is-active",
          "is-done"
        );

        const state =
          item.querySelector(
            ".check-state"
          );

        if (state) {

          state.textContent =
            "ОЖИДАНИЕ";
        }

      }
    );

    loaderReady.classList.remove(
      "is-visible"
    );

    const interval =
      520;

    loaderChecks.forEach(
      (_, index) => {

        window.setTimeout(
          () => {

            runLoaderCheck(
              index
            );

            updateLoaderProgress(
              ((index + 1) /
                loaderChecks.length) *
                100
            );

          },
          index * interval
        );

      }
    );

    window.setTimeout(
      () => {

        loaderReady.classList.add(
          "is-visible"
        );

        soundReady();

      },
      loaderChecks.length *
        interval +
        180
    );

    window.setTimeout(
      () => {

        loader.classList.add(
          "is-hidden"
        );

      },
      loaderChecks.length *
        interval +
        950
    );
  }


  /* =========================================
     INITIALIZATION
  ========================================= */

  setTranslate(0);

  activateScene(0);

  runLoader();

})();
