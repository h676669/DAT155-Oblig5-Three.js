"use strict";

import {Group, PerspectiveCamera, Scene, Vector3, WebGLRenderer} from "../build/three.module.js";
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



const canvas = document.createElement('canvas');
const context = canvas.getContext('webgl2');

const renderer = new WebGLRenderer({canvas, context});
renderer.setClearColor(0x000000); // "Bakgrunnsfarge"
renderer.setSize(width, height);

// Dette er for å ha og aktivere VR
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;


function handleControllerMovement() {
    const session = renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const gp = source.gamepad;

        // Prefer right stick; fall back to left stick
        let xAxis = 0;
        let yAxis = 0;
        const rx = gp.axes[2] ?? 0;
        const ry = gp.axes[3] ?? 0;
        const lx = gp.axes[0] ?? 0;
        const ly = gp.axes[1] ?? 0;

        if (Math.abs(rx) > 0.05 || Math.abs(ry) > 0.05) {
            xAxis = rx;
            yAxis = ry;
        } else if (Math.abs(lx) > 0.05 || Math.abs(ly) > 0.05) {
            xAxis = lx;
            yAxis = ly;
        } else {
            continue; // deadzone
        }

        const speed = 0.1;
        const forward = new Vector3();
        camera.getWorldDirection(forward);

        // Forward/backward
        player.position.addScaledVector(forward, -yAxis * speed);

        // Strafe (right vector = forward × up)
        const right = new Vector3().crossVectors(forward, camera.up).normalize();
        player.position.addScaledVector(right, xAxis * speed);
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
const solarSystem = new SolarSystem(scene);

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1);
scene.add(controller2);


const controllerGrip1 = renderer.xr.getControllerGrip(0);

const controllerGrip2 = renderer.xr.getControllerGrip(1);

const player = new Group();
player.add(camera);
scene.add(player);
player.add(controller1);
player.add(controller2);
player.add(controllerGrip1);
player.add(controllerGrip2);

player.position.set(0, 0, 150);


function render(){
    if(renderer.xr.isPresenting){
        handleControllerMovement();
    } else {
        controls.update();
    }
    solarSystem.animate();

    renderer.render(scene, camera);

    // Hvis vi ikke har VR har vi denne
    // window.requestAnimationFrame(render);
}
renderer.setAnimationLoop(render);