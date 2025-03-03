import type { ServerConfig, ConfigItem } from "@src/types";

export function getServerKey() {
  let configStr = localStorage.getItem("config_key") || "";
  if (!configStr) {
    const list = Object.keys(getServerConfigList());
    if (list.length) {
      setServerConfigKey(list[0]);
      return list[0];
    }
  }
  return configStr;
}

export function setServerConfigKey(key: string) {
  localStorage.setItem("config_key", key);
}

export function getServerConfigList() {
  let configStr = localStorage.getItem("config") || "{}";
  return JSON.parse(configStr) as ServerConfig;
}

export function saveConfig(key: string, config: ConfigItem) {
  let configStr = localStorage.getItem("config") || "{}";
  let conf = JSON.parse(configStr) as ServerConfig;
  conf[key] = config;
  localStorage.setItem("config", JSON.stringify(conf));
}

export function delConfig(key: string) {
  let configStr = localStorage.getItem("config") || "{}";
  let conf = JSON.parse(configStr) as ServerConfig;
  delete conf[key];
  localStorage.setItem("config", JSON.stringify(conf));
}

export function getCurrentConfig() {
  return getServerConfigList()[getServerKey()];
}

let lables: Record<string, string> = JSON.parse(
  localStorage.getItem("lable_config") || "{}"
);

export function setLable(key: string, lable: string) {
  lables[key] = lable;
  setTimeout(() => {
    localStorage.setItem("lable_config", JSON.stringify(lables));
  }, 1000);
}
export function getLable(key: string): string {
  let _lable_config = localStorage.getItem("lable_config") || "{}";
  let lable_config: Record<string, string> = JSON.parse(_lable_config);
  return lable_config[key] || "";
}
