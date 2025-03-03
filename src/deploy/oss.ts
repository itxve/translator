import { OssUploadMapConfig } from "@src/types";

class OssUtil {
  _config: OssUploadMapConfig;
  constructor() {
    const config = this.loadConfig();
    this._config = config;
  }

  loadConfig() {
    const ossConfigJsonStr =
      localStorage.getItem("oss_config_json") ||
      `{"platform":[],"oss_config":[],"oss_map_info":[]}`;
    const config: OssUploadMapConfig = JSON.parse(ossConfigJsonStr);
    return config;
  }

  storeConfig(config: any) {
    localStorage.setItem("oss_config_json", JSON.stringify(config));
    const __config = this.loadConfig();
    this._config = __config;
  }

  platformLable(value: string) {
    const [first] = this._config.platform.filter(
      (it) => it.value == String(value)
    );
    return first;
  }

  findMapConfig(app: string, upload_type: string) {
    const [first] = this._config.oss_map_info.filter(
      (it) => it.app_code == app && String(it.upload_type) == upload_type
    );

    return first;
  }

  confGroup(): {
    [key: string]: OssUploadMapConfig["oss_config"][number];
  } {
    return this._config.oss_config.reduce((accumulator: any, current: any) => {
      const codes = current.storage_code.split(",");
      codes.forEach((code: string) => {
        if (!accumulator[code]) {
          accumulator[code] = {};
        }
        accumulator[code] = current;
      });
      return accumulator;
    }, {});
  }

  confListKey() {
    return this._config.oss_config.reduce(
      (accumulator: Array<string>, current: any) => {
        const codes = current.storage_code.split(",");
        codes.forEach((code: string) => {
          if (!accumulator.includes(code)) {
            accumulator.push(code);
          }
        });
        return accumulator;
      },
      []
    );
  }

  platform_type() {
    return this._config.platform;
  }

  platformGroup(): Record<
    string,
    {
      value: string;
      label: string;
      use_app_code_prifix: boolean;
    }
  > {
    return this._config.platform.reduce((accumulator: any, current) => {
      if (!accumulator[current.value]) {
        accumulator[current.value] = current;
      }
      return accumulator;
    }, {});
  }
}
export default new OssUtil();
