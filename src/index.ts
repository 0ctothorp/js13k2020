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

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  assert(shader, "Couldn't create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log("Couldn't compile the shader: " + gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) {
  const program = gl.createProgram();
  assert(program, "Couldn't link the shader program.");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

const createShaderProgram = (
  gl: WebGL2RenderingContext,
  vertexShaderCode: string,
  fragShaderCode: string,
) => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
  assert(vertexShader, "Couldn't create vertex shader");

  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderCode);
  assert(fragmentShader, "Couldn't create fragment shader");

  const program = createProgram(gl, vertexShader, fragmentShader);
  assert(program, "Couldn't create shader program");

  return program;
};

const planeVertexShader = `#version 300 es

    in vec2 aPosition;

    uniform mat4 uModelMat;
    uniform mat4 uProjMat;
    
    void main() {
      gl_Position = uProjMat * uModelMat * vec4(aPosition, 0, 1);
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

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const posBuffer = gl.createBuffer();
assert(posBuffer, "Couldn't create position buffer");
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

gl.clearColor(0, 0, 0, 1);

const gameLoop = () => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  window.requestAnimationFrame(gameLoop);
};

window.requestAnimationFrame(gameLoop);
