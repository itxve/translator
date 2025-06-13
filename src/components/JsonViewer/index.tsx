import { useEffect, useState } from "react";
import "./index.css";
import { Button, Checkbox } from "@heroui/react";
import * as clipboard from "@tauri-apps/plugin-clipboard-manager";

export default function JsonViewer(props: { data: any }) {
  const { data } = props;
  const [jsonData, setJsonData] = useState<any[]>();
  const [copyState, setCopyState] = useState(false);
  const [showLn, setShowLn] = useState(false);

  useEffect(() => {
    if (data) {
      setJsonData(JSON.stringify(data, null, 2).split("\n"));
    }
  }, [data]);
  return (
    <div className="relative">
      <div className="absolute left-0 top-0 p-1 flex items-center gap-2 m-1">
        <Checkbox radius="full" onValueChange={setShowLn}>
          <span className="text-blue-700">show line number</span>
        </Checkbox>
        <Button
          size="sm"
          color={copyState ? "success" : "primary"}
          variant="bordered"
          onClick={async () => {
            setCopyState(true);
            setTimeout(() => {
              setCopyState(false);
            }, 2000);
            await clipboard.writeText(JSON.stringify(data, null, 2));
          }}
        >
          {copyState ? "Copied!" : "Copy"}
          {Array.isArray(data) && (
            <b className="text-green-600 left-full">{data.length}</b>
          )}
        </Button>
      </div>

      <pre
        className={
          showLn ? "pre-line-number overflow-x-auto" : "pre overflow-x-auto"
        }
      >
        {jsonData?.map((it) => (
          <span>{it}</span>
        ))}
      </pre>
    </div>
  );
}
