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
  const allEntry = glob.sync(
    packbuild["scan"].map((item) => resolve(__dirname, "../../", item))
  ); //路径是基于项目目录

  let temp = fs
    .readFileSync(resolve(__dirname, "../../template.html"))
    .toString();

  let { build } = entryConfig;
  let entryPage: Record<string, string> = {};
  allEntry.forEach((entry) => {
    let [_, _1, modeuleName] = entry.match(/(.*)\/(.*)\/main.tsx/)!;
    let writeHtmlPath = resolve(__dirname, `../../${modeuleName}.html`);
    console.log("匹配模块:::", _);
    const mode: Record<string, any> = {
      title: entryConfig[modeuleName]?.title || modeuleName,
      src: entry,
      ...(entryConfig[modeuleName] || {}),
    };
    //  贪婪模式
    let content = temp.replace(/{{(.*?)}}/gi, (ma, p1) => {
      return mode[p1.trim()] || ma; //替换失败返回原有文本
    });
    // 写入口文件
    fs.writeFileSync(writeHtmlPath, content);
    entryPage[modeuleName] = modeuleName + ".html";
  });

  if (command === "build") {
    console.log(
      `********************输出模块:[${[...build].join(
        "]["
      )}]********************`
    );
    entryPage = Object.keys(entryPage).reduce((acc: any, key) => {
      if (entryPage[key] !== undefined && [...build].includes(key)) {
        acc[key] = entryPage[key];
      }
      return acc;
    }, {});
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
