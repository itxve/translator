import { invoke } from "@tauri-apps/api/core";

import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Code,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tooltip,
} from "@heroui/react";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useState } from "react";
import ossUtil from "./oss";
import { OssConfig, UploadInfoType } from "@src/types";
import ImportConfig from "./ImportConfig";
import { getLable } from "@src/utils/ServerConfigUtil";

function App() {
  const [directory, setDirectory] = useState();
  const [platformDir, setPlatformDir] = useState<string[]>([]);
  const [deployApps, setDeployApps] = useState<Set<string>>(new Set());
  const [deployPlatform, setDeployPlatform] = useState<Set<string>>(new Set());
  const [deployLs, setDeployLs] = useState<OssConfig[]>();
  const [uploading, setUploading] = useState<UploadInfoType>({});
  const [ignoreConfigJs, setIgnoreConfigJs] = useState(true);

  const fileSelect = async () => {
    let selectPath: any = await dialog.open({
      title: "选择文件",
      multiple: false,
      directory: true,
    });
    setDirectory(selectPath);
  };
  const loadDeployList = () => {
    let deployList: OssConfig[] = [];

    const apps = Array.from(deployApps);
    const platforms = Array.from(deployPlatform);
    if (!apps.length || !platforms.length) {
      return;
    }
    apps.map((app) => {
      platforms.map((plat) => {
        const uploadInfo = ossUtil.findMapConfig(app, plat);
        const ossConf = ossUtil.confGroup()[app];
        if (uploadInfo && ossConf) {
          const platform = ossUtil.platformGroup()[plat];
          const platformName = platform?.label;
          const use_app_code_prifix = platform?.use_app_code_prifix;

          deployList.push({
            ...(ossConf as any),
            storage_code: app,
            platform: use_app_code_prifix
              ? platformName + "/" + app
              : platformName,
            use_app_code_prifix: use_app_code_prifix,
            target_base_path: uploadInfo.target_base_path,
            status: "",
            error: "",
          });
        }
      });
    });
    setDeployLs(deployList);
  };
  const loadPlatform = () => {
    if (!directory) {
      return;
    }
    invoke<string[]>("platform_list", { dir: directory }).then((res) => {
      setPlatformDir(res);
    });
  };

  const disabledKeys = useMemo(() => {
    const difference = ossUtil
      .platform_type()
      .filter((element) => !platformDir.includes(element.label))
      .map((it) => it.value);
    return difference;
  }, [platformDir]);

  const groupDeployByCode: Record<string, OssConfig[]> = useMemo(() => {
    return (
      deployLs?.reduce((value: any, current) => {
        const code = current.storage_code;
        if (!value[code]) {
          value[code] = [];
        }
        value[code].push(current);
        return value;
      }, {}) || []
    );
  }, [deployLs]);

  const deploy = () => {
    if (!deployLs) {
      return;
    }
    const list = [...deployLs];

    list?.forEach(async (de) => {
      uploading[`${de.storage_code + de.platform}`] = {
        status: "uploading",
        error: "",
        success_files: [],
        failed_files: [],
        total_count: 0,
      };
      setUploading({ ...uploading });

      if (!(await invoke("exists", { dir: directory + "/" + de.platform }))) {
        uploading[`${de.storage_code + de.platform}`] = {
          status: "error",
          error: "本地目录不存在",
          success_files: [],
          failed_files: [],
          total_count: 0,
        };
        setUploading({ ...uploading });
        console.log("fff");

        return;
      }

      invoke("aliyu_oss_upload", {
        conf: {
          key_id: de.access_key_id,
          key_secret: de.access_key_secret,
          endpoint: de.end_point,
          bucket: de.bucket_name,
          platform: de.platform,
          local_dir_path: directory,
          target_base_path: de.target_base_path,
          ignore_config_js: ignoreConfigJs,
        },
      })
        .then((res) => {
          const {
            success_files,
            failed_files,
            total_count,
          } = res as UploadInfoType[string];
          uploading[`${de.storage_code + de.platform}`] = {
            status: "success",
            error: "",
            success_files,
            failed_files,
            total_count,
          };
          setUploading({ ...uploading });
        })
        .catch((e) => {
          uploading[`${de.storage_code + de.platform}`] = {
            status: "error",
            error: JSON.stringify(e),
            success_files: [],
            failed_files: [],
            total_count: 0,
          };
          setUploading({ ...uploading });
        });
    });
  };
  const renderStatus = (key: string) => {
    const up = uploading[`${key}`];
    return up?.status == "uploading" ? (
      <span>
        <Spinner size="sm" />
        上传中...
      </span>
    ) : up?.status == "success" ? (
      <Tooltip
        content={
          <div className="px-1 py-2">
            {up.failed_files.length ? (
              up.failed_files.map((it) => <span>{it}</span>)
            ) : (
              <span className="text-green-700">all success</span>
            )}
          </div>
        }
      >
        <div>
          <span>
            <b className="text-green-700">{up.success_files.length}</b> |{" "}
            <b className="text-red-700">{up.failed_files.length}</b> |
            <b>{up.total_count}</b>
          </span>
        </div>
      </Tooltip>
    ) : (
      <b className="text-red-500">{up?.error}</b>
    );
  };

  useEffect(() => {
    loadPlatform();
  }, [directory]);

  useEffect(() => {
    loadDeployList();
  }, [deployApps, deployPlatform]);

  return (
    <div className="m-3">
      <div className="flex gap-2 items-center mt-3">
        <ImportConfig />
        <Button
          color={directory ? "primary" : "danger"}
          variant="faded"
          onClick={fileSelect}
        >
          选择上传目录
        </Button>
        <span className="text-yellow-700">
          请确保选择的目录有
          {ossUtil.platform_type().map((mm) => (
            <Code className="m-1">{mm.label}</Code>
          ))}
          这些文件夹
        </span>
      </div>
      <div className="flex gap-2 items-center justify-between  mt-3">
        <div>
          目录：<b>{directory}</b>
        </div>
        <div>
          <Checkbox
            isSelected={ignoreConfigJs}
            onValueChange={setIgnoreConfigJs}
          >
            过滤根目录config.js
          </Checkbox>
        </div>
      </div>
      <div className="flex gap-2 items-center  mt-3">
        <Select
          label="部署平台"
          selectionMode="multiple"
          isMultiline={true}
          disabledKeys={disabledKeys}
          onSelectionChange={(e) => setDeployPlatform(e as Set<string>)}
        >
          {ossUtil.platform_type().map((item) => (
            <SelectItem key={item.value} title={item.label} />
          ))}
        </Select>
        <Select
          label="AppCode"
          selectionMode="multiple"
          isMultiline={true}
          onSelectionChange={(e) => setDeployApps(e as Set<string>)}
        >
          {ossUtil
            .confListKey()
            .sort()
            .reverse()
            .map((item) => (
              <SelectItem key={item} title={`${item} (${getLable(item)})`} />
            ))}
        </Select>

        <Button color="primary" disabled={!deployLs?.length} onClick={deploy}>
          部署
        </Button>
      </div>
      <div className="mt-2">
        <Tabs
          aria-label="Dynamic tabs"
          items={Array.from(deployApps).map((it) => ({
            id: it,
            label: it,
          }))}
        >
          {(item) => (
            <Tab key={item.id} title={item.label}>
              <Card>
                <CardBody>
                  <Table aria-label="Example static collection table">
                    <TableHeader>
                      <TableColumn>AppCode</TableColumn>
                      <TableColumn>平台</TableColumn>
                      <TableColumn>本地目录</TableColumn>
                      <TableColumn>oss目录(bucket+oss地址)</TableColumn>
                      <TableColumn>上传结果(成功｜失败｜总数)</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {(groupDeployByCode[item.id] || []).map((de) => (
                        <TableRow key={de.storage_code + "-" + de.platform}>
                          <TableCell>{de.storage_code}</TableCell>
                          <TableCell>{de.platform}</TableCell>
                          <TableCell>{directory + "/" + de.platform}</TableCell>
                          <TableCell>
                            {de.bucket_name + "/" + de.target_base_path}
                          </TableCell>
                          <TableCell>
                            {renderStatus(`${de.storage_code + de.platform}`)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </Tab>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
