import * as THREE from "three";
import {
    AmbientLight,
    Color,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    Object3D, PointLight,
    SphereGeometry,
    TextureLoader, Vector2
} from "three";

export class SolarSystem {
    constructor(scene){
        let sunRadius = 10;
        let widthSegments = 64;
        let heightSegments = 64;

        this.textureLoader = new THREE.TextureLoader();

        this.centerOfSystem = new THREE.Object3D();


        const skyBoxMesh = new THREE.SphereGeometry(1000,widthSegments*2,heightSegments*2);
        const skyBoxTexture = this.textureLoader.load("./assets/universe.jpg");
        skyBoxTexture.colorSpace = THREE.SRGBColorSpace;
        const skyBoxMaterial = new THREE.MeshBasicMaterial({map: skyBoxTexture,side:THREE.BackSide});
        const skyBox = new Mesh(skyBoxMesh,skyBoxMaterial)
        scene.add(skyBox);

        this.centerOfSystem.position.setZ(0);

        scene.add(this.centerOfSystem);

        this.sun = this.createSphericalBody({
            radius: sunRadius,
            width: widthSegments,
            height: heightSegments,
            assetUrl : "./assets/texture_sun.jpg",
            MaterialType: THREE.MeshBasicMaterial

        })
        this.centerOfSystem.add(this.sun);

        this.earth = this.createSphericalBody({
            radius: sunRadius/10,widthSegments,heightSegments,
            assetUrl : "./assets/texture_earth.jpg",
            MaterialType : THREE.MeshPhongMaterial,
            specularMapUrl : "./assets/earthspec1k.jpg",
            normalMapUrl : "./assets/2k_earth_normal_map.png",
            shininess : 3
        });
        this.earthOrbitNode = new THREE.Object3D();
        this.centerOfSystem.add(this.earthOrbitNode);
        this.earth.position.x = 100;
        this.earthOrbitNode.add(this.earth);


        this.sunLight = new THREE.PointLight(0xffffff);
        this.sun.add(this.sunLight);

        this.ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(this.ambientLight);



    }
    animate() {
        this.rotateObject(this.sun, [0, 0.005, 0]);
        this.rotateObject(this.earthOrbitNode, [0, 0.01, 0]);
        this.rotateObject(this.earth, [0, 0.005, 0]);
        /*
        this.rotateObject(this.moon, [0, 0.01, 0]);
        this.rotateObject(this.moonOrbitNode, [0, 0.02, 0]);
        this.rotateObject(this.marsOrbitNode, [0, 0.001, 0]);
        this.rotateObject(this.mars, [0, 0.05, 0]);

         */
    }


    rotateObject(object, rotation) {
        object.rotation.x += rotation[0];
        object.rotation.y += rotation[1];
        object.rotation.z += rotation[2];
    }

    createSphericalBody({
                            radius = 5, widthSegments = 64, heightSegments = 64,
                            assetUrl = undefined,
                            color = new Color(0xFFFFFF),
                            MaterialType = MeshBasicMaterial,
                            shininess = 0,
                            normalMapUrl = undefined,
                            specularMapUrl = undefined
                        }) {
        let geometry = new SphereGeometry(radius, widthSegments, heightSegments);

        let texture = assetUrl ? this.textureLoader.load(assetUrl) : null;
        let nMap = normalMapUrl ? this.textureLoader.load(normalMapUrl) : null;
        let specMap = specularMapUrl ? this.textureLoader.load(specularMapUrl) : null;

        let mat = new MaterialType(
            {
                map: texture,
                color: color,
                shininess: shininess,
                normalMap: nMap,
                specularMap: specMap,
                specular: new Color(0x777777),
                normalScale: new Vector2(10,10)
            });

        return new Mesh(geometry, mat);
    }
}
