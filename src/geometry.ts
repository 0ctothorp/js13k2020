export type Vertex2d = [number, number];

export const isVertexInsideASquare2d = (
  vertex: Vertex2d,
  { topLeft, size }: { topLeft: Vertex2d; size: number },
) => {
  const [vx, vy] = vertex;
  return !(
    vx < topLeft[0] ||
    vx > topLeft[0] + size ||
    vy < topLeft[1] ||
    vy > topLeft[1] + size
  );
};
