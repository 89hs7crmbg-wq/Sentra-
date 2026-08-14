/* =====================================================
   SENTRA
   DIGITAL CONTROL EXPERIENCE
===================================================== */

"use strict";


/* =====================================================
   DOM
===================================================== */

const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderStatus = document.getElementById("loaderStatus");

const site = document.getElementById("site");
const experience = document.getElementById("experience");
const track = document.getElementById("track");

const headerCta = document.getElementById("headerCta");

const liveDate = document.getElementById("liveDate");
const liveTime = document.getElementById("liveTime");

const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");

const currentSceneElement =
  document.getElementById("currentScene");

const progressFill =
  document.getElementById("progressFill");

const navigationHint =
  document.getElementById("navigationHint");

const scenes =
  Array.from(document.querySelectorAll(".scene"));

const mobileNavItems =
  Array.from(document.querySelectorAll(".mobile-nav-item"));

const brand =
  document.querySelector(".brand");

const TOTAL_SCENES = scenes.length;

let currentIndex = 0;

let isMoving = false;
let wheelLocked = false;

let pointerStartX = 0;
let pointerStartY = 0;

let pointerCurrentX = 0;

let isPointerDragging = false;

let touchStartX = 0;
let touchStartY = 0;

let touchCurrentX = 0;

let lastWheelTime = 0;

const WHEEL_THRESHOLD = 55;
const WHEEL_LOCK_TIME = 650;

const DRAG_THRESHOLD = 80;


/* =====================================================
   VK CTA
===================================================== */

const VK_URL = "https://vk.ru/id_aikharisov";

function openVK() {
  window.open(
    VK_URL,
    "_blank",
    "noopener,noreferrer"
  );
}

if (headerCta) {
  headerCta.addEventListener("click", openVK);
}


/* =====================================================
   LIVE DATE / TIME
===================================================== */

function updateClock() {

  const now = new Date();

  const dateFormatter =
    new Intl.DateTimeFormat(
      "ru-RU",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );

  const timeFormatter =
    new Intl.DateTimeFormat(
      "ru-RU",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    );

  liveDate.textContent =
    dateFormatter.format(now);

  liveTime.textContent =
    timeFormatter.format(now);
}

updateClock();

setInterval(updateClock, 1000);


/* =====================================================
   LOADER
===================================================== */

function runLoader() {

  let progress = 0;

  const statuses = [
    "Запуск системы",
    "Проверка соединения",
    "Синхронизация узлов",
    "Проверка каналов",
    "Подключение объекта",
    "Синхронизация завершена"
  ];

  let statusIndex = 0;

  const interval = setInterval(() => {

    const increment =
      progress < 35
        ? 3
        : progress < 70
          ? 2
          : 1;

    progress += increment;

    if (progress >= 100) {

      progress = 100;

      clearInterval(interval);

      loaderProgress.textContent = "100";

      loaderStatus.textContent =
        statuses[statuses.length - 1];

      document
        .querySelectorAll(".loader-node")
        .forEach(node => {

          node.style.animationPlayState =
            "paused";

          node.style.opacity = "1";

          node.style.boxShadow =
            "0 0 20px rgba(216,187,120,.8)";
        });

      document
        .querySelectorAll(".loader-trace")
        .forEach(trace => {
          trace.style.opacity = ".95";
        });

      setTimeout(() => {

        loader.classList.add("is-hidden");

        setTimeout(() => {
          activateScene(currentIndex);
        }, 120);

      }, 850);

      return;
    }

    loaderProgress.textContent =
      String(progress);

    const newStatusIndex =
      Math.min(
        statuses.length - 2,
        Math.floor(progress / 18)
      );

    if (newStatusIndex !== statusIndex) {

      statusIndex = newStatusIndex;

      loaderStatus.animate(
        [
          {
            opacity: 0,
            transform: "translateY(5px)"
          },
          {
            opacity: 1,
            transform: "translateY(0)"
          }
        ],
        {
          duration: 350,
          easing:
            "cubic-bezier(.16,1,.3,1)"
        }
      );

      loaderStatus.textContent =
        statuses[statusIndex];
    }

  }, 95);
}


/* =====================================================
   SCENE POSITION
===================================================== */

