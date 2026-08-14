"use strict";


/* =========================================
   ELEMENTS
========================================= */

const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderStatus = document.getElementById("loaderStatus");
const loaderReady = document.getElementById("loaderReady");
const checks = [...document.querySelectorAll(".check")];

const experience = document.getElementById("experience");
const track = document.getElementById("track");
const scenes = [...document.querySelectorAll(".scene")];

const currentSceneEl = document.getElementById("currentScene");
const progressBar = document.getElementById("progressBar");

const menu = document.getElementById("menu");
const menuButton = document.getElementById("menuButton");
const menuClose = document.getElementById("menuClose");
const menuItems = [...document.querySelectorAll("[data-scene]")];

const clock = document.getElementById("clock");


/* =========================================
   STATE
========================================= */

let currentScene = 0;
let isDragging = false;
let dragStartX = 0;
let dragCurrentX = 0;
let dragMoved = false;
let wheelLocked = false;
let wheelAccumulator = 0;
let lastWheelTime = 0;


/* =========================================
   AUDIO
========================================= */

let audioCtx = null;
let masterGain = null;
let audioReady = false;

function initAudio() {

  if (audioCtx) return audioCtx;

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return null;

    audioCtx = new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.17;

    masterGain.connect(audioCtx.destination);

    audioReady = true;

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;

  } catch (error) {

    return null;

  }

}


async function unlockAudio() {

  const ctx = initAudio();

  if (!ctx) return;

  try {

    if (ctx.state !== "running") {
      await ctx.resume();
    }

    audioReady = ctx.state === "running";

  } catch (error) {}

}


function soundTone(
  frequency = 440,
  duration = .08,
  type = "sine",
  volume = .04,
  delay = 0
) {

  const ctx = initAudio();

  if (!ctx || !masterGain) return;

  try {

    const start = ctx.currentTime + delay;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(volume, 0.0002),
      start + .008
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + duration
    );

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(start);
    oscillator.stop(start + duration + .02);

  } catch (error) {}

}


function soundClick() {
  soundTone(950, .045, "square", .028);
}


function soundScan() {

  soundTone(620, .08, "sine", .025);
  soundTone(920, .06, "sine", .018, .1);

}


function soundDetection() {

  soundTone(180, .14, "sine", .045);
  soundTone(360, .08, "square", .025, .16);
  soundTone(720, .05, "sine", .018, .28);

}


function soundAccess() {

  soundTone(520, .06, "sine", .035);
  soundTone(780, .12, "sine", .035, .08);

}


function soundWarning() {

  soundTone(150, .16, "sine", .045);
  soundTone(110, .2, "sine", .03, .2);

}


function soundService() {

  soundTone(260, .05, "square", .025);
  soundTone(410, .06, "square", .022, .12);
  soundTone(620, .07, "sine", .018, .24);

}


function soundNetwork() {

  soundTone(310, .06, "sine", .02);
  soundTone(390, .06, "sine", .022, .15);
  soundTone(490, .06, "sine", .024, .3);
  soundTone(700, .13, "sine", .04, .5);

}


function soundReady() {

  soundTone(420, .08, "sine", .025);
  soundTone(620, .1, "sine", .03, .12);
  soundTone(880, .16, "sine", .035, .26);

}


/*
  Browser autoplay policies can block audio before
  a user gesture. We do not show an activation button.
  Natural interaction unlocks audio automatically.
*/

window.addEventListener(
  "pointerdown",
  unlockAudio,
  {
    passive: true
  }
);

window.addEventListener(
  "touchstart",
  unlockAudio,
  {
    passive: true
  }
);

window.addEventListener(
  "keydown",
  unlockAudio
);

window.addEventListener(
  "wheel",
  unlockAudio,
  {
    passive: true
  }
);


/* =========================================
   LOADER
========================================= */

const loaderSteps = [
  "ПРОВЕРКА ВИДЕОНАБЛЮДЕНИЯ",
  "ПРОВЕРКА ПОЖАРНОЙ БЕЗОПАСНОСТИ",
  "ПРОВЕРКА СКУД",
  "ПРОВЕРКА СОСТОЯНИЯ ОБЪЕКТА",
  "СИНХРОНИЗАЦИЯ ЦЕНТРА КОНТРОЛЯ"
];

function runLoader() {

  let step = 0;

  loaderStatus.textContent = "ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ";

  const timer = setInterval(() => {

    if (step >= loaderSteps.length) {

      clearInterval(timer);

      loaderProgress.style.width = "100%";
      loaderStatus.textContent = "СИСТЕМА СИНХРОНИЗИРОВАНА";

      loaderReady.classList.add("show");

      soundReady();

      setTimeout(() => {

        loader.classList.add("hidden");

        setTimeout(() => {
          activateScene(0);
        }, 500);

      }, 900);

      return;
    }

    const item = checks[step];

    item.classList.add("active");

    item.querySelector("b").textContent = "CHECK";

    loaderStatus.textContent = loaderSteps[step];

    loaderProgress.style.width =
      `${((step + 1) / loaderSteps.length) * 100}%`;

    soundClick();

    setTimeout(() => {

      item.classList.remove("active");
      item.classList.add("done");

      item.querySelector("b").textContent = "OK";

    }, 360);

    step++;

  }, 620);

}

