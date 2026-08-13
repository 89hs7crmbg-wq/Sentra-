const track = document.getElementById("track");
const loader = document.getElementById("loader");
const liveTime = document.getElementById("liveTime");
const progressBar = document.getElementById("progressBar");
const progressCurrent = document.getElementById("progressCurrent");
const swipeHint = document.getElementById("swipeHint");
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");
const systemState = document.getElementById("systemState");

const sceneCount = 8;

let currentProgress = 0;
let targetProgress = 0;
let currentScene = 0;

let dragging = false;
let dragStartX = 0;
let dragStartProgress = 0;

let touchStartX = 0;
let touchLastX = 0;
let touchStartProgress = 0;
let touchMoved = false;

let wheelLock = false;

function updateClock(){

  const now = new Date();

  const h = String(now.getHours()).padStart(2,"0");
  const m = String(now.getMinutes()).padStart(2,"0");
  const s = String(now.getSeconds()).padStart(2,"0");

  liveTime.textContent = `${h}:${m}:${s}`;
}

updateClock();
setInterval(updateClock,1000);

function clamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}

function sceneToProgress(scene){
  return scene / (sceneCount - 1);
}

function goToScene(index){

  currentScene = clamp(index,0,sceneCount - 1);
  targetProgress = sceneToProgress(currentScene);

  document.querySelectorAll(".desktop-nav button").forEach((button,i)=>{
    button.classList.toggle("active",i === currentScene);
  });

  progressCurrent.textContent =
    String(currentScene + 1).padStart(2,"0");

  updateSystemState();

  mobileMenu.classList.remove("open");
}

function updateSystemState(){

  const states = [
    "OBJECT ONLINE",
    "SURVEILLANCE ACTIVE",
    "ACCESS VERIFIED",
    "RESPONSE READY",
    "SERVICE RUNNING",
    "NETWORK CONNECTED",
    "CONTROL CENTER",
    "SYSTEM COMPLETE"
  ];

  systemState.textContent = states[currentScene] || "SYSTEM ONLINE";
}

function render(){

  currentProgress +=
    (targetProgress - currentProgress) * .085;

  const distance =
    currentProgress *
    window.innerWidth *
    (sceneCount - 1);

  track.style.transform =
    `translate3d(${-distance}px,0,0)`;

  progressBar.style.width =
    `${currentProgress * 100}%`;

  requestAnimationFrame(render);
}

render();

function nearestScene(){

  const index =
    Math.round(targetProgress * (sceneCount - 1));

  goToScene(index);
}

function handleWheel(event){

  if(window.innerWidth <= 700) return;

  event.preventDefault();

  if(wheelLock) return;

  const delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;

  targetProgress += delta * .0008;

  targetProgress =
    clamp(targetProgress,0,1);

  wheelLock = true;

  setTimeout(()=>{
    wheelLock = false;
    nearestScene();
  },180);
}

window.addEventListener("wheel",handleWheel,{passive:false});

window.addEventListener("keydown",(event)=>{

  if(event.key === "ArrowRight"){
    goToScene(currentScene + 1);
  }

  if(event.key === "ArrowLeft"){
    goToScene(currentScene - 1);
  }
});

track.addEventListener("pointerdown",(event)=>{

  if(window.innerWidth <= 700) return;

  dragging = true;
  dragStartX = event.clientX;
  dragStartProgress = targetProgress;

  track.setPointerCapture(event.pointerId);
  track.classList.add("is-dragging");
});

track.addEventListener("pointermove",(event)=>{

  if(!dragging) return;

  const delta =
    event.clientX - dragStartX;

  targetProgress =
    dragStartProgress -
    delta /
    (window.innerWidth * (sceneCount - 1));

  targetProgress =
    clamp(targetProgress,0,1);
});

track.addEventListener("pointerup",()=>{

  if(!dragging) return;

  dragging = false;

  track.classList.remove("is-dragging");

  nearestScene();
});

track.addEventListener("pointercancel",()=>{

  dragging = false;
  track.classList.remove("is-dragging");
  nearestScene();

});

track.addEventListener("touchstart",(event)=>{

  const touch = event.touches[0];

  touchStartX = touch.clientX;
  touchLastX = touch.clientX;
  touchStartProgress = targetProgress;
  touchMoved = false;

},{passive:false});

track.addEventListener("touchmove",(event)=>{

  event.preventDefault();

  const touch = event.touches[0];

  const delta =
    touch.clientX - touchStartX;

  const frameDelta =
    touch.clientX - touchLastX;

  if(Math.abs(delta) > 8){
    touchMoved = true;
  }

  targetProgress =
    touchStartProgress -
    delta /
    (window.innerWidth * (sceneCount - 1));

  targetProgress =
    clamp(targetProgress,0,1);

  touchLastX = touch.clientX;

},{passive:false});

track.addEventListener("touchend",()=>{

  if(!touchMoved) return;

  nearestScene();

  if(swipeHint){
    swipeHint.classList.add("hidden");
  }

},{passive:true});

document.querySelectorAll("[data-scene]").forEach(button=>{

  button.addEventListener("click",()=>{

    const scene =
      Number(button.dataset.scene);

    goToScene(scene);

  });

});

burger.addEventListener("click",()=>{
  mobileMenu.classList.add("open");
});

closeMenu.addEventListener("click",()=>{
  mobileMenu.classList.remove("open");
});

mobileMenu.addEventListener("click",(event)=>{

  if(event.target === mobileMenu){
    mobileMenu.classList.remove("open");
  }

});

const orderBtn =
  document.getElementById("orderBtn");

orderBtn.addEventListener("click",()=>{

  window.open(
    "https://vk.ru/id_aikharisov",
    "_blank",
    "noopener,noreferrer"
  );

});

window.addEventListener("resize",()=>{

  const index =
    Math.round(targetProgress * (sceneCount - 1));

  targetProgress =
    sceneToProgress(index);

  currentProgress =
    targetProgress;

});

setTimeout(()=>{

  loader.classList.add("hidden");

},3600);

setTimeout(()=>{

  swipeHint.classList.add("hidden");

},7000);

window.addEventListener("load",()=>{

  document.querySelectorAll("img").forEach(img=>{

    img.addEventListener("error",()=>{
      console.warn(
        "SENTRA: изображение не найдено:",
        img.src
      );
    });

  });

});

goToScene(0);
