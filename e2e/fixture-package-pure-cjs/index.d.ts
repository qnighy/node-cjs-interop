declare function square(x: number): number;
declare namespace square {
  export const version: string;

  export let counter: number;
  export function countUp(): void;

  export function getThis<T>(this: T): T;
}
export = square;
