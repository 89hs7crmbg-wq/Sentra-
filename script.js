"use strict";

/*
=========================================================
SENTRA SYSTEM
No libraries.
GitHub Pages ready.
=========================================================
*/


/* =========================================================
   DOM
========================================================= */

const body = document.body;

const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderPercent = document.getElementById("loaderPercent");
const loaderStatus = document.getElementById("loaderStatus");

const experience = document.getElementById("experience");

const headerState = document.getElementById("headerState");
const systemTime = document.getElementById("systemTime");

const systemProgress = document.getElementById("systemProgress");
const sceneCurrent = document.getElementById("sceneCurrent");

const scenes = Array.from(
    document.querySelectorAll(".scene")
);

const cursor = document.getElementById("cursor");
const cursorLabel = document.getElementById("cursorLabel");

const accessResult = document.getElementById("accessResult");

const eventStatus = document.getElementById("eventStatus");
const eventLogText = document.getElementById("eventLogText");
const eventLine = document.getElementById("eventLine");

const responseState = document.getElementById("responseState");

const networkHealth = document.getElementById("networkHealth");

const contactButton = document.getElementById("contactButton");
const requestState = document.getElementById("requestState");


/* =========================================================
   STATE
========================================================= */

let isMobile = window.innerWidth <= 900;

let currentProgress = 0;
let targetProgress = 0;

let currentScene = 0;

let loaderValue = 0;

let accessStarted = false;
let securityStarted = false;
let healthStarted = false;


