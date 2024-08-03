declare module "@babel/helper-validator-option" {
  export class OptionValidator {
    descriptor: string;
    constructor(descriptor: string);

    /**
     * Validate if the given `options` follow the name of keys defined in the `TopLevelOptionShape`
     *
     * @param options
     * @param TopLevelOptionShape
     *   An object with all the valid key names that `options` should be allowed to have
     *   The property values of `TopLevelOptionShape` can be arbitrary
     */
    validateTopLevelOptions<T extends object, U extends object>(
      options: T,
      TopLevelOptionShape: U,
    ): asserts options is T &
      Record<keyof U, unknown> & {
        [K in keyof T]?: K extends keyof U ? unknown : undefined;
      };

    validateBooleanOption<T>(
      name: string,
      value?: boolean,
      defaultValue?: T,
    ): boolean | T;

    validateStringOption<T>(
      name: string,
      value?: string,
      defaultValue?: T,
    ): string | T;

    /**
     * A helper interface copied from the `invariant` npm package.
     * It throws given `message` when `condition` is not met
     */
    invariant(condition: boolean, message: string): void;

    formatMessage(message: string): string;
  }

  /**
   * Given a string `str` and an array of candidates `arr`,
   * return the first of elements in candidates that has minimal
   * Levenshtein distance with `str`.
   */
  export function findSuggestion(str: string, arr: readonly string[]): string;
}
