const experience = document.getElementById("experience");
const scenes = Array.from(document.querySelectorAll(".scene"));
const progress = document.getElementById("sceneProgress");

const menuButton = document.getElementById("menuButton");
const systemMenu = document.getElementById("systemMenu");
const menuSceneButtons = Array.from(
  document.querySelectorAll(".menu-navigation button")
);

const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderStatus = document.getElementById("loaderStatus");
const loaderReady = document.getElementById("loaderReady");
const loaderChecks = Array.from(
  document.querySelectorAll(".loader-check")
);

const clock = document.getElementById("clock");

let currentScene = 0;
let isNavigating = false;

let pointerDown = false;
let pointerStartX = 0;
let pointerCurrentX = 0;
let pointerMoved = false;

let touchStartX = 0;


/* =========================
   CLOCK
========================= */

function updateClock() {
  if (!clock) return;

  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  clock.textContent = `${hours}:${minutes}:${seconds}`;
}

updateClock();
setInterval(updateClock, 1000);


/* =========================
   SOUND
========================= */

let audioContext = null;
let audioUnlocked = false;

function initAudio() {
  if (audioContext) return;

  const AudioCtx =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioCtx) return;

  audioContext = new AudioCtx();
}

function unlockAudio() {
  initAudio();

  if (!audioContext) return;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  audioUnlocked = true;
}

function tone({
  frequency = 440,
  duration = .08,
  volume = .025,
  type = "sine",
  delay = 0
} = {}) {

  if (!audioContext || !audioUnlocked) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(
    0.0001,
    audioContext.currentTime + delay
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    audioContext.currentTime + delay + .01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + delay + duration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime + delay);
  oscillator.stop(audioContext.currentTime + delay + duration + .02);
}

function soundClick() {
  tone({
    frequency: 620,
    duration: .045,
    volume: .018,
    type: "square"
  });
}

function soundScan() {
  tone({
    frequency: 280,
    duration: .11,
    volume: .014,
    type: "sine"
  });

  tone({
    frequency: 470,
    duration: .07,
    volume: .012,
    type: "sine",
    delay: .08
  });
}

function soundDetection() {
  tone({
    frequency: 170,
    duration: .18,
    volume: .024,
    type: "sine"
  });

  tone({
    frequency: 520,
    duration: .055,
    volume: .02,
    type: "square",
    delay: .19
  });

  tone({
    frequency: 720,
    duration: .055,
    volume: .018,
    type: "square",
    delay: .28
  });
}

function soundAccess() {
  tone({
    frequency: 580,
    duration: .08,
    volume: .018,
    type: "sine"
  });

  tone({
    frequency: 850,
    duration: .13,
    volume: .022,
    type: "sine",
    delay: .1
  });
}

function soundWarning() {
  tone({
    frequency: 120,
    duration: .2,
    volume: .02,
    type: "sine"
  });

  tone({
    frequency: 180,
    duration: .12,
    volume: .014,
    type: "sine",
    delay: .16
  });
}

function soundService() {
  tone({
    frequency: 180,
    duration: .055,
    volume: .014,
    type: "square"
  });

  tone({
    frequency: 260,
    duration: .055,
    volume: .012,
    type: "square",
    delay: .12
  });
}

function soundNetwork() {
  tone({
    frequency: 460,
    duration: .05,
    volume: .012,
    type: "sine"
  });

  tone({
    frequency: 680,
    duration: .08,
    volume: .014,
    type: "sine",
    delay: .08
  });
}

function soundReady() {
  tone({
    frequency: 520,
    duration: .08,
    volume: .015,
    type: "sine"
  });

  tone({
    frequency: 780,
    duration: .13,
    volume: .018,
    type: "sine",
    delay: .1
  });
}

function playSceneSound(index) {

  if (!audioUnlocked) return;

  switch (index) {

    case 0:
      soundScan();
      break;

    case 1:
      soundScan();
      break;

    case 2:
      setTimeout(soundDetection, 250);
      break;

    case 3:
      setTimeout(soundAccess, 300);
      break;

    case 4:
      setTimeout(soundWarning, 300);
      break;

    case 5:
      setTimeout(soundService, 400);
      break;

    case 6:
      setTimeout(soundNetwork, 350);
      break;

    case 7:
      setTimeout(soundReady, 3200);
      break;
  }
}


/* =========================
   LOADER
========================= */

function runLoader() {

  let progressValue = 0;

  const checks = [
    "ПРОВЕРКА ВИДЕОНАБЛЮДЕНИЯ",
    "ПРОВЕРКА ПОЖАРНОЙ БЕЗОПАСНОСТИ",
    "ПРОВЕРКА СКУД",
    "ПРОВЕРКА СОСТОЯНИЯ ОБЪЕКТА",
    "СИНХРОНИЗАЦИЯ ЦЕНТРА КОНТРОЛЯ"
  ];

  loaderChecks.forEach((check) => {
    check.classList.remove("is-active", "is-done");
    const status = check.querySelector("b");
    if (status) status.textContent = "...";
  });

  const checkDuration = 420;

  checks.forEach((text, index) => {

    setTimeout(() => {

      const check = loaderChecks[index];

      if (!check) return;

      check.classList.add("is-active");

      loaderStatus.textContent = text;

      const status = check.querySelector("b");

      if (status) {
        status.textContent = "SCAN";
      }

      soundClick();

    }, index * checkDuration);

    setTimeout(() => {

      const check = loaderChecks[index];

      if (!check) return;

      check.classList.remove("is-active");
      check.classList.add("is-done");

      const status = check.querySelector("b");

      if (status) {
        status.textContent = "OK";
      }

      progressValue = Math.round(
        ((index + 1) / checks.length) * 100
      );

      loaderProgress.style.width = `${progressValue}%`;

      tone({
        frequency: 720,
        duration: .045,
        volume: .012,
        type: "sine"
      });

    }, index * checkDuration + 300);

  });

  const finishTime =
    checks.length * checkDuration + 500;

  setTimeout(() => {

    loaderStatus.textContent = "СИСТЕМА ГОТОВА";

    loaderReady.classList.add("is-visible");

    soundReady();

  }, finishTime);

  setTimeout(() => {

    loader.classList.add("is-hidden");

    setTimeout(() => {
      loader.style.display = "none";
      activateScene(0);
    }, 900);

  }, finishTime + 850);
}


