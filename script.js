(() => {
  "use strict";


  /* =====================================================
     ELEMENTS
  ===================================================== */

  const loader = document.getElementById("loader");
  const loaderProgress = document.getElementById("loaderProgress");
  const loaderPercent = document.getElementById("loaderPercent");

  const loaderChecks = [
    ...document.querySelectorAll(".loader-check")
  ];

  const loaderFinal = document.getElementById("loaderFinal");

  const site = document.getElementById("site");
  const experience = document.getElementById("experience");
  const track = document.getElementById("track");

  const scenes = [
    ...document.querySelectorAll(".scene")
  ];

  const liveDate =
    document.getElementById("liveDate");

  const liveTime =
    document.getElementById("liveTime");

  const progressCurrent =
    document.getElementById("progressCurrent");

  const progressFill =
    document.getElementById("progressFill");

  const navigationHint =
    document.getElementById("navigationHint");

  const menuButton =
    document.getElementById("menuButton");

  const mobileMenu =
    document.getElementById("mobileMenu");

  const mobileButtons = [
    ...document.querySelectorAll("[data-go]")
  ];


  /* =====================================================
     STATE
  ===================================================== */

  let currentIndex = 0;

  let isAnimating = false;
  let isDragging = false;
  let wheelLocked = false;

  let pointerStartX = 0;
  let pointerCurrentX = 0;

  let dragStartTranslate = 0;
  let dragTranslate = 0;

  let loaderStarted = false;
  let loaderFinished = false;

  let networkTimer = null;

  let soundEnabled = true;
  let audioContext = null;
  let masterGain = null;
  let audioUnlocked = false;
  let soundControl = null;

  let lastNetworkSound = -1;


  /* =====================================================
     UTILITIES
  ===================================================== */

  const clamp = (
    value,
    min,
    max
  ) => {
    return Math.min(
      Math.max(value, min),
      max
    );
  };


  const lerp = (
    a,
    b,
    amount
  ) => {
    return a + (b - a) * amount;
  };


  const formatScene = (index) => {
    return String(index + 1).padStart(2, "0");
  };


  /* =====================================================
     SOUND ENGINE
  ===================================================== */

  function initAudio() {

    if (audioContext) {
      return;
    }

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    audioContext =
      new AudioContext();

    masterGain =
      audioContext.createGain();

    masterGain.gain.value =
      soundEnabled
        ? 0.055
        : 0.0001;

    masterGain.connect(
      audioContext.destination
    );
  }


  async function unlockAudio() {

    initAudio();

    if (!audioContext) {
      return;
    }

    if (
      audioContext.state ===
      "suspended"
    ) {

      try {
        await audioContext.resume();
      } catch (_) {
        return;
      }
    }

    audioUnlocked = true;
  }


  function soundReady() {

    return (
      soundEnabled &&
      audioUnlocked &&
      audioContext &&
      masterGain
    );
  }


  function audioNow() {

    return audioContext.currentTime;
  }


  function playTone({
    type = "sine",
    frequency = 440,
    start = audioNow(),
    duration = 0.08,
    volume = 0.5,
    attack = 0.005,
    release = 0.05,
    detune = 0
  }) {

    if (!soundReady()) {
      return;
    }

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type =
      type;

    oscillator.frequency.setValueAtTime(
      frequency,
      start
    );

    oscillator.detune.setValueAtTime(
      detune,
      start
    );

    gain.gain.setValueAtTime(
      0.0001,
      start
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(
        volume,
        0.0001
      ),
      start + attack
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start +
        duration +
        release
    );

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(start);

    oscillator.stop(
      start +
      duration +
      release +
      0.02
    );
  }


  function playNoise({
    start = audioNow(),
    duration = 0.15,
    volume = 0.1,
    frequency = 1800
  }) {

    if (!soundReady()) {
      return;
    }

    const bufferSize =
      audioContext.sampleRate *
      duration;

    const buffer =
      audioContext.createBuffer(
        1,
        bufferSize,
        audioContext.sampleRate
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
      audioContext.createBufferSource();

    const filter =
      audioContext.createBiquadFilter();

    const gain =
      audioContext.createGain();

    source.buffer =
      buffer;

    filter.type =
      "bandpass";

    filter.frequency.value =
      frequency;

    filter.Q.value =
      1.2;

    gain.gain.setValueAtTime(
      0.0001,
      start
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(
        volume,
        0.0001
      ),
      start + 0.008
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + duration
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(start);

    source.stop(
      start +
      duration +
      0.02
    );
  }


  /* =====================================================
     SOUND — UI
  ===================================================== */

  function soundClick() {

    playTone({
      type: "square",
      frequency: 1450,
      duration: 0.025,
      volume: 0.7 * 0.32,
      attack: 0.001,
      release: 0.025
    });
  }


  function soundSoftClick() {

    playTone({
      type: "sine",
      frequency: 980,
      duration: 0.035,
      volume: 0.7 * 0.22,
      attack: 0.001,
      release: 0.04
    });
  }


  /* =====================================================
     SOUND — LOADER
  ===================================================== */

  function soundBoot() {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playTone({
      type: "sine",
      frequency: 62,
      start: time,
      duration: 0.24,
      volume: 0.7,
      attack: 0.02,
      release: 0.22
    });

    playTone({
      type: "triangle",
      frequency: 440,
      start: time + 0.12,
      duration: 0.08,
      volume: 0.18,
      attack: 0.002,
      release: 0.06
    });
  }


  function soundSystemCheck() {

    soundSoftClick();

    setTimeout(
      () => {

        playTone({
          type: "sine",
          frequency: 760,
          duration: 0.035,
          volume: 0.14,
          attack: 0.002,
          release: 0.05
        });

      },
      55
    );
  }


  function soundSystemReady() {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playTone({
      type: "sine",
      frequency: 410,
      start: time,
      duration: 0.07,
      volume: 0.2,
      attack: 0.004,
      release: 0.07
    });

    playTone({
      type: "sine",
      frequency: 620,
      start: time + 0.075,
      duration: 0.1,
      volume: 0.22,
      attack: 0.004,
      release: 0.08
    });

    playTone({
      type: "sine",
      frequency: 920,
      start: time + 0.16,
      duration: 0.12,
      volume: 0.18,
      attack: 0.004,
      release: 0.1
    });
  }


  /* =====================================================
     SOUND — SCENE TRANSITION
  ===================================================== */

  function soundTransition(
    direction = 1
  ) {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playNoise({
      start: time,
      duration: 0.075,
      volume: 0.025,
      frequency:
        direction > 0
          ? 1450
          : 1050
    });

    playTone({
      type: "triangle",
      frequency:
        direction > 0
          ? 210
          : 170,
      start: time,
      duration: 0.075,
      volume: 0.06,
      attack: 0.002,
      release: 0.08
    });

    setTimeout(
      soundClick,
      85
    );
  }


  /* =====================================================
     SOUND — SURVEILLANCE
  ===================================================== */

  function soundScanner() {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playTone({
      type: "sine",
      frequency: 1050,
      start: time,
      duration: 0.42,
      volume: 0.32 * 0.22,
      attack: 0.08,
      release: 0.14
    });

    playTone({
      type: "sine",
      frequency: 2100,
      start: time + 0.08,
      duration: 0.28,
      volume: 0.32 * 0.08,
      attack: 0.05,
      release: 0.12
    });
  }


  function soundScanPing() {

    playTone({
      type: "sine",
      frequency: 1480,
      duration: 0.045,
      volume: 0.07,
      attack: 0.002,
      release: 0.05
    });
  }


  /* =====================================================
     SOUND — DETECTION
  ===================================================== */

  function soundDetection() {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playTone({
      type: "sine",
      frequency: 145,
      start: time,
      duration: 0.11,
      volume: 0.3,
      attack: 0.005,
      release: 0.12
    });

    playTone({
      type: "square",
      frequency: 860,
      start: time + 0.11,
      duration: 0.035,
      volume: 0.11,
      attack: 0.001,
      release: 0.035
    });

    playTone({
      type: "square",
      frequency: 860,
      start: time + 0.19,
      duration: 0.035,
      volume: 0.085,
      attack: 0.001,
      release: 0.035
    });
  }


  /* =====================================================
     SOUND — ACCESS
  ===================================================== */

  function soundAccessGranted() {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playTone({
      type: "sine",
      frequency: 720,
      start: time,
      duration: 0.045,
      volume: 0.15,
      attack: 0.002,
      release: 0.05
    });

    playTone({
      type: "sine",
      frequency: 1040,
      start: time + 0.075,
      duration: 0.09,
      volume: 0.2,
      attack: 0.002,
      release: 0.08
    });
  }


  /* =====================================================
     SOUND — ALERT
  ===================================================== */

  function soundAlert() {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playTone({
      type: "sine",
      frequency: 112,
      start: time,
      duration: 0.18,
      volume: 0.8 * 0.35,
      attack: 0.01,
      release: 0.2
    });

    playTone({
      type: "square",
      frequency: 780,
      start: time + 0.12,
      duration: 0.045,
      volume: 0.8 * 0.16,
      attack: 0.002,
      release: 0.04
    });

    playTone({
      type: "sine",
      frequency: 112,
      start: time + 0.34,
      duration: 0.18,
      volume: 0.8 * 0.28,
      attack: 0.01,
      release: 0.2
    });
  }


  /* =====================================================
     SOUND — MAINTENANCE
  ===================================================== */

  function soundMaintenance() {

    if (!soundReady()) {
      return;
    }

    const time =
      audioNow();

    playTone({
      type: "square",
      frequency: 420,
      start: time,
      duration: 0.025,
      volume: 0.08,
      attack: 0.001,
      release: 0.025
    });

    playTone({
      type: "square",
      frequency: 510,
      start: time + 0.075,
      duration: 0.025,
      volume: 0.07,
      attack: 0.001,
      release: 0.025
    });
  }


  /* =====================================================
     SOUND — CONTROL CENTER
  ===================================================== */

  function soundNetworkSignal(
    node = 0
  ) {

    if (!soundReady()) {
      return;
    }

    const frequencies = [
      1180,
      920,
      680,
      520
    ];

    const frequency =
      frequencies[
        node %
        frequencies.length
      ];

    const time =
      audioNow();

    playTone({
      type: "sine",
      frequency,
      start: time,
      duration: 0.045,
      volume: 0.075,
      attack: 0.002,
      release: 0.05
    });

    playTone({
      type: "sine",
      frequency:
        frequency * 0.5,
      start: time + 0.06,
      duration: 0.08,
      volume: 0.05,
      attack: 0.002,
      release: 0.07
    });
  }


  function soundNetworkCenter() {

    playTone({
      type: "sine",
      frequency: 610,
      duration: 0.09,
      volume: 0.12,
      attack: 0.004,
      release: 0.1
    });
  }


  /* =====================================================
     SOUND CONTROL
  ===================================================== */

  function createSoundControl() {

    if (
      document.getElementById(
        "sentraSoundControl"
      )
    ) {
      return;
    }

    soundControl =
      document.createElement(
        "button"
      );

    soundControl.id =
      "sentraSoundControl";

    soundControl.type =
      "button";

    soundControl.innerHTML = `
      <span class="sentra-sound-dot"></span>
      <span class="sentra-sound-label">
        SOUND / ON
      </span>
    `;

    soundControl.setAttribute(
      "aria-label",
      "Переключить звук"
    );

    Object.assign(
      soundControl.style,
      {
        position: "fixed",
        right: "34px",
        bottom: "24px",
        zIndex: "9500",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 11px",
        border:
          "1px solid rgba(255,255,255,.12)",
        background:
          "rgba(10,10,10,.68)",
        color:
          "rgba(255,255,255,.72)",
        fontFamily:
          '"IBM Plex Mono","SFMono-Regular",Consolas,monospace',
        fontSize: "9px",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        cursor: "pointer",
        backdropFilter:
          "blur(12px)",
        WebkitBackdropFilter:
          "blur(12px)",
        transition:
          "all .25s ease"
      }
    );

    const dot =
      soundControl.querySelector(
        ".sentra-sound-dot"
      );

    Object.assign(
      dot.style,
      {
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: "#c9a45a",
        boxShadow:
          "0 0 10px rgba(201,164,90,.65)",
        transition:
          "all .25s ease"
      }
    );

    soundControl.addEventListener(
      "mouseenter",
      () => {

        soundControl.style.color =
          "#fff";

        soundControl.style.borderColor =
          "rgba(201,164,90,.5)";

        soundControl.style.background =
          "rgba(15,15,15,.82)";
      }
    );

    soundControl.addEventListener(
      "mouseleave",
      () => {

        soundControl.style.color =
          soundEnabled
            ? "rgba(255,255,255,.72)"
            : "rgba(255,255,255,.38)";

        soundControl.style.borderColor =
          soundEnabled
            ? "rgba(255,255,255,.12)"
            : "rgba(255,255,255,.08)";

        soundControl.style.background =
          "rgba(10,10,10,.68)";
      }
    );

    soundControl.addEventListener(
      "click",
      async () => {

        await unlockAudio();

        soundEnabled =
          !soundEnabled;

        if (
          masterGain &&
          audioContext
        ) {

          masterGain.gain.cancelScheduledValues(
            audioContext.currentTime
          );

          masterGain.gain.setTargetAtTime(
            soundEnabled
              ? 0.055
              : 0.0001,
            audioContext.currentTime,
            0.035
          );
        }

        updateSoundControl();

        if (soundEnabled) {
          soundClick();
        }
      }
    );

    document.body.appendChild(
      soundControl
    );

    updateSoundControl();
  }


  function updateSoundControl() {

    if (!soundControl) {
      return;
    }

    const label =
      soundControl.querySelector(
        ".sentra-sound-label"
      );

    const dot =
      soundControl.querySelector(
        ".sentra-sound-dot"
      );

    if (label) {

      label.textContent =
        soundEnabled
          ? "SOUND / ON"
          : "SOUND / OFF";
    }

    if (dot) {

      dot.style.background =
        soundEnabled
          ? "#c9a45a"
          : "rgba(255,255,255,.22)";

      dot.style.boxShadow =
        soundEnabled
          ? "0 0 10px rgba(201,164,90,.65)"
          : "none";
    }

    soundControl.style.color =
      soundEnabled
        ? "rgba(255,255,255,.72)"
        : "rgba(255,255,255,.38)";

    soundControl.style.borderColor =
      soundEnabled
        ? "rgba(255,255,255,.12)"
        : "rgba(255,255,255,.08)";
  }


  /* =====================================================
     FIRST USER INTERACTION
     ===================================================== */

  let firstInteractionHandled = false;

  async function handleFirstInteraction() {

    if (firstInteractionHandled) {
      return;
    }

    firstInteractionHandled = true;

    await unlockAudio();

    if (
      loaderStarted &&
      !loaderFinished
    ) {

      soundBoot();
    }
  }


  [
    "pointerdown",
    "touchstart",
    "keydown"
  ].forEach(
    (eventName) => {

      window.addEventListener(
        eventName,
        handleFirstInteraction,
        {
          passive: true,
          once: false
        }
      );

    }
  );


  /* =====================================================
     CLOCK
  ===================================================== */

  function updateClock() {

    const now =
      new Date();

    if (liveDate) {

      liveDate.textContent =
        new Intl.DateTimeFormat(
          "ru-RU",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }
        ).format(now);
    }

    if (liveTime) {

      liveTime.textContent =
        new Intl.DateTimeFormat(
          "ru-RU",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          }
        ).format(now);
    }
  }

  updateClock();

  setInterval(
    updateClock,
    1000
  );


  /* =====================================================
     LOADER
  ===================================================== */

  function setLoaderProgress(
    value
  ) {

    const safeValue =
      clamp(
        value,
        0,
        100
      );

    if (loaderProgress) {

      loaderProgress.style.width =
        `${safeValue}%`;
    }

    if (loaderPercent) {

      loaderPercent.textContent =
        `${String(
          Math.round(
            safeValue
          )
        ).padStart(
          2,
          "0"
        )}%`;
    }
  }


  function setLoaderStep(
    index
  ) {

    loaderChecks.forEach(
      (
        item,
        itemIndex
      ) => {

        item.classList.remove(
          "is-active"
        );

        if (
          itemIndex <
          index
        ) {

          item.classList.add(
            "is-done"
          );

          const status =
            item.querySelector(
              "strong"
            );

          if (status) {
            status.textContent =
              "ОК";
          }
        }

        if (
          itemIndex ===
          index
        ) {

          item.classList.add(
            "is-active"
          );

          const status =
            item.querySelector(
              "strong"
            );

          if (status) {
            status.textContent =
              "ПРОВЕРКА";
          }
        }
      }
    );
  }


  function finishLoader() {

    if (loaderFinished) {
      return;
    }

    loaderFinished = true;

    loaderChecks.forEach(
      (item) => {

        item.classList.remove(
          "is-active"
        );

        item.classList.add(
          "is-done"
        );

        const status =
          item.querySelector(
            "strong"
          );

        if (status) {
          status.textContent =
            "ОК";
        }
      }
    );

    setLoaderProgress(
      100
    );

    if (loaderFinal) {

      loaderFinal.classList.add(
        "is-visible"
      );
    }

    soundSystemReady();

    setTimeout(
      () => {

        if (loader) {

          loader.classList.add(
            "is-hidden"
          );

          setTimeout(
            () => {

              if (
                loader &&
                loader.parentNode
              ) {

                loader.remove();
              }

            },
            900
          );
        }

        activateScene(
          0,
          false,
          false
        );

      },
      750
    );
  }


  function startLoader() {

    if (loaderStarted) {
      return;
    }

    loaderStarted = true;

    const duration =
      4300;

    const start =
      performance.now();

    function animateLoader(
      now
    ) {

      const elapsed =
        now - start;

      const progress =
        clamp(
          (
            elapsed /
            duration
          ) * 100,
          0,
          100
        );

      setLoaderProgress(
        progress
      );

      const step =
        Math.min(
          loaderChecks.length - 1,
          Math.floor(
            (
              progress /
              100
            ) *
            loaderChecks.length
          )
        );

      setLoaderStep(
        step
      );

      if (progress >= 100) {

        finishLoader();

        return;
      }

      requestAnimationFrame(
        animateLoader
      );
    }

    requestAnimationFrame(
      animateLoader
    );
  }


  /* =====================================================
     TRANSLATE
  ===================================================== */

  function getTargetTranslate(
    index
  ) {

    return -(
      index *
      window.innerWidth
    );
  }


  function applyTranslate(
    value,
    animate = true
  ) {

    if (!track) {
      return;
    }

    if (!animate) {

      track.style.transition =
        "none";

    } else {

      track.style.transition =
        "transform .85s cubic-bezier(.22,.61,.36,1)";
    }

    track.style.transform =
      `translate3d(${value}px,0,0)`;

    if (!animate) {

      requestAnimationFrame(
        () => {

          track.style.transition =
            "transform .85s cubic-bezier(.22,.61,.36,1)";
        }
      );
    }
  }


  /* =====================================================
     SCENE SOUND
  ===================================================== */

  function playSceneSound(
    index
  ) {

    if (!soundEnabled) {
      return;
    }

    switch (index) {

      case 0:

        soundSoftClick();

        break;


      case 1:

        soundScanner();

        setTimeout(
          () => {

            if (
              currentIndex ===
              1
            ) {

              soundScanPing();
            }

          },
          900
        );

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

        soundNetworkSignal(
          Math.floor(
            Math.random() * 4
          )
        );

        break;


      case 7:

        soundSystemReady();

        break;
    }
  }


  /* =====================================================
     SCENE
  ===================================================== */

  function activateScene(
    index,
    animate = true,
    playSound = true
  ) {

    index =
      clamp(
        index,
        0,
        scenes.length - 1
      );

    currentIndex =
      index;

    applyTranslate(
      getTargetTranslate(
        index
      ),
      animate
    );

    scenes.forEach(
      (
        scene,
        sceneIndex
      ) => {

        scene.classList.toggle(
          "is-active",
          sceneIndex === index
        );

      }
    );

    if (progressCurrent) {

      progressCurrent.textContent =
        formatScene(
          index
        );
    }

    if (progressFill) {

      progressFill.style.width =
        `${
          (
            (index + 1) /
            scenes.length
          ) * 100
        }%`;
    }

    if (
      navigationHint
    ) {

      if (index > 0) {

        navigationHint.classList.add(
          "is-hidden"
        );

      } else {

        navigationHint.classList.remove(
          "is-hidden"
        );
      }
    }

    if (
      index === 6
    ) {

      startNetworkAnimation();

    } else {

      stopNetworkAnimation();
    }

    updateHash(
      index
    );

    if (playSound) {

      playSceneSound(
        index
      );
    }
  }


  function goTo(
    index
  ) {

    if (
      isAnimating ||
      isDragging
    ) {
      return;
    }

    const target =
      clamp(
        index,
        0,
        scenes.length - 1
      );

    if (
      target ===
      currentIndex
    ) {
      return;
    }

    isAnimating =
      true;

    soundTransition(
      target >
        currentIndex
        ? 1
        : -1
    );

    activateScene(
      target,
      true,
      true
    );

    setTimeout(
      () => {

        isAnimating =
          false;

      },
      900
    );
  }


  /* =====================================================
     HASH
  ===================================================== */

  function updateHash(
    index
  ) {

    const hash =
      `#scene-${index + 1}`;

    if (
      history.replaceState
    ) {

      history.replaceState(
        null,
        "",
        hash
      );
    }
  }


  function readHash() {

    const match =
      window.location.hash.match(
        /#scene-(\d+)/
      );

    if (!match) {
      return 0;
    }

    const number =
      parseInt(
        match[1],
        10
      );

    if (
      Number.isNaN(
        number
      )
    ) {
      return 0;
    }

    return clamp(
      number - 1,
      0,
      scenes.length - 1
    );
  }


  /* =====================================================
     WHEEL
  ===================================================== */

  function handleWheel(
    event
  ) {

    if (
      isDragging ||
      isAnimating
    ) {
      return;
    }

    const delta =
      Math.abs(
        event.deltaX
      ) >
      Math.abs(
        event.deltaY
      )
        ? event.deltaX
        : event.deltaY;

    if (
      Math.abs(
        delta
      ) < 18
    ) {
      return;
    }

    event.preventDefault();

    if (wheelLocked) {
      return;
    }

    wheelLocked =
      true;

    if (delta > 0) {

      goTo(
        currentIndex + 1
      );

    } else {

      goTo(
        currentIndex - 1
      );
    }

    setTimeout(
      () => {

        wheelLocked =
          false;

      },
      850
    );
  }


  if (experience) {

    experience.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false
      }
    );
  }


  /* =====================================================
     POINTER DRAG
  ===================================================== */

  function handlePointerDown(
    event
  ) {

    if (
      event.pointerType ===
        "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    if (isAnimating) {
      return;
    }

    isDragging =
      true;

    pointerStartX =
      event.clientX;

    pointerCurrentX =
      event.clientX;

    dragStartTranslate =
      getTargetTranslate(
        currentIndex
      );

    dragTranslate =
      dragStartTranslate;

    track.classList.add(
      "is-dragging"
    );

    experience.setPointerCapture(
      event.pointerId
    );
  }


  function handlePointerMove(
    event
  ) {

    if (!isDragging) {
      return;
    }

    pointerCurrentX =
      event.clientX;

    const delta =
      pointerCurrentX -
      pointerStartX;

    const resistance =
      0.92;

    dragTranslate =
      dragStartTranslate +
      delta *
      resistance;

    const maxTranslate =
      0;

    const minTranslate =
      -(
        (
          scenes.length - 1
        ) *
        window.innerWidth
      );

    if (
      dragTranslate >
      maxTranslate
    ) {

      dragTranslate =
        lerp(
          maxTranslate,
          dragTranslate,
          0.35
        );
    }

    if (
      dragTranslate <
      minTranslate
    ) {

      dragTranslate =
        lerp(
          minTranslate,
          dragTranslate,
          0.35
        );
    }

    track.style.transform =
      `translate3d(${dragTranslate}px,0,0)`;
  }


  function handlePointerUp(
    event
  ) {

    if (!isDragging) {
      return;
    }

    isDragging =
      false;

    track.classList.remove(
      "is-dragging"
    );

    try {

      experience.releasePointerCapture(
        event.pointerId
      );

    } catch (_) {}

    const delta =
      pointerCurrentX -
      pointerStartX;

    const threshold =
      Math.min(
        window.innerWidth *
          0.18,
        150
      );

    if (
      Math.abs(
        delta
      ) >
      threshold
    ) {

      if (delta < 0) {

        goTo(
          currentIndex + 1
        );

      } else {

        goTo(
          currentIndex - 1
        );
      }

      return;
    }

    activateScene(
      currentIndex,
      true,
      false
    );
  }


  if (experience) {

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
  }


  /* =====================================================
     KEYBOARD
  ===================================================== */

  window.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "ArrowRight"
      ) {

        event.preventDefault();

        goTo(
          currentIndex + 1
        );
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {

        event.preventDefault();

        goTo(
          currentIndex - 1
        );
      }

      if (
        event.key ===
        "Home"
      ) {

        event.preventDefault();

        goTo(0);
      }

      if (
        event.key ===
        "End"
      ) {

        event.preventDefault();

        goTo(
          scenes.length - 1
        );
      }

      if (
        event.key ===
        "Escape"
      ) {

        closeMobileMenu();
      }
    }
  );


  /* =====================================================
     MOBILE MENU
  ===================================================== */

  function openMobileMenu() {

    if (!mobileMenu) {
      return;
    }

    mobileMenu.classList.add(
      "is-open"
    );

    if (menuButton) {

      menuButton.classList.add(
        "is-open"
      );
    }
  }


  function closeMobileMenu() {

    if (!mobileMenu) {
      return;
    }

    mobileMenu.classList.remove(
      "is-open"
    );

    if (menuButton) {

      menuButton.classList.remove(
        "is-open"
      );
    }
  }


  if (menuButton) {

    menuButton.addEventListener(
      "click",
      () => {

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
  }


  mobileButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const index =
            parseInt(
              button.dataset.go,
              10
            );

          closeMobileMenu();

          goTo(index);

        }
      );

    }
  );


  /* =====================================================
     RESIZE
  ===================================================== */

  let resizeTimer = null;

  function handleResize() {

    clearTimeout(
      resizeTimer
    );

    resizeTimer =
      setTimeout(
        () => {

          applyTranslate(
            getTargetTranslate(
              currentIndex
            ),
            false
          );

          updateNetworkGeometry();

        },
        100
      );
  }

  window.addEventListener(
    "resize",
    handleResize
  );


  /* =====================================================
     NETWORK
  ===================================================== */

  const controlNetwork =
    document.getElementById(
      "controlNetwork"
    );

  const centralControl =
    document.getElementById(
      "centralControl"
    );

  const nodes = [
    ...document.querySelectorAll(
      ".network-node"
    )
  ];

  const lines = [
    document.getElementById(
      "line1"
    ),
    document.getElementById(
      "line2"
    ),
    document.getElementById(
      "line3"
    ),
    document.getElementById(
      "line4"
    )
  ];

  const signals = [
    document.getElementById(
      "signal1"
    ),
    document.getElementById(
      "signal2"
    ),
    document.getElementById(
      "signal3"
    ),
    document.getElementById(
      "signal4"
    )
  ];


  function getElementCenter(
    element,
    parentRect
  ) {

    const rect =
      element.getBoundingClientRect();

    return {

      x:
        (
          (
            rect.left +
            rect.width / 2
          ) -
          parentRect.left
        ) /
        parentRect.width *
        1000,

      y:
        (
          (
            rect.top +
            rect.height / 2
          ) -
          parentRect.top
        ) /
        parentRect.height *
        620
    };
  }


  function updateNetworkGeometry() {

    if (
      !controlNetwork ||
      !centralControl ||
      nodes.length !== 4
    ) {
      return;
    }

    const parentRect =
      controlNetwork.getBoundingClientRect();

    const center =
      getElementCenter(
        centralControl,
        parentRect
      );

    nodes.forEach(
      (
        node,
        index
      ) => {

        const point =
          getElementCenter(
            node,
            parentRect
          );

        const line =
          lines[index];

        const signal =
          signals[index];

        if (
          !line ||
          !signal
        ) {
          return;
        }

        line.setAttribute(
          "x1",
          point.x
        );

        line.setAttribute(
          "y1",
          point.y
        );

        line.setAttribute(
          "x2",
          center.x
        );

        line.setAttribute(
          "y2",
          center.y
        );

        signal.setAttribute(
          "cx",
          point.x
        );

        signal.setAttribute(
          "cy",
          point.y
        );
      }
    );
  }


  function startNetworkAnimation() {

    stopNetworkAnimation();

    updateNetworkGeometry();

    let index = 0;

    networkTimer =
      setInterval(
        () => {

          nodes.forEach(
            (node) => {

              node.classList.remove(
                "is-live"
              );
            }
          );

          signals.forEach(
            (signal) => {

              signal.style.opacity =
                "0";
            }
          );

          const node =
            nodes[index];

          const signal =
            signals[index];

          const line =
            lines[index];

          if (node) {

            node.classList.add(
              "is-live"
            );
          }

          if (signal) {

            signal.style.opacity =
              "1";
          }

          if (line) {

            line.style.stroke =
              "rgba(199,168,106,.95)";

            line.style.strokeWidth =
              "2";

            setTimeout(
              () => {

                line.style.stroke =
                  "rgba(199,168,106,.25)";

                line.style.strokeWidth =
                  "1";

              },
              550
            );
          }

          /*
           * Звуковой сигнал узла.
           * Не повторяем один и тот же сигнал слишком быстро.
           */

          if (
            index !==
            lastNetworkSound
          ) {

            soundNetworkSignal(
              index
            );

            lastNetworkSound =
              index;

          } else {

            soundNetworkCenter();
          }

          index =
            (
              index + 1
            ) %
            nodes.length;

        },
        720
      );
  }


  function stopNetworkAnimation() {

    if (networkTimer) {

      clearInterval(
        networkTimer
      );

      networkTimer =
        null;
    }

    lastNetworkSound =
      -1;

    nodes.forEach(
      (node) => {

        node.classList.remove(
          "is-live"
        );
      }
    );

    signals.forEach(
      (signal) => {

        signal.style.opacity =
          "0";
      }
    );

    lines.forEach(
      (line) => {

        if (!line) {
          return;
        }

        line.style.stroke =
          "rgba(199,168,106,.25)";

        line.style.strokeWidth =
          "1";
      }
    );
  }


  /* =====================================================
     PARALLAX
  ===================================================== */

  function handleParallax(
    event
  ) {

    if (
      window.innerWidth <=
        760 ||
      isDragging
    ) {
      return;
    }

    const activeScene =
      scenes[currentIndex];

    if (!activeScene) {
      return;
    }

    const frame =
      activeScene.querySelector(
        ".media-frame"
      );

    const image =
      activeScene.querySelector(
        ".media-frame img"
      );

    if (
      !frame ||
      !image
    ) {
      return;
    }

    const rect =
      frame.getBoundingClientRect();

    if (
      event.clientX <
        rect.left ||
      event.clientX >
        rect.right ||
      event.clientY <
        rect.top ||
      event.clientY >
        rect.bottom
    ) {
      return;
    }

    const x =
      (
        event.clientX -
        rect.left
      ) /
      rect.width -
      0.5;

    const y =
      (
        event.clientY -
        rect.top
      ) /
      rect.height -
      0.5;

    image.style.transform =
      `scale(1.025) translate(${x * -8}px, ${y * -5}px)`;
  }


  if (experience) {

    experience.addEventListener(
      "pointermove",
      handleParallax
    );
  }


  /* =====================================================
     PREVENT NATIVE GESTURES
  ===================================================== */

  document.addEventListener(
    "gesturestart",
    (event) => {

      event.preventDefault();

    },
    {
      passive: false
    }
  );

  document.addEventListener(
    "gesturechange",
    (event) => {

      event.preventDefault();

    },
    {
      passive: false
    }
  );

  document.addEventListener(
    "gestureend",
    (event) => {

      event.preventDefault();

    },
    {
      passive: false
    }
  );


  /* =====================================================
     INIT
  ===================================================== */

  if (site) {

    site.style.visibility =
      "visible";
  }

  createSoundControl();

  const initialScene =
    readHash();

  scenes.forEach(
    (
      scene,
      index
    ) => {

      scene.classList.toggle(
        "is-active",
        index === initialScene
      );

    }
  );

  applyTranslate(
    getTargetTranslate(
      initialScene
    ),
    false
  );

  if (progressCurrent) {

    progressCurrent.textContent =
      formatScene(
        initialScene
      );
  }

  if (progressFill) {

    progressFill.style.width =
      `${
        (
          (
            initialScene + 1
          ) /
          scenes.length
        ) * 100
      }%`;
  }

  updateNetworkGeometry();

  setTimeout(
    updateNetworkGeometry,
    100
  );

  setTimeout(
    updateNetworkGeometry,
    700
  );

  startLoader();

})();
