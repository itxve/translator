import { languages, toLanguages } from "../../lang";
import * as dialog from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useEffect, useState, useRef } from "react";
import { translator, run_args, allow_file } from "../../cmds";
import { nest_transloter, sleep, extensions } from "../../utils";
import JSON5 from "json5";
// import Worker from "./sw/works?worker&inline";
import { getCurrent } from "@tauri-apps/plugin-deep-link";
import * as log from "@tauri-apps/plugin-log";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { notification, tryRequestPermission } from "../../message";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";

function Translator() {
  const [content, setContent] = useState<any>();
  const [fileType, setFileType] = useState("");
  const [translatorContent, setTranslatorContent] = useState<any>();
  const [from, setFrom] = useState("auto");
  const [to, setTo] = useState("");
  const [vm, setVm] = useState("google");
  const [translatorabled, setTranslatorabled] = useState(true);
  const [selectFileAbled, setSelectFileAbled] = useState(false);
  const [translatoring, setTranslatoring] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const keyRef = useRef<any>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const unListenFileDrop = listenFileDrop();
    tryRequestPermission();
    win_run_args();
    macos_run_args();
    return () => {
      unListenFileDrop.then((call) => call());
    };
  }, []);

  const listenFileDrop = async () => {
    return getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "drop") {
        const [path] = event.payload.paths;
        if (path) {
          loadByPath(path);
        }
      }
    });
  };

  const win_run_args = async () => {
    try {
      await run_args();
    } catch (err) {
      log.error(`win error :${JSON.stringify(err)}`);
      console.log("win error :", err);
    }
  };

  const macos_run_args = async () => {
    try {
      const path = (await getCurrent())?.[0];
      log.info(`macos path :${path}`);
      if (path && path.startsWith("file:///")) {
        await allow_file(path.replace("file://", ""));
        loadByPath(path);
      }
    } catch (err) {
      log.error(`macos error :${JSON.stringify(err)}`);
      console.log("macos error :", err);
    }
  };

  // const wk = new Worker();

  // wk.onmessage = function (event) {
  //   console.log("Received message " + event.data);
  // };

  // const wkMessage = () => {
  //   wk.postMessage(JSON5.stringify({ from, to, content }));
  // };

  const fileSelect = async () => {
    let selectPathObject = await dialog.open({
      title: "选择文件",
      multiple: false,
      directory: false,
    });
    let filePath = selectPathObject?.path!;
    await loadByPath(filePath);
  };

  const loadByPath = async (filePath: string) => {
    console.log("loadByPath:", filePath);
    const fileType = `${filePath}`.split(".").pop();
    setFileType(fileType!);
    console.log("fileType:", fileType);
    let contentText = await readTextFile(filePath as string);
    contentText = extensions[fileType!].replace(contentText);
    setTranslatorabled(false);
    setContent(contentText);
    setTranslatorContent(contentText);
  };

  const translatorFile = async () => {
    setTranslatoring(true);
    setSelectFileAbled(true);
    await nest_transloter(content, async (value, key) => {
      keyRef.current.textContent = key;
      const v: string = await translator(from, to, value, vm);
      await sleep(20);
      return v || value;
    }).finally(async () => {
      setTranslatoring(false);
      setTranslatorContent(content);
      setCanSave(false);
      setSelectFileAbled(false);
      notification({
        title: "这是一个通知",
        body: "你的文件翻译完成",
        autoCancel: false,
      });
    });
  };

  const saveToFile = async () => {
    const filePath = await dialog.save({
      title: "保存文件",
      filters: [
        {
          name: "",
          extensions: [fileType],
        },
      ],
    });

    await writeTextFile(
      filePath as string,
      extensions[fileType!].concat(JSON5.stringify(translatorContent, null, 2))
    );
    dialog.message("保存成功");
  };

  const openA = () => {
    const appWindow = new WebviewWindow("avg", {
      url: "avg.html",
      x: 10,
      y: 10,
      width: 64,
      height: 64,
      // closable: false,
      // maximizable: false,
      // minimizable: false,
      // skipTaskbar: true,
      // transparent: true,
      // decorations: false,
    });
  };

  return (
    <div className=" p-3">
      <div className="flex gap-5">
        <div className="flex">
          <Autocomplete
            key={"from"}
            isRequired
            color={"primary"}
            label="源语言"
            placeholder=""
            className="w-150"
            defaultSelectedKey={from}
            onSelectionChange={(id) => {
              setFrom(id as string);
            }}
          >
            {languages.map((lang) => (
              <AutocompleteItem key={lang.value}>{lang.label}</AutocompleteItem>
            ))}
          </Autocomplete>

          <span className="self-center">至</span>
          <Autocomplete
            value={to}
            key={"to"}
            isRequired
            color={"primary"}
            label="目标语言"
            placeholder=""
            className="w-150"
            onSelectionChange={(id) => {
              setTo(id as string);
            }}
          >
            {toLanguages.map((lang) => (
              <AutocompleteItem
                key={lang.value}
                textValue={`${lang.label}(${lang.value})`}
              >
                {lang.label}({lang.value})
              </AutocompleteItem>
            ))}
          </Autocomplete>
        </div>
        <div className="flex self-center gap-2">
          <Button
            color={"primary"}
            isDisabled={selectFileAbled}
            onClick={fileSelect}
          >
            选择文件
          </Button>
          <Button
            color={"primary"}
            isDisabled={!to || translatorabled}
            isLoading={translatoring}
            onClick={translatorFile}
          >
            {translatoring ? "翻译中..." : "翻译"}
          </Button>
        </div>
      </div>
      <div className="mt-3 mb-3 flex gap-3">
        <Button color={"primary"} isDisabled={canSave} onClick={saveToFile}>
          保存到文件
        </Button>
        <Button color={"warning"} endContent={<>⚠️</>} onClick={onOpen}>
          关于
        </Button>
        <Button color={"primary"} onClick={openA}>
          打开a页面
        </Button>
        <span
          ref={keyRef}
          title="正在翻译key"
          className="text-blue-500 w-300 overflow-x-hidden self-center"
        />
      </div>
      <div>
        <Textarea
          readOnly
          style={{ width: "100%", resize: "none" }}
          minRows={17}
          maxRows={17}
          value={JSON5.stringify(translatorContent, null, 2)}
        ></Textarea>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                关于软件功能
              </ModalHeader>
              <ModalBody>
                <h2>支持翻译文件格式</h2>
                <ul className="text-blue-500 animate-textclip container">
                  <li>安卓 strings.xml</li>
                  <li>.json文件</li>
                  <li>.js文件（仅支持 export defalut 纯对象）</li>
                  <li>.properties</li>
                </ul>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Translator;
