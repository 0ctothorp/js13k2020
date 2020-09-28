import { assert, groupBy3, falsyFilter } from './utils';
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
import { mat4 } from 'gl-matrix/types/types';
import { create as vec3Create, add as vec3Add } from 'gl-matrix/vec3';
import { createShaderProgram } from './shaders';
import { isVertexInsideASquare2d } from './geometry';
import { pressed } from './input';

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
  -0.4, 0, -0.4, //left
   0.4, 0, -0.4, //right
     0, 0,  0.4, //top
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

const shipSpeed = 0.005;
const moveShipHorizontally = (deltaTime: number, direction: 1 | -1) => {
  translate(shipModelMat, shipModelMat, [
    shipSpeed * deltaTime * direction,
    0,
    0,
  ]);
};

const getShipCurrent2dPosition = () => {
  const translation = getTranslation(vec3Create(), shipModelMat);
  return groupBy3([...shipVertices])
    .map((v) => vec3Add(vec3Create(), v, translation))
    .map((v) => [v[0], v[2]]);
};

// blocks
//prettier-ignore
const blockBaseVertices = [
  -0.5, 0, -0.5, // 1
  -0.5, 0,  0.5, // 2 - top left
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

const getBlockVertexBuffer = () => {
  const blockVertexBuffer = gl.createBuffer();
  console.assert(blockVertexBuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, blockVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, blockVertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posAttrLoc);
  gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return blockVertexBuffer;
};

const BLOCKS_STARTING_Z = 18;

// prettier-ignore
const blocksLayout = [
  [1, 0, 1, 0],
  [0, 2, 0, 0],
  [0, 0, 1, 0],
  [1, 0, 0, 2],
  [0, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 1],
  [1, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 1, 0, 1],
  [1, 0, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 0],
  [1, 0, 0, 1]
];

const greenBlocksInitialPositions = blocksLayout.flatMap((row, i) =>
  row
    .map((x, j) => (x == 1 ? [(j - 1.5) * 2, 0.01, i + BLOCKS_STARTING_Z] : x))
    .filter((x): x is number[] => typeof x == 'object'),
);

const redBlocksInitialPositions = blocksLayout.flatMap((row, i) =>
  row
    .map((x, j) => (x == 2 ? [(j - 1.5) * 2, 0.01, i + BLOCKS_STARTING_Z] : x))
    .filter((x): x is number[] => typeof x == 'object'),
);

const blockVertexBuffer = getBlockVertexBuffer();

const blocksModelMats: Array<
  mat4 | undefined
> = greenBlocksInitialPositions.map((p) =>
  mat4FromTranslation(mat4Create(), p),
);

// TODO: Do I need to keep all these matrices? It's a lot
// of memory.
const redBlocksModelMats = redBlocksInitialPositions.map((p) =>
  mat4FromTranslation(mat4Create(), p),
);

const getBlockTranslatedBaseVertices = (modelMat: mat4) => {
  const [v1, v2, v3, _, v4] = groupBy3(blockBaseVertices);
  const translation = getTranslation(vec3Create(), modelMat);
  return [
    vec3Add(vec3Create(), v1, translation),
    vec3Add(vec3Create(), v2, translation),
    vec3Add(vec3Create(), v3, translation),
    vec3Add(vec3Create(), v4, translation),
  ];
};

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

gl.useProgram(program);
gl.uniformMatrix4fv(uniProjMatLoc, false, projMat);
gl.uniformMatrix4fv(uniViewMatLoc, false, viewMat);

let prevTime: number | null = null;

const gameLoop = (elapsed: number) => {
  if (!prevTime) {
    prevTime = elapsed;
    delta = 16.67;
  } else {
    delta = elapsed - prevTime;
  }

  processInput();

  // simulate
  blocksModelMats
    .filter(falsyFilter)
    .forEach((m) => translate(m, m, [0, 0, -0.005 * delta]));

  redBlocksModelMats
    .filter(falsyFilter)
    .forEach((m) => translate(m, m, [0, 0, -0.005 * delta]));

  blocksModelMats.forEach((m, i) => {
    if (!m) return;

    const blockBaseTopLeft = getBlockTranslatedBaseVertices(m)[0];

    // TODO: Zmienić warunek na sprawdzający, czy bloki są wystarczająco blisko
    // statku, żeby w ogóle sprawdzać kolizje
    if (blockBaseTopLeft[2] > 10) {
      return;
    }

    const shipTranslated = getShipCurrent2dPosition();

    const blockBaseShape = {
      topLeft: [blockBaseTopLeft[0], blockBaseTopLeft[2]] as [number, number],
      size: 1,
    };

    const isInsideASquare = shipTranslated.some((p) =>
      isVertexInsideASquare2d(p as [number, number], blockBaseShape),
    );

    if (isInsideASquare) {
      blocksModelMats[i] = undefined;
    }

    // TODO: Check if any of the two bottom square vertices are inside a ship's triangle
  });

  redBlocksModelMats.forEach((m, i) => {
    if (!m) return;

    const blockBaseTopLeft = getBlockTranslatedBaseVertices(m)[0];

    // TODO: Zmienić warunek na sprawdzający, czy bloki są wystarczająco blisko
    // statku, żeby w ogóle sprawdzać kolizje
    if (blockBaseTopLeft[2] > 10) {
      return;
    }

    const shipTranslated = getShipCurrent2dPosition();

    const blockBaseShape = {
      topLeft: [blockBaseTopLeft[0], blockBaseTopLeft[2]] as [number, number],
      size: 1,
    };

    const isInsideASquare = shipTranslated.some((p) =>
      isVertexInsideASquare2d(p as [number, number], blockBaseShape),
    );

    if (isInsideASquare) {
      blocksModelMats[i] = undefined;
    }

    // TODO: Check if any of the two bottom square vertices are inside a ship's triangle
  });

  // draw
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindVertexArray(vao);
  gl.uniformMatrix4fv(uniModelMatLoc, false, modelMat1);
  gl.uniform4fv(uniColorLoc, [0.6, 0.2, 0.2, 1]);
  gl.drawArrays(gl.TRIANGLES, 0, floorVertices.length / 3);
  gl.bindVertexArray(null);

  gl.bindBuffer(gl.ARRAY_BUFFER, shipVertexBuffer);
  gl.uniform4fv(uniColorLoc, shipColor);
  gl.uniformMatrix4fv(uniModelMatLoc, false, shipModelMat);
  gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, shipVertices.length / 3);

  gl.bindBuffer(gl.ARRAY_BUFFER, blockVertexBuffer);
  gl.uniform4fv(uniColorLoc, [0.1, 0.7, 0.3, 1]);

  const blocksToRemove: number[] = [];
  blocksModelMats.forEach((m, idx) => {
    if (!m) return;

    const blockBaseTopLeft = getBlockTranslatedBaseVertices(m)[0];

    // TODO: Tweak this and stop rendering if the block goes out of the screen
    if (blockBaseTopLeft[2] > 15) {
      return;
    }

    if (blockBaseTopLeft[2] < -2) {
      blocksToRemove.push(idx);
    }

    gl.uniformMatrix4fv(uniModelMatLoc, false, m);
    gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, blockVertices.length / 3);
  });

  gl.uniform4fv(uniColorLoc, [0.8, 0.1, 0.3, 1]);
  redBlocksModelMats.forEach((m, idx) => {
    if (!m) return;

    const blockBaseTopLeft = getBlockTranslatedBaseVertices(m)[0];

    // TODO: Tweak this and stop rendering if the block goes out of the screen
    if (blockBaseTopLeft[2] > 15) {
      return;
    }

    if (blockBaseTopLeft[2] < -2) {
      blocksToRemove.push(idx);
    }

    gl.uniformMatrix4fv(uniModelMatLoc, false, m);
    gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, blockVertices.length / 3);
  });

  blocksToRemove.forEach((x) => (blocksModelMats[x] = undefined));

  prevTime = elapsed;
  window.requestAnimationFrame(gameLoop);
};

window.requestAnimationFrame(gameLoop);
