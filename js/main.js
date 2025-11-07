"use strict";

import * as THREE from 'three';
import {SolarSystem} from "./solarSystem.js";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {VRButton, XRControllerModelFactory} from "three/addons";

const width = window.innerWidth;
const height = window.innerHeight;
const aspectRatio = width / height;

const fov = 75;
const near = 0.1
const far = 10000;

const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
camera.position.setZ(150);
camera.lookAt(0,0,0);

const canvas = document.createElement("canvas");
const context = canvas.getContext("webgl2");

const renderer = new THREE.WebGLRenderer({canvas,context,antialias: true});
renderer.setClearColor(0x000000);
renderer.setSize(width, height);

document.body.appendChild(renderer.domElement);

renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener("resize",()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})


const scene = new THREE.Scene();
const solarSystem = new SolarSystem(scene);

const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1);
scene.add(controller2);

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

const player = new THREE.Group();
player.add(camera);
scene.add(player);
player.add(controller1);
player.add(controller2);
player.add(controllerGrip1);
player.add(controllerGrip2);

player.position.set(0, 0, 150);



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
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);

        // Forward/backward
        player.position.addScaledVector(forward, -yAxis * speed);

        // Strafe (right vector = forward × up)
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        player.position.addScaledVector(right, xAxis * speed);
    }
}


function render(){
    solarSystem.animate();
    if(renderer.xr.isPresenting){
        handleControllerMovement();
    } else {
        controls.update();
    }
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(render);