initAudio();

setTimeout(runLoader, 500);


/* =========================================
   CLOCK
========================================= */

function updateClock() {

  const now = new Date();

  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  clock.textContent = `${h}:${m}:${s}`;

}

updateClock();
setInterval(updateClock, 1000);


/* =========================================
   SCENE
========================================= */

function activateScene(index) {

  scenes.forEach((scene, i) => {
    scene.classList.toggle("active", i === index);
  });

  currentScene = index;

  currentSceneEl.textContent =
    String(index + 1).padStart(2, "0");

  progressBar.style.width =
    `${((index + 1) / scenes.length) * 100}%`;

  track.style.transform =
    `translate3d(-${index * 100}vw, 0, 0)`;

  playSceneSound(index);

}


function playSceneSound(index) {

  unlockAudio();

  setTimeout(() => {

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

  }, 180);

}


function goToScene(index) {

  if (index < 0) index = 0;
  if (index > scenes.length - 1) {
    index = scenes.length - 1;
  }

  if (index === currentScene) return;

  activateScene(index);

}


/* =========================================
   WHEEL
========================================= */

experience.addEventListener(
  "wheel",
  event => {

    event.preventDefault();

    const now = performance.now();

    if (now - lastWheelTime < 450) return;

    wheelAccumulator +=
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;

    if (Math.abs(wheelAccumulator) < 35) {
      return;
    }

    const direction =
      wheelAccumulator > 0 ? 1 : -1;

    wheelAccumulator = 0;
    lastWheelTime = now;

    goToScene(currentScene + direction);

  },
  {
    passive: false
  }
);


/* =========================================
   POINTER DRAG
========================================= */

experience.addEventListener(
  "pointerdown",
  event => {

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    isDragging = true;
    dragMoved = false;

    dragStartX = event.clientX;
    dragCurrentX = event.clientX;

    experience.classList.add("dragging");

    try {
      experience.setPointerCapture(event.pointerId);
    } catch (error) {}

  }
);


experience.addEventListener(
  "pointermove",
  event => {

    if (!isDragging) return;

    dragCurrentX = event.clientX;

    if (Math.abs(dragCurrentX - dragStartX) > 8) {
      dragMoved = true;
    }

  }
);


experience.addEventListener(
  "pointerup",
  event => {

    if (!isDragging) return;

    const distance =
      dragCurrentX - dragStartX;

    isDragging = false;

    experience.classList.remove("dragging");

    try {
      experience.releasePointerCapture(event.pointerId);
    } catch (error) {}

    if (Math.abs(distance) < 55) {
      return;
    }

    if (distance < 0) {
      goToScene(currentScene + 1);
    } else {
      goToScene(currentScene - 1);
    }

  }
);


experience.addEventListener(
  "pointercancel",
  () => {

    isDragging = false;
    experience.classList.remove("dragging");

  }
);


/* =========================================
   KEYBOARD
========================================= */

window.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "ArrowRight" ||
      event.key === "PageDown"
    ) {

      event.preventDefault();
      goToScene(currentScene + 1);

    }

    if (
      event.key === "ArrowLeft" ||
      event.key === "PageUp"
    ) {

      event.preventDefault();
      goToScene(currentScene - 1);

    }

    if (event.key === "Home") {

      event.preventDefault();
      goToScene(0);

    }

    if (event.key === "End") {

      event.preventDefault();
      goToScene(scenes.length - 1);

    }

    if (event.key === "Escape") {

      closeMenu();

    }

  }
);


/* =========================================
   MENU
========================================= */

function openMenu() {

  menu.classList.add("open");

}


function closeMenu() {

  menu.classList.remove("open");

}


menuButton.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    openMenu();

  }
);


menuClose.addEventListener(
  "click",
  closeMenu
);


menuItems.forEach(item => {

  item.addEventListener(
    "click",
    () => {

      const index =
        Number(item.dataset.scene);

      closeMenu();

      setTimeout(() => {
        goToScene(index);
      }, 150);

    }
  );

});


/* =========================================
   CLOSE MENU OUTSIDE
========================================= */

document.addEventListener(
  "pointerdown",
  event => {

    if (!menu.classList.contains("open")) {
      return;
    }

    if (
      !menu.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {

      closeMenu();

    }

  }
);


/* =========================================
   INITIAL STATE
========================================= */

track.style.transform =
  "translate3d(0,0,0)";

scenes[0].classList.add("active");


/* =========================================
   RESIZE
========================================= */

window.addEventListener(
  "resize",
  () => {

    track.style.transition = "none";

    track.style.transform =
      `translate3d(-${currentScene * 100}vw,0,0)`;

    requestAnimationFrame(() => {
      track.style.transition = "";
    });

  }
);
