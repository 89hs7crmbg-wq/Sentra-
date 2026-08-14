const VK_URL = "https://vk.ru/id_aikharisov";

const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderStatus = document.getElementById("loaderStatus");

const track = document.getElementById("track");
const experience = document.getElementById("experience");
const scenes = Array.from(document.querySelectorAll(".scene"));

const sceneNumber = document.getElementById("sceneNumber");
const progressFill = document.getElementById("progressFill");
const navigationHint = document.getElementById("navigationHint");

const headerCta = document.getElementById("headerCta");
const finalCta = document.getElementById("finalCta");

const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");
const mobileCta = document.getElementById("mobileCta");

const liveDate = document.getElementById("liveDate");
const liveTime = document.getElementById("liveTime");

let currentIndex = 0;
let isMoving = false;

let pointerStartX = 0;
let pointerStartY = 0;
let pointerLastX = 0;
let pointerDown = false;
let pointerMoved = false;

let touchStartX = 0;
let touchStartY = 0;

let wheelLocked = false;
let wheelAccumulator = 0;

const TOTAL_SCENES = scenes.length;
const MOVE_DURATION = 780;

/* -----------------------------------
   LOADER
----------------------------------- */

function runLoader() {
  let progress = 0;

  const statuses = [
    "Запуск системы",
    "Проверка соединения",
    "Синхронизация узлов",
    "Подготовка объекта",
    "Система готова"
  ];

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 5) + 2;

    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      loaderProgress.textContent = progress;
      loaderStatus.textContent = statuses[statuses.length - 1];

      setTimeout(() => {
        loader.classList.add("is-hidden");
        activateScene(0);
      }, 500);

      return;
    }

    loaderProgress.textContent = progress;

    const index = Math.min(
      statuses.length - 2,
      Math.floor(progress / 25)
    );

    loaderStatus.textContent = statuses[index];
  }, 70);
}

/* -----------------------------------
   LIVE DATE / TIME
----------------------------------- */

function updateClock() {
  const now = new Date();

  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(now);

  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  liveDate.textContent = date;
  liveTime.textContent = time;
}

updateClock();
setInterval(updateClock, 1000);

/* -----------------------------------
   NAVIGATION
----------------------------------- */

function setHash(index) {
  history.replaceState(
    null,
    "",
    index === 0 ? window.location.pathname : `#${index + 1}`
  );
}

function updateInterface(index) {
  sceneNumber.textContent = String(index + 1).padStart(2, "0");

  const percentage = ((index + 1) / TOTAL_SCENES) * 100;
  progressFill.style.width = `${percentage}%`;

  scenes.forEach((scene, sceneIndex) => {
    scene.classList.toggle("active", sceneIndex === index);
  });

  if (index > 0) {
    navigationHint.classList.add("hidden");
  } else {
    navigationHint.classList.remove("hidden");
  }
}

function activateScene(index) {
  scenes[index]?.classList.add("active");
}

function goTo(index, options = {}) {
  if (index < 0 || index >= TOTAL_SCENES) {
    return;
  }

  if (index === currentIndex && !options.force) {
    return;
  }

  if (isMoving && !options.force) {
    return;
  }

  isMoving = true;

  currentIndex = index;

  track.style.transition =
    `transform ${MOVE_DURATION}ms cubic-bezier(.16,1,.3,1)`;

  track.style.transform =
    `translate3d(${-index * 100}vw, 0, 0)`;

  updateInterface(index);
  setHash(index);

  closeMenu();

  window.setTimeout(() => {
    isMoving = false;
  }, MOVE_DURATION + 80);
}

/* -----------------------------------
   WHEEL / TRACKPAD
----------------------------------- */

function handleWheel(event) {
  event.preventDefault();

  if (wheelLocked || isMoving) {
    return;
  }

  const delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;

  wheelAccumulator += delta;

  const threshold = 55;

  if (Math.abs(wheelAccumulator) < threshold) {
    return;
  }

  const direction = wheelAccumulator > 0 ? 1 : -1;

  wheelAccumulator = 0;
  wheelLocked = true;

  goTo(currentIndex + direction);

  window.setTimeout(() => {
    wheelLocked = false;
  }, MOVE_DURATION + 120);
}

experience.addEventListener(
  "wheel",
  handleWheel,
  { passive: false }
);

/* -----------------------------------
   POINTER DRAG
----------------------------------- */

experience.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") {
    return;
  }

  pointerDown = true;
  pointerMoved = false;

  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
  pointerLastX = event.clientX;

  experience.setPointerCapture?.(event.pointerId);

  track.style.transition = "none";
});