function updateProgress() {

  const number =
    String(currentIndex + 1)
      .padStart(2, "0");

  currentSceneElement.textContent =
    number;

  const percentage =
    ((currentIndex + 1) / TOTAL_SCENES) * 100;

  progressFill.style.width =
    `${percentage}%`;
}


/* =====================================================
   CONTROL CENTER GEOMETRY
===================================================== */

function updateControlNetworkLines() {

  const network =
    document.getElementById("controlNetwork");

  const central =
    document.getElementById("centralControl");

  if (!network || !central) {
    return;
  }

  const svg =
    document.getElementById("networkLines");

  if (!svg) {
    return;
  }

  const networkRect =
    network.getBoundingClientRect();

  const centralRect =
    central.getBoundingClientRect();

  const centralX =
    centralRect.left +
    centralRect.width / 2 -
    networkRect.left;

  const centralY =
    centralRect.top +
    centralRect.height / 2 -
    networkRect.top;

  const nodes = [
    {
      element:
        document.querySelector(
          '.network-node[data-node="top-left"]'
        ),
      line:
        document.getElementById("lineTopLeft"),
      trace:
        document.getElementById("lineTopLeftTrace")
    },

    {
      element:
        document.querySelector(
          '.network-node[data-node="top-right"]'
        ),
      line:
        document.getElementById("lineTopRight"),
      trace:
        document.getElementById("lineTopRightTrace")
    },

    {
      element:
        document.querySelector(
          '.network-node[data-node="bottom-left"]'
        ),
      line:
        document.getElementById("lineBottomLeft"),
      trace:
        document.getElementById("lineBottomLeftTrace")
    },

    {
      element:
        document.querySelector(
          '.network-node[data-node="bottom-right"]'
        ),
      line:
        document.getElementById("lineBottomRight"),
      trace:
        document.getElementById("lineBottomRightTrace")
    }
  ];

  const svgWidth = 1000;
  const svgHeight = 620;

  const scaleX =
    svgWidth / networkRect.width;

  const scaleY =
    svgHeight / networkRect.height;

  nodes.forEach(item => {

    if (!item.element) {
      return;
    }

    const rect =
      item.element.getBoundingClientRect();

    const nodeX =
      rect.left +
      rect.width / 2 -
      networkRect.left;

    const nodeY =
      rect.top +
      rect.height / 2 -
      networkRect.top;

    const x1 =
      nodeX * scaleX;

    const y1 =
      nodeY * scaleY;

    const x2 =
      centralX * scaleX;

    const y2 =
      centralY * scaleY;

    if (item.line) {

      item.line.setAttribute(
        "x1",
        x1
      );

      item.line.setAttribute(
        "y1",
        y1
      );

      item.line.setAttribute(
        "x2",
        x2
      );

      item.line.setAttribute(
        "y2",
        y2
      );
    }

    if (item.trace) {

      item.trace.setAttribute(
        "x1",
        x1
      );

      item.trace.setAttribute(
        "y1",
        y1
      );

      item.trace.setAttribute(
        "x2",
        x2
      );

      item.trace.setAttribute(
        "y2",
        y2
      );
    }
  });
}


/* =====================================================
   CONTROL CENTER STATE
===================================================== */

function activateControlCenter() {

  const scene =
    document.getElementById("scene-7");

  if (!scene) {
    return;
  }

  const nodes =
    Array.from(
      scene.querySelectorAll(".network-node")
    );

  const log =
    document.getElementById("controlLog");

  const central =
    document.getElementById("centralControl");

  if (!central) {
    return;
  }

  updateControlNetworkLines();

  let active = 0;

  nodes.forEach(node => {
    node.classList.remove("network-node-active");
  });

  const cycle = setInterval(() => {

    nodes.forEach(node => {
      node.classList.remove(
        "network-node-active"
      );
    });

    if (nodes[active]) {

      nodes[active].classList.add(
        "network-node-active"
      );
    }

    if (log) {

      log.innerHTML =
        `<span>СИНХРОНИЗАЦИЯ</span>
         <strong>${active + 1} / ${nodes.length}</strong>`;
    }

    central.classList.remove(
      "central-control-response"
    );

    void central.offsetWidth;

    central.classList.add(
      "central-control-response"
    );

    active++;

    if (active >= nodes.length) {
      active = 0;
    }

  }, 1050);

  scene.dataset.controlInterval =
    String(cycle);
}


