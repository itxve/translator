import * as xlsx from "xlsx";
import * as dialog from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import * as clipboard from "@tauri-apps/plugin-clipboard-manager";

import {
  Button,
  TableHeader,
  Table,
  TableColumn,
  TableCell,
  TableBody,
  TableRow,
  Pagination,
  Textarea,
  Card,
  CardBody,
  Select,
  SelectItem,
} from "@heroui/react";
import { useMemo, useState } from "react";

function App() {
  const [columns, setColumns] = useState<any[]>(["Example"]);
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [jsonValue, setJsonValue] = useState("");
  const [jsonColumns, setJsonColumns] = useState<any[]>([]);
  const [mergeColumns, setMergeColumns] = useState<Set<string>>(new Set([]));
  const [fc, setFc] = useState("");
  const [jc, setJc] = useState("");

  const rowsPerPage = 10;

  const itemrows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return rows.slice(start, end);
  }, [page, rows]);

  const mergeDisable = useMemo(() => {
    return !fc || !jc || !Array.from(mergeColumns).length;
  }, [fc, jc, mergeColumns]);

  const fileSelect = async () => {
    let selectPathObject: any = await dialog.open({
      title: "选择文件",
      multiple: false,
      directory: false,
    });
    let filePath = selectPathObject.path;
    let excelData = await readFile(filePath as string);

    /* parse */
    const wb = xlsx.read(excelData.buffer);
    /* generate array of presidents from the first worksheet */
    const ws = wb.Sheets[wb.SheetNames[0]]; // get the first worksheet
    const data = xlsx.utils.sheet_to_json(ws);
    if (data.length) {
      let _columns: any[] = [];
      data.forEach((element: any) => {
        const kys = Object.keys(element);
        kys.forEach((k) => {
          if (!_columns.includes(k)) {
            _columns.push(k);
          }
        });
      });
      setColumns(_columns);
    }
    setRows(data);
  };

  const getKeyValue = (row: any, key: any) => {
    return row[key] || "";
  };

  const mergeData = async () => {
    const _rows: any[] = JSON.parse(JSON.stringify(rows));
    let jrows: any[] = JSON.parse(jsonValue);
    jrows.forEach((jr) => {
      _rows.forEach((r) => {
        if (r[fc] == jr[jc]) {
          console.log(r, jr);
          Array.from(mergeColumns).forEach((mc) => {
            if (r[mc]) {
              r[mc] = r[mc] + "," + jr[mc];
            } else {
              r[mc] = jr[mc];
            }
          });
        }
      });
    });

    const ws = xlsx.utils.json_to_sheet(_rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer: Uint8Array = xlsx.write(wb, {
      bookType: "xlsx",
      compression: true,
      type: "buffer",
    });

    const filePath = await dialog.save({
      title: "保存文件",
      defaultPath: "merge",
      filters: [
        {
          name: "",
          extensions: ["xlsx"],
        },
      ],
    });

    await writeFile(filePath!, buffer);
    dialog.message("保存成功");
  };

  const columnClick = async (cloum: string) => {
    const text = rows
      .map((it) => it[cloum])
      .filter((it) => it)
      .map((it) => `"${it}"`)
      .join(",");
    await clipboard.writeText(text);
  };

  return (
    <div className="m-4">
      <div className="flex self-center gap-2">
        <Button color={"primary"} variant="faded" onClick={fileSelect}>
          选择excel文件
        </Button>
      </div>
      <Table
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={Math.ceil(rows.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>
        }
        classNames={{
          wrapper: "min-h-[222px]",
        }}
      >
        <TableHeader columns={columns}>
          {columns.map((column) => (
            <TableColumn
              className="cursor-pointer"
              key={column}
              onClick={() => columnClick(column)}
            >
              <b title="点击复制列数组" className="text-black">
                {column}
              </b>
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody items={itemrows}>
          {itemrows.map((row) => (
            <TableRow key={row.key}>
              {(columnKey) => (
                <TableCell>{getKeyValue(row, columnKey)}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center gap-2 m-4">
        <div className="mr-4 w-[200px]">
          <Select
            label="文件列"
            value={fc}
            onChange={(e) => {
              setFc(e.target.value);
            }}
          >
            {columns.map((item) => (
              <SelectItem key={item} title={item} />
            ))}
          </Select>
        </div>
        <div className="mr-4">
          <span>~</span>
        </div>
        <div className="mr-4 w-[200px]">
          <Select
            label="Json数组列"
            value={jc}
            onChange={(e) => {
              setJc(e.target.value);
            }}
          >
            {jsonColumns.map((item) => (
              <SelectItem key={item} title={item} />
            ))}
          </Select>
        </div>
        <div className="mr-4 w-[400px]">
          <Select
            selectedKeys={mergeColumns}
            onSelectionChange={(e) => {
              setMergeColumns(e as Set<string>);
            }}
            selectionMode="multiple"
            label="需要合并到文件的Json数组列"
          >
            {jsonColumns.map((item) => (
              <SelectItem key={item} title={item} />
            ))}
          </Select>
        </div>
        <Button
          color={mergeDisable ? "default" : "primary"}
          disabled={mergeDisable}
          onClick={() => mergeData()}
        >
          下载合并后的Excel
        </Button>
      </div>
      <Card className="mt-4">
        <CardBody>
          <span>Json数组</span>
          <Textarea
            minRows={15}
            maxRows={25}
            value={jsonValue}
            onChange={(e) => {
              let data = [];
              try {
                data = JSON.parse(e.target.value);
              } catch (error) {
                data = [];
              }
              if (data.length) {
                let _columns: any[] = [];
                data.forEach((element: any) => {
                  const kys = Object.keys(element);
                  kys.forEach((k) => {
                    if (!_columns.includes(k)) {
                      _columns.push(k);
                    }
                  });
                });
                setJsonColumns(_columns);
              }
              setJsonValue(e.target.value);
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}

export default App;
