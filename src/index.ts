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
  // TODO: Wouldn't it be more efficient if I had allocated the needed memory
  // upfront?
  const vertices: number[] = [];

  for (let row = 0; row < height + 1; row++) {
    for (let col = 0; col < width + 1; col++) {
      vertices.push(col);
      vertices.push(row);
    }
  }

  return vertices;
};

const vertices = makeTriangleStrapVertices(5, 5);
console.log({ vertices });

gl.clearColor(0, 0, 0, 1);

const gameLoop = () => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  window.requestAnimationFrame(gameLoop);
};

window.requestAnimationFrame(gameLoop);
