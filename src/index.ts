// # Jak zaimplementować nieskończoną "autostradę"
// - na początku wyrenderować 3 plejny 5x5
// - gdy pierwszy zniknie z widoku, to przestać go renderować i zacząć renderować "nowy" na końcu
// - ???
// - profit

import { assert } from './utils';
import {
  fromTranslation as mat4FromTranslation,
  create as mat4Create,
  perspective as mat4Perspective,
  lookAt,
  translate,
  getTranslation,
  fromRotationTranslation,
} from 'gl-matrix/mat4';
import { create as vec3Create, add as vec3Add } from 'gl-matrix/vec3';
import { createShaderProgram } from './shaders';

const canvas: HTMLCanvasElement | null = document.querySelector('canvas');
assert(canvas, 'No canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const fov = 90;
const nearPlane = 0.01;
const farPlane = 100;

const getPerspectiveMatrix = (aspect: number) =>
  mat4Perspective(mat4Create(), fov, aspect, nearPlane, farPlane);

let projMat = getPerspectiveMatrix(canvas.width / canvas.height);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const aspect = canvas.width / canvas.height;
  projMat = getPerspectiveMatrix(aspect);
});

const gl = canvas.getContext('webgl2');
assert(gl, 'No webgl2');

const planeVertexShader = `#version 300 es

    in vec3 aPosition;

    uniform mat4 uModelMat;
    uniform mat4 uProjMat;
    uniform mat4 uViewMat;
    
    void main() {
      gl_Position = uProjMat * uViewMat * uModelMat * vec4(aPosition, 1);
    }
  `;

const planeFragmentShader = `#version 300 es
  
    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;

    out vec4 outColor;

    uniform vec4 uColor;

    void main() {
      outColor = uColor;
    }
  `;

const program = createShaderProgram(gl, planeVertexShader, planeFragmentShader);

const posAttrLoc = gl.getAttribLocation(program, 'aPosition');
const uniModelMatLoc = gl.getUniformLocation(program, 'uModelMat');
const uniProjMatLoc = gl.getUniformLocation(program, 'uProjMat');
const uniViewMatLoc = gl.getUniformLocation(program, 'uViewMat');
const uniColorLoc = gl.getUniformLocation(program, 'uColor');

// floor
// prettier-ignore
const floorVertices = new Float32Array([
  -0.5, 0, -0.5,
   0.5, 0, -0.5,
  -0.5, 0,  0.5,
  
  -0.5, 0,  0.5,
   0.5, 0,  0.5,
   0.5, 0, -0.5
]);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const posBuffer = gl.createBuffer();
assert(posBuffer, "Couldn't create position buffer");
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, floorVertices, gl.STATIC_DRAW);

gl.enableVertexAttribArray(posAttrLoc);

const size = 3; // 3 components per iteration
const type = gl.FLOAT; // the data is 32bit floats
const normalize = false; // don't normalize the data
const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
const offset = 0; // start at the beginning of the buffer
gl.vertexAttribPointer(posAttrLoc, size, type, normalize, stride, offset);

gl.bindVertexArray(null);

const modelMat1 = mat4FromTranslation(mat4Create(), [0, 0, 0]);

const viewMat = lookAt(mat4Create(), [0, 2, 0], [0, 0, 1], [0, 1, 0]);

// ship
// prettier-ignore
const shipVertices = new Float32Array([
  -0.5, 0, -0.5,
   0.5, 0, -0.5,
     0, 0,  0.5,
]);

