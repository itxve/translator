import { Button, Select, SelectItem } from "@heroui/react";
import * as xlsx from "xlsx";
import SelectFile from "@src/components/SelectFile";
import * as fs from "@tauri-apps/plugin-fs";
import { useRef, useState } from "react";
import * as dialog from "@tauri-apps/plugin-dialog";

export default function SpreadExcel() {
  const [sheets, setSheetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const wbRef = useRef<xlsx.WorkBook>();

  const [select_cloums, setSelectColumns] = useState<Set<string>>(new Set([]));
  const onFileSelect = async (fpath: string) => {
    let excelData = await fs.readFile(fpath);
    const wb = xlsx.read(excelData.buffer);
    setSheetNames(wb.SheetNames);
    wbRef.current = wb;
  };

  const excuteSpread = async () => {
    let cloums = Array.from(select_cloums);
    if (!cloums.length) {
      return;
    }
    let filePath = await dialog.open({
      title: "保存文件",
      directory: true,
    });
    setLoading(true);
    try {
      for (let index = 0; index < Array.from(cloums).length; index++) {
        const sname = cloums[index];
        const sheet = wbRef.current?.Sheets[sname];
        const headers = xlsx.utils.sheet_to_json(sheet!, { header: 1 });
        console.log("表头数组：", headers);

        const _rows = xlsx.utils.sheet_to_json(sheet!);

        const ws = xlsx.utils.json_to_sheet(_rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, sname);
        const buffer: Uint8Array = xlsx.write(wb, {
          bookType: "xlsx",
          compression: true,
          type: "buffer",
        });

        let new_filePath = filePath! + `/Spread_${sname}_${Date.now()}.xlsx`;
        await fs.writeFile(new_filePath, buffer);
      }
    } finally {
      setLoading(false);
    }
    dialog.message("保存成功");
  };
  return (
    <div className="min-w-[1100px]">
      <div>
        <h2>分割Excel Sheet</h2>
        <SelectFile title="选择文件" onFileSelect={onFileSelect} />
      </div>
      <div className="flex content-center">
        <Select
          label="Sheet列表"
          selectedKeys={select_cloums}
          onSelectionChange={(e) => {
            setSelectColumns(e as Set<string>);
          }}
          selectionMode="multiple"
        >
          {sheets.map((item) => (
            <SelectItem key={item} title={item} />
          ))}
        </Select>
        <Button
          isLoading={loading}
          color={"primary"}
          variant="faded"
          onPress={excuteSpread}
        >
          开始分离Sheet
        </Button>
      </div>
    </div>
  );
}
