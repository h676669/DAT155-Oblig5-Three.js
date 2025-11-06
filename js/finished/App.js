"use strict";

import {Group, PerspectiveCamera, Scene, WebGLRenderer} from "../build/three.module.js";
import {SolarSystem} from "./SolarSystem.js";
import {OrbitControls} from "../build/OrbitControls.js";
import {VRButton} from "../build/VRButton.js";

const width = window.innerWidth;
const height= window.innerHeight;
const aspect = width / height;

const fov = 75;
const near = 0.1;
const far = 1000;

const camera = new PerspectiveCamera(fov, aspect, near, far);
// Flytter camera vekk fra sentrum, vil ikke ha noe effekt i VR
camera.position.setZ(30);

const dolly = new Group();
dolly.add(camera)


const canvas = document.createElement('canvas');
const context = canvas.getContext('webgl2');

const renderer = new WebGLRenderer({canvas, context});
renderer.setClearColor(0x000000); // "Bakgrunnsfarge"
renderer.setSize(width, height);

// Dette er for å ha og aktivere VR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

const controller1 = renderer.xr.getController(0);
dolly.add(controller1);
const controller2 = renderer.xr.getController(1);
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
})

const scene = new Scene();
const solarSystem = new SolarSystem(scene);

// Dette er kun hvis VR er i scenen
renderer.setAnimationLoop(render);

function handleController(controller) {
    if (controller.inputSource && controller.inputSource.gamepad) {
        const gamepad = controller.inputSource.gamepad;
        // The thumbstick is usually axes 2 and 3 on VR controllers
        if (gamepad.axes.length >= 4) {
            const moveSpeed = 0.05;
            const forward = gamepad.axes[3]; // Forward/backward from thumbstick
            const strafe = gamepad.axes[2];  // Left/right from thumbstick

            // Deadzone to prevent drift
            if (Math.abs(forward) > 0.1) {
                // Move forward/backward relative to the dolly's direction
                dolly.translateZ(moveSpeed * forward);
            }
            if (Math.abs(strafe) > 0.1) {
                // Strafe left/right
                dolly.translateX(moveSpeed * strafe);
            }
        }
    }
}

function render(){
    handleController(controller2)
    solarSystem.animate();

    renderer.render(scene, camera);

    // Hvis vi ikke har VR har vi denne
    // window.requestAnimationFrame(render);
}

render();