/* =====================================================
   SCENE ACTIVATION
===================================================== */

function activateScene(index) {

  scenes.forEach(scene => {
    scene.classList.remove("is-active");
  });

  const scene =
    scenes[index];

  if (!scene) {
    return;
  }

  scene.classList.add("is-active");

  if (index === 6) {

    requestAnimationFrame(() => {
      updateControlNetworkLines();
    });

    setTimeout(() => {
      activateControlCenter();
    }, 250);
  }

  updateProgress();

  updateHash(index);

  updateNavigationHint();
}


/* =====================================================
   NAVIGATION HINT
===================================================== */

function updateNavigationHint() {

  if (!navigationHint) {
    return;
  }

  if (currentIndex === 0) {

    navigationHint.textContent =
      "ПЕРЕМЕЩЕНИЕ ПО СИСТЕМЕ";

  } else if (currentIndex === TOTAL_SCENES - 1) {

    navigationHint.textContent =
      "СИСТЕМА ЗАВЕРШЕНА";

  } else {

    navigationHint.textContent =
      "СИСТЕМА ПРОДОЛЖАЕТСЯ";
  }
}


/* =====================================================
   HASH
===================================================== */

function updateHash(index) {

  const id =
    `scene-${index + 1}`;

  if (
    window.history &&
    window.history.replaceState
  ) {

    window.history.replaceState(
      null,
      "",
      `#${id}`
    );
  }
}


/* =====================================================
   GO TO SCENE
===================================================== */

function goTo(index, options = {}) {

  const force =
    options.force === true;

  const next =
    Math.max(
      0,
      Math.min(
        TOTAL_SCENES - 1,
        index
      )
    );

  if (
    next === currentIndex &&
    !force
  ) {
    return;
  }

  if (isMoving && !force) {
    return;
  }

  isMoving = true;

  currentIndex = next;

  track.style.transform =
    `translate3d(-${currentIndex * 100}vw, 0, 0)`;

  activateScene(currentIndex);

  setTimeout(() => {
    isMoving = false;
  }, 780);
}


/* =====================================================
   WHEEL
===================================================== */

experience.addEventListener(
  "wheel",
  event => {

    event.preventDefault();

    const now =
      performance.now();

    if (
      wheelLocked ||
      now - lastWheelTime < 450
    ) {
      return;
    }

    let delta =
      Math.abs(event.deltaX) >
      Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (Math.abs(delta) < WHEEL_THRESHOLD) {
      return;
    }

    lastWheelTime = now;

    wheelLocked = true;

    if (delta > 0) {
      goTo(currentIndex + 1);
    } else {
      goTo(currentIndex - 1);
    }

    setTimeout(() => {
      wheelLocked = false;
    }, WHEEL_LOCK_TIME);

  },
  {
    passive: false
  }
);


/* =====================================================
   POINTER DRAG
===================================================== */

experience.addEventListener(
  "pointerdown",
  event => {

    if (event.pointerType === "mouse") {

      pointerStartX =
        event.clientX;

      pointerStartY =
        event.clientY;

      pointerCurrentX =
        event.clientX;

      isPointerDragging = true;

      experience.setPointerCapture(
        event.pointerId
      );
    }
  }
);


experience.addEventListener(
  "pointermove",
  event => {

    if (!isPointerDragging) {
      return;
    }

    pointerCurrentX =
      event.clientX;
  }
);


experience.addEventListener(
  "pointerup",
  event => {

    if (!isPointerDragging) {
      return;
    }

    isPointerDragging = false;

    try {
      experience.releasePointerCapture(
        event.pointerId
      );
    } catch (error) {
      /* capture may already be released */
    }

    const distance =
      pointerCurrentX -
      pointerStartX;

    if (
      Math.abs(distance) >=
      DRAG_THRESHOLD
    ) {

      if (distance < 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }

    } else {

      goTo(currentIndex, {
        force: true
      });
    }
  }
);


/* =====================================================
   TOUCH
===================================================== */

