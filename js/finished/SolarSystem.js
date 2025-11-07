"use strict";

import {
    AmbientLight,
    Color,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    Object3D,
    PointLight,
    SphereGeometry,
    TextureLoader,
    Vector2
} from "../build/three.module.js";

export class SolarSystem {
    /**
     * scene : THREE.Scene
     * options: {
     *   sunSceneRadius: number (scene units for Sun radius, default 5),
     *   earthSceneDistance: number (scene units for Earth's orbit radius, default 30),
     *   minRadius: number (minimum scene radius for any body to keep visible, default 0.05)
     * }
     */
    constructor(scene, options = {}) {
        const {sunSceneRadius = 5, earthSceneDistance = 30, minRadius = 0.05, sceneScale=3} = options;

        // Real-world reference data (km)
        const R = {
            sun: {r: 695700, a: 0},
            mercury: {r: 2439.7, a: 57909227},
            venus: {r: 6051.8, a: 108209475},
            earth: {r: 6371.0, a: 149598023},
            moon: {r: 1737.4, a: 384400},       // moon distance from Earth
            mars: {r: 3389.5, a: 227943824},
            jupiter: {r: 69911, a: 778340821},
            saturn: {r: 58232, a: 1426666422},
            uranus: {r: 25362, a: 2870658186},
            neptune: {r: 24622, a: 4498396441}
        };

        // Compute linear scales: size and distance
        const SIZE_SCALE = sunSceneRadius / R.sun.r; // scene units per km for radii
        const DISTANCE_SCALE = earthSceneDistance / R.earth.a; // scene units per km for semimajor axes

        this.textureLoader = new TextureLoader();
        this.centerOfSystem = new Object3D();
        scene.add(this.centerOfSystem);

        // helper to compute scene radius with optional min clamp
        const sceneRadius = (km) => Math.max(km * SIZE_SCALE * sceneScale, minRadius);
        const sceneDistance = (km) => km * DISTANCE_SCALE * sceneScale;

        // create sun
        this.sun = this.createSphericalBody({
            radius: sceneRadius(R.sun.r),
            widthSegments: 64,
            heightSegments: 64,
            assetUrl: 'assets/texture_sun.jpg',
            MaterialType: MeshBasicMaterial
        });
        this.centerOfSystem.add(this.sun);
        // --- Physical light modelling ---
        // Solar constant at Earth's orbit (W/m^2)
        const SOLAR_CONSTANT = 1361;
        const earthSceneDist = sceneDistance(R.earth.a);
        const baseIntensity = SOLAR_CONSTANT / (earthSceneDist * earthSceneDist);

        // Create PointLight representing the Sun. Use decay = 2 for inverse-square falloff.
        this.sunLight = new PointLight(0xFFFFFF, baseIntensity);
        this.sunLight.decay = 2;      // inverse-square
        this.sunLight.distance = 0;   // leave unlimited (falloff handled by decay)
        this.sun.add(this.sunLight);


        // planets convenience factory
        const makePlanet = (key, texture, material = MeshPhongMaterial) => {
            const obj = this.createSphericalBody({
                radius: sceneRadius(R[key].r),
                widthSegments: 32,
                heightSegments: 32,
                assetUrl: texture,
                MaterialType: material
            });
            const orbit = new Object3D();
            this.centerOfSystem.add(orbit);
            obj.position.x = sceneDistance(R[key].a);
            orbit.add(obj);
            return {mesh: obj, orbitNode: orbit};
        };

        // Mercury
        const mMercury = makePlanet('mercury', 'assets/texture_mercury.jpg');
        this.mercury = mMercury.mesh;
        this.mercuryOrbitNode = mMercury.orbitNode;

        // Venus
        const mVenus = makePlanet('venus', 'assets/texture_venus.jpg');
        this.venus = mVenus.mesh;
        this.venusOrbitNode = mVenus.orbitNode;

        // Earth
        const mEarth = makePlanet('earth', 'assets/texture_earth.jpg', MeshPhongMaterial);
        this.earth = mEarth.mesh;
        this.earthOrbitNode = mEarth.orbitNode;

        // Moon: orbit node attached to Earth (use real moon distance)
        this.moon = this.createSphericalBody({
            radius: sceneRadius(R.moon.r),
            widthSegments: 24,
            heightSegments: 24,
            assetUrl: 'assets/texture_moon.jpg',
            MaterialType: MeshPhongMaterial
        });
        this.moonOrbitNode = new Object3D();
        this.earth.add(this.moonOrbitNode); // moon orbits earth
        this.moon.position.x = sceneDistance(R.moon.a); // moon distance scaled
        this.moonOrbitNode.add(this.moon);

        // Mars
        const mMars = makePlanet('mars', 'assets/texture_mars.jpg');
        this.mars = mMars.mesh;
        this.marsOrbitNode = mMars.orbitNode;

        // Jupiter
        const mJupiter = makePlanet('jupiter', 'assets/texture_jupiter.jpg');
        this.jupiter = mJupiter.mesh;
        this.jupiterOrbitNode = mJupiter.orbitNode;

        // Saturn
        const mSaturn = makePlanet('saturn', 'assets/texture_saturn.jpg');
        this.saturn = mSaturn.mesh;
        this.saturnOrbitNode = mSaturn.orbitNode;

        // Uranus
        const mUranus = makePlanet('uranus', 'assets/texture_uranus.jpg');
        this.uranus = mUranus.mesh;
        this.uranusOrbitNode = mUranus.orbitNode;

        // Neptune
        const mNeptune = makePlanet('neptune', 'assets/texture_neptune.jpg');
        this.neptune = mNeptune.mesh;
        this.neptuneOrbitNode = mNeptune.orbitNode;

        // ambient light
        this.ambientLight = new AmbientLight(0xFFFFFF, 0.2);
        scene.add(this.ambientLight);

        // preserve realistic ratios for orbit/spin speeds (these are visual tuning)
        this.orbitSpeeds = {
            mercury: 0.0414, venus: -0.0163, earth: 0.01, moon: 0.13,
            mars: 0.0053, jupiter: 0.00084, saturn: 0.00034, uranus: -0.00012, neptune: 0.00006
        };
        this.spinSpeeds = {
            sun: 0.005, mercury: 0.088, venus: 0.225, earth: 0.365, moon: 0.13,
            mars: 0.366, jupiter: 0.4333, saturn: 0.10759, uranus: 0.30687, neptune: 0.60190
        };

        // store scales for debugging/inspection
        this._scales = {SIZE_SCALE: SIZE_SCALE * sceneScale, DISTANCE_SCALE: DISTANCE_SCALE * sceneScale};
    }

