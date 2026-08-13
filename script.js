(() => {

  "use strict";


  /* =========================================================
     ELEMENTS
  ========================================================== */

  const body =
    document.body;

  const loader =
    document.getElementById(
      "loader"
    );

  const loaderStatus =
    document.getElementById(
      "loaderStatus"
    );

  const loaderPercent =
    document.getElementById(
      "loaderPercent"
    );

  const loaderProgress =
    document.getElementById(
      "loaderProgress"
    );

  const horizontalWorld =
    document.getElementById(
      "horizontalWorld"
    );

  const horizontalTrack =
    document.getElementById(
      "horizontalTrack"
    );

  const scenes =
    [...document.querySelectorAll(
      ".scene"
    )];

  const sceneIndex =
    document.getElementById(
      "sceneIndex"
    );

  const sceneProgress =
    document.getElementById(
      "sceneProgress"
    );

  const systemTime =
    document.getElementById(
      "systemTime"
    );

  const cursor =
    document.getElementById(
      "cursor"
    );

  const cursorLabel =
    document.getElementById(
      "cursorLabel"
    );

  const requestOverlay =
    document.getElementById(
      "requestOverlay"
    );

  const requestModal =
    document.querySelector(
      ".request-modal"
    );

  const openRequest =
    document.getElementById(
      "openRequest"
    );

  const closeRequest =
    document.getElementById(
      "closeRequest"
    );

  const requestForm =
    document.getElementById(
      "requestForm"
    );


  /* =========================================================
     STATE
  ========================================================== */

  let mobile =
    window.innerWidth <= 900;

  let targetProgress = 0;

  let currentProgress = 0;

  let currentScene = 0;

  let lastScroll =
    window.scrollY;

  let animationFrame = null;


  /* =========================================================
     UTILITY
  ========================================================== */

  const clamp =
    (value, min, max) =>
      Math.min(
        Math.max(
          value,
          min
        ),
        max
      );


  const lerp =
    (a, b, amount) =>
      a + (b - a) * amount;


  const wait =
    ms =>
      new Promise(
        resolve =>
          setTimeout(
            resolve,
            ms
          )
      );


  /* =========================================================
     CLOCK
  ========================================================== */

  function updateClock() {

    const now =
      new Date();

    const h =
      String(
        now.getHours()
      ).padStart(2, "0");

    const m =
      String(
        now.getMinutes()
      ).padStart(2, "0");

    const s =
      String(
        now.getSeconds()
      ).padStart(2, "0");

    systemTime.textContent =
      `${h}:${m}:${s}`;
  }


  updateClock();

  setInterval(
    updateClock,
    1000
  );


  /* =========================================================
     LOADER
  ========================================================== */

  const loaderStates = [

    {
      value: 8,
      text:
        "SYSTEM INITIALIZATION"
    },

    {
      value: 26,
      text:
        "CENTRAL NODE ACTIVE"
    },

    {
      value: 47,
      text:
        "NETWORK CONNECTED"
    },

    {
      value: 71,
      text:
        "OBJECT DETECTED"
    },

    {
      value: 88,
      text:
        "CONTROL NETWORK ACTIVE"
    },

    {
      value: 100,
      text:
        "SYSTEM ONLINE"
    }

  ];


  async function animateLoader(
    from,
    to
  ) {

    const duration = 600;

    const start =
      performance.now();

    return new Promise(
      resolve => {

        function frame(
          timestamp
        ) {

          const progress =
            clamp(
              (
                timestamp -
                start
              ) / duration,
              0,
              1
            );

          const value =
            Math.round(
              from +
              (
                to - from
              ) *
              progress
            );

          loaderPercent.textContent =
            `${String(value).padStart(2, "0")}%`;

          loaderProgress.style.width =
            `${value}%`;

          if (
            progress < 1
          ) {

            requestAnimationFrame(
              frame
            );

          } else {

            resolve();

          }

        }

        requestAnimationFrame(
          frame
        );

      }
    );
  }


  async function startLoader() {

    body.classList.add(
      "is-loading"
    );

    let previous = 0;

    await wait(450);


    for (
      const state
      of loaderStates
    ) {

      loaderStatus.textContent =
        state.text;

      await animateLoader(
        previous,
        state.value
      );

      previous =
        state.value;

      await wait(260);

    }


    await wait(850);

    loader.classList.add(
      "is-hidden"
    );

    body.classList.remove(
      "is-loading"
    );


    setTimeout(
      () => {

        if (!mobile) {
          initializeHorizontal();
        }

      },
      300
    );

  }


  /* =========================================================
     HORIZONTAL SCROLL
  ========================================================== */

  function getMaxScroll() {

    return Math.max(
      document.documentElement
        .scrollHeight -
      window.innerHeight,
      1
    );

  }


  function getHorizontalDistance() {

    return Math.max(
      horizontalTrack.scrollWidth -
      window.innerWidth,
      0
    );

  }


  function updateTargetFromScroll() {

    if (mobile) {
      return;
    }

    const max =
      getMaxScroll();

    targetProgress =
      clamp(
        window.scrollY /
        max,
        0,
        1
      );

  }


  function renderHorizontal() {

    if (mobile) {

      horizontalTrack.style.transform =
        "none";

      return;

    }


    const distance =
      getHorizontalDistance();

    const x =
      distance *
      currentProgress;


    horizontalTrack.style.transform =
      `translate3d(${-x}px,0,0)`;

  }


  function animateHorizontal() {

    currentProgress =
      lerp(
        currentProgress,
        targetProgress,
        .075
      );


    renderHorizontal();


    const scenePosition =
      currentProgress *
      (
        scenes.length - 1
      );


    updateScene(
      scenePosition
    );


    animationFrame =
      requestAnimationFrame(
        animateHorizontal
      );

  }


  function initializeHorizontal() {

    if (mobile) {
      return;
    }


    updateTargetFromScroll();

    currentProgress =
      targetProgress;

    renderHorizontal();

    updateScene(
      currentProgress *
      (
        scenes.length - 1
      )
    );


    if (
      !animationFrame
    ) {

      animationFrame =
        requestAnimationFrame(
          animateHorizontal
        );

    }

  }


  window.addEventListener(
    "scroll",
    () => {

      if (mobile) {
        return;
      }

      updateTargetFromScroll();

      lastScroll =
        window.scrollY;

    },
    {
      passive: true
    }
  );


  /* =========================================================
     WHEEL
  ========================================================== */

  window.addEventListener(
    "wheel",
    event => {

      if (
        mobile ||
        body.classList.contains(
          "is-loading"
        ) ||
        requestOverlay.classList.contains(
          "is-open"
        )
      ) {
        return;
      }


      event.preventDefault();


      const delta =
        Math.abs(
          event.deltaY
        ) >
        Math.abs(
          event.deltaX
        )
          ? event.deltaY
          : event.deltaX;


      const max =
        getMaxScroll();


      const next =
        clamp(
          window.scrollY +
          delta *
          1.35,
          0,
          max
        );


      window.scrollTo({
        top: next,
        behavior: "auto"
      });

    },
    {
      passive: false
    }
  );


  /* =========================================================
     KEYBOARD
  ========================================================== */

  window.addEventListener(
    "keydown",
    event => {

      if (
        mobile ||
        requestOverlay.classList.contains(
          "is-open"
        )
      ) {
        return;
      }


      const step =
        1 /
        (
          scenes.length - 1
        );


      if (
        event.key ===
        "ArrowRight"
      ) {

        event.preventDefault();

        moveTo(
          targetProgress +
          step
        );

      }


      if (
        event.key ===
        "ArrowLeft"
      ) {

        event.preventDefault();

        moveTo(
          targetProgress -
          step
        );

      }


      if (
        event.key ===
        "PageDown"
      ) {

        event.preventDefault();

        moveTo(
          targetProgress +
          step
        );

      }


      if (
        event.key ===
        "PageUp"
      ) {

        event.preventDefault();

        moveTo(
          targetProgress -
          step
        );

      }


      if (
        event.key ===
        "Home"
      ) {

        event.preventDefault();

        moveTo(0);

      }


      if (
        event.key ===
        "End"
      ) {

        event.preventDefault();

        moveTo(1);

      }

    }
  );


  function moveTo(
    progress
  ) {

    const max =
      getMaxScroll();

    const value =
      clamp(
        progress,
        0,
        1
      );


    window.scrollTo({
      top:
        value *
        max,

      behavior:
        "smooth"
    });

  }


  /* =========================================================
     SCENE UPDATE
  ========================================================== */

  function updateScene(
    scenePosition
  ) {

    const index =
      Math.round(
        scenePosition
      );


    if (
      index !== currentScene
    ) {

      currentScene =
        index;

      activateScene(
        index
      );

    }


    sceneIndex.textContent =
      String(
        index + 1
      ).padStart(
        2,
        "0"
      );


    sceneProgress.style.height =
      `${(
        (
          scenePosition + 1
        ) /
        scenes.length
      ) * 100}%`;

  }


  function activateScene(
    index
  ) {

    scenes.forEach(
      (
        scene,
        sceneIndexValue
      ) => {

        scene.classList.toggle(
          "active",
          sceneIndexValue ===
          index
        );

      }
    );


    if (
      index === 2
    ) {

      playAccess();

    }


    if (
      index === 3
    ) {

      playSecurity();

    }

  }


  /* =========================================================
     ACCESS SEQUENCE
  ========================================================== */

  let accessInterval = null;


  function playAccess() {

    clearInterval(
      accessInterval
    );


    const sequence =
      [
        ...document.querySelectorAll(
          ".sequence-item"
        )
      ];


    sequence.forEach(
      item =>
        item.classList.remove(
          "active"
        )
    );


    let index = 0;


    accessInterval =
      setInterval(
        () => {

          sequence.forEach(
            (
              item,
              itemIndex
            ) => {

              item.classList.toggle(
                "active",
                itemIndex <= index
              );

            }
          );


          index++;


          if (
            index >=
            sequence.length
          ) {

            clearInterval(
              accessInterval
            );

            setTimeout(
              () => {

                if (
                  currentScene === 2
                ) {

                  playAccess();

                }

              },
              1500
            );

          }

        },
        600
      );

  }


  /* =========================================================
     SECURITY SEQUENCE
  ========================================================== */

  let securityInterval = null;


  function playSecurity() {

    clearInterval(
      securityInterval
    );


    const states =
      [
        ...document.querySelectorAll(
          ".console-state"
        )
      ];


    states.forEach(
      state => {

        state.style.opacity =
          ".25";

        state.style.color =
          "";

      }
    );


    let index = 0;


    securityInterval =
      setInterval(
        () => {

          states.forEach(
            (
              state,
              stateIndex
            ) => {

              state.style.opacity =
                stateIndex === index
                  ? "1"
                  : ".25";


              state.style.color =
                stateIndex === index
                  ? "var(--gold)"
                  : "";

            }
          );


          index++;


          if (
            index >=
            states.length
          ) {

            clearInterval(
              securityInterval
            );


            setTimeout(
              () => {

                if (
                  currentScene === 3
                ) {

                  playSecurity();

                }

              },
              1700
            );

          }

        },
        850
      );

  }


  /* =========================================================
     IMAGE PARALLAX
  ========================================================== */

  window.addEventListener(
    "mousemove",
    event => {

      if (
        mobile ||
        body.classList.contains(
          "is-loading"
        )
      ) {
        return;
      }


      const x =
        (
          event.clientX /
          window.innerWidth
        ) -
        .5;


      const y =
        (
          event.clientY /
          window.innerHeight
        ) -
        .5;


      document
        .querySelectorAll(
          ".scene-image img"
        )
        .forEach(
          img => {

            img.style.setProperty(
              "--px",
              `${x * -12}px`
            );

            img.style.setProperty(
              "--py",
              `${y * -8}px`
            );

          }
        );

    }
  );


  /* =========================================================
     CURSOR
  ========================================================== */

  let mouseX = 0;
  let mouseY = 0;

  let cursorX = 0;
  let cursorY = 0;


  window.addEventListener(
    "mousemove",
    event => {

      mouseX =
        event.clientX;

      mouseY =
        event.clientY;

    }
  );


  function animateCursor() {

    cursorX =
      lerp(
        cursorX,
        mouseX,
        .18
      );


    cursorY =
      lerp(
        cursorY,
        mouseY,
        .18
      );


    cursor.style.left =
      `${cursorX}px`;

    cursor.style.top =
      `${cursorY}px`;


    cursorLabel.style.left =
      `${cursorX}px`;

    cursorLabel.style.top =
      `${cursorY}px`;


    requestAnimationFrame(
      animateCursor
    );

  }


  animateCursor();


  document.addEventListener(
    "mouseover",
    event => {

      const interactive =
        event.target.closest(
          "button, a, input, textarea"
        );


      if (
        interactive
      ) {

        body.classList.add(
          "cursor-active"
        );

        cursorLabel.textContent =
          "CONTROL";

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
     REQUEST MODAL
  ========================================================== */

  function openModal() {

    requestOverlay.classList.add(
      "is-open"
    );

    body.style.overflow =
      "hidden";

  }


  function closeModal() {

    requestOverlay.classList.remove(
      "is-open"
    );

    body.style.overflow =
      "";

  }


  openRequest?.addEventListener(
    "click",
    openModal
  );


  closeRequest?.addEventListener(
    "click",
    closeModal
  );


  requestOverlay?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        requestOverlay
      ) {

        closeModal();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        if (
          requestOverlay.classList.contains(
            "is-open"
          )
        ) {

          closeModal();

        }

      }

    }
  );


  /* =========================================================
     FORM SUCCESS
  ========================================================== */

  requestForm?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      requestModal.classList.add(
        "is-success"
      );

    }
  );


  /* =========================================================
     RESIZE
  ========================================================== */

  window.addEventListener(
    "resize",
    () => {

      const newMobile =
        window.innerWidth <= 900;


      if (
        newMobile === mobile
      ) {
        return;
      }


      mobile =
        newMobile;


      if (
        mobile
      ) {

        horizontalTrack.style.transform =
          "none";

        window.scrollTo({
          top: 0,
          behavior: "auto"
        });

        currentProgress = 0;
        targetProgress = 0;

      } else {

        updateTargetFromScroll();

        currentProgress =
          targetProgress;

        renderHorizontal();

      }

    }
  );


  /* =========================================================
     INIT
  ========================================================== */

  activateScene(0);

  startLoader();

})();