/* =========================
   NAVIGATION
========================= */

function clampScene(index) {
  return Math.max(
    0,
    Math.min(index, scenes.length - 1)
  );
}

function activateScene(index) {

  currentScene = clampScene(index);

  scenes.forEach((scene, sceneIndex) => {

    scene.classList.toggle(
      "is-active",
      sceneIndex === currentScene
    );

  });

  progress.textContent = String(
    currentScene + 1
  ).padStart(2, "0");

  playSceneSound(currentScene);
}

function goToScene(index, playSound = true) {

  const target = clampScene(index);

  if (target === currentScene) return;

  if (isNavigating) return;

  isNavigating = true;

  currentScene = target;

  experience.style.transform =
    `translate3d(-${currentScene * 100}vw, 0, 0)`;

  activateScene(currentScene);

  if (playSound) {
    soundClick();
  }

  setTimeout(() => {
    isNavigating = false;
  }, 650);
}

function nextScene() {
  goToScene(currentScene + 1);
}

function previousScene() {
  goToScene(currentScene - 1);
}


/* =========================
   WHEEL
========================= */

let wheelLocked = false;

window.addEventListener(
  "wheel",
  (event) => {

    if (systemMenu.classList.contains("is-open")) {
      return;
    }

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (Math.abs(delta) < 8) {
      return;
    }

    event.preventDefault();

    if (wheelLocked) {
      return;
    }

    wheelLocked = true;

    if (delta > 0) {
      nextScene();
    } else {
      previousScene();
    }

    setTimeout(() => {
      wheelLocked = false;
    }, 700);

  },
  {
    passive: false
  }
);


/* =========================
   POINTER DRAG
========================= */

experience.addEventListener(
  "pointerdown",
  (event) => {

    if (event.button !== 0) return;

    unlockAudio();

    pointerDown = true;
    pointerMoved = false;

    pointerStartX = event.clientX;
    pointerCurrentX = event.clientX;

    experience.classList.add("is-dragging");

    try {
      experience.setPointerCapture(event.pointerId);
    } catch (_) {}

  }
);

experience.addEventListener(
  "pointermove",
  (event) => {

    if (!pointerDown) return;

    pointerCurrentX = event.clientX;

    const delta =
      pointerCurrentX - pointerStartX;

    if (Math.abs(delta) > 8) {
      pointerMoved = true;
    }

  }
);

experience.addEventListener(
  "pointerup",
  (event) => {

    if (!pointerDown) return;

    pointerDown = false;

    experience.classList.remove("is-dragging");

    try {
      experience.releasePointerCapture(event.pointerId);
    } catch (_) {}

    const delta =
      pointerCurrentX - pointerStartX;

    if (!pointerMoved) {
      return;
    }

    if (Math.abs(delta) < 45) {
      return;
    }

    if (delta < 0) {
      nextScene();
    } else {
      previousScene();
    }

  }
);

experience.addEventListener(
  "pointercancel",
  () => {

    pointerDown = false;

    experience.classList.remove("is-dragging");

  }
);


/* =========================
   TOUCH
========================= */

experience.addEventListener(
  "touchstart",
  (event) => {

    unlockAudio();

    if (!event.touches.length) return;

    touchStartX =
      event.touches[0].clientX;

  },
  {
    passive: true
  }
);

experience.addEventListener(
  "touchend",
  (event) => {

    if (!event.changedTouches.length) return;

    const touchEndX =
      event.changedTouches[0].clientX;

    const delta =
      touchEndX - touchStartX;

    if (Math.abs(delta) < 45) {
      return;
    }

    if (delta < 0) {
      nextScene();
    } else {
      previousScene();
    }

  },
  {
    passive: true
  }
);


/* =========================
   KEYBOARD
========================= */

window.addEventListener(
  "keydown",
  (event) => {

    unlockAudio();

    if (
      systemMenu.classList.contains("is-open") &&
      event.key !== "Escape"
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextScene();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousScene();
    }

    if (event.key === "Escape") {
      closeMenu();
    }

  }
);


/* =========================
   MENU
========================= */

function openMenu() {

  unlockAudio();

  systemMenu.classList.add("is-open");

  soundClick();

}

function closeMenu() {

  systemMenu.classList.remove("is-open");

}

menuButton.addEventListener(
  "click",
  () => {

    if (
      systemMenu.classList.contains("is-open")
    ) {
      closeMenu();
    } else {
      openMenu();
    }

  }
);

menuSceneButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const index =
          Number(button.dataset.scene);

        closeMenu();

        setTimeout(() => {
          goToScene(index);
        }, 120);

      }
    );

  }
);


/* =========================
   AUDIO UNLOCK
========================= */

[
  "pointerdown",
  "touchstart",
  "keydown"
].forEach((eventName) => {

  window.addEventListener(
    eventName,
    unlockAudio,
    {
      once: true,
      passive: true
    }
  );

});


/* =========================
   RESIZE
========================= */

window.addEventListener(
  "resize",
  () => {

    experience.style.transform =
      `translate3d(-${currentScene * 100}vw, 0, 0)`;

  }
);


/* =========================
   START
========================= */

runLoader();
