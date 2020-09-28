export function assert(condition: any, msg: string): asserts condition {
  console.assert(condition, msg);
}

export const groupBy3 = <T>(arr: T[]) =>
  arr.reduce<T[][]>((prev, curr, idx) => {
    const ret = [...prev];
    if (idx % 3 === 0) {
      return [...ret, [curr]];
    }
    ret[prev.length - 1].push(curr);
    return ret;
  }, []);

type Falsy = undefined | null | false | 0 | '';

export const falsyFilter = <T extends object | number | string | Falsy>(
  x: T,
): x is Exclude<T, Falsy> => !!x;
