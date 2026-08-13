const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderPercent = document.getElementById("loaderPercent");
const loaderStatus = document.getElementById("loaderStatus");

const experience = document.getElementById("experience");
const track = document.getElementById("track");

const progressBar = document.getElementById("progressBar");
const currentScene = document.getElementById("currentScene");

const floatingCta = document.getElementById("floatingCta");
const requestModal = document.getElementById("requestModal");
const modalClose = document.getElementById("modalClose");
const openRequest = document.getElementById("openRequest");

const requestForm = document.getElementById("requestForm");
const formSuccess = document.getElementById("formSuccess");

const menuButton = document.getElementById("menuButton");
const menuClose = document.getElementById("menuClose");
const mobileMenu = document.getElementById("mobileMenu");

const sceneCount = 8;

let currentProgress = 0;
let targetProgress = 0;

let dragging = false;
let dragStartX = 0;
let dragStartProgress = 0;

let touchStartX = 0;
let touchLastX = 0;
let touchStartProgress = 0;

let wheelAccumulator = 0;
let lastTime = performance.now();

const isMobile = () => window.innerWidth <= 760;


/* -------------------------------------------------
   LOADER
------------------------------------------------- */

const loaderSteps = [
    {
        text: "СИСТЕМА ИНИЦИАЛИЗИРУЕТСЯ",
        start: 0,
        end: 24
    },
    {
        text: "СЕТЬ ПОДКЛЮЧЕНА",
        start: 25,
        end: 48
    },
    {
        text: "ОБЪЕКТ ОБНАРУЖЕН",
        start: 49,
        end: 76
    },
    {
        text: "СИСТЕМА АКТИВНА",
        start: 77,
        end: 100
    }
];

const loaderStart = performance.now();
const loaderDuration = 3600;

function runLoader(now) {

    const elapsed = now - loaderStart;
    const progress = Math.min(elapsed / loaderDuration, 1);
    const percent = Math.floor(progress * 100);

    loaderProgress.style.width = `${percent}%`;
    loaderPercent.textContent = `${String(percent).padStart(2, "0")}%`;

    const step = loaderSteps.find(
        item => percent >= item.start && percent <= item.end
    );

    if (step) {
        loaderStatus.textContent = step.text;
    }

    if (progress < 1) {
        requestAnimationFrame(runLoader);
    } else {

        setTimeout(() => {
            loader.classList.add("hidden");

            setTimeout(() => {
                document.body.classList.add("ready");
            }, 700);

        }, 350);
    }
}

requestAnimationFrame(runLoader);


/* -------------------------------------------------
   HORIZONTAL ENGINE
------------------------------------------------- */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function setProgress(value) {

    targetProgress = clamp(value, 0, 1);
}

function moveByPixels(delta) {

    const maxDistance =
        Math.max(window.innerWidth * (sceneCount - 1), 1);

    setProgress(targetProgress + delta / maxDistance);
}

function goToScene(index) {

    const target = clamp(index, 0, sceneCount - 1);

    setProgress(target / (sceneCount - 1));

    closeMobileMenu();
}

function render(now) {

    const delta = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;

    const ease = 1 - Math.pow(.0005, delta);

    currentProgress +=
        (targetProgress - currentProgress) * ease;

    const distance =
        currentProgress * window.innerWidth * (sceneCount - 1);

    track.style.transform =
        `translate3d(${-distance}px, 0, 0)`;

    updateInterface();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);


/* -------------------------------------------------
   INTERFACE
------------------------------------------------- */

function updateInterface() {

    const sceneFloat =
        currentProgress * (sceneCount - 1);

    const sceneNumber =
        Math.min(
            sceneCount,
            Math.floor(sceneFloat + .5) + 1
        );

    currentScene.textContent =
        String(sceneNumber).padStart(2, "0");

    progressBar.style.width =
        `${currentProgress * 100}%`;

    updateDesktopMenu(sceneNumber);
}

function updateDesktopMenu(number) {

    document
        .querySelectorAll(".desktop-menu button")
        .forEach((button, index) => {

            button.classList.toggle(
                "active",
                index === number - 1
            );
        });
}


/* -------------------------------------------------
   DESKTOP WHEEL
------------------------------------------------- */

experience.addEventListener(
    "wheel",
    event => {

        if (isMobile()) {
            return;
        }

        event.preventDefault();

        const amount =
            Math.abs(event.deltaY) > Math.abs(event.deltaX)
                ? event.deltaY
                : event.deltaX;

        wheelAccumulator += amount;

        const threshold = 20;

        if (Math.abs(wheelAccumulator) >= threshold) {

            moveByPixels(wheelAccumulator * 0.8);

            wheelAccumulator = 0;
        }

    },
    { passive: false }
);


/* -------------------------------------------------
   MOUSE DRAG
------------------------------------------------- */