experience.addEventListener("pointermove", (event) => {
  if (!pointerDown || isMoving) {
    return;
  }

  const deltaX = event.clientX - pointerStartX;
  const deltaY = event.clientY - pointerStartY;

  if (Math.abs(deltaX) > 8) {
    pointerMoved = true;
  }

  const width = window.innerWidth;
  const progress = deltaX / width;

  const base = -currentIndex * width;
  const position = base + deltaX;

  track.style.transform =
    `translate3d(${position}px,0,0)`;

  pointerLastX = event.clientX;
});

experience.addEventListener("pointerup", (event) => {
  if (!pointerDown) {
    return;
  }

  pointerDown = false;

  const deltaX = event.clientX - pointerStartX;
  const threshold = Math.min(130, window.innerWidth * 0.16);

  track.style.transition =
    `transform ${MOVE_DURATION}ms cubic-bezier(.16,1,.3,1)`;

  if (pointerMoved && Math.abs(deltaX) >= threshold) {
    if (deltaX < 0) {
      goTo(currentIndex + 1);
    } else {
      goTo(currentIndex - 1);
    }
  } else {
    goTo(currentIndex, { force: true });
  }
});

experience.addEventListener("pointercancel", () => {
  pointerDown = false;
  goTo(currentIndex, { force: true });
});

/* -----------------------------------
   TOUCH
----------------------------------- */

experience.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) {
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;

    track.style.transition = "none";
  },
  { passive: true }
);

experience.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length !== 1 || isMoving) {
      return;
    }

    const currentX = event.touches[0].clientX;
    const deltaX = currentX - touchStartX;

    const base = -currentIndex * window.innerWidth;

    track.style.transform =
      `translate3d(${base + deltaX}px,0,0)`;
  },
  { passive: true }
);

experience.addEventListener(
  "touchend",
  (event) => {
    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    track.style.transition =
      `transform ${MOVE_DURATION}ms cubic-bezier(.16,1,.3,1)`;

    if (
      Math.abs(deltaX) > 65 &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      if (deltaX < 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }
    } else {
      goTo(currentIndex, { force: true });
    }
  },
  { passive: true }
);

/* -----------------------------------
   KEYBOARD
----------------------------------- */

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    goTo(currentIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goTo(currentIndex - 1);
  }

  if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  }

  if (event.key === "End") {
    event.preventDefault();
    goTo(TOTAL_SCENES - 1);
  }

  if (event.key === "Escape") {
    closeMenu();
  }
});

/* -----------------------------------
   CTA
----------------------------------- */

function openVK() {
  window.location.href = VK_URL;
}

headerCta.addEventListener("click", openVK);
finalCta.addEventListener("click", openVK);
mobileCta.addEventListener("click", openVK);

/* -----------------------------------
   MOBILE MENU
----------------------------------- */

function closeMenu() {
  mobileMenu.classList.remove("open");
  menuButton.classList.remove("open");
}

function toggleMenu() {
  mobileMenu.classList.toggle("open");
  menuButton.classList.toggle("open");
}

menuButton.addEventListener("click", toggleMenu);

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.go);
    goTo(index);
  });
});

/* -----------------------------------
   BRAND
----------------------------------- */

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  goTo(0);
});

/* -----------------------------------
   HASH
----------------------------------- */

function readHash() {
  const hash = window.location.hash.replace("#", "");

  if (!hash) {
    return 0;
  }

  const number = Number(hash);

  if (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= TOTAL_SCENES
  ) {
    return number - 1;
  }

  return 0;
}

/* -----------------------------------
   RESIZE
----------------------------------- */

function handleResize() {
  track.style.transition = "none";

  track.style.transform =
    `translate3d(${-currentIndex * 100}vw,0,0)`;

  requestAnimationFrame(() => {
    track.style.transition =
      `transform ${MOVE_DURATION}ms cubic-bezier(.16,1,.3,1)`;
  });
}

window.addEventListener("resize", handleResize);

/* -----------------------------------
   PARALLAX
----------------------------------- */

window.addEventListener(
  "pointermove",
  (event) => {
    if (window.innerWidth < 900) {
      return;
    }

    if (pointerDown || isMoving) {
      return;
    }

    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;

    const activeMedia =
      scenes[currentIndex]?.querySelector(".media-frame");

    if (!activeMedia) {
      return;
    }

    const amountX = x * 8;
    const amountY = y * 5;

    activeMedia.style.transform =
      `translate3d(${amountX}px,${amountY}px,0)`;
  }
);

window.addEventListener("pointerleave", () => {
  scenes.forEach((scene) => {
    const media = scene.querySelector(".media-frame");

    if (media) {
      media.style.transform = "";
    }
  });
});

/* -----------------------------------
   INITIALIZATION
----------------------------------- */

const initialScene = readHash();

track.style.transform =
  `translate3d(${-initialScene * 100}vw,0,0)`;

currentIndex = initialScene;

updateInterface(currentIndex);

window.setTimeout(() => {
  activateScene(currentIndex);
}, 100);

runLoader();