const shipVertexBuffer = gl.createBuffer();
console.assert(shipVertexBuffer);
gl.bindBuffer(gl.ARRAY_BUFFER, shipVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, shipVertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(posAttrLoc);
gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const shipColor = [0.1, 0.1, 0.9, 1];
let shipModelMat = mat4FromTranslation(mat4Create(), [0, 0.1, 0.5]);

const shipSpeed = 50;
const moveShipHorizontally = (deltaTime: number, direction: 1 | -1) => {
  translate(shipModelMat, shipModelMat, [
    shipSpeed * deltaTime * direction,
    0,
    0,
  ]);
};

// blocks
// prettier-ignore
const blockVertices = new Float32Array([
  // front 
  -0.5, 0, -0.5,
  -0.5, 1, -0.5,
   0.5, 0, -0.5,

   0.5, 0, -0.5,
   0.5, 1, -0.5,
  -0.5, 1, -0.5,

  // back 
  -0.5, 0, 0.5,
  -0.5, 1, 0.5,
   0.5, 0, 0.5,

   0.5, 0, 0.5,
   0.5, 1, 0.5,
  -0.5, 1, 0.5,

  // bottom
  -0.5, 0, -0.5,
  -0.5, 0,  0.5,
   0.5, 0, -0.5,

   0.5, 0, -0.5,
   0.5, 0,  0.5,
  -0.5, 0,  0.5,
  
  // top
  -0.5, 1, -0.5,
  -0.5, 1,  0.5,
   0.5, 1, -0.5,

   0.5, 1, -0.5,
   0.5, 1,  0.5,
  -0.5, 1,  0.5,

  // left
  -0.5, 0, -0.5,
  -0.5, 1, -0.5,
  -0.5, 0,  0.5,

  -0.5, 0,  0.5,
  -0.5, 1,  0.5,
  -0.5, 1, -0.5,

  // right
  0.5, 0, -0.5,
  0.5, 1, -0.5,
  0.5, 0,  0.5,

  0.5, 0,  0.5,
  0.5, 1,  0.5,
  0.5, 1, -0.5,
]);

const blockVertexBuffer = gl.createBuffer();
console.assert(blockVertexBuffer);
gl.bindBuffer(gl.ARRAY_BUFFER, blockVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, blockVertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(posAttrLoc);
gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

let blockModelMat = mat4FromTranslation(mat4Create(), [0, 0.1, 2.5]);

// input
const pressed = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowRight':
      pressed[event.code] = true;
      break;
    case 'ArrowLeft':
      pressed[event.code] = true;
      break;
    case 'ArrowUp':
      pressed[event.code] = true;
      break;
    case 'ArrowDown':
      pressed[event.code] = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowRight':
      pressed[event.code] = false;
      break;
    case 'ArrowLeft':
      pressed[event.code] = false;
      break;
    case 'ArrowUp':
      pressed[event.code] = false;
      break;
    case 'ArrowDown':
      pressed[event.code] = false;
      break;
  }
});

/////////

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0, 0, 0, 1);

let prevElapsed: number | undefined;
let delta = 0;

const DELTA_DIVISOR = 1000;

const gameLoop = (elapsed: number) => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  gl.bindVertexArray(vao);
  gl.uniformMatrix4fv(uniModelMatLoc, false, modelMat1);
  gl.uniformMatrix4fv(uniProjMatLoc, false, projMat);
  gl.uniformMatrix4fv(uniViewMatLoc, false, viewMat);
  gl.uniform4fv(uniColorLoc, [0.6, 0.2, 0.2, 1]);
  gl.drawArrays(gl.TRIANGLES, 0, floorVertices.length / 3);
  gl.bindVertexArray(null);

  if (pressed.ArrowRight) {
    moveShipHorizontally(delta / DELTA_DIVISOR, -1);
  }
  if (pressed.ArrowLeft) {
    moveShipHorizontally(delta / DELTA_DIVISOR, 1);
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, shipVertexBuffer);
  gl.uniform4fv(uniColorLoc, shipColor);
  gl.uniformMatrix4fv(uniModelMatLoc, false, shipModelMat);
  gl.uniformMatrix4fv(uniProjMatLoc, false, projMat);
  gl.uniformMatrix4fv(uniViewMatLoc, false, viewMat);
  // No need to enable vertexAttribPointer since it was enabled
  // before entering the loop?
  gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, shipVertices.length / 3);

  translate(blockModelMat, blockModelMat, [0, 0, -0.01 * delta]);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, blockVertexBuffer);
  gl.uniform4fv(uniColorLoc, [0.1, 0.7, 0.3, 1]);
  gl.uniformMatrix4fv(uniModelMatLoc, false, blockModelMat);
  gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, blockVertices.length / 3);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  delta = performance.now() - elapsed;
  window.requestAnimationFrame(gameLoop);
};

window.requestAnimationFrame(gameLoop);
