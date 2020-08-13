export function assert(condition: any, msg: string): asserts condition {
  console.assert(condition, msg);
}
