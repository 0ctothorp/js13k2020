import { assert } from './utils';
import {
  fromTranslation as mat4FromTranslation,
  create as mat4Create,
  perspective as mat4Perspective,
  lookAt,
  translate,
  getTranslation,
  fromRotationTranslation,
  fromRotationTranslationScale,
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
  -0.5, 0, 0,
   0.5, 0, 0,
  -0.5, 0, 1,
  
  -0.5, 0, 1,
   0.5, 0, 1,
   0.5, 0, 0 
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

const modelMat1 = fromRotationTranslationScale(
  mat4Create(),
  [0, 0, 0, 0],
  [0, 0, -1.5],
  [5, 1, 25],
);

const viewMat = lookAt(mat4Create(), [0, 2, 0], [0, 0, 1.1], [0, 1, 0]);

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
let shipModelMat = mat4FromTranslation(mat4Create(), [0, 0.1, -0.5]);

const shipSpeed = 0.05;
const moveShipHorizontally = (deltaTime: number, direction: 1 | -1) => {
  translate(shipModelMat, shipModelMat, [
    shipSpeed * deltaTime * direction,
    0,
    0,
  ]);
};

const getShipCurrent2dPosition = () => {
  const translation = getTranslation(vec3Create(), shipModelMat);
  const [x1, y1, z1, x2, y2, z2, x3, y3, z3] = shipVertices;
  const v1 = [x1, y1, z1];
  const v2 = [x2, y2, z2];
  const v3 = [x3, y3, z3];
  const tv1 = vec3Add(vec3Create(), v1, translation);
  const tv2 = vec3Add(vec3Create(), v2, translation);
  const tv3 = vec3Add(vec3Create(), v3, translation);
  return [
    [tv1[0], tv1[2]],
    [tv2[0], tv2[2]],
    [tv3[0], tv3[2]],
  ];
};

// blocks
//prettier-ignore
const blockBaseVertices = [
  -0.5, 0, -0.5, // 1
  -0.5, 0,  0.5, // 2
   0.5, 0, -0.5, // 3

   0.5, 0, -0.5,
   0.5, 0,  0.5, // 4
  -0.5, 0,  0.5,
];

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
  ...blockBaseVertices,
 
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

const groupBy3 = <T>(arr: T[]) =>
  arr.reduce<T[][]>((prev, curr, idx) => {
    const ret = [...prev];
    if (idx % 3 === 0) {
      return [...ret, [curr]];
    }
    ret[prev.length - 1].push(curr);
    return ret;
  }, []);

const getBlockTranslatedBaseVertices = () => {
  const [v1, v2, v3, _, v4] = groupBy3(blockBaseVertices);
  const translation = getTranslation(vec3Create(), blockModelMat);
  return [
    vec3Add(vec3Create(), v1, translation),
    vec3Add(vec3Create(), v2, translation),
    vec3Add(vec3Create(), v3, translation),
    vec3Add(vec3Create(), v4, translation),
  ];
};

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

let delta = 0;

const processInput = () => {
  if (pressed.ArrowRight) {
    moveShipHorizontally(delta, -1);
  }
  if (pressed.ArrowLeft) {
    moveShipHorizontally(delta, 1);
  }
};

const gameLoop = (elapsed: number) => {
  processInput();

  // simulate
  translate(blockModelMat, blockModelMat, [0, 0, -0.01 * delta]);

  // when does the triangle and a square overlap?
  // - when at least one vertex of a triangle is inside the square
  // - when at least one vertex of a square is inside the triangle
  // - when one edge of a triangle intersects any edge of a square
  // jak w przypadku tej gry mogę łatwo stwierdzić, czy jadący kwadrat
  // koliduje z trójkątem?
  // kwadrat porusza się tylko w osi y;
  // natomiast statek porusza się obecnie tylko po osi x, ale może
  // chciałbym, żeby mógł się poruszać też w y;
  // scenariusz, w którym statek lata tylko na boki jest łatwiejszy;
  // Skoro statek porusza się tylko na boki i do góry i nie obraca sie,
  // to znaczy, że tylko dół statku może się stykać krawędzią z kwadratem
  // (sytuacja kiedy cofałbym statkiem).
  // Potrzebuję w prosty sposób mieć dostęp do aktualnej pozycji wierzchołków.
  // Obecnie musiałbym z macierzy modelu wyciągać wektor translacji, a potem
  // zaaplikować go do wierzchołków obiektu.

  const translatedShipVertices = getShipCurrent2dPosition();
  // TODO:
  // 1. get squares that are below a certain z coordinate
  // 2. for every square from point 1:
  //   2.1. check if any triangle's vertex is inside a square.
  //   2.2. check if any square's vertex is inside a triangle.
  const translatedBlockBaseVertices = getBlockTranslatedBaseVertices();

  // draw
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

  gl.bindBuffer(gl.ARRAY_BUFFER, shipVertexBuffer);
  gl.uniform4fv(uniColorLoc, shipColor);
  gl.uniformMatrix4fv(uniModelMatLoc, false, shipModelMat);
  gl.uniformMatrix4fv(uniProjMatLoc, false, projMat);
  gl.uniformMatrix4fv(uniViewMatLoc, false, viewMat);
  // No need to enable vertexAttribPointer since it was enabled
  // before entering the loop?
  gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, shipVertices.length / 3);

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
