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
     CLOCK
  ===================================================== */

  function updateClock() {

    const now = new Date();

    liveDate.textContent =
      new Intl.DateTimeFormat(
        "ru-RU",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }
      ).format(now);

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

  updateClock();

  setInterval(
    updateClock,
    1000
  );


  /* =====================================================
     LOADER
  ===================================================== */

  function setLoaderProgress(value) {

    const safeValue =
      clamp(value, 0, 100);

    loaderProgress.style.width =
      `${safeValue}%`;

    loaderPercent.textContent =
      `${String(
        Math.round(safeValue)
      ).padStart(2, "0")}%`;
  }


  function setLoaderStep(index) {

    loaderChecks.forEach(
      (item, itemIndex) => {

        item.classList.remove(
          "is-active"
        );

        if (itemIndex < index) {

          item.classList.add(
            "is-done"
          );

          item.querySelector(
            "strong"
          ).textContent = "ОК";
        }

        if (itemIndex === index) {

          item.classList.add(
            "is-active"
          );

          item.querySelector(
            "strong"
          ).textContent = "ПРОВЕРКА";
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

        item.querySelector(
          "strong"
        ).textContent = "ОК";

      }
    );

    setLoaderProgress(100);

    loaderFinal.classList.add(
      "is-visible"
    );

    setTimeout(
      () => {

        loader.classList.add(
          "is-hidden"
        );

        setTimeout(
          () => {
            loader.remove();
          },
          900
        );

        activateScene(
          0,
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

    const duration = 4300;
    const start = performance.now();

    function animateLoader(now) {

      const elapsed =
        now - start;

      const progress =
        clamp(
          (elapsed / duration) * 100,
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
            (progress / 100) *
            loaderChecks.length
          )
        );

      setLoaderStep(step);

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

  function getTargetTranslate(index) {

    return -(
      index *
      window.innerWidth
    );
  }


  function applyTranslate(
    value,
    animate = true
  ) {

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
     SCENE
  ===================================================== */

  function activateScene(
    index,
    animate = true
  ) {

    index =
      clamp(
        index,
        0,
        scenes.length - 1
      );

    currentIndex = index;

    applyTranslate(
      getTargetTranslate(index),
      animate
    );

    scenes.forEach(
      (scene, sceneIndex) => {

        scene.classList.toggle(
          "is-active",
          sceneIndex === index
        );

      }
    );

    progressCurrent.textContent =
      formatScene(index);

    progressFill.style.width =
      `${((index + 1) / scenes.length) * 100}%`;

    if (index > 0) {

      navigationHint.classList.add(
        "is-hidden"
      );

    } else {

      navigationHint.classList.remove(
        "is-hidden"
      );
    }

    if (index === 6) {

      startNetworkAnimation();

    } else {

      stopNetworkAnimation();
    }

    updateHash(index);
  }


  function goTo(index) {

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
      target === currentIndex
    ) {
      return;
    }

    isAnimating = true;

    activateScene(
      target,
      true
    );

    setTimeout(
      () => {
        isAnimating = false;
      },
      900
    );
  }


  /* =====================================================
     HASH
  ===================================================== */

  function updateHash(index) {

    const hash =
      `#scene-${index + 1}`;

    if (history.replaceState) {

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

    if (Number.isNaN(number)) {
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

  function handleWheel(event) {

    if (
      isDragging ||
      isAnimating
    ) {
      return;
    }

    const delta =
      Math.abs(event.deltaX) >
      Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (
      Math.abs(delta) < 18
    ) {
      return;
    }

    event.preventDefault();

    if (wheelLocked) {
      return;
    }

    wheelLocked = true;

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
        wheelLocked = false;
      },
      850
    );
  }


  experience.addEventListener(
    "wheel",
    handleWheel,
    {
      passive: false
    }
  );


  /* =====================================================
     POINTER DRAG
  ===================================================== */

  function handlePointerDown(
    event
  ) {

    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    if (isAnimating) {
      return;
    }

    isDragging = true;

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

    const resistance = .92;

    dragTranslate =
      dragStartTranslate +
      delta * resistance;

    const maxTranslate = 0;

    const minTranslate =
      -(
        (scenes.length - 1) *
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
          .35
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
          .35
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

    isDragging = false;

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
        window.innerWidth * .18,
        150
      );

    if (
      Math.abs(delta) >
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
      true
    );
  }


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


  /* =====================================================
     KEYBOARD
  ===================================================== */

  window.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "ArrowRight"
      ) {

        event.preventDefault();

        goTo(
          currentIndex + 1
        );
      }

      if (
        event.key === "ArrowLeft"
      ) {

        event.preventDefault();

        goTo(
          currentIndex - 1
        );
      }

      if (
        event.key === "Home"
      ) {

        event.preventDefault();

        goTo(0);
      }

      if (
        event.key === "End"
      ) {

        event.preventDefault();

        goTo(
          scenes.length - 1
        );
      }

      if (
        event.key === "Escape"
      ) {

        closeMobileMenu();
      }

    }
  );


  /* =====================================================
     MOBILE MENU
  ===================================================== */

  function openMobileMenu() {

    mobileMenu.classList.add(
      "is-open"
    );

    menuButton.classList.add(
      "is-open"
    );
  }


  function closeMobileMenu() {

    mobileMenu.classList.remove(
      "is-open"
    );

    menuButton.classList.remove(
      "is-open"
    );
  }


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
    document.getElementById("line1"),
    document.getElementById("line2"),
    document.getElementById("line3"),
    document.getElementById("line4")
  ];

  const signals = [
    document.getElementById("signal1"),
    document.getElementById("signal2"),
    document.getElementById("signal3"),
    document.getElementById("signal4")
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

      networkTimer = null;
    }

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
      window.innerWidth <= 760 ||
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
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return;
    }

    const x =
      (
        event.clientX -
        rect.left
      ) /
      rect.width -
      .5;

    const y =
      (
        event.clientY -
        rect.top
      ) /
      rect.height -
      .5;

    image.style.transform =
      `scale(1.025) translate(${x * -8}px, ${y * -5}px)`;
  }


  experience.addEventListener(
    "pointermove",
    handleParallax
  );


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

  site.style.visibility =
    "visible";

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

  progressCurrent.textContent =
    formatScene(
      initialScene
    );

  progressFill.style.width =
    `${
      (
        (initialScene + 1) /
        scenes.length
      ) * 100
    }%`;

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
