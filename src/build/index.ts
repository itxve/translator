import { glob } from "glob";
import { resolve } from "path";
import fs from "fs";
import { packbuild } from "../../package.json";

/**
 * 生成入口
 * @param command
 */
export function genInputEntry(command: string, port: number) {
  let entryConfig: Record<string, any> = packbuild as any;
  const allEntry = glob.sync(["./src/pages/**/main.tsx"]); //路径是基于项目目录

  let temp = fs
    .readFileSync(resolve(__dirname, "../../template.html"))
    .toString();

  // 初始化模版文件内容
  let content = "";
  let entryPage: Record<string, string> = {};
  allEntry.forEach((entry) => {
    let [_, modeuleName] = entry.match(/pages\/(.*)\/main.tsx/)!;
    let writeHtmlPath = resolve(__dirname, `../../${modeuleName}.html`);
    // 如果出现了新的入口文件且没有在配置项内则写入该配置并且将其设置为true(也就是说默认将其统一打包)
    const mode: Record<string, any> = {
      title: entryConfig[modeuleName]?.title || modeuleName,
      src: entry,
    };
    // 模版匹配
    content = temp.replace(/{{(.*?)}}/gi, (_, p1) => {
      return mode[p1.trim()];
    });
    // 写入口文件
    fs.writeFileSync(writeHtmlPath, content);
    entryPage[modeuleName] = modeuleName + ".html";
  });

  if (command === "build") {
    let { build } = entryConfig;
    console.log(
      `********************输出模块:[${[...build].join(
        "]["
      )}]********************`
    );
    let _entryPage: any = {};
    [...build].forEach((key) => {
      _entryPage[key] = entryPage[key];
    });
    entryPage = _entryPage;
  } else {
    printServerUrls(entryPage, port);
  }

  return entryPage;
}

export const printServerUrls = (options: any, port: string | number) => {
  console.log("********************页面入口信息打印开始********************");
  Object.values(options).forEach((val) => {
    const base = (val as string).split("/").pop();
    console.log(`http://localhost:${port}/${base}`);
  });
  console.log("********************页面入口信息打印结束********************");
};
