import JSON5 from "json5";

export async function nest_transloter(
  content: any,
  apply: (v: string, key: string) => Promise<string>
) {
  if (Array.isArray(content)) {
    for (let index = 0; index < content.length; index++) {
      const obj = content[index];
      await nest_transloter(obj, apply);
    }
    return;
  }
  for (const key in content) {
    const value = content[key];
    if (typeof value == "object") {
      await nest_transloter(value, apply);
    } else if (typeof value == "string") {
      content[key] = await apply(value, key);
    }
  }
}

export function sleep(timeout: number) {
  return new Promise((resove) => {
    setTimeout(resove, timeout);
  });
}

export const extensions: Record<
  string,
  { replace: (c: string) => any; concat: (c: string) => string }
> = {
  js: {
    replace: (c: string) =>
      JSON5.parse(c.replace("export default ", "").replace("};", "}")),
    concat: (c: string) => "export default " + c,
  },
  json: {
    replace: (c: string) => JSON5.parse(c.replace("};", "}")),
    concat: (c: string) => c,
  },
  properties: {
    replace: (c: string) => {
      return c.split("\n").map((it) => {
        const [k = "", v = ""] = it.split("=");
        return { [k]: v };
      });
    },
    concat: (c: string) => {
      let prop = JSON5.parse(c);
      prop = prop
        .map((it: any) => {
          const key = Object.keys(it)[0];
          const value = it[key];
          return key && value ? `${key}=${value}` : `${key}`;
        })
        .join("\n");
      return prop;
    },
  },
  xml: {
    replace: (c: string) => {
      return c
        .split("\n")
        .filter((it) => it.match(`<string name="(.*)">(.*)</string>`))
        .map((it) => {
          const [_, name, value] = it.match(
            `<string name="(.*)">(.*)</string>`
          )!;
          return { [name]: value };
        });
    },
    concat: (c: string) => {
      let prop = JSON5.parse(c);
      return `
<?xml version="1.0" encoding="utf-8"?>
<resources>
    ${[]
      .concat(prop)
      .map((ite) => {
        const name = Object.keys(ite)[0];
        const value = ite[name];
        console.log(name, value);
        return `  <string name="${name}">${value}</string>`;
      })
      .join("\n")}
</resources>`;
    },
  },
};
