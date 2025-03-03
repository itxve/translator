import { Plugin } from "vite";
import { copyAssets } from "../../package.json";
import { resolve } from "path";
import { cpSync } from "fs";

export default function copy(comand: string): Plugin {
  return {
    apply(config, env) {
      return true;
    },
    name: "copyAssets", // this name will show up in logs and errors
    buildStart: (options) => {
      console.log("copyAssets:::");

      //dev 模式
      if (comand == "serve") {
      }

      if (copyAssets) {
        copyAssets.map(({ from, to }) => {
          let fromPath = resolve(__dirname, "../../", from);
          let toPath = resolve(__dirname, "../../", to);
          cpSync(fromPath, toPath, { recursive: true });
        });
      }
    },
  };
}