    animate(delta = 1) {
        this.mercuryOrbitNode && (this.mercuryOrbitNode.rotation.y += this.orbitSpeeds.mercury * delta);
        this.venusOrbitNode && (this.venusOrbitNode.rotation.y += this.orbitSpeeds.venus * delta);
        this.earthOrbitNode && (this.earthOrbitNode.rotation.y += this.orbitSpeeds.earth * delta);
        this.moonOrbitNode && (this.moonOrbitNode.rotation.y += this.orbitSpeeds.moon * delta);
        this.marsOrbitNode && (this.marsOrbitNode.rotation.y += this.orbitSpeeds.mars * delta);
        this.jupiterOrbitNode && (this.jupiterOrbitNode.rotation.y += this.orbitSpeeds.jupiter * delta);
        this.saturnOrbitNode && (this.saturnOrbitNode.rotation.y += this.orbitSpeeds.saturn * delta);
        this.uranusOrbitNode && (this.uranusOrbitNode.rotation.y += this.orbitSpeeds.uranus * delta);
        this.neptuneOrbitNode && (this.neptuneOrbitNode.rotation.y += this.orbitSpeeds.neptune * delta);

        this.sun.rotation.y += this.spinSpeeds.sun * delta;
        this.mercury.rotation.y += this.spinSpeeds.mercury * delta;
        this.venus.rotation.y += this.spinSpeeds.venus * delta;
        this.earth.rotation.y += this.spinSpeeds.earth * delta;
        this.moon.rotation.y += this.spinSpeeds.moon * delta;
        this.mars.rotation.y += this.spinSpeeds.mars * delta;
        this.jupiter.rotation.y += this.spinSpeeds.jupiter * delta;
        this.saturn.rotation.y += this.spinSpeeds.saturn * delta;
        this.uranus.rotation.y += this.spinSpeeds.uranus * delta;
        this.neptune.rotation.y += this.spinSpeeds.neptune * delta;
    }

    /**
     * Creates a sphere mesh given the given parameters
     */
    createSphericalBody({
                            radius = 5, widthSegments = 64, heightSegments = 64,
                            assetUrl = undefined, color = new Color(0xFFFFFF),
                            MaterialType = MeshBasicMaterial, shininess = 0,
                            normalMapUrl = undefined, specularMapUrl = undefined
                        }) {
        let geometry = new SphereGeometry(radius, widthSegments, heightSegments);
        let texture = assetUrl ? this.textureLoader.load(assetUrl) : null;
        let nMap = normalMapUrl ? this.textureLoader.load(normalMapUrl) : null;
        let specMap = specularMapUrl ? this.textureLoader.load(specularMapUrl) : null;

        let mat = new MaterialType({
            map: texture,
            color: color,
            shininess: shininess,
            normalMap: nMap,
            specularMap: specMap,
            specular: new Color(0x777777),
            normalScale: new Vector2(1, 1)
        });

        return new Mesh(geometry, mat);
    }
}
