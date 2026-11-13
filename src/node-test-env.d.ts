// Minimal ambient declarations for Node built-ins used in Vitest headless tests (keeps package.json strictly to spec-pinned dependencies).

declare module 'node:fs' {
  export interface Dirent {
    readonly name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  export function existsSync(path: string): boolean;
  export function readdirSync(path: string, options: { withFileTypes: true }): Dirent[];
  export function readFileSync(path: string): Uint8Array;
  export function readFileSync(path: string, encoding: 'utf-8' | 'utf8'): string;
}

declare module 'node:path' {
  export const sep: string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;
}

declare const process: {
  cwd(): string;
};
