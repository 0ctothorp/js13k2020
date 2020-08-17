import { assert } from './utils.js';

const canvas: HTMLCanvasElement | null = document.querySelector('canvas');
assert(canvas, 'No canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
      vertices.push(row);
      vertices.push(0);
    }
  }

  return vertices;
};

const w = 3;
const h = 3;
const vertices = makeTriangleStrapVertices(w, h);
console.log({ vertices });

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
console.log({ indices });

gl.clearColor(0, 0, 0, 1);

const gameLoop = () => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  window.requestAnimationFrame(gameLoop);
};

window.requestAnimationFrame(gameLoop);
