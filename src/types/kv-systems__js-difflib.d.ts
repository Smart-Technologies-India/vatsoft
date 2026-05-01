declare module "@kv-systems/js-difflib" {
  export class SequenceMatcher {
    constructor(a: string | string[], b: string | string[], isjunk?: (c: string) => boolean);
    ratio(): number;
    quick_ratio(): number;
    real_quick_ratio(): number;
    get_opcodes(): Array<[string, number, number, number, number]>;
    get_matching_blocks(): Array<[number, number, number]>;
  }

  export function defaultJunkFunction(c: string): boolean;
  export function stripLinebreaks(str: string): string;
  export function stringAsLines(str: string): string[];
}