/* =========================================================
   HELPERS
========================================================= */

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function updateViewportHeight() {
    document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight}px`
    );
}

updateViewportHeight();


/* =========================================================
   TIME
========================================================= */

function updateSystemTime() {

    const now = new Date();

    const hours = String(
        now.getHours()
    ).padStart(2, "0");

    const minutes = String(
        now.getMinutes()
    ).padStart(2, "0");

    const seconds = String(
        now.getSeconds()
    ).padStart(2, "0");

    systemTime.textContent =
        `${hours}:${minutes}:${seconds}`;
}

setInterval(updateSystemTime, 1000);
updateSystemTime();


/* =========================================================
   LOADER
========================================================= */

const loaderStatuses = [
    {
        at: 0,
        text: "SYSTEM INITIALIZATION"
    },
    {
        at: 24,
        text: "NETWORK CONNECTED"
    },
    {
        at: 52,
        text: "OBJECT DETECTED"
    },
    {
        at: 76,
        text: "CONTROL CHANNEL READY"
    },
    {
        at: 94,
        text: "SYSTEM ONLINE"
    }
];

function updateLoaderStatus(value) {

    let current = loaderStatuses[0];

    loaderStatuses.forEach((item) => {

        if (value >= item.at) {
            current = item;
        }

    });

    loaderStatus.textContent = current.text;
}

function runLoader() {

    const loaderTimer = setInterval(() => {

        const increment =
            loaderValue < 70
                ? Math.random() * 4 + 1
                : Math.random() * 1.8 + 0.4;

        loaderValue += increment;

        if (loaderValue >= 100) {

            loaderValue = 100;

            clearInterval(loaderTimer);

            loaderProgress.style.width = "100%";
            loaderPercent.textContent = "100";
            loaderStatus.textContent = "SYSTEM ONLINE";

            setTimeout(() => {

                loader.classList.add("is-hidden");
                body.classList.remove("is-loading");

                activateScene(0);

            }, 700);

            return;
        }

        const rounded =
            Math.floor(loaderValue);

        loaderProgress.style.width =
            `${loaderValue}%`;

        loaderPercent.textContent =
            String(rounded).padStart(2, "0");

        updateLoaderStatus(loaderValue);

    }, 70);
}

body.classList.add("is-loading");

window.addEventListener(
    "load",
    runLoader,
    { once: true }
);


/* =========================================================
   DEVICE
========================================================= */

function checkDevice() {

    isMobile =
        window.innerWidth <= 900;

}

checkDevice();


/* =========================================================
   HORIZONTAL SCROLL
========================================================= */

function getMaxScroll() {

    if (isMobile) {
        return 0;
    }

    return (
        document.documentElement.scrollHeight -
        window.innerHeight
    );
}

function getHorizontalWidth() {

    return (
        window.innerWidth *
        (scenes.length - 1)
    );
}

function updateTargetFromScroll() {

    if (isMobile) {
        return;
    }

    const maxScroll =
        getMaxScroll();

    if (maxScroll <= 0) {
        return;
    }

    targetProgress =
        clamp(
            window.scrollY / maxScroll,
            0,
            1
        );
}

window.addEventListener(
    "scroll",
    updateTargetFromScroll,
    { passive: true }
);


/* =========================================================
   SCROLL TRANSFORM
========================================================= */

function renderHorizontalExperience() {

    if (isMobile) {

        experience.style.transform =
            "none";

        currentProgress = 0;

        requestAnimationFrame(
            renderHorizontalExperience
        );

        return;
    }

    currentProgress =
        lerp(
            currentProgress,
            targetProgress,
            0.085
        );

    const maxX =
        getHorizontalWidth();

    const x =
        currentProgress *
        maxX;

    experience.style.transform =
        `translate3d(${-x}px, 0, 0)`;

    updateSystemInterface();

    requestAnimationFrame(
        renderHorizontalExperience
    );
}

renderHorizontalExperience();


/* =========================================================
   SCENE STATES
========================================================= */

const sceneNames = [
    "OBJECT DETECTED",
    "SURVEILLANCE ACTIVE",
    "ACCESS CONTROL",
    "FIRE / SECURITY",
    "MAINTENANCE",
    "SYSTEM HEALTH",
    "CONTROL CENTER",
    "SYSTEM ONLINE"
];

function calculateScene() {

    const raw =
        currentProgress *
        (scenes.length - 1);

    return clamp(
        Math.round(raw),
        0,
        scenes.length - 1
    );
}

function activateScene(index) {

    scenes.forEach(
        (scene, sceneIndex) => {

            scene.classList.toggle(
                "active",
                sceneIndex === index
            );

        }
    );

    currentScene = index;

    sceneCurrent.textContent =
        String(index + 1).padStart(2, "0");

    headerState.textContent =
        sceneNames[index];

    if (index === 2) {
        runAccessSequence();
    }

    if (index === 3) {
        runSecuritySequence();
    }

    if (index === 5) {
        runHealthSequence();
    }
}

function updateSystemInterface() {

    const scene =
        calculateScene();

    if (scene !== currentScene) {
        activateScene(scene);
    }

    const percentage =
        currentProgress * 100;

    systemProgress.style.width =
        `${percentage}%`;
}


/* =========================================================
   ACCESS CONTROL SEQUENCE
========================================================= */

function runAccessSequence() {

    if (accessStarted) {
        return;
    }

    accessStarted = true;

    const items =
        Array.from(
            document.querySelectorAll(
                ".sequence-item"
            )
        );

    const labels = [
        "IDENTIFICATION",
        "VERIFICATION",
        "ACCESS GRANTED",
        "EVENT LOGGED"
    ];

    let index = 0;

    const runStep = () => {

        items.forEach(
            (item, itemIndex) => {

                item.classList.toggle(
                    "active",
                    itemIndex === index
                );

            }
        );

        accessResult.textContent =
            labels[index];

        index++;

        if (index < items.length) {

            setTimeout(
                runStep,
                850
            );

        } else {

            setTimeout(() => {

                items.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                items[3].classList.add(
                    "active"
                );

                accessResult.textContent =
                    "ACCESS VERIFIED";

            }, 900);

        }

    };

    runStep();
}


/* =========================================================
   SECURITY RESPONSE
========================================================= */

function runSecuritySequence() {

    if (securityStarted) {
        return;
    }

    securityStarted = true;

    const states = [
        {
            status: "ALL SYSTEMS NORMAL",
            log: "MONITORING",
            response: "MONITORING",
            width: 18
        },
        {
            status: "FIRE DETECTION",
            log: "EVENT RECEIVED",
            response: "VERIFYING",
            width: 42
        },
        {
            status: "EVENT VERIFIED",
            log: "THREAT CONFIRMED",
            response: "VERIFIED",
            width: 72
        },
        {
            status: "RESPONSE ACTIVE",
            log: "CENTER NOTIFIED",
            response: "RESPONSE ACTIVE",
            width: 100
        }
    ];

    let index = 0;

    const runStep = () => {

        const state =
            states[index];

        eventStatus.textContent =
            state.status;

        eventLogText.textContent =
            state.log;

        responseState.textContent =
            state.response;

        eventLine.style.width =
            `${state.width}%`;

        index++;

        if (index < states.length) {

            setTimeout(
                runStep,
                1150
            );

        } else {

            setTimeout(() => {

                eventStatus.textContent =
                    "SYSTEM STABILIZED";

                eventLogText.textContent =
                    "RESPONSE COMPLETE";

                responseState.textContent =
                    "SYSTEM STABLE";

            }, 1500);

        }

    };

    runStep();
}


/* =========================================================
   HEALTH NETWORK
========================================================= */

function runHealthSequence() {

    if (healthStarted) {
        return;
    }

    healthStarted = true;

    let value = 100;

    const timer =
        setInterval(() => {

            value -= 1;

            networkHealth.textContent =
                `${value}%`;

            if (value <= 97) {

                clearInterval(timer);

                setTimeout(
                    restoreHealth,
                    500
                );

            }

        }, 80);
}

function restoreHealth() {

    let value =
        parseInt(
            networkHealth.textContent
        ) || 97;

    const timer =
        setInterval(() => {

            value += 1;

            networkHealth.textContent =
                `${value}%`;

            if (value >= 100) {

                clearInterval(timer);

                setTimeout(() => {

                    networkHealth.textContent =
                        "100%";

                }, 300);

            }

        }, 80);
}


/* =========================================================
   CONTACT INTERACTION
========================================================= */

contactButton.addEventListener(
    "click",
    () => {

        requestState.textContent =
            "REQUEST RECEIVED";

        requestState.classList.add(
            "received"
        );

        setTimeout(() => {

            requestState.textContent =
                "CONNECTION OPEN";

        }, 900);

    }
);


/* =========================================================
   MOUSE PARALLAX
========================================================= */

let mouseX = 0;
let mouseY = 0;

window.addEventListener(
    "mousemove",
    (event) => {

        mouseX =
            event.clientX /
            window.innerWidth -
            0.5;

        mouseY =
            event.clientY /
            window.innerHeight -
            0.5;

        if (!isMobile) {

            document
                .querySelectorAll(
                    ".image-frame"
                )
                .forEach(
                    (image, index) => {

                        const amount =
                            (index % 3 + 1) * 3;

                        image.style.setProperty(
                            "--mx",
                            `${mouseX * amount}px`
                        );

                        image.style.setProperty(
                            "--my",
                            `${mouseY * amount}px`
                        );

                    }
                );

        }

    }
);


/* =========================================================
   IMAGE PARALLAX
========================================================= */

function applyImageParallax() {

    if (!isMobile) {

        document
            .querySelectorAll(
                ".image-frame img"
            )
            .forEach(
                (image) => {

                    const parent =
                        image.parentElement;

                    const mx =
                        parent.style.getPropertyValue(
                            "--mx"
                        ) || "0px";

                    const my =
                        parent.style.getPropertyValue(
                            "--my"
                        ) || "0px";

                    image.style.transform =
                        `scale(1.02) translate3d(${mx}, ${my}, 0)`;

                }
            );

    }

    requestAnimationFrame(
        applyImageParallax
    );
}

applyImageParallax();


/* =========================================================
   CURSOR
========================================================= */

if (!isMobile) {

    window.addEventListener(
        "mousemove",
        (event) => {

            cursor.style.left =
                `${event.clientX}px`;

            cursor.style.top =
                `${event.clientY}px`;

            cursorLabel.style.left =
                `${event.clientX}px`;

            cursorLabel.style.top =
                `${event.clientY}px`;

        }
    );

    const interactive =
        document.querySelectorAll(
            "a, .image-frame, .sequence-item, .health-item, .control-node"
        );

    interactive.forEach(
        (element) => {

            element.addEventListener(
                "mouseenter",
                () => {

                    cursor.style.width =
                        "32px";

                    cursor.style.height =
                        "32px";

                    cursorLabel.classList.add(
                        "visible"
                    );

                    cursorLabel.textContent =
                        "INTERACT";

                }
            );

            element.addEventListener(
                "mouseleave",
                () => {

                    cursor.style.width =
                        "18px";

                    cursor.style.height =
                        "18px";

                    cursorLabel.classList.remove(
                        "visible"
                    );

                }
            );

        }
    );

}


/* =========================================================
   WHEEL TO HORIZONTAL
========================================================= */

window.addEventListener(
    "wheel",
    (event) => {

        if (isMobile) {
            return;
        }

        /*
        The browser's vertical scroll becomes
        the navigation axis of SENTRA.
        */

        const maxScroll =
            getMaxScroll();

        if (maxScroll <= 0) {
            return;
        }

        event.preventDefault();

        const delta =
            event.deltaY ||
            event.deltaX;

        targetProgress =
            clamp(
                targetProgress +
                delta / maxScroll,
                0,
                1
            );

        window.scrollTo(
            0,
            targetProgress *
            maxScroll
        );

    },
    {
        passive: false
    }
);


/* =========================================================
   TOUCH SWIPE
========================================================= */

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener(
    "touchstart",
    (event) => {

        if (!isMobile) {
            return;
        }

        touchStartX =
            event.touches[0].clientX;

        touchStartY =
            event.touches[0].clientY;

    },
    {
        passive: true
    }
);

window.addEventListener(
    "touchmove",
    () => {

        /*
        Mobile deliberately keeps
        native vertical scrolling.
        */

    },
    {
        passive: true
    }
);


/* =========================================================
   KEYBOARD NAVIGATION
========================================================= */

window.addEventListener(
    "keydown",
    (event) => {

        if (isMobile) {
            return;
        }

        const maxScroll =
            getMaxScroll();

        if (event.key === "ArrowRight") {

            event.preventDefault();

            targetProgress =
                clamp(
                    targetProgress +
                    1 /
                    (scenes.length - 1),
                    0,
                    1
                );

            window.scrollTo(
                0,
                targetProgress *
                maxScroll
            );

        }

        if (event.key === "ArrowLeft") {

            event.preventDefault();

            targetProgress =
                clamp(
                    targetProgress -
                    1 /
                    (scenes.length - 1),
                    0,
                    1
                );

            window.scrollTo(
                0,
                targetProgress *
                maxScroll
            );

        }

    }
);


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        updateViewportHeight();

        checkDevice();

        if (isMobile) {

            experience.style.transform =
                "none";

            window.scrollTo(
                0,
                0
            );

        }

    }
);


/* =========================================================
   IMAGE ERROR PROTECTION
========================================================= */

document
    .querySelectorAll("img")
    .forEach(
        (image) => {

            image.addEventListener(
                "error",
                () => {

                    image.style.opacity =
                        "0";

                    image.parentElement?.classList.add(
                        "image-missing"
                    );

                }
            );

        }
    );


/* =========================================================
   INITIAL STATE
========================================================= */

activateScene(0);
