// javascript
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
    Vector2,
    RingGeometry,
} from "../build/three.module.js";

export class SolarSystem {
    constructor(scene) {
        const sunRadius = 10;
        const AU = 40;                 // base unit distance
        const DIST_EXP = 0.7;          // < 1 compresses outer orbits
        const ORBIT_BASE_SPEED = 0.01; // base angular speed for 1 AU
        const SIZE_EXAGGERATION = 12;
        const MIN_PLANET_RADIUS = 0.4;

        this.textureLoader = new TextureLoader();
        this.centerOfSystem = new Object3D();
        scene.add(this.centerOfSystem);

        // Sun
        this.sun = this.createSphericalBody({
            radius: sunRadius,
            assetUrl: "assets/texture_sun.jpg",
            MaterialType: MeshBasicMaterial
        });
        this.centerOfSystem.add(this.sun);

        // Planet data
        const planetData = [
            { key: "mercury", ratio: 0.0035, au: 0.39, tex: "assets/2k_mercury.jpg", tiltDeg: 0, shininess: 2, specularHex: 0x101010 },
            { key: "venus", ratio: 0.0092, au: 0.72, tex: "assets/2k_venus_surface.jpg", tiltDeg: 177.3, shininess: 2, specularHex: 0x0f0f0f },
            { key: "earth", ratio: 0.00915, au: 1.0, tex: "assets/texture_earth.jpg", normalMapUrl: "assets/2k_earth_normal_map.png", specularMapUrl: "assets/earthspec1k.jpg", tiltDeg: 23.5, shininess: 6, specularHex: 0x202020 },
            { key: "mars", ratio: 0.0049, au: 1.52, tex: "assets/texture_mars.jpg", tiltDeg: 25, shininess: 2, specularHex: 0x101010 },
            { key: "jupiter", ratio: 0.1004, au: 5.20, tex: "assets/2k_jupiter.jpg", tiltDeg: 3.1, shininess: 4, specularHex: 0x202020 },
            { key: "saturn", ratio: 0.0836, au: 9.58, tex: "assets/2k_saturn.jpg", tiltDeg: 26.7, ringTex: "assets/2k_saturn_ring_alpha.png", shininess: 4, specularHex: 0x202020 },
            { key: "uranus", ratio: 0.0364, au: 19.20, tex: "assets/2k_uranus.jpg", tiltDeg: 97.8, shininess: 3, specularHex: 0x181818 },
            { key: "neptune", ratio: 0.0353, au: 30.05, tex: "assets/2k_neptune.jpg", tiltDeg: 28.3, shininess: 3, specularHex: 0x181818 }
        ];


        this.orbits = {};
        this.orbitSpeeds = {};

        planetData.forEach(p => {
            const baseRatio = p.ratio;
            const finalRatio = baseRatio < 0.02 ? baseRatio * SIZE_EXAGGERATION : baseRatio;
            const planetRadius = Math.max(sunRadius * finalRatio, MIN_PLANET_RADIUS);

            const mesh = this.createSphericalBody({
                radius: planetRadius,
                assetUrl: p.tex,
                MaterialType: MeshPhongMaterial,
                normalMapUrl: p.normalMapUrl,
                specularMapUrl: p.specularMapUrl,
                shininess: p.shininess ?? 2,
                specular: p.specularHex ?? 0x151515
            });

            // Axial tilt
            if (p.tiltDeg) {
                mesh.rotation.z = p.tiltDeg * Math.PI / 180;
            }

            // Orbit node with unique start phase (prevents alignment)
            const orbitNode = new Object3D();
            orbitNode.rotation.y = Math.random() * Math.PI * 2;

            // Compressed distance for outer planets
            const scaledDistance = AU * Math.pow(p.au, DIST_EXP);
            mesh.position.x = scaledDistance;

            orbitNode.add(mesh);
            this.centerOfSystem.add(orbitNode);
            this[p.key] = mesh;
            this.orbits[p.key] = orbitNode;

            // Kepler-like orbit speed: ω ~ a^(-3/2)
            this.orbitSpeeds[p.key] = ORBIT_BASE_SPEED / Math.pow(p.au, 1.5);

            // Saturn ring
            if (p.key === "saturn" && p.ringTex) {
                const inner = planetRadius * 1.3;
                const outer = planetRadius * 2.3;
                const ringGeo = new RingGeometry(inner, outer, 96);
                const ringTex = this.textureLoader.load(p.ringTex);
                const ringMat = new MeshBasicMaterial({
                    map: ringTex,
                    transparent: true,
                    side: 2
                });
                const ring = new Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                this.saturn.add(ring);
                this.saturnRing = ring;
            }
        });

        // Moon (exaggerated)
        this.moon = this.createSphericalBody({
            radius: this.earth.geometry.parameters.radius * 0.27,
            assetUrl: "assets/texture_moon.jpg",
            MaterialType: MeshPhongMaterial,
            shininess: 2,
            specular: 0x111111
        });
        this.moonOrbitNode = new Object3D();
        this.moon.position.x = this.earth.geometry.parameters.radius * 3.5;
        this.moonOrbitNode.add(this.moon);
        this.earth.add(this.moonOrbitNode);

        // Softer point light + decay to reduce front hot spots
        this.sunLight = new PointLight(0xFFFFFF, 1.4, 0, 2);
        this.sun.add(this.sunLight);
        this.ambientLight = new AmbientLight(0xFFFFFF, 0.15);
        scene.add(this.ambientLight);
    }

    animate() {
        this.rotateObject(this.sun, [0, 0.002, 0]);

        // Individual orbit speeds
        for (const [key, node] of Object.entries(this.orbits)) {
            node.rotation.y += this.orbitSpeeds[key];
        }

        // Spins
        this.rotateObject(this.mercury, [0, 0.0005, 0]);
        this.rotateObject(this.venus, [0, -0.0003, 0]);
        this.rotateObject(this.earth, [0, 0.01, 0]);
        this.rotateObject(this.mars, [0, 0.008, 0]);
        this.rotateObject(this.jupiter, [0, 0.02, 0]);
        this.rotateObject(this.saturn, [0, 0.018, 0]);
        this.rotateObject(this.uranus, [0, -0.015, 0]);
        this.rotateObject(this.neptune, [0, 0.017, 0]);

        // Moon
        this.rotateObject(this.moonOrbitNode, [0, 0.02, 0]);
        this.rotateObject(this.moon, [0, 0.005, 0]);
    }

    rotateObject(object, rotation) {
        object.rotation.x += rotation[0];
        object.rotation.y += rotation[1];
        object.rotation.z += rotation[2];
    }

    createSphericalBody({
                            radius = 5,
                            widthSegments = 64,
                            heightSegments = 64,
                            assetUrl = undefined,
                            color = new Color(0xFFFFFF),
                            MaterialType = MeshBasicMaterial,
                            shininess = 0,
                            normalMapUrl = undefined,
                            specularMapUrl = undefined
                        }) {
        const geometry = new SphereGeometry(radius, widthSegments, heightSegments);
        const texture = assetUrl ? this.textureLoader.load(assetUrl) : null;
        const nMap = normalMapUrl ? this.textureLoader.load(normalMapUrl) : null;
        const specMap = specularMapUrl ? this.textureLoader.load(specularMapUrl) : null;

        const mat = new MaterialType({
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
