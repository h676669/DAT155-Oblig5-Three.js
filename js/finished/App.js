"use strict";

import {Clock, Group, PerspectiveCamera, Scene, Vector3, WebGLRenderer} from "../build/three.module.js";
import {SolarSystem} from "./SolarSystem.js";
import {OrbitControls} from "../build/OrbitControls.js";
import {VRButton} from "../build/VRButton.js";

const width = window.innerWidth;
const height= window.innerHeight;
const aspect = width / height;

const fov = 75;
const near = 0.1;
const far = 10000;

const camera = new PerspectiveCamera(fov, aspect, near, far);
// Flytter camera vekk fra sentrum, vil ikke ha noe effekt i VR
camera.position.setZ(50);

const clock = new Clock();


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

    // 3) Frame-rate independent speed
    const dt = Math.min(clock.getDelta(), 0.05);     // clamp large pauses
    const speed = 1.0 * (dt * 60);                   // was 0.1; 1.0 ≈ 10x faster at 60fps

    for (const source of session.inputSources) {
        if (!source.gamepad) continue;

        const gp = source.gamepad;

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
            continue;
        }

        const forward = new Vector3();
        camera.getWorldDirection(forward);

        // Move the rig
        player.position.addScaledVector(forward, -yAxis * speed);

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

player.position.set(0, 0, 0);

renderer.xr.addEventListener('sessionstart', () => {
    controls.enabled = false;
    player.position.set(0, 0, 150);
});

renderer.xr.addEventListener('sessionend', () => {
    player.position.set(0, 0, 0);
    controls.enabled = true;
});


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