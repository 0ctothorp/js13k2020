import { assert } from './utils';
import {
  fromTranslation as mat4FromTranslation,
  create as mat4Create,
  perspective as mat4Perspective,
  lookAt,
} from 'gl-matrix/mat4';
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

const makeTriangleStrapVertices = (width: number, height: number) => {
  // TODO: It'd probably be more efficient if I had allocated the needed memory
  // upfront?
  const vertices: number[] = [];

  for (let row = 0; row < height + 1; row++) {
    for (let col = 0; col < width + 1; col++) {
      vertices.push(col);
      vertices.push(0);
      vertices.push(row);
    }
  }

  return vertices;
};

const w = 3;
const h = 3;
const vertices = makeTriangleStrapVertices(w, h);

const makeTriangleStrapIndices = (width: number, height: number) => {
  const indices: number[] = [];

  for (let i = 0; i < height; i++) {
    for (let j = i * (width + 1); j < (i + 1) * (width + 1); j++) {
      indices.push(j);
      indices.push(j + width + 1);
    }
    if (i < height - 1) {
      indices.push((i + 2) * width + 1);
      indices.push((i + 1) * width + 1);
    }
  }

  return indices;
};

const indices = makeTriangleStrapIndices(w, h);

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

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const posBuffer = gl.createBuffer();
assert(posBuffer, "Couldn't create position buffer");
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

gl.enableVertexAttribArray(posAttrLoc);

const size = 3; // 3 components per iteration
const type = gl.FLOAT; // the data is 32bit floats
const normalize = false; // don't normalize the data
const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
const offset = 0; // start at the beginning of the buffer
gl.vertexAttribPointer(posAttrLoc, size, type, normalize, stride, offset);

const indicesBuffer = gl.createBuffer();
assert(indicesBuffer, "Couldn't create indices buffer");
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  Uint16Array.from(indices),
  gl.STATIC_DRAW,
);

gl.bindVertexArray(null);

const modelMat = mat4FromTranslation(mat4Create(), [0, 0, 0]);

const viewMat = lookAt(mat4Create(), [w / 2, 1, 0], [w / 2, 0, 1], [0, 1, 0]);

/////////////
// prettier-ignore
const shipVertices = new Float32Array([
  -0.5, 0, -0.5,
   0.5, 0, -0.5,
     0, 0,  0.5,
]);

const shipVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, shipVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, shipVertices, gl.STATIC_DRAW);
gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const shipColor = [0.1, 0.1, 0.9, 1];
const shipModelMat = mat4FromTranslation(mat4Create(), [0, 0.5, 0]);
/////////

const gameLoop = () => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clearColor(0, 0, 0, 1);

  gl.useProgram(program);

  gl.bindVertexArray(vao);
  gl.uniformMatrix4fv(uniModelMatLoc, false, modelMat);
  gl.uniformMatrix4fv(uniProjMatLoc, false, projMat);
  gl.uniformMatrix4fv(uniViewMatLoc, false, viewMat);
  gl.uniform4fv(uniColorLoc, [0.6, 0.2, 0.2, 1]);
  const primitiveType = gl.TRIANGLE_STRIP;
  const offset = 0;
  const count = indices.length;
  gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, offset);
  gl.bindVertexArray(null);

  gl.bindBuffer(gl.ARRAY_BUFFER, shipVertexBuffer);
  gl.uniform4fv(uniColorLoc, shipColor);
  gl.uniformMatrix4fv(uniModelMatLoc, false, shipModelMat);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  window.requestAnimationFrame(gameLoop);
};

window.requestAnimationFrame(gameLoop);
