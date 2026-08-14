(() => {
  "use strict";


  /* =======================================================
     ELEMENTS
  ======================================================== */

  const loader = document.getElementById("loader");
  const loaderCounter = document.getElementById("loaderCounter");

  const track = document.getElementById("track");
  const experience = document.getElementById("experience");

  const scenes = Array.from(
    document.querySelectorAll(".scene")
  );

  const progressNumber =
    document.getElementById("progressNumber");

  const progressFill =
    document.getElementById("progressFill");

  const liveDate =
    document.getElementById("liveDate");

  const liveTime =
    document.getElementById("liveTime");

  const menuButton =
    document.getElementById("menuButton");

  const menuClose =
    document.getElementById("menuClose");

  const mobileMenu =
    document.getElementById("mobileMenu");

  const menuLinks =
    Array.from(
      document.querySelectorAll("[data-menu-scene]")
    );

  const navigationHint =
    document.getElementById("navigationHint");


  /* =======================================================
     STATE
  ======================================================== */

  const TOTAL = scenes.length;

  let currentIndex = 0;

  let targetIndex = 0;

  let currentX = 0;

  let targetX = 0;

  let viewportWidth =
    window.innerWidth;

  let isAnimating = false;

  let wheelLocked = false;

  let pointerDown = false;

  let pointerStartX = 0;

  let pointerStartY = 0;

  let pointerLastX = 0;

  let pointerMoved = false;

  let touchStartTime = 0;

  let animationFrame = null;

  let initialized = false;


  /* =======================================================
     UTILS
  ======================================================== */

  const clamp = (value, min, max) => {
    return Math.min(
      Math.max(value, min),
      max
    );
  };


  const ease = (t) => {
    return 1 - Math.pow(1 - t, 4);
  };


  const isMobile = () => {
    return window.innerWidth <= 650;
  };


  const getSceneX = (index) => {
    return -(index * viewportWidth);
  };


  /* =======================================================
     LOADER
  ======================================================== */

  const runLoader = () => {

    let value = 0;

    const duration = 1900;

    const start = performance.now();

    const update = (now) => {

      const progress =
        Math.min(
          (now - start) / duration,
          1
        );

      value =
        Math.floor(
          ease(progress) * 100
        );

      if (loaderCounter) {
        loaderCounter.textContent =
          String(value).padStart(2, "0");
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {

        setTimeout(() => {

          loader.classList.add(
            "is-hidden"
          );

          document.body.classList.add(
            "system-ready"
          );

        }, 280);

      }
    };

    requestAnimationFrame(update);
  };


  /* =======================================================
     LIVE DATE / TIME
  ======================================================== */

  const updateDateTime = () => {

    const now = new Date();

    const date =
      new Intl.DateTimeFormat(
        "ru-RU",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }
      ).format(now);

    const time =
      new Intl.DateTimeFormat(
        "ru-RU",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }
      ).format(now);

    if (liveDate) {
      liveDate.textContent = date;
    }

    if (liveTime) {
      liveTime.textContent = time;
    }
  };


  /* =======================================================
     URL HASH
  ======================================================== */

  const readHash = () => {

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

    const requested =
      Number(match[1]) - 1;

    return clamp(
      requested,
      0,
      TOTAL - 1
    );
  };


  const updateHash = (
    index,
    replace = false
  ) => {

    const hash =
      `#scene-${index + 1}`;

    if (window.location.hash === hash) {
      return;
    }

    if (replace) {

      history.replaceState(
        null,
        "",
        hash
      );

    } else {

      history.pushState(
        null,
        "",
        hash
      );

    }
  };


  /* =======================================================
     PROGRESS
  ======================================================== */

  const updateProgress = (index) => {

    const number =
      String(index + 1)
        .padStart(2, "0");

    if (progressNumber) {
      progressNumber.textContent =
        number;
    }

    if (progressFill) {

      const percent =
        ((index + 1) / TOTAL) * 100;

      progressFill.style.width =
        `${percent}%`;
    }
  };


  /* =======================================================
     ACTIVE SCENE
  ======================================================== */

  const setActiveScene = (index) => {

    scenes.forEach(
      (scene, sceneIndex) => {

        scene.classList.toggle(
          "is-active",
          sceneIndex === index
        );

      }
    );

    updateProgress(index);

    currentIndex = index;
  };


  /* =======================================================
     TRACK RENDER
  ======================================================== */

  const render = () => {

    currentX +=
      (targetX - currentX) * 0.085;

    if (
      Math.abs(targetX - currentX)
      < 0.08
    ) {
      currentX = targetX;
    }

    track.style.transform =
      `translate3d(${currentX}px, 0, 0)`;

    animationFrame =
      requestAnimationFrame(render);
  };


  /* =======================================================
     GO TO SCENE
  ======================================================== */

  const goToScene = (
    index,
    options = {}
  ) => {

    const {
      updateUrl = true,
      instant = false,
      unlockDelay = 620
    } = options;

    const next =
      clamp(
        index,
        0,
        TOTAL - 1
      );

    targetIndex = next;

    targetX =
      getSceneX(next);

    setActiveScene(next);

    if (updateUrl) {
      updateHash(next);
    }

    if (instant) {
      currentX = targetX;
    }

    isAnimating = true;

    clearTimeout(
      goToScene.unlockTimer
    );

    goToScene.unlockTimer =
      setTimeout(() => {
        isAnimating = false;
      }, unlockDelay);

    wheelLocked = true;

    clearTimeout(
      goToScene.wheelTimer
    );

    goToScene.wheelTimer =
      setTimeout(() => {
        wheelLocked = false;
      }, unlockDelay);
  };


  /* =======================================================
     NEXT / PREVIOUS
  ======================================================== */

  const nextScene = () => {

    if (currentIndex >= TOTAL - 1) {
      return;
    }

    goToScene(
      currentIndex + 1
    );
  };


  const previousScene = () => {

    if (currentIndex <= 0) {
      return;
    }

    goToScene(
      currentIndex - 1
    );
  };


  /* =======================================================
     WHEEL
  ======================================================== */

  const handleWheel = (event) => {

    event.preventDefault();

    if (wheelLocked || isAnimating) {
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

    if (delta > 0) {
      nextScene();
    } else {
      previousScene();
    }
  };


  /* =======================================================
     POINTER DRAG
  ======================================================== */

  const handlePointerDown = (event) => {

    if (event.pointerType === "mouse") {

      pointerDown = true;

      pointerStartX =
        event.clientX;

      pointerStartY =
        event.clientY;

      pointerLastX =
        event.clientX;

      pointerMoved = false;

      experience.classList.add(
        "is-dragging"
      );

      try {
        experience.setPointerCapture(
          event.pointerId
        );
      } catch (_) {}

    }

    if (
      event.pointerType === "touch"
    ) {

      pointerDown = true;

      pointerStartX =
        event.clientX;

      pointerStartY =
        event.clientY;

      pointerLastX =
        event.clientX;

      pointerMoved = false;

      touchStartTime =
        performance.now();

    }
  };


  const handlePointerMove = (event) => {

    if (!pointerDown) {
      return;
    }

    const deltaX =
      event.clientX -
      pointerLastX;

    const totalX =
      event.clientX -
      pointerStartX;

    const totalY =
      event.clientY -
      pointerStartY;

    if (
      Math.abs(totalX) > 8 ||
      Math.abs(totalY) > 8
    ) {
      pointerMoved = true;
    }

    if (
      event.pointerType === "mouse"
    ) {

      const mostlyHorizontal =
        Math.abs(totalX) >
        Math.abs(totalY);

      if (!mostlyHorizontal) {
        return;
      }

    }

    pointerLastX =
      event.clientX;

    if (
      Math.abs(deltaX) < 0.1
    ) {
      return;
    }

    /*
      Во время drag разрешаем только
      визуальное смещение в пределах
      соседних сцен.

      Никакого свободного улёта на
      несколько экранов.
    */

    const minX =
      getSceneX(TOTAL - 1);

    const maxX =
      getSceneX(0);

    targetX =
      clamp(
        targetX + deltaX,
        minX,
        maxX
      );

    track.style.transform =
      `translate3d(${targetX}px, 0, 0)`;
  };


  const handlePointerUp = (event) => {

    if (!pointerDown) {
      return;
    }

    pointerDown = false;

    experience.classList.remove(
      "is-dragging"
    );

    const totalX =
      event.clientX -
      pointerStartX;

    const totalY =
      event.clientY -
      pointerStartY;

    const elapsed =
      performance.now() -
      touchStartTime;

    const horizontal =
      Math.abs(totalX) >
      Math.abs(totalY);

    /*
      Если пользователь сделал короткий
      клик мышью, ничего не переключаем.
    */

    if (
      !pointerMoved &&
      event.pointerType === "mouse"
    ) {
      goToScene(
        currentIndex,
        {
          updateUrl: false
        }
      );

      return;
    }

    /*
      Свайп:
      достаточно 55 px.
      Быстрый свайп допускается от 35 px.
    */

    const threshold =
      elapsed < 350
        ? 35
        : 55;

    if (
      horizontal &&
      Math.abs(totalX) >= threshold
    ) {

      if (totalX < 0) {
        nextScene();
      } else {
        previousScene();
      }

      return;
    }

    /*
      Если жест был недостаточным,
      возвращаемся к ближайшей сцене.
    */

    const estimatedIndex =
      Math.round(
        Math.abs(
          targetX / viewportWidth
        )
      );

    goToScene(
      estimatedIndex,
      {
        updateUrl: false
      }
    );
  };


  /* =======================================================
     TOUCH SAFETY
  ======================================================== */

  const handleTouchStart = (event) => {

    if (!event.touches.length) {
      return;
    }

    pointerStartX =
      event.touches[0].clientX;

    pointerStartY =
      event.touches[0].clientY;
  };


  /* =======================================================
     KEYBOARD
  ======================================================== */

  const handleKeyboard = (event) => {

    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown"
    ) {

      event.preventDefault();

      nextScene();

      return;
    }

    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp"
    ) {

      event.preventDefault();

      previousScene();

      return;
    }

    if (event.key === "Home") {

      event.preventDefault();

      goToScene(0);

      return;
    }

    if (event.key === "End") {

      event.preventDefault();

      goToScene(TOTAL - 1);

    }
  };


  /* =======================================================
     RESIZE
  ======================================================== */

  const handleResize = () => {

    viewportWidth =
      window.innerWidth;

    targetX =
      getSceneX(
        currentIndex
      );

    currentX =
      targetX;

    track.style.transform =
      `translate3d(${currentX}px, 0, 0)`;
  };


  /* =======================================================
     MOBILE MENU
  ======================================================== */

  const openMenu = () => {

    mobileMenu.classList.add(
      "is-open"
    );

    mobileMenu.setAttribute(
      "aria-hidden",
      "false"
    );

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );
  };


  const closeMenu = () => {

    mobileMenu.classList.remove(
      "is-open"
    );

    mobileMenu.setAttribute(
      "aria-hidden",
      "true"
    );

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );
  };


  /* =======================================================
     MENU NAVIGATION
  ======================================================== */

  const handleMenuNavigation = (
    event
  ) => {

    event.preventDefault();

    const index =
      Number(
        event.currentTarget.dataset.menuScene
      );

    closeMenu();

    setTimeout(() => {

      goToScene(index);

    }, 120);
  };


  /* =======================================================
     HASH CHANGE
  ======================================================== */

  const handleHashChange = () => {

    const index =
      readHash();

    goToScene(
      index,
      {
        updateUrl: false,
        instant: false
      }
    );
  };


  /* =======================================================
     HOVER PARALLAX
  ======================================================== */

  const setupParallax = () => {

    if (isMobile()) {
      return;
    }

    scenes.forEach((scene) => {

      const image =
        scene.querySelector(
          ".scene-image"
        );

      if (!image) {
        return;
      }

      scene.addEventListener(
        "pointermove",
        (event) => {

          if (
            pointerDown ||
            !scene.classList.contains("is-active")
          ) {
            return;
          }

          const rect =
            scene.getBoundingClientRect();

          const x =
            (event.clientX - rect.left)
            / rect.width
            - .5;

          const y =
            (event.clientY - rect.top)
            / rect.height
            - .5;

          image.style.transform =
            `scale(1.015)
             translate3d(
               ${x * -8}px,
               ${y * -5}px,
               0
             )`;
        }
      );

      scene.addEventListener(
        "pointerleave",
        () => {

          image.style.transform =
            "";

        }
      );

    });
  };


  /* =======================================================
     EVENT LISTENERS
  ======================================================== */

  experience.addEventListener(
    "wheel",
    handleWheel,
    {
      passive: false
    }
  );

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

  experience.addEventListener(
    "touchstart",
    handleTouchStart,
    {
      passive: true
    }
  );

  window.addEventListener(
    "keydown",
    handleKeyboard
  );

  window.addEventListener(
    "resize",
    handleResize
  );

  window.addEventListener(
    "hashchange",
    handleHashChange
  );


  if (menuButton) {

    menuButton.addEventListener(
      "click",
      openMenu
    );

  }


  if (menuClose) {

    menuClose.addEventListener(
      "click",
      closeMenu
    );

  }


  menuLinks.forEach(
    (link) => {

      link.addEventListener(
        "click",
        handleMenuNavigation
      );

    }
  );


  /* =======================================================
     INITIALIZATION
  ======================================================== */

  const init = () => {

    viewportWidth =
      window.innerWidth;

    const initialIndex =
      readHash();

    currentIndex =
      initialIndex;

    targetIndex =
      initialIndex;

    currentX =
      getSceneX(initialIndex);

    targetX =
      currentX;

    track.style.transform =
      `translate3d(${currentX}px, 0, 0)`;

    setActiveScene(
      initialIndex
    );

    updateDateTime();

    setInterval(
      updateDateTime,
      1000
    );

    setupParallax();

    render();

    runLoader();

    initialized = true;
  };


  init();

})();
