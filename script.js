(() => {
  "use strict";

  const body = document.body;
  const loader = document.getElementById("loader");

  const loaderStatus = document.getElementById("loaderStatus");
  const loaderPercent = document.getElementById("loaderPercent");
  const loaderProgress = document.getElementById("loaderProgress");

  const horizontalWorld = document.getElementById("horizontalWorld");
  const horizontalTrack = document.getElementById("horizontalTrack");

  const scenes = [...document.querySelectorAll(".scene")];

  const sceneIndex = document.getElementById("sceneIndex");
  const sceneProgress = document.getElementById("sceneProgress");

  const systemTime = document.getElementById("systemTime");

  const cursor = document.getElementById("cursor");
  const cursorLabel = document.getElementById("cursorLabel");

  const requestOverlay = document.getElementById("requestOverlay");
  const requestModal = document.querySelector(".request-modal");

  const openRequest = document.getElementById("openRequest");
  const closeRequest = document.getElementById("closeRequest");

  const requestForm = document.getElementById("requestForm");

  let isMobile = window.innerWidth <= 900;

  let targetProgress = 0;
  let currentProgress = 0;

  let currentScene = 0;
  let raf = null;

  const sceneCount = scenes.length;


  /* =========================================================
     HELPERS
  ========================================================== */

  const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  const lerp = (a, b, amount) => {
    return a + (b - a) * amount;
  };


  /* =========================================================
     CLOCK
  ========================================================== */

  function updateClock() {
    const now = new Date();

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    systemTime.textContent = `${hh}:${mm}:${ss}`;
  }

  updateClock();
  setInterval(updateClock, 1000);


  /* =========================================================
     LOADER
  ========================================================== */

  const loaderStates = [
    {
      progress: 12,
      text: "SYSTEM INITIALIZATION"
    },
    {
      progress: 37,
      text: "NETWORK CONNECTED"
    },
    {
      progress: 68,
      text: "OBJECT DETECTED"
    },
    {
      progress: 100,
      text: "SYSTEM ONLINE"
    }
  ];

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runLoader() {

    body.classList.add("is-loading");
    loader.classList.add("is-running");

    await sleep(500);

    for (const state of loaderStates) {

      loaderStatus.textContent = state.text;

      const start = Number(
        loaderPercent.textContent.replace("%", "")
      ) || 0;

      const end = state.progress;

      const duration = 650;

      const started = performance.now();

      await new Promise(resolve => {

        function tick(now) {

          const progress = clamp(
            (now - started) / duration,
            0,
            1
          );

          const value = Math.round(
            lerp(start, end, progress)
          );

          loaderPercent.textContent =
            `${String(value).padStart(2, "0")}%`;

          loaderProgress.style.width = `${value}%`;

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        }

        requestAnimationFrame(tick);
      });

      await sleep(320);
    }

    await sleep(650);

    loader.classList.add("is-hidden");
    body.classList.remove("is-loading");

    startHorizontalSystem();
  }


  /* =========================================================
     HORIZONTAL SYSTEM
  ========================================================== */

  function getMaxScroll() {

    if (isMobile) {
      return 0;
    }

    return Math.max(
      horizontalWorld.offsetHeight - window.innerHeight,
      1
    );
  }


  function getHorizontalDistance() {

    if (isMobile) {
      return 0;
    }

    return Math.max(
      horizontalTrack.scrollWidth - window.innerWidth,
      0
    );
  }


  function applyHorizontalPosition(progress) {

    if (isMobile) {
      horizontalTrack.style.transform = "none";
      return;
    }

    const distance = getHorizontalDistance();

    const x = distance * progress;

    horizontalTrack.style.transform =
      `translate3d(${-x}px, 0, 0)`;
  }


  function updateFromScroll() {

    if (isMobile) {
      return;
    }

    const maxScroll = getMaxScroll();

    targetProgress = clamp(
      window.scrollY / maxScroll,
      0,
      1
    );
  }


  function animateHorizontal() {

    currentProgress = lerp(
      currentProgress,
      targetProgress,
      0.075
    );

    applyHorizontalPosition(currentProgress);

    const rawScene =
      currentProgress * (sceneCount - 1);

    const nextScene =
      Math.round(rawScene);

    if (nextScene !== currentScene) {
      activateScene(nextScene);
    }

    updateSceneUI(rawScene);

    raf = requestAnimationFrame(
      animateHorizontal
    );
  }


  function scrollToProgress(progress) {

    if (isMobile) {
      return;
    }

    const maxScroll = getMaxScroll();

    const y = progress * maxScroll;

    window.scrollTo({
      top: y,
      behavior: "smooth"
    });
  }


  function startHorizontalSystem() {

    if (isMobile) {
      activateScene(0);
      return;
    }

    updateFromScroll();

    currentProgress = targetProgress;

    applyHorizontalPosition(currentProgress);

    activateScene(
      Math.round(
        currentProgress * (sceneCount - 1)
      )
    );

    if (!raf) {
      raf = requestAnimationFrame(
        animateHorizontal
      );
    }
  }


  /* =========================================================
     WHEEL
  ========================================================== */

  window.addEventListener(
    "wheel",
    event => {

      if (
        isMobile ||
        body.classList.contains("is-loading") ||
        requestOverlay.classList.contains("is-open")
      ) {
        return;
      }

      const intensity =
        Math.abs(event.deltaY) > Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;

      if (Math.abs(intensity) < 1) {
        return;
      }

      event.preventDefault();

      const maxScroll = getMaxScroll();

      const next =
        clamp(
          window.scrollY + intensity * 0.85,
          0,
          maxScroll
        );

      window.scrollTo({
        top: next,
        behavior: "auto"
      });

    },
    { passive: false }
  );


  /* =========================================================
     SCROLL
  ========================================================== */

  window.addEventListener(
    "scroll",
    updateFromScroll,
    { passive: true }
  );


  /* =========================================================
     KEYBOARD
  ========================================================== */

  window.addEventListener(
    "keydown",
    event => {

      if (
        isMobile ||
        requestOverlay.classList.contains("is-open")
      ) {
        return;
      }

      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown"
      ) {
        event.preventDefault();

        scrollToProgress(
          clamp(
            targetProgress + 1 / (sceneCount - 1),
            0,
            1
          )
        );
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "PageUp"
      ) {
        event.preventDefault();

        scrollToProgress(
          clamp(
            targetProgress - 1 / (sceneCount - 1),
            0,
            1
          )
        );
      }

      if (event.key === "Home") {
        event.preventDefault();
        scrollToProgress(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        scrollToProgress(1);
      }
    }
  );


  /* =========================================================
     SCENE ACTIVATION
  ========================================================== */

  function activateScene(index) {

    index = clamp(
      index,
      0,
      sceneCount - 1
    );

    currentScene = index;

    scenes.forEach(
      (scene, sceneIndexValue) => {

        scene.classList.toggle(
          "active",
          sceneIndexValue === index
        );

      }
    );

    sceneIndex.textContent =
      String(index + 1).padStart(2, "0");

    sceneProgress.style.height =
      `${((index + 1) / sceneCount) * 100}%`;

    if (index === 2) {
      runAccessSequence();
    }

    if (index === 3) {
      runSecuritySequence();
    }
  }


  function updateSceneUI(rawScene) {

    const normalized =
      clamp(rawScene, 0, sceneCount - 1);

    const visualIndex =
      Math.round(normalized);

    sceneIndex.textContent =
      String(visualIndex + 1).padStart(2, "0");

    sceneProgress.style.height =
      `${((normalized + 1) / sceneCount) * 100}%`;
  }


  /* =========================================================
     ACCESS SEQUENCE
  ========================================================== */

  let accessTimer = null;

  function runAccessSequence() {

    clearTimeout(accessTimer);

    const items = [
      ...document.querySelectorAll(
        ".sequence-item"
      )
    ];

    let index = 0;

    items.forEach(
      item => item.classList.remove("active")
    );

    function step() {

      items.forEach(
        item => item.classList.remove("active")
      );

      if (items[index]) {
        items[index].classList.add("active");
      }

      index++;

      if (index < items.length) {

        accessTimer = setTimeout(
          step,
          850
        );

      } else {

        accessTimer = setTimeout(
          () => {
            items.forEach(
              item => item.classList.add("active")
            );
          },
          700
        );
      }
    }

    step();
  }


  /* =========================================================
     SECURITY RESPONSE
  ========================================================== */

  let securityTimer = null;

  function runSecuritySequence() {

    clearTimeout(securityTimer);

    const states = [
      ...document.querySelectorAll(
        ".console-state"
      )
    ];

    states.forEach(
      state => {
        state.classList.remove("active");
      }
    );

    let index = 0;

    function step() {

      states.forEach(
        state => {
          state.style.opacity = ".4";
          state.style.color = "";
        }
      );

      if (states[index]) {

        states[index].style.opacity = "1";
        states[index].style.color =
          "var(--gold)";
      }

      index++;

      if (index < states.length) {

        securityTimer = setTimeout(
          step,
          900
        );

      } else {

        securityTimer = setTimeout(
          () => {

            states.forEach(
              state => {
                state.style.opacity = ".75";
                state.style.color =
                  "var(--gold)";
              }
            );

          },
          800
        );
      }
    }

    step();
  }


  /* =========================================================
     IMAGE PARALLAX
  ========================================================== */

  document.addEventListener(
    "mousemove",
    event => {

      if (
        isMobile ||
        body.classList.contains("is-loading")
      ) {
        return;
      }

      const x =
        event.clientX / window.innerWidth - .5;

      const y =
        event.clientY / window.innerHeight - .5;

      document
        .querySelectorAll(".image-frame img")
        .forEach(img => {

          img.style.transform =
            `scale(1.025)
             translate3d(${x * -10}px, ${y * -8}px, 0)`;
        });

    }
  );


  /* =========================================================
     CURSOR
  ========================================================== */

  let cursorX = 0;
  let cursorY = 0;

  let cursorTargetX = 0;
  let cursorTargetY = 0;

  function animateCursor() {

    cursorTargetX =
      lerp(cursorTargetX, cursorX, .18);

    cursorTargetY =
      lerp(cursorTargetY, cursorY, .18);

    cursor.style.left =
      `${cursorTargetX}px`;

    cursor.style.top =
      `${cursorTargetY}px`;

    cursorLabel.style.left =
      `${cursorTargetX}px`;

    cursorLabel.style.top =
      `${cursorTargetY}px`;

    requestAnimationFrame(
      animateCursor
    );
  }

  window.addEventListener(
    "mousemove",
    event => {

      cursorX = event.clientX;
      cursorY = event.clientY;

    }
  );

  animateCursor();


  document.addEventListener(
    "mouseenter",
    () => {
      cursor.style.opacity = "1";
      cursorLabel.style.opacity = "1";
    }
  );


  document.addEventListener(
    "mouseover",
    event => {

      const interactive =
        event.target.closest(
          "button, a, input, textarea"
        );

      if (interactive) {

        body.classList.add(
          "cursor-active"
        );

        cursorLabel.textContent =
          interactive.tagName === "BUTTON"
            ? "CONTROL"
            : "OPEN";

      } else {

        body.classList.remove(
          "cursor-active"
        );

        cursorLabel.textContent =
          "SYSTEM";
      }
    }
  );


  /* =========================================================
     REQUEST POPUP
  ========================================================== */

  function openRequestModal() {

    requestOverlay.classList.add(
      "is-open"
    );

    requestModal.classList.remove(
      "is-success"
    );

    body.style.overflow = "hidden";
  }


  function closeRequestModal() {

    requestOverlay.classList.remove(
      "is-open"
    );

    body.style.overflow = "";

    requestModal.classList.remove(
      "is-success"
    );
  }


  openRequest.addEventListener(
    "click",
    openRequestModal
  );


  closeRequest.addEventListener(
    "click",
    closeRequestModal
  );


  requestOverlay.addEventListener(
    "click",
    event => {

      if (event.target === requestOverlay) {
        closeRequestModal();
      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        requestOverlay.classList.contains("is-open")
      ) {
        closeRequestModal();
      }

    }
  );


  /* =========================================================
     REQUEST FORM
  ========================================================== */

  requestForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      requestModal.classList.add(
        "is-success"
      );

    }
  );


  /* =========================================================
     IMAGE ERROR HANDLING
  ========================================================== */

  document
    .querySelectorAll("img")
    .forEach(img => {

      img.addEventListener(
        "error",
        () => {

          img.style.opacity = "0";

          const parent =
            img.closest(
              ".image-frame, .author-logo-wrap, .sentra-logo-wrap, .control-logo-wrap"
            );

          if (parent) {
            parent.classList.add(
              "image-missing"
            );
          }

        }
      );

    });


  /* =========================================================
     RESIZE
  ========================================================== */

  window.addEventListener(
    "resize",
    () => {

      const nextMobile =
        window.innerWidth <= 900;

      if (nextMobile !== isMobile) {

        isMobile = nextMobile;

        if (isMobile) {

          horizontalTrack.style.transform =
            "none";

          window.scrollTo({
            top: 0,
            behavior: "auto"
          });

          currentProgress = 0;
          targetProgress = 0;

        } else {

          horizontalWorld.style.height =
            "800vh";

          updateFromScroll();
        }
      }

    }
  );


  /* =========================================================
     INITIALIZATION
  ========================================================== */

  activateScene(0);

  runLoader();

})();
