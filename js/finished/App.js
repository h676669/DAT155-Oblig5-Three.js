// javascript
"use strict";
import {Group, PerspectiveCamera, Scene, WebGLRenderer, Vector3} from "../build/three.module.js";
import {SolarSystem} from "./SolarSystem.js";
import {OrbitControls} from "../build/OrbitControls.js";
import {VRButton} from "../build/VRButton.js";

const width = window.innerWidth;
const height = window.innerHeight;
const aspect = width / height;

const fov = 75;
const near = 0.1;
const far = 1000000000000000;

const camera = new PerspectiveCamera(fov, aspect, near, far);
// Move camera away from center (no effect in VR when camera is attached to dolly)
camera.position.setZ(30);

const dolly = new Group();
dolly.add(camera);

const canvas = document.createElement('canvas');
const context = canvas.getContext('webgl2');

const renderer = new WebGLRenderer({canvas, context});
renderer.setClearColor(0x000000);
renderer.setSize(width, height);

// Enable VR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);

// Track connected input sources so we can read gamepad/axes
controller1.addEventListener('connected', (event) => { controller1.userData.inputSource = event.data; });
controller1.addEventListener('disconnected', () => { delete controller1.userData.inputSource; });
controller2.addEventListener('connected', (event) => { controller2.userData.inputSource = event.data; });
controller2.addEventListener('disconnected', () => { delete controller2.userData.inputSource; });

dolly.add(controller1);
dolly.add(controller2);

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 0;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

const scene = new Scene();
// add dolly (camera + controllers) to scene so translations affect view
scene.add(dolly);

const solarSystem = new SolarSystem(scene);

// animation / timescale management
let lastTime = null;
let timeScale = 1.0;

// keyboard shortcuts to adjust timescale
window.addEventListener("keydown", (e) => {
    if (e.key === "-") {
        timeScale = Math.max(0.01, timeScale / 2);
    } else if (e.key === "=" || e.key === "+") {
        timeScale = Math.min(16, timeScale * 2);
    } else if (e.key === "0") {
        timeScale = 1.0;
    }
    console.log("timeScale =", timeScale);
});

// UI slider for timescale
const slider = document.createElement("input");
slider.type = "range";
slider.min = "0.01";
slider.max = "4.0";
slider.step = "0.01";
slider.value = String(timeScale);
Object.assign(slider.style, {position: "fixed", right: "12px", top: "12px", zIndex: "9999"});
slider.addEventListener("input", (ev) => {
    timeScale = parseFloat(ev.target.value);
});
document.body.appendChild(slider);

// VR controller movement handler
function handleController(controller, dt) {
    if (!controller || !controller.userData || !controller.userData.inputSource) return;
    const input = controller.userData.inputSource;
    if (!input.gamepad || !input.gamepad.axes) return;

    const axes = input.gamepad.axes;
    // Common mapping: axes[2] = strafe X, axes[3] = forward/back Z (may vary by controller)
    const rawStrafe = axes[2] !== undefined ? axes[2] : 0;
    const rawForward = axes[3] !== undefined ? axes[3] : 0;

    const deadzone = 0.15;
    const forward = Math.abs(rawForward) > deadzone ? -rawForward : 0; // invert so pushing forward -> positive
    const strafe = Math.abs(rawStrafe) > deadzone ? rawStrafe : 0;

    if (forward === 0 && strafe === 0) return;

    const moveSpeed = 10.0; // units per second

    // compute camera-forward projected to XZ plane
    const dir = new Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    // right vector (camera right)
    const right = new Vector3();
    right.crossVectors(dir, camera.up).normalize();

    // move dolly in world space
    dolly.position.addScaledVector(dir, moveSpeed * forward * dt);
    dolly.position.addScaledVector(right, moveSpeed * strafe * dt);
}

function render(timestamp) {
    // timestamp is a DOMHighResTimeStamp when called by setAnimationLoop
    const now = (typeof timestamp === "number") ? timestamp : performance.now();
    if (lastTime === null) lastTime = now;
    let dt = (now - lastTime) / 1000; // seconds
    // clamp very large dt (e.g., tab switching)
    dt = Math.min(dt, 0.1);
    lastTime = now;

    const scaledDt = dt * timeScale;

    // handle VR controllers (frame-rate independent)
    handleController(controller1, dt);
    handleController(controller2, dt);

    // advance solar system simulation with scaled time
    solarSystem.animate(scaledDt);

    // update orbit controls (useful outside VR)
    controls.update();

    renderer.render(scene, camera);
}

// Use renderer.setAnimationLoop for both VR and non-VR rendering
renderer.setAnimationLoop(render);