experience.addEventListener(
  "touchstart",
  event => {

    if (!event.touches.length) {
      return;
    }

    const touch =
      event.touches[0];

    touchStartX =
      touch.clientX;

    touchStartY =
      touch.clientY;

    touchCurrentX =
      touch.clientX;
  },
  {
    passive: true
  }
);


experience.addEventListener(
  "touchmove",
  event => {

    if (!event.touches.length) {
      return;
    }

    const touch =
      event.touches[0];

    touchCurrentX =
      touch.clientX;

    const distanceY =
      Math.abs(
        touch.clientY -
        touchStartY
      );

    const distanceX =
      Math.abs(
        touchCurrentX -
        touchStartX
      );

    if (distanceX > distanceY) {
      event.preventDefault();
    }
  },
  {
    passive: false
  }
);


experience.addEventListener(
  "touchend",
  () => {

    const distance =
      touchCurrentX -
      touchStartX;

    if (
      Math.abs(distance) >=
      DRAG_THRESHOLD
    ) {

      if (distance < 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }

    } else {

      goTo(currentIndex, {
        force: true
      });
    }
  },
  {
    passive: true
  }
);


/* =====================================================
   KEYBOARD
===================================================== */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown"
    ) {

      event.preventDefault();

      goTo(currentIndex + 1);

      return;
    }

    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp"
    ) {

      event.preventDefault();

      goTo(currentIndex - 1);

      return;
    }

    if (event.key === "Home") {

      event.preventDefault();

      goTo(0);

      return;
    }

    if (event.key === "End") {

      event.preventDefault();

      goTo(TOTAL_SCENES - 1);

      return;
    }

    if (event.key === "Escape") {

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

  mobileMenu.classList.add("is-open");

  menuButton.classList.add("is-open");

  menuButton.setAttribute(
    "aria-expanded",
    "true"
  );

  document.body.style.overflow =
    "hidden";
}


function closeMobileMenu() {

  if (!mobileMenu) {
    return;
  }

  mobileMenu.classList.remove(
    "is-open"
  );

  menuButton.classList.remove(
    "is-open"
  );

  menuButton.setAttribute(
    "aria-expanded",
    "false"
  );

  document.body.style.overflow =
    "";
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


mobileNavItems.forEach(item => {

  item.addEventListener(
    "click",
    () => {

      const index =
        Number(
          item.dataset.go
        );

      closeMobileMenu();

      setTimeout(() => {
        goTo(index);
      }, 120);
    }
  );
});


/* =====================================================
   BRAND
===================================================== */

if (brand) {

  brand.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeMobileMenu();

      goTo(0);
    }
  );
}


/* =====================================================
   RESIZE
===================================================== */

let resizeTimer = null;

window.addEventListener(
  "resize",
  () => {

    clearTimeout(resizeTimer);

    resizeTimer =
      setTimeout(() => {

        track.style.transform =
          `translate3d(-${currentIndex * 100}vw, 0, 0)`;

        updateControlNetworkLines();

      }, 120);
  }
);


/* =====================================================
   VISIBILITY
===================================================== */

document.addEventListener(
  "visibilitychange",
  () => {

    if (!document.hidden) {

      updateClock();

      requestAnimationFrame(() => {
        updateControlNetworkLines();
      });
    }
  }
);


/* =====================================================
   HASH NAVIGATION
===================================================== */

function readInitialHash() {

  const hash =
    window.location.hash;

  if (!hash) {
    return 0;
  }

  const match =
    hash.match(
      /scene-(\d+)/
    );

  if (!match) {
    return 0;
  }

  const number =
    Number(match[1]);

  if (
    Number.isNaN(number) ||
    number < 1 ||
    number > TOTAL_SCENES
  ) {
    return 0;
  }

  return number - 1;
}


/* =====================================================
   INITIAL STATE
===================================================== */

currentIndex =
  readInitialHash();

track.style.transform =
  `translate3d(-${currentIndex * 100}vw, 0, 0)`;

updateProgress();

setTimeout(() => {

  updateControlNetworkLines();

}, 150);


/* =====================================================
   START
===================================================== */

window.addEventListener(
  "load",
  () => {

    setTimeout(() => {
      runLoader();
    }, 350);
  }
);
