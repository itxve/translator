import { Button, Chip } from "@heroui/react";
import * as fs from "@tauri-apps/plugin-fs";
import * as dialog from "@tauri-apps/plugin-dialog";
import ossUtil from "./oss";
import { useMemo } from "react";
import configReadmeTxt from "./template.txt?raw";

export default function ImportConfig() {
  const importConfig = async () => {
    let selectPath: any = await dialog.open({
      title: "选择文件",
      filters: [{ name: "", extensions: ["json"] }],
      multiple: false,
      directory: false,
    });
    const configJSon = await fs.readTextFile(selectPath.path);
    ossUtil.storeConfig(JSON.parse(configJSon));
    location.reload();
  };

  const hasConfig = useMemo(() => {
    const { platform, oss_config, oss_map_info } = ossUtil._config;
    return platform.length && oss_config.length && oss_map_info.length;
  }, [localStorage]);

  const downReadme = async () => {
    const filePath = await dialog.save({
      title: "保存文件",
      defaultPath: "oss_map_config",
      filters: [
        {
          name: "",
          extensions: ["txt"],
        },
      ],
    });

    await fs.writeTextFile(filePath!, configReadmeTxt);
    dialog.message("保存成功");
  };
  return (
    <div className="flex items-center gap-2">
      <div>
        <Button
          color={hasConfig ? "primary" : "danger"}
          variant="faded"
          onClick={importConfig}
        >
          导入json配置文件
        </Button>
      </div>
      <div>
        <Chip
          size="sm"
          color="primary"
          className="cursor-pointer"
          onClick={downReadme}
        >
          下载模版
        </Chip>
      </div>
    </div>
  );
}
