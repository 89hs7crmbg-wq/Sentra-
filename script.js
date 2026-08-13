/* =========================================================
   SENTRA / SYSTEM ENGINE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const loader = document.getElementById("loader");
  const loaderStatus = document.getElementById("loaderStatus");
  const loaderProgress = document.getElementById("loaderProgress");
  const loaderPercent = document.getElementById("loaderPercent");
  const loaderCode = document.getElementById("loaderCode");

  const system = document.getElementById("system");
  const stage = document.getElementById("horizontalStage");
  const track = document.getElementById("horizontalTrack");

  const sceneNumber = document.getElementById("sceneNumber");
  const globalStatus = document.getElementById("globalStatus");
  const progressPercent = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");
  const progressNode = document.getElementById("progressNode");
  const mobilePosition = document.getElementById("mobilePosition");

  const scenes = [...document.querySelectorAll(".scene")];
  const navItems = [...document.querySelectorAll(".nav-item")];

  const menuButton = document.getElementById("menuButton");
  const systemNav = document.getElementById("systemNav");
  const navClose = document.getElementById("navClose");

  const floatingRequest = document.getElementById("floatingRequest");
  const contactTrigger = document.getElementById("contactTrigger");

  const modal = document.getElementById("projectModal");
  const modalClose = document.getElementById("modalClose");
  const modalBackdrop = document.querySelector(".modal-backdrop");

  const projectForm = document.getElementById("projectForm");
  const formSuccess = document.getElementById("formSuccess");


  /* =======================================================
     LOADER
  ======================================================== */

  const loaderSteps = [
    {
      text: "SYSTEM INITIALIZATION",
      code: "NODE 00"
    },
    {
      text: "NETWORK CONNECTED",
      code: "NODE 04"
    },
    {
      text: "OBJECT DETECTED",
      code: "OBJECT 01"
    },
    {
      text: "SYSTEM ONLINE",
      code: "SENTRA / ACTIVE"
    }
  ];

  let loaderStart = performance.now();

  function runLoader(now) {

    const elapsed = now - loaderStart;
    const duration = 4300;
    const progress = Math.min(elapsed / duration, 1);

    const percent = Math.floor(progress * 100);

    loaderProgress.style.width = `${percent}%`;
    loaderPercent.textContent = String(percent).padStart(2, "0");

    let step;

    if (progress < .27) {
      step = loaderSteps[0];
    } else if (progress < .53) {
      step = loaderSteps[1];
    } else if (progress < .78) {
      step = loaderSteps[2];
    } else {
      step = loaderSteps[3];
    }

    loaderStatus.textContent = step.text;
    loaderCode.textContent = step.code;

    if (progress < 1) {
      requestAnimationFrame(runLoader);
    } else {
      setTimeout(() => {
        loader.classList.add("is-done");
        system.classList.add("ready");
        document.body.classList.add("system-ready");
      }, 650);
    }
  }

  requestAnimationFrame(runLoader);


  /* =======================================================
     STATE
  ======================================================== */

  let currentProgress = 0;
  let targetProgress = 0;
  let currentScene = 0;
  let raf = null;

  function maxScroll() {
    return Math.max(
      0,
      stage.offsetHeight - window.innerHeight
    );
  }

  function getProgressFromScroll() {
    const max = maxScroll();

    if (!max) {
      return 0;
    }

    return Math.min(
      1,
      Math.max(
        0,
        window.scrollY / max
      )
    );
  }


  /* =======================================================
     TRACK
  ======================================================== */

  function render() {

    currentProgress +=
      (targetProgress - currentProgress) * .11;

    const travel =
      window.innerWidth * 7;

    const x =
      currentProgress * travel;

    track.style.transform =
      `translate3d(${-x}px, 0, 0)`;

    updateInterface(currentProgress);

    raf = requestAnimationFrame(render);
  }

  raf = requestAnimationFrame(render);


  /* =======================================================
     TARGET SCROLL
  ======================================================== */

  function setTargetProgress(value) {

    targetProgress = Math.min(
      1,
      Math.max(
        0,
        value
      )
    );

    const scrollPosition =
      targetProgress * maxScroll();

    window.scrollTo({
      top: scrollPosition,
      behavior: "auto"
    });
  }


  function moveByDelta(delta) {

    const max = maxScroll();

    if (!max) {
      return;
    }

    const sensitivity =
      window.innerWidth <= 900
        ? 0.00115
        : 0.00075;

    targetProgress +=
      delta * sensitivity;

    targetProgress = Math.min(
      1,
      Math.max(
        0,
        targetProgress
      )
    );

    window.scrollTo({
      top: targetProgress * max,
      behavior: "auto"
    });
  }


  /* =======================================================
     WHEEL
  ======================================================== */

  let wheelLocked = false;

  window.addEventListener(
    "wheel",
    (event) => {

      if (
        modal.classList.contains("open") ||
        systemNav.classList.contains("open")
      ) {
        return;
      }

      event.preventDefault();

      if (wheelLocked) {
        return;
      }

      wheelLocked = true;

      const delta =
        Math.abs(event.deltaY) > Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;

      moveByDelta(delta);

      setTimeout(() => {
        wheelLocked = false;
      }, 8);

    },
    {
      passive: false
    }
  );


  /* =======================================================
     NORMAL SCROLL
  ======================================================== */

  let scrollTimer = null;

  window.addEventListener(
    "scroll",
    () => {

      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      scrollTimer = setTimeout(() => {

        const p = getProgressFromScroll();

        targetProgress = p;

      }, 5);

    },
    {
      passive: true
    }
  );


  /* =======================================================
     TOUCH
  ======================================================== */

  let touchStartY = 0;
  let touchLastY = 0;

  window.addEventListener(
    "touchstart",
    (event) => {

      if (
        modal.classList.contains("open") ||
        systemNav.classList.contains("open")
      ) {
        return;
      }

      touchStartY =
        event.touches[0].clientY;

      touchLastY =
        touchStartY;

    },
    {
      passive: true
    }
  );


  window.addEventListener(
    "touchmove",
    (event) => {

      if (
        modal.classList.contains("open") ||
        systemNav.classList.contains("open")
      ) {
        return;
      }

      const y =
        event.touches[0].clientY;

      const delta =
        touchLastY - y;

      touchLastY = y;

      moveByDelta(delta * 1.35);

    },
    {
      passive: true
    }
  );


  /* =======================================================
     POINTER DRAG
  ======================================================== */

  let dragging = false;
  let pointerX = 0;

  window.addEventListener(
    "pointerdown",
    (event) => {

      if (
        event.pointerType !== "mouse" ||
        event.button !== 0
      ) {
        return;
      }

      if (
        modal.classList.contains("open") ||
        systemNav.classList.contains("open")
      ) {
        return;
      }

      dragging = true;
      pointerX = event.clientX;

      document.body.classList.add("dragging");

    }
  );


  window.addEventListener(
    "pointermove",
    (event) => {

      if (!dragging) {
        return;
      }

      const delta =
        pointerX - event.clientX;

      pointerX = event.clientX;

      moveByDelta(delta * 1.5);

    }
  );


  window.addEventListener(
    "pointerup",
    () => {

      dragging = false;

      document.body.classList.remove("dragging");

    }
  );


  /* =======================================================
     INTERFACE UPDATE
  ======================================================== */

  function updateInterface(progress) {

    const sceneFloat =
      progress * scenes.length;

    let index =
      Math.floor(sceneFloat);

    if (index >= scenes.length) {
      index = scenes.length - 1;
    }

    const local =
      sceneFloat - index;

    if (index !== currentScene) {
      currentScene = index;
      updateSceneState(index);
    }

    const percent =
      Math.round(progress * 100);

    progressPercent.textContent =
      `${String(percent).padStart(2, "0")}%`;

    progressFill.style.width =
      `${percent}%`;

    progressNode.style.left =
      `${percent}%`;

    sceneNumber.textContent =
      String(index + 1).padStart(2, "0");

    updateSceneMotion(
      index,
      local
    );
  }


  /* =======================================================
     SCENE STATE
  ======================================================== */

  const sceneNames = [
    "OBJECT DETECTED",
    "SURVEILLANCE ACTIVE",
    "ACCESS CONTROL",
    "RESPONSE READY",
    "SYSTEM HEALTH",
    "NETWORK ACTIVE",
    "CENTRAL NODE",
    "NEW OBJECT"
  ];

  const globalNames = [
    "OBJECT ONLINE",
    "SURVEILLANCE ACTIVE",
    "ACCESS VERIFIED",
    "RESPONSE READY",
    "SERVICE ACTIVE",
    "NETWORK ACTIVE",
    "CONTROL CENTER",
    "CHANNEL READY"
  ];


  function updateSceneState(index) {

    scenes.forEach((scene, i) => {
      scene.classList.toggle(
        "active",
        i === index
      );
    });

    navItems.forEach((item, i) => {
      item.classList.toggle(
        "active",
        i === index
      );
    });

    globalStatus.textContent =
      globalNames[index];

    mobilePosition.textContent =
      sceneNames[index];

    if (index === 0) {
      document.getElementById("objectState").textContent =
        "ONLINE";
    }

    if (index === 1) {
      document.getElementById("motionState").textContent =
        "DETECTED";
    }

    if (index === 2) {
      document.getElementById("accessLabel").textContent =
        "CARD VERIFIED";

      document.getElementById("accessStatus").textContent =
        "GRANTED";
    }

    if (index === 3) {
      document.getElementById("fireNodeState").textContent =
        "EVENT READY";

      document.getElementById("responseState").textContent =
        "RESPONSE ACTIVE";
    }

    if (index === 4) {
      document.getElementById("maintenanceState").textContent =
        "RESTORING";

      document.getElementById("healthValue").textContent =
        "96%";

      document.getElementById("healthBar").style.width =
        "96%";
    }

    if (index === 5) {
      document.getElementById("flowState").textContent =
        "ACTIVE / 24H";
    }

    if (index === 6) {
      document.getElementById("nodeCount").textContent =
        "018";
    }
  }


  /* =======================================================
     SCENE MOTION
  ======================================================== */

  function updateSceneMotion(index, local) {

    const scene =
      scenes[index];

    if (!scene) {
      return;
    }

    const image =
      scene.querySelector(".scene-image");

    if (image) {

      const x =
        (local - .5) * -2;

      const y =
        Math.sin(local * Math.PI) * -1;

      image.style.transform =
        `translate3d(${x}%, ${y}%, 0) scale(1.035)`;

    }


    if (index === 0) {

      const scan =
        scene.querySelector(".scan-field");

      if (scan) {
        scan.style.opacity =
          local > .03 && local < .97
            ? "1"
            : "0";
      }

    }


    if (index === 1) {

      const frame =
        scene.querySelector(".surveillance-frame");

      if (frame) {

        const scale =
          .88 + local * .22;

        frame.style.transform =
          `scale(${scale})`;

      }

    }


    if (index === 4) {

      const value =
        Math.round(
          72 + local * 25
        );

      document.getElementById(
        "healthValue"
      ).textContent = `${value}%`;

      document.getElementById(
        "healthBar"
      ).style.width = `${value}%`;

    }

  }


  /* =======================================================
     NAVIGATION
  ======================================================== */

  menuButton.addEventListener(
    "click",
    () => {
      systemNav.classList.add("open");
    }
  );


  navClose.addEventListener(
    "click",
    () => {
      systemNav.classList.remove("open");
    }
  );


  navItems.forEach(
    (item) => {

      item.addEventListener(
        "click",
        () => {

          const target =
            Number(
              item.dataset.target
            );

          const progress =
            target /
            (scenes.length - 1);

          setTargetProgress(progress);

          systemNav.classList.remove("open");

        }
      );

    }
  );


  /* =======================================================
     MODAL
  ======================================================== */

  function openModal() {

    modal.classList.add("open");
    document.body.classList.add("modal-open");

  }


  function closeModal() {

    modal.classList.remove("open");
    document.body.classList.remove("modal-open");

  }


  floatingRequest.addEventListener(
    "click",
    openModal
  );


  contactTrigger.addEventListener(
    "click",
    openModal
  );


  modalClose.addEventListener(
    "click",
    closeModal
  );


  modalBackdrop.addEventListener(
    "click",
    closeModal
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {

        if (modal.classList.contains("open")) {
          closeModal();
        }

        if (systemNav.classList.contains("open")) {
          systemNav.classList.remove("open");
        }

      }

    }
  );


  /* =======================================================
     FORM
  ======================================================== */

  projectForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      projectForm.style.display =
        "none";

      formSuccess.classList.add(
        "show"
      );

    }
  );


  /* =======================================================
     IMAGE ERROR HANDLING
  ======================================================== */

  document
    .querySelectorAll("img")
    .forEach((image) => {

      image.addEventListener(
        "error",
        () => {

          image.classList.add(
            "image-missing"
          );

          console.warn(
            `SENTRA image not found: ${image.getAttribute("src")}`
          );

        }
      );

    });


  /* =======================================================
     RESIZE
  ======================================================== */

  window.addEventListener(
    "resize",
    () => {

      const p =
        getProgressFromScroll();

      targetProgress = p;
      currentProgress = p;

      track.style.transform =
        `translate3d(${-p * window.innerWidth * 7}px, 0, 0)`;

    }
  );


  /* =======================================================
     INITIAL
  ======================================================== */

  updateSceneState(0);

});
