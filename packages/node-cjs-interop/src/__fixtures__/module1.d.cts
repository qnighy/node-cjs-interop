/* eslint-disable @typescript-eslint/no-namespace */

declare function square(x: number): number;
declare namespace square {
  const version: string;
}

export = square;
