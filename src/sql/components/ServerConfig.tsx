import Modal from "@src/components/Modal";
import {
  getServerConfigList,
  getServerKey,
  setServerConfigKey,
  saveConfig,
  delConfig,
} from "@src/utils/LocalConfigUtil";
import {
  Textarea,
  Button,
  Select,
  SelectItem,
  Input,
  SharedSelection,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { config_template, type ConfigItem, type REQUESTINFO } from "@src/types";
import { fetch } from "@tauri-apps/plugin-http";
import { getLable } from "@src/utils/LocalConfigUtil";

export default function ServerConfig(props: {
  selectBase?: (selectBaseList: REQUESTINFO[]) => void;
  className?: string;
}) {
  let config_template_str = JSON.stringify(config_template, null, 2);
  const [sKey, setSkey] = useState(getServerKey());
  const [configList, setConfigList] = useState(getServerConfigList());
  const [configKey, setConfigKey] = useState<string>("");
  const [configValue, setConfigValue] = useState<string>(config_template_str);
  const [database, setDatabase] = useState<Record<string, any>>({});
  const [loadingBase, setLoadingBase] = useState(false);
  const [values, setValues] = useState<Set<string>>(new Set([]));
  const [select, setSelected] = useState(false);

  const loadAllData = (conf: ConfigItem) => {
    setLoadingBase(true);
    fetch(conf["SERVER"])
      .then((res) => res.json())
      .then((res) => {
        setDatabase(res);
      })
      .finally(() => {
        setLoadingBase(false);
      });
  };
  const onSelectionChange = (e: SharedSelection) => {
    trrigerValue(e as Set<string>);
  };

  const trrigerValue = (e: Set<string>) => {
    setValues(e);
    const configItem = configList[sKey];
    props.selectBase?.(
      Array.from(e).map((baseName) => {
        return {
          BASE_NAME: baseName,
          url: database[baseName],
          SQL_REQUEST_KEY: configItem.SQL_REQUEST_KEY,
          SQL_SIGN_SECRET: configItem.SQL_SIGN_SECRET,
          Platform: configItem.Platform,
        };
      })
    );
  };

  const saveConifgToLocal = (close: Function) => {
    if (!configKey || !configValue) {
      return;
    }
    if (!Object.keys(getServerConfigList()).length) {
      setSkey(configKey);
      setServerConfigKey(configKey);
    }
    saveConfig(configKey, JSON.parse(configValue));
    setConfigList(getServerConfigList());
    close();
  };
  const delConifgToLocal = (close: Function) => {
    delConfig(configKey);
    setConfigList(getServerConfigList());
    close();
  };

  const selectAllBase = () => {
    const _values = new Set(Object.keys(database));
    const _select = !select;
    setSelected(_select);
    if (!_select) {
      trrigerValue(new Set([]));
    } else {
      trrigerValue(_values);
    }
  };

  useEffect(() => {
    trrigerValue(new Set([]));
    const configItem = configList[sKey];
    if (configItem) {
      loadAllData(configItem);
      setConfigKey(sKey);
      setConfigValue(JSON.stringify(configItem, null, 2));
    }
  }, [sKey]);
  return (
    <div className={`flex gap-2 items-center ` + props.className}>
      <Modal
        title="服务器配置"
        open={(onOpen) => <Button onPress={onOpen}>配置</Button>}
        footer={(onClose) => (
          <>
            <Button color="default" onPress={onClose}>
              Close
            </Button>
            <Button
              color="danger"
              onPress={() => {
                delConifgToLocal(onClose);
              }}
            >
              删除配置
            </Button>
            <Button
              color="primary"
              onPress={() => {
                saveConifgToLocal(onClose);
              }}
            >
              保存配置
            </Button>
          </>
        )}
      >
        <Input
          label="配置别名"
          isRequired
          className="m-3 max-w-96"
          isInvalid={!configKey}
          errorMessage="请输入配置别名"
          value={configKey}
          onChange={(e) => setConfigKey(e.target.value)}
        />

        <Textarea
          isRequired={true}
          label="配置JSON"
          isInvalid={!configValue}
          className="m-3 max-w-96"
          errorMessage="请输入配置JSON"
          value={configValue}
          onChange={(e) => {
            if (e.target.value) {
              setConfigValue(e.target.value);
            } else {
              setConfigValue(config_template_str);
            }
          }}
        ></Textarea>
      </Modal>
      <Select
        label="选择配置"
        isRequired
        className="max-w-[140px]"
        selectionMode="single"
        selectedKeys={[sKey]}
        isInvalid={sKey.length <= 0}
        onChange={(e) => {
          const v = e.target.value;
          setSkey(v);
          setServerConfigKey(v);
          setConfigKey(v);
          setConfigValue(JSON.stringify(configList[v], null, 2));
        }}
      >
        {Object.keys(configList).map((key) => (
          <SelectItem key={key}>{key}</SelectItem>
        ))}
      </Select>
      <Select
        isLoading={loadingBase}
        isRequired
        className="max-w-xs"
        selectionMode="multiple"
        label="数据库"
        selectedKeys={values}
        isInvalid={values.size <= 0}
        onSelectionChange={onSelectionChange}
      >
        {[
          <SelectItem key="all" onClick={selectAllBase}>
            全部
          </SelectItem>,
        ].concat(
          Object.keys(database)
            .reverse()
            .map((key) => (
              <SelectItem key={key} title={`${key} (${getLable(key)})`} />
            ))
        )}
      </Select>
    </div>
  );
}
