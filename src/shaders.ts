import { assert } from './utils';

export function createShader(
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

export function createProgram(
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

export const createShaderProgram = (
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
