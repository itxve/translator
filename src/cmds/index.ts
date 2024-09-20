import { invoke } from "@tauri-apps/api/core";
export function translator(
  from: string,
  to: string,
  text: string,
  vm: string
): Promise<string> {
  return invoke("translate", { req: { from, to, text, vm } });
}

export function run_args(): Promise<string[]> {
  return invoke("run_args");
}

export function allow_file(path: string): Promise<string> {
  return invoke("allow_file", { path });
}
