(() => {
  "use strict";

  /* =========================================================
     ELEMENTS
  ========================================================= */

  const loader = document.getElementById("loader");
  const loaderPercent = document.getElementById("loaderPercent");

  const track = document.getElementById("track");
  const experience = document.getElementById("experience");

  const scenes = [...document.querySelectorAll(".scene")];

  const currentSceneEl = document.getElementById("currentScene");
  const progressFill = document.getElementById("progressFill");

  const liveDate = document.getElementById("liveDate");
  const liveTime = document.getElementById("liveTime");
  const controlClock = document.getElementById("controlClock");

  const menuButton = document.getElementById("menuButton");
  const mobileMenu = document.getElementById("mobileMenu");
  const menuClose = document.getElementById("menuClose");

  const menuLinks = [
    ...document.querySelectorAll("[data-menu-scene]")
  ];

  const navigationHint = document.getElementById("navigationHint");


  /* =========================================================
     STATE
  ========================================================= */

  let currentIndex = 0;

  let currentX = 0;
  let targetX = 0;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartTarget = 0;

  let pointerStartX = 0;
  let pointerStartY = 0;

  let lastWheelTime = 0;

  let wheelAccumulator = 0;

  let animationFrame = null;

  const sceneCount = scenes.length;


  /* =========================================================
     HELPERS
  ========================================================= */

  const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };


  const getViewportWidth = () => {
    return window.innerWidth;
  };


  const getSceneX = (index) => {
    return -index * getViewportWidth();
  };


  const formatNumber = (number) => {
    return String(number).padStart(2, "0");
  };


  /* =========================================================
     LIVE DATE / TIME
  ========================================================= */

  function updateClock() {

    const now = new Date();

    const date = now.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    const time = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    if (liveDate) {
      liveDate.textContent = date;
    }

    if (liveTime) {
      liveTime.textContent = time;
    }

    if (controlClock) {
      controlClock.textContent = time;
    }
  }

  updateClock();
  setInterval(updateClock, 1000);


  /* =========================================================
     LOADER
  ========================================================= */

  let loaderValue = 0;

  const loaderTimer = setInterval(() => {

    loaderValue += Math.floor(Math.random() * 7) + 3;

    if (loaderValue >= 100) {
      loaderValue = 100;
      clearInterval(loaderTimer);

      if (loaderPercent) {
        loaderPercent.textContent = "100";
      }

      setTimeout(() => {
        loader.classList.add("is-hidden");
        activateScene(0);
      }, 500);

      return;
    }

    if (loaderPercent) {
      loaderPercent.textContent =
        String(loaderValue).padStart(3, "0");
    }

  }, 65);


  /* =========================================================
     TRACK POSITION
  ========================================================= */

  function setTrackPosition(x) {

    currentX = x;

    track.style.transform =
      `translate3d(${currentX}px, 0, 0)`;
  }


  function updateTargetFromIndex() {

    targetX = getSceneX(currentIndex);
  }


  function animateTrack() {

    const difference = targetX - currentX;

    if (Math.abs(difference) < 0.35) {

      currentX = targetX;

      setTrackPosition(currentX);

      animationFrame = null;

      return;
    }

    currentX += difference * 0.105;

    setTrackPosition(currentX);

    animationFrame = requestAnimationFrame(animateTrack);
  }


  function startTrackAnimation() {

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(animateTrack);
  }


  /* =========================================================
     SCENE ACTIVATION
  ========================================================= */

  function activateScene(index) {

    currentIndex = clamp(
      index,
      0,
      sceneCount - 1
    );

    updateTargetFromIndex();

    startTrackAnimation();

    scenes.forEach((scene, sceneIndex) => {

      scene.classList.toggle(
        "is-active",
        sceneIndex === currentIndex
      );

    });

    if (currentSceneEl) {
      currentSceneEl.textContent =
        formatNumber(currentIndex + 1);
    }

    if (progressFill) {

      const progress =
        ((currentIndex + 1) / sceneCount) * 100;

      progressFill.style.width =
        `${progress}%`;
    }

    updateNavigationHint();

    window.history.replaceState(
      null,
      "",
      `#scene-${currentIndex}`
    );
  }


  /* =========================================================
     NEXT / PREVIOUS
  ========================================================= */

  function nextScene() {

    if (currentIndex >= sceneCount - 1) {
      return;
    }

    activateScene(currentIndex + 1);
  }


  function previousScene() {

    if (currentIndex <= 0) {
      return;
    }

    activateScene(currentIndex - 1);
  }


  /* =========================================================
     WHEEL
  ========================================================= */

  function handleWheel(event) {

    event.preventDefault();

    const now = Date.now();

    if (now - lastWheelTime < 520) {
      return;
    }

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    wheelAccumulator += delta;

    if (Math.abs(wheelAccumulator) < 18) {
      return;
    }

    if (wheelAccumulator > 0) {
      nextScene();
    } else {
      previousScene();
    }

    wheelAccumulator = 0;
    lastWheelTime = now;
  }

  experience.addEventListener(
    "wheel",
    handleWheel,
    { passive: false }
  );


  /* =========================================================
     POINTER DRAG
  ========================================================= */

  experience.addEventListener(
    "pointerdown",
    (event) => {

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      isDragging = true;

      pointerStartX = event.clientX;
      pointerStartY = event.clientY;

      dragStartX = event.clientX;
      dragStartTarget = targetX;

      experience.setPointerCapture?.(
        event.pointerId
      );
    }
  );


  experience.addEventListener(
    "pointermove",
    (event) => {

      if (!isDragging) {
        return;
      }

      const dx = event.clientX - dragStartX;

      const proposed =
        dragStartTarget + dx;

      const maxX =
        -(sceneCount - 1) * getViewportWidth();

      targetX = clamp(
        proposed,
        maxX,
        0
      );

      setTrackPosition(
        currentX + (targetX - currentX) * 0.25
      );
    }
  );


  function finishPointer(event) {

    if (!isDragging) {
      return;
    }

    isDragging = false;

    const dx =
      event.clientX - pointerStartX;

    const dy =
      event.clientY - pointerStartY;

    const horizontalDistance =
      Math.abs(dx);

    const verticalDistance =
      Math.abs(dy);

    if (
      horizontalDistance > 35 &&
      horizontalDistance > verticalDistance
    ) {

      if (dx < 0) {
        nextScene();
      } else {
        previousScene();
      }

      return;
    }

    const rawIndex =
      Math.round(
        Math.abs(targetX) / getViewportWidth()
      );

    activateScene(rawIndex);
  }


  experience.addEventListener(
    "pointerup",
    finishPointer
  );

  experience.addEventListener(
    "pointercancel",
    finishPointer
  );


  /* =========================================================
     TOUCH SWIPE
  ========================================================= */

  experience.addEventListener(
    "touchstart",
    (event) => {

      const touch = event.changedTouches[0];

      pointerStartX = touch.clientX;
      pointerStartY = touch.clientY;
    },
    { passive: true }
  );


  experience.addEventListener(
    "touchend",
    (event) => {

      const touch = event.changedTouches[0];

      const dx =
        touch.clientX - pointerStartX;

      const dy =
        touch.clientY - pointerStartY;

      if (
        Math.abs(dx) > 35 &&
        Math.abs(dx) > Math.abs(dy)
      ) {

        if (dx < 0) {
          nextScene();
        } else {
          previousScene();
        }

      } else {

        activateScene(currentIndex);

      }
    },
    { passive: true }
  );


  /* =========================================================
     KEYBOARD
  ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown"
      ) {

        event.preventDefault();

        nextScene();
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp"
      ) {

        event.preventDefault();

        previousScene();
      }

      if (event.key === "Home") {

        event.preventDefault();

        activateScene(0);
      }

      if (event.key === "End") {

        event.preventDefault();

        activateScene(sceneCount - 1);
      }

      if (event.key === "Escape") {

        closeMobileMenu();
      }
    }
  );


  /* =========================================================
     MOBILE MENU
  ========================================================= */

  function openMobileMenu() {

    mobileMenu.classList.add("is-open");

    document.body.style.pointerEvents = "none";

    mobileMenu.style.pointerEvents = "auto";
  }


  function closeMobileMenu() {

    mobileMenu.classList.remove("is-open");

    document.body.style.pointerEvents = "";
  }


  if (menuButton) {

    menuButton.addEventListener(
      "click",
      openMobileMenu
    );
  }


  if (menuClose) {

    menuClose.addEventListener(
      "click",
      closeMobileMenu
    );
  }


  menuLinks.forEach((link) => {

    link.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        const index =
          Number(
            link.dataset.menuScene
          );

        activateScene(index);

        closeMobileMenu();
      }
    );
  });


  /* =========================================================
     NAVIGATION HINT
  ========================================================= */

  function updateNavigationHint() {

    if (!navigationHint) {
      return;
    }

    const label =
      navigationHint.querySelector("span");

    if (!label) {
      return;
    }

    if (currentIndex === 0) {

      label.textContent =
        window.innerWidth <= 650
          ? "SWIPE"
          : "SCROLL / DRAG";

      navigationHint.style.opacity = "1";

    } else if (currentIndex === sceneCount - 1) {

      label.textContent = "END";

      navigationHint.style.opacity = ".45";

    } else {

      label.textContent =
        window.innerWidth <= 650
          ? "SWIPE"
          : "SCROLL / DRAG";

      navigationHint.style.opacity = ".7";
    }
  }


  /* =========================================================
     RESPONSIVE RESIZE
  ========================================================= */

  let resizeTimer;

  window.addEventListener(
    "resize",
    () => {

      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {

        updateTargetFromIndex();

        setTrackPosition(targetX);

        updateNavigationHint();

      }, 100);
    }
  );


  /* =========================================================
     URL / INITIAL SCENE
  ========================================================= */

  function getInitialScene() {

    const hash =
      window.location.hash;

    const match =
      hash.match(/scene-(\d+)/);

    if (!match) {
      return 0;
    }

    const index =
      Number(match[1]);

    return clamp(
      index,
      0,
      sceneCount - 1
    );
  }


  currentIndex =
    getInitialScene();

  targetX =
    getSceneX(currentIndex);

  currentX =
    targetX;

  setTrackPosition(
    currentX
  );

  scenes.forEach((scene, index) => {

    scene.classList.toggle(
      "is-active",
      index === currentIndex
    );

  });

  if (currentSceneEl) {

    currentSceneEl.textContent =
      formatNumber(currentIndex + 1);
  }

  if (progressFill) {

    progressFill.style.width =
      `${((currentIndex + 1) / sceneCount) * 100}%`;
  }

  updateNavigationHint();


  /* =========================================================
     PREVENT CONTEXT MENU
  ========================================================= */

  experience.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    }
  );


  /* =========================================================
     SMALL PARALLAX ON DESKTOP
  ========================================================= */

  if (window.matchMedia("(pointer:fine)").matches) {

    window.addEventListener(
      "pointermove",
      (event) => {

        const x =
          (event.clientX / window.innerWidth) - .5;

        const y =
          (event.clientY / window.innerHeight) - .5;

        scenes.forEach((scene) => {

          const image =
            scene.querySelector(".scene-image");

          if (!image) {
            return;
          }

          if (!scene.classList.contains("is-active")) {
            return;
          }

          image.style.transform =
            `scale(1.01) translate(${x * -5}px, ${y * -3}px)`;
        });

      }
    );
  }

})();
