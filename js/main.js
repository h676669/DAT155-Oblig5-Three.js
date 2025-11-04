"use strict";

import * as THREE from 'three';
import {SolarSystem} from "./solarSystem.js";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

const width = window.innerWidth;
const height = window.innerHeight;
const aspectRatio = width / height;

const fov = 75;
const near = 0.1
const far = 10000;

const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
camera.position.setZ(30);

const canvas = document.createElement("canvas");
const context = canvas.getContext("webgl2");

const renderer = new THREE.WebGLRenderer({canvas,context,antialias: true});
renderer.setClearColor(0x000000);
renderer.setSize(width, height);

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener("resize",()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

renderer.setAnimationLoop(render)

const scene = new THREE.Scene();
const solarSystem = new SolarSystem(scene);

function render(){
    solarSystem.animate();
    controls.update();
    renderer.render(scene, camera);
}

render();