experience.addEventListener("pointerdown", event => {

    if (isMobile()) {
        return;
    }

    if (
        event.target.closest("button") ||
        event.target.closest("a") ||
        event.target.closest("input") ||
        event.target.closest("textarea")
    ) {
        return;
    }

    dragging = true;
    dragStartX = event.clientX;
    dragStartProgress = targetProgress;

    experience.classList.add("dragging");

    experience.setPointerCapture(event.pointerId);
});

experience.addEventListener("pointermove", event => {

    if (!dragging) {
        return;
    }

    const distance =
        Math.max(window.innerWidth * (sceneCount - 1), 1);

    const delta =
        dragStartX - event.clientX;

    setProgress(
        dragStartProgress + delta / distance
    );
});

function stopDragging() {

    dragging = false;

    experience.classList.remove("dragging");
}

experience.addEventListener("pointerup", stopDragging);
experience.addEventListener("pointercancel", stopDragging);
experience.addEventListener("lostpointercapture", stopDragging);


/* -------------------------------------------------
   MOBILE REAL SWIPE
------------------------------------------------- */

experience.addEventListener(
    "touchstart",
    event => {

        if (event.touches.length !== 1) {
            return;
        }

        touchStartX = event.touches[0].clientX;
        touchLastX = touchStartX;

        touchStartProgress = targetProgress;

    },
    { passive: true }
);

experience.addEventListener(
    "touchmove",
    event => {

        if (event.touches.length !== 1) {
            return;
        }

        const x = event.touches[0].clientX;

        const delta =
            touchStartX - x;

        const distance =
            Math.max(window.innerWidth * (sceneCount - 1), 1);

        setProgress(
            touchStartProgress + delta / distance
        );

        touchLastX = x;

    },
    { passive: true }
);

experience.addEventListener(
    "touchend",
    () => {

        const moved =
            touchStartX - touchLastX;

        const threshold =
            window.innerWidth * .08;

        if (Math.abs(moved) < threshold) {
            return;
        }

        const sceneFloat =
            targetProgress * (sceneCount - 1);

        let nearest =
            Math.round(sceneFloat);

        if (moved > 0) {
            nearest = Math.max(nearest, Math.ceil(sceneFloat));
        } else {
            nearest = Math.min(nearest, Math.floor(sceneFloat));
        }

        goToScene(nearest);

    },
    { passive: true }
);


/* -------------------------------------------------
   KEYBOARD
------------------------------------------------- */

window.addEventListener("keydown", event => {

    if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft"
    ) {
        return;
    }

    event.preventDefault();

    const current =
        Math.round(targetProgress * (sceneCount - 1));

    if (event.key === "ArrowRight") {
        goToScene(current + 1);
    }

    if (event.key === "ArrowLeft") {
        goToScene(current - 1);
    }
});


/* -------------------------------------------------
   NAVIGATION
------------------------------------------------- */

document.querySelectorAll("[data-target]").forEach(button => {

    button.addEventListener("click", () => {

        const target =
            Number(button.dataset.target);

        goToScene(target);
    });
});


/* -------------------------------------------------
   MOBILE MENU
------------------------------------------------- */

function openMobileMenu() {
    mobileMenu.classList.add("open");
}

function closeMobileMenu() {
    mobileMenu.classList.remove("open");
}

menuButton.addEventListener(
    "click",
    openMobileMenu
);

menuClose.addEventListener(
    "click",
    closeMobileMenu
);

mobileMenu.addEventListener("click", event => {

    const button =
        event.target.closest("[data-target]");

    if (!button) {
        return;
    }

    goToScene(
        Number(button.dataset.target)
    );
});


/* -------------------------------------------------
   MODAL
------------------------------------------------- */

function openModal() {

    requestModal.classList.add("open");

    formSuccess.style.display = "none";
    requestForm.style.display = "flex";
}

function closeModal() {

    requestModal.classList.remove("open");
}

floatingCta.addEventListener(
    "click",
    openModal
);

openRequest.addEventListener(
    "click",
    openModal
);

modalClose.addEventListener(
    "click",
    closeModal
);

document
    .querySelector(".modal-backdrop")
    .addEventListener(
        "click",
        closeModal
    );

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeModal();
        closeMobileMenu();
    }
});


/* -------------------------------------------------
   FORM
------------------------------------------------- */

requestForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        requestForm.style.display = "none";
        formSuccess.style.display = "block";
    }
);


/* -------------------------------------------------
   IMAGE CHECK
------------------------------------------------- */

document.querySelectorAll("img").forEach(image => {

    image.addEventListener("error", () => {

        console.warn(
            `Не удалось загрузить изображение: ${image.src}`
        );

        image.style.opacity = "0";
    });
});


/* -------------------------------------------------
   RESIZE
------------------------------------------------- */

window.addEventListener("resize", () => {

    const sceneFloat =
        currentProgress * (sceneCount - 1);

    targetProgress =
        clamp(sceneFloat / (sceneCount - 1), 0, 1);
});


/* -------------------------------------------------
   INITIAL STATE
------------------------------------------------- */

setTimeout(() => {
    setProgress(0);
}, 100);
