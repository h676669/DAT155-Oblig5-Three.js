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

// Controller 1 (Left)
const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', () => console.log('Left controller select start'));
controller1.addEventListener('selectend', () => console.log('Left controller select end'));
dolly.add(controller1);

// Controller 2 (Right)
const controller2 = renderer.xr.getController(1);
controller2.addEventListener('selectstart', () => console.log('Right controller select start'));
controller2.addEventListener('selectend', () => console.log('Right controller select end'));
dolly.add(controller2);


// Left Controller Grip
const controllerGrip1 = renderer.xr.getControllerGrip(0);
dolly.add(controllerGrip1); // Add grip to dolly

// Right Controller Grip
const controllerGrip2 = renderer.xr.getControllerGrip(1);
dolly.add(controllerGrip2); // Add grip to dolly


// Variable to prevent turning every frame
let turnDebounce = false;
const turnAngle = Math.PI / 6; // 30 degrees snap turn

// Renamed your function to be more specific
function handleMovement(controller) {
    if (controller.inputSource && controller.inputSource.gamepad) {
        const gamepad = controller.inputSource.gamepad;
        if (gamepad.axes.length >= 4) {
            const moveSpeed = 0.05;
            const forward = gamepad.axes[3]; // Forward/backward (usually Y axis)
            const strafe = gamepad.axes[2];  // Left/right (usually X axis)

            if (Math.abs(forward) > 0.1) {
                dolly.translateZ(moveSpeed * forward);
            }
            if (Math.abs(strafe) > 0.1) {
                dolly.translateX(moveSpeed * strafe);
            }
        }
    }
}

// 4. New function to handle rotation with the other controller
function handleRotation(controller) {
    if (controller.inputSource && controller.inputSource.gamepad) {
        const gamepad = controller.inputSource.gamepad;
        if (gamepad.axes.length >= 4) {
            const turn = gamepad.axes[2]; // Left/right (usually X axis)

            if (Math.abs(turn) > 0.5) { // High threshold for snap turn
                if (!turnDebounce) {
                    // Rotate the dolly (the player rig)
                    dolly.rotateY(turn > 0 ? -turnAngle : turnAngle);
                    turnDebounce = true; // Set debounce flag
                }
            } else {
                turnDebounce = false; // Reset debounce when stick is centered
            }
        }
    }
}

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
scene.add(dolly)
const solarSystem = new SolarSystem(scene);

// Dette er kun hvis VR er i scenen




function render(){
    handleMovement(controller2);
    handleRotation(controller1);
    solarSystem.animate();

    renderer.render(scene, camera);

    // Hvis vi ikke har VR har vi denne
    // window.requestAnimationFrame(render);
}
renderer.setAnimationLoop(render);