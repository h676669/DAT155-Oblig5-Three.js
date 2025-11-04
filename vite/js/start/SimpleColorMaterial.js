"use strict";

import {ShaderMaterial} from "../build/three.module.js";

export class SimpleColorMaterial extends ShaderMaterial {
    constructor() {

        const vertexShader = ``;

        const fragmentShader = ``;

        super({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms:{}
        });
    }
}