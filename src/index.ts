import { assert } from './utils';

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

gl.clearColor(0, 0, 0, 1.0);

const gameLoop = () => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  window.requestAnimationFrame(gameLoop);
};

window.requestAnimationFrame(gameLoop);
