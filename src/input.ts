export const pressed = {
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
