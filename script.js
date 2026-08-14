(() => {
  "use strict";


  /* =========================================================
     DOM
  ========================================================== */

  const loader = document.getElementById("loader");

  const loaderProgress =
    document.getElementById("loaderProgress");

  const loaderPercent =
    document.getElementById("loaderPercent");

  const loaderState =
    document.getElementById("loaderState");

  const loaderReady =
    document.getElementById("loaderReady");

  const track =
    document.getElementById("track");

  const experience =
    document.getElementById("experience");

  const sceneCurrent =
    document.getElementById("sceneCurrent");

  const sceneProgress =
    document.getElementById("sceneProgress");

  const sceneHint =
    document.getElementById("sceneHint");

  const headerTime =
    document.getElementById("headerTime");

  const menuButton =
    document.getElementById("menuButton");

  const mobileMenu =
    document.getElementById("mobileMenu");

  const soundControl =
    document.getElementById("soundControl");

  const soundLabel =
    document.getElementById("soundLabel");

  const scenes =
    [...document.querySelectorAll(".scene")];

  const navigationButtons =
    [...document.querySelectorAll("[data-go-scene]")];


  /* =========================================================
     STATE
  ========================================================== */

  const SCENE_COUNT = 8;

  let currentScene = 0;
  let targetScene = 0;

  let isAnimating = false;
  let animationFrame = null;

  let pointerDown = false;

  let pointerStartX = 0;
  let pointerCurrentX = 0;
  let pointerStartScene = 0;

  let wheelLocked = false;
  let wheelTimer = null;

  let loaderFinished = false;
  let loaderStarted = false;

  let soundEnabled = true;
  let audioUnlocked = false;
  let audioContext = null;

  let scannerSoundTimer = null;
  let networkSoundTimer = null;

  let parallaxPointerActive = false;


  /* =========================================================
     CLOCK
  ========================================================== */

  function updateClock() {

    const now = new Date();

    const h =
      String(now.getHours()).padStart(2, "0");

    const m =
      String(now.getMinutes()).padStart(2, "0");

    const s =
      String(now.getSeconds()).padStart(2, "0");

    if (headerTime) {
      headerTime.textContent =
        `${h}:${m}:${s}`;
    }

  }

  updateClock();

  setInterval(updateClock, 1000);


  /* =========================================================
     AUDIO
  ========================================================== */

  function getAudioContext() {

    if (!audioContext) {

      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioCtx) {
        return null;
      }

      audioContext =
        new AudioCtx();
    }

    return audioContext;
  }


  async function unlockAudio() {

    if (!soundEnabled) return;

    const ctx =
      getAudioContext();

    if (!ctx) return;

    try {

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      audioUnlocked =
        ctx.state === "running";

    } catch (error) {

      audioUnlocked = false;

    }

  }


  function nowTime() {

    return (
      getAudioContext()?.currentTime ||
      0
    );

  }


  function makeGain(
    value,
    duration = 0.2
  ) {

    const ctx =
      getAudioContext();

    if (
      !ctx ||
      !audioUnlocked ||
      !soundEnabled
    ) {
      return null;
    }

    const gain =
      ctx.createGain();

    gain.gain.setValueAtTime(
      0.0001,
      nowTime()
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(value, 0.0002),
      nowTime() + duration
    );

    gain.connect(
      ctx.destination
    );

    return gain;
  }


  function tone({
    frequency = 440,
    duration = 0.12,
    volume = 0.035,
    type = "sine",
    endFrequency = null
  } = {}) {

    const ctx =
      getAudioContext();

    if (
      !ctx ||
      !audioUnlocked ||
      !soundEnabled
    ) {
      return;
    }

    const oscillator =
      ctx.createOscillator();

    const gain =
      makeGain(volume, 0.015);

    if (!gain) return;

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      nowTime()
    );

    if (endFrequency) {

      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(endFrequency, 20),
        nowTime() + duration
      );

    }

    oscillator.connect(gain);

    const end =
      nowTime() + duration;

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      end
    );

    oscillator.start(
      nowTime()
    );

    oscillator.stop(
      end + 0.03
    );

  }


  function filteredTone({
    frequency = 300,
    duration = 0.15,
    volume = 0.03
  } = {}) {

    const ctx =
      getAudioContext();

    if (
      !ctx ||
      !audioUnlocked ||
      !soundEnabled
    ) {
      return;
    }

    const osc =
      ctx.createOscillator();

    const filter =
      ctx.createBiquadFilter();

    const gain =
      ctx.createGain();

    osc.type = "triangle";

    osc.frequency.setValueAtTime(
      frequency,
      nowTime()
    );

    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = .7;

    gain.gain.setValueAtTime(
      0.0001,
      nowTime()
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      nowTime() + .02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      nowTime() + duration
    );

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    osc.stop(
      nowTime() + duration + .03
    );

  }


  function noiseBurst({
    duration = .15,
    volume = .025,
    frequency = 1200
  } = {}) {

    const ctx =
      getAudioContext();

    if (
      !ctx ||
      !audioUnlocked ||
      !soundEnabled
    ) {
      return;
    }

    const bufferSize =
      Math.floor(
        ctx.sampleRate * duration
      );

    const buffer =
      ctx.createBuffer(
        1,
        bufferSize,
        ctx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (
      let i = 0;
      i < bufferSize;
      i++
    ) {
      data[i] =
        Math.random() * 2 - 1;
    }

    const source =
      ctx.createBufferSource();

    const filter =
      ctx.createBiquadFilter();

    const gain =
      ctx.createGain();

    source.buffer = buffer;

    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(
      0.0001,
      nowTime()
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      nowTime() + .015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      nowTime() + duration
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();

  }


  function mechanicalClick() {

    filteredTone({
      frequency: 170,
      duration: .055,
      volume: .04
    });

    setTimeout(() => {

      filteredTone({
        frequency: 280,
        duration: .035,
        volume: .025
      });

    }, 45);

  }


  function soundBoot() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    filteredTone({
      frequency: 90,
      duration: .35,
      volume: .025
    });

    setTimeout(() => {

      tone({
        frequency: 180,
        duration: .16,
        volume: .018,
        type: "sine",
        endFrequency: 230
      });

    }, 180);

  }


  function soundCheck(index) {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    const frequencies = [
      330,
      280,
      390,
      300,
      440
    ];

    mechanicalClick();

    setTimeout(() => {

      tone({
        frequency:
          frequencies[index] || 330,

        duration: .09,

        volume: .018,

        type: "sine"
      });

    }, 90);

  }


  function soundReady() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    tone({
      frequency: 260,
      duration: .18,
      volume: .025,
      type: "sine",
      endFrequency: 330
    });

    setTimeout(() => {

      tone({
        frequency: 520,
        duration: .25,
        volume: .018,
        type: "sine"
      });

    }, 120);

  }


  function soundTransition() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    noiseBurst({
      duration: .12,
      volume: .012,
      frequency: 850
    });

    tone({
      frequency: 110,
      duration: .11,
      volume: .018,
      type: "sine",
      endFrequency: 70
    });

  }


  function startScannerSound() {

    stopScannerSound();

    if (
      !audioUnlocked ||
      !soundEnabled
    ) {
      return;
    }

    const ctx =
      getAudioContext();

    if (!ctx) return;

    const osc =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    const filter =
      ctx.createBiquadFilter();

    osc.type = "sine";

    osc.frequency.setValueAtTime(
      150,
      nowTime()
    );

    osc.frequency.exponentialRampToValueAtTime(
      720,
      nowTime() + 1.8
    );

    osc.frequency.exponentialRampToValueAtTime(
      190,
      nowTime() + 3.2
    );

    gain.gain.setValueAtTime(
      0.0001,
      nowTime()
    );

    gain.gain.exponentialRampToValueAtTime(
      .018,
      nowTime() + .25
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      nowTime() + 3.3
    );

    filter.type = "lowpass";
    filter.frequency.value = 1100;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    osc.stop(
      nowTime() + 3.4
    );

    scannerSoundTimer =
      setTimeout(() => {

        tone({
          frequency: 690,
          duration: .08,
          volume: .022,
          type: "sine"
        });

      }, 1650);

  }


  function stopScannerSound() {

    if (scannerSoundTimer) {

      clearTimeout(
        scannerSoundTimer
      );

      scannerSoundTimer = null;
    }

  }


  function soundDetection() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    tone({
      frequency: 105,
      duration: .2,
      volume: .035,
      type: "triangle",
      endFrequency: 75
    });

    setTimeout(() => {
      mechanicalClick();
    }, 180);

    setTimeout(() => {

      tone({
        frequency: 360,
        duration: .1,
        volume: .018,
        type: "sine"
      });

    }, 300);

  }


  function soundAccess() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    tone({
      frequency: 640,
      duration: .08,
      volume: .022,
      type: "sine"
    });

    setTimeout(() => {

      tone({
        frequency: 920,
        duration: .13,
        volume: .025,
        type: "sine"
      });

    }, 90);

  }


  function soundAlert() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    tone({
      frequency: 78,
      duration: .4,
      volume: .045,
      type: "triangle",
      endFrequency: 62
    });

    setTimeout(() => {

      filteredTone({
        frequency: 140,
        duration: .12,
        volume: .025
      });

    }, 220);

  }


  function soundMaintenance() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    mechanicalClick();

    setTimeout(() => {

      filteredTone({
        frequency: 210,
        duration: .08,
        volume: .022
      });

    }, 220);

  }


  function soundNetwork() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    const tones = [
      260,
      340,
      410,
      500
    ];

    const index =
      Math.floor(
        Date.now() / 700
      ) % tones.length;

    tone({
      frequency: tones[index],
      duration: .06,
      volume: .012,
      type: "sine"
    });

  }


  function soundFinal() {

    if (
      !audioUnlocked ||
      !soundEnabled
    ) return;

    tone({
      frequency: 220,
      duration: .2,
      volume: .02,
      type: "sine",
      endFrequency: 280
    });

    setTimeout(() => {

      tone({
        frequency: 440,
        duration: .3,
        volume: .015,
        type: "sine"
      });

    }, 150);

  }


  function playSceneSound(index) {

    stopScannerSound();

    if (
      networkSoundTimer
    ) {
      clearInterval(
        networkSoundTimer
      );

      networkSoundTimer = null;
    }

    if (
      !soundEnabled ||
      !audioUnlocked
    ) {
      return;
    }

    switch (index) {

      case 0:
        mechanicalClick();
        break;

      case 1:
        startScannerSound();
        break;

      case 2:
        soundDetection();
        break;

      case 3:
        soundAccess();
        break;

      case 4:
        soundAlert();
        break;

      case 5:
        soundMaintenance();
        break;

      case 6:

        soundNetwork();

        networkSoundTimer =
          setInterval(() => {

            if (
              currentScene === 6
            ) {
              soundNetwork();
            }

          }, 1300);

        break;

      case 7:
        soundFinal();
        break;

    }

  }


  /* =========================================================
     SOUND CONTROL
  ========================================================== */

  function updateSoundControl() {

    if (
      !soundControl ||
      !soundLabel
    ) {
      return;
    }

    soundControl.classList.toggle(
      "is-off",
      !soundEnabled
    );

    soundLabel.textContent =
      soundEnabled
        ? "ЗВУК / ON"
        : "ЗВУК / OFF";
  }

  updateSoundControl();


  soundControl?.addEventListener(
    "click",
    async (event) => {

      event.stopPropagation();

      soundEnabled =
        !soundEnabled;

      updateSoundControl();

      if (soundEnabled) {

        await unlockAudio();

        if (audioUnlocked) {

          mechanicalClick();

          playSceneSound(
            currentScene
          );

        }

      } else {

        stopScannerSound();

        if (networkSoundTimer) {

          clearInterval(
            networkSoundTimer
          );

          networkSoundTimer = null;
        }

      }

    }
  );


  /* =========================================================
     LOADER
  ========================================================== */

  const loaderTexts = [
    "ПРОВЕРКА ВИДЕОНАБЛЮДЕНИЯ",
    "ПРОВЕРКА ПОЖАРНОЙ БЕЗОПАСНОСТИ",
    "ПРОВЕРКА СКУД",
    "ПРОВЕРКА СОСТОЯНИЯ ОБЪЕКТА",
    "СИНХРОНИЗАЦИЯ ЦЕНТРА КОНТРОЛЯ"
  ];


  function setLoaderProgress(percent) {

    const value =
      Math.max(
        0,
        Math.min(100, percent)
      );

    if (loaderProgress) {

      loaderProgress.style.width =
        `${value}%`;

    }

    if (loaderPercent) {

      loaderPercent.textContent =
        `${String(
          Math.round(value)
        ).padStart(2, "0")}%`;

    }

  }


  function activateLoaderCheck(index) {

    const checks =
      document.querySelectorAll(
        ".loader-check"
      );

    checks.forEach(
      (check, i) => {

        check.classList.remove(
          "active"
        );

        if (i < index) {
          check.classList.add(
            "done"
          );
        }

        if (i === index) {
          check.classList.add(
            "active"
          );
        }

      }
    );

    if (loaderState) {

      loaderState.textContent =
        loaderTexts[index] ||
        "СИНХРОНИЗАЦИЯ";

    }

  }


  function finishLoader() {

    loaderFinished = true;

    setLoaderProgress(100);

    document
      .querySelectorAll(
        ".loader-check"
      )
      .forEach(check => {

        check.classList.remove(
          "active"
        );

        check.classList.add(
          "done"
        );

      });

    if (loaderState) {
      loaderState.textContent =
        "СИСТЕМА ГОТОВА";
    }

    if (loaderReady) {
      loaderReady.textContent =
        "ONLINE";
    }

    soundReady();

    setTimeout(() => {

      loader.classList.add(
        "is-hidden"
      );

      document.body.classList.add(
        "system-ready"
      );

      playSceneSound(0);

    }, 850);

  }


  function startLoader() {

    if (
      loaderStarted ||
      loaderFinished
    ) {
      return;
    }

    loaderStarted = true;

    soundBoot();

    let step = 0;
    let progress = 0;

    activateLoaderCheck(0);

    const timer =
      setInterval(() => {

        progress += 2.5;

        setLoaderProgress(
          progress
        );

        const expectedStep =
          Math.min(
            loaderTexts.length - 1,
            Math.floor(
              progress / 20
            )
          );

        if (
          expectedStep !== step
        ) {

          step =
            expectedStep;

          activateLoaderCheck(
            step
          );

          soundCheck(
            step
          );

        }

        if (
          progress >= 100
        ) {

          clearInterval(timer);

          finishLoader();

        }

      }, 105);

  }


  /*
    ВАЖНО:
    Кнопки активации больше нет.

    Loader стартует автоматически.
    Если браузер разрешает Web Audio,
    звук работает сразу.

    Если браузер блокирует звук до user gesture,
    первый touch / click / key автоматически
    разблокирует AudioContext.
  */

  async function handleFirstGesture() {

    await unlockAudio();

    if (
      audioUnlocked &&
      loaderStarted &&
      !loaderFinished
    ) {
      /*
        Loader уже идёт.
        Ничего перезапускаем.
      */
    }

  }


  document.addEventListener(
    "pointerdown",
    handleFirstGesture,
    {
      passive: true
    }
  );

  document.addEventListener(
    "keydown",
    handleFirstGesture
  );


  window.addEventListener(
    "load",
    () => {

      setTimeout(() => {

        /*
          Loader теперь запускается
          независимо от AudioContext.
        */

        startLoader();

        /*
          Пытаемся получить audio context
          заранее, но не блокируем loader.
        */

        getAudioContext();

      }, 180);

    }
  );


  /* =========================================================
     SCENE POSITION
  ========================================================== */

  function clampScene(index) {

    return Math.max(
      0,
      Math.min(
        SCENE_COUNT - 1,
        index
      )
    );

  }


  function updateHash(index) {

    const hash =
      `#scene-${index + 1}`;

    if (
      window.location.hash !== hash
    ) {

      history.replaceState(
        null,
        "",
        hash
      );

    }

  }


  function updateSceneUI() {

    if (sceneCurrent) {

      sceneCurrent.textContent =
        String(
          currentScene + 1
        ).padStart(2, "0");

    }

    if (sceneProgress) {

      sceneProgress.style.width =
        `${(
          (currentScene + 1) /
          SCENE_COUNT
        ) * 100}%`;

    }

    if (sceneHint) {

      if (currentScene === 0) {

        sceneHint.textContent =
          "СВАЙПНИТЕ ИЛИ ПЕРЕМЕЩАЙТЕ КУРСОР";

      } else if (
        currentScene === SCENE_COUNT - 1
      ) {

        sceneHint.textContent =
          "ОБЪЕКТ ГОТОВ";

      } else {

        sceneHint.textContent =
          "ПРОДОЛЖИТЬ";

      }

    }

    navigationButtons.forEach(
      (button) => {

        const index =
          Number(
            button.dataset.goScene
          );

        button.classList.toggle(
          "is-current",
          index === currentScene
        );

      }
    );

  }


  function activateScene(index) {

    scenes.forEach(
      (scene, i) => {

        scene.classList.toggle(
          "is-active",
          i === index
        );

      }
    );

    playSceneSound(index);

  }


  function renderSceneImmediate(index) {

    const safeIndex =
      clampScene(index);

    currentScene =
      safeIndex;

    targetScene =
      safeIndex;

    track.style.transform =
      `translate3d(
        ${-safeIndex * 100}vw,
        0,
        0
      )`;

    updateSceneUI();

    activateScene(
      safeIndex
    );

  }


  function animateToScene(
    index,
    options = {}
  ) {

    const safeIndex =
      clampScene(index);

    targetScene =
      safeIndex;

    if (isAnimating) {
      return;
    }

    if (
      safeIndex === currentScene
    ) {

      track.style.transform =
        `translate3d(
          ${-safeIndex * 100}vw,
          0,
          0
        )`;

      return;
    }

    isAnimating = true;

    const startScene =
      currentScene;

    const endScene =
      safeIndex;

    const start =
      performance.now();

    const duration =
      options.duration || 650;

    soundTransition();

    function frame(now) {

      const elapsed =
        now - start;

      const raw =
        Math.min(
          1,
          elapsed / duration
        );

      const eased =
        1 -
        Math.pow(
          1 - raw,
          4
        );

      const value =
        startScene +
        (
          endScene -
          startScene
        ) * eased;

      track.style.transform =
        `translate3d(
          ${-value * 100}vw,
          0,
          0
        )`;

      if (raw < 1) {

        animationFrame =
          requestAnimationFrame(
            frame
          );

      } else {

        currentScene =
          endScene;

        track.style.transform =
          `translate3d(
            ${-endScene * 100}vw,
            0,
            0
          )`;

        isAnimating = false;

        animationFrame = null;

        updateSceneUI();

        updateHash(
          endScene
        );

        activateScene(
          endScene
        );

      }

    }

    animationFrame =
      requestAnimationFrame(
        frame
      );

  }


  function nextScene() {

    if (isAnimating) return;

    animateToScene(
      currentScene + 1
    );

  }


  function previousScene() {

    if (isAnimating) return;

    animateToScene(
      currentScene - 1
    );

  }


  /* =========================================================
     WHEEL / TRACKPAD
  ========================================================== */

  experience.addEventListener(
    "wheel",
    (event) => {

      event.preventDefault();

      if (
        wheelLocked ||
        isAnimating ||
        mobileMenu?.classList.contains(
          "is-open"
        )
      ) {
        return;
      }

      const delta =
        Math.abs(event.deltaX) >
        Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (
        Math.abs(delta) < 8
      ) {
        return;
      }

      wheelLocked = true;

      if (delta > 0) {
        nextScene();
      } else {
        previousScene();
      }

      clearTimeout(
        wheelTimer
      );

      wheelTimer =
        setTimeout(() => {

          wheelLocked = false;

        }, 720);

    },
    {
      passive: false
    }
  );


  /* =========================================================
     POINTER DRAG
  ========================================================== */

  experience.addEventListener(
    "pointerdown",
    (event) => {

      if (
        event.pointerType === "mouse" &&
        event.button !== 0
      ) {
        return;
      }

      if (
        mobileMenu?.classList.contains(
          "is-open"
        )
      ) {
        return;
      }

      pointerDown = true;

      pointerStartX =
        event.clientX;

      pointerCurrentX =
        event.clientX;

      pointerStartScene =
        currentScene;

      experience.setPointerCapture?.(
        event.pointerId
      );

    }
  );


  experience.addEventListener(
    "pointermove",
    (event) => {

      if (
        !pointerDown ||
        isAnimating
      ) {
        return;
      }

      pointerCurrentX =
        event.clientX;

      const delta =
        pointerCurrentX -
        pointerStartX;

      const width =
        window.innerWidth;

      const movement =
        delta / width;

      let visualScene =
        pointerStartScene -
        movement;

      visualScene =
        Math.max(
          0,
          Math.min(
            SCENE_COUNT - 1,
            visualScene
          )
        );

      track.style.transform =
        `translate3d(
          ${-visualScene * 100}vw,
          0,
          0
        )`;

    }
  );


  function finishPointerDrag() {

    if (!pointerDown) {
      return;
    }

    pointerDown = false;

    const delta =
      pointerCurrentX -
      pointerStartX;

    const threshold =
      Math.max(
        45,
        window.innerWidth * .08
      );

    if (
      Math.abs(delta) >
      threshold
    ) {

      if (delta < 0) {
        animateToScene(
          pointerStartScene + 1
        );
      } else {
        animateToScene(
          pointerStartScene - 1
        );
      }

    } else {

      animateToScene(
        pointerStartScene
      );

    }

  }


  experience.addEventListener(
    "pointerup",
    finishPointerDrag
  );

  experience.addEventListener(
    "pointercancel",
    finishPointerDrag
  );

  experience.addEventListener(
    "lostpointercapture",
    finishPointerDrag
  );


  /* =========================================================
     KEYBOARD
  ========================================================== */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "ArrowRight"
      ) {

        event.preventDefault();

        nextScene();

      }

      if (
        event.key === "ArrowLeft"
      ) {

        event.preventDefault();

        previousScene();

      }

      if (
        event.key === "Home"
      ) {

        event.preventDefault();

        animateToScene(0);

      }

      if (
        event.key === "End"
      ) {

        event.preventDefault();

        animateToScene(
          SCENE_COUNT - 1
        );

      }

      if (
        event.key === "Escape"
      ) {

        closeMobileMenu();

      }

    }
  );


  /* =========================================================
     MOBILE MENU
  ========================================================== */

  function openMobileMenu() {

    if (!mobileMenu) return;

    mobileMenu.classList.add(
      "is-open"
    );

    menuButton?.classList.add(
      "is-open"
    );

    menuButton?.setAttribute(
      "aria-expanded",
      "true"
    );

    mobileMenu.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  function closeMobileMenu() {

    if (!mobileMenu) return;

    mobileMenu.classList.remove(
      "is-open"
    );

    menuButton?.classList.remove(
      "is-open"
    );

    menuButton?.setAttribute(
      "aria-expanded",
      "false"
    );

    mobileMenu.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  menuButton?.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      if (
        mobileMenu.classList.contains(
          "is-open"
        )
      ) {

        closeMobileMenu();

      } else {

        openMobileMenu();

      }

    }
  );


  navigationButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.goScene
            );

          closeMobileMenu();

          /*
            Небольшая задержка нужна только
            чтобы меню успело закрыться визуально.
          */

          setTimeout(() => {

            animateToScene(
              index
            );

          }, 60);

        }
      );

    }
  );


  mobileMenu?.addEventListener(
    "click",
    (event) => {

      if (
        event.target === mobileMenu
      ) {

        closeMobileMenu();

      }

    }
  );


  /* =========================================================
     PARALLAX
  ========================================================== */

  function setupParallax() {

    scenes.forEach(
      (scene) => {

        const image =
          scene.querySelector(
            ".media-frame img"
          );

        if (!image) {
          return;
        }

        scene.addEventListener(
          "pointermove",
          (event) => {

            if (
              window.innerWidth < 901 ||
              pointerDown ||
              isAnimating
            ) {
              return;
            }

            const rect =
              scene.getBoundingClientRect();

            const x =
              (
                event.clientX -
                rect.left
              ) / rect.width;

            const y =
              (
                event.clientY -
                rect.top
              ) / rect.height;

            const px =
              (x - .5) * -4;

            const py =
              (y - .5) * -2;

            image.style.transform =
              `scale(1.018)
               translate3d(
                 ${px}px,
                 ${py}px,
                 0
               )`;

            parallaxPointerActive = true;

          }
        );


        scene.addEventListener(
          "pointerleave",
          () => {

            image.style.transform =
              "scale(1.018) translate3d(0,0,0)";

            parallaxPointerActive =
              false;

          }
        );

      }
    );

  }


  setupParallax();


  /* =========================================================
     RESIZE
  ========================================================== */

  window.addEventListener(
    "resize",
    () => {

      if (
        !isAnimating &&
        !pointerDown
      ) {

        renderSceneImmediate(
          currentScene
        );

      }

    }
  );


  /* =========================================================
     HASH
  ========================================================== */

  function readHash() {

    const match =
      window.location.hash.match(
        /scene-(\d+)/
      );

    if (!match) {
      return false;
    }

    const value =
      parseInt(
        match[1],
        10
      );

    if (
      Number.isFinite(value) &&
      value >= 1 &&
      value <= SCENE_COUNT
    ) {

      renderSceneImmediate(
        value - 1
      );

      return true;

    }

    return false;

  }


  window.addEventListener(
    "hashchange",
    readHash
  );


  /* =========================================================
     INIT
  ========================================================== */

  const hasHash =
    readHash();

  if (!hasHash) {

    renderSceneImmediate(
      0
    );

  }

  updateSceneUI();

})();
