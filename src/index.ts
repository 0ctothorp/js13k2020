const canvas: HTMLCanvasElement | null = document.querySelector('canvas');

if (!canvas) {
  throw new Error('No canvas in the DOM');
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error("Couldn't get 2d canvas context");
}

ctx.fillStyle = '#FF0000';
ctx.fillRect(0, 0, 100, 100);
