import { Textarea } from "@nextui-org/react";
import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { SQL_STATE } from "@src/types";
export interface SqlRef {
  foucsSelectText: () => void;
}

export default forwardRef<
  SqlRef,
  {
    onValueChange: (sqlState: SQL_STATE) => void;
  }
>(function SqlExec(props, ref) {
  const [sql, setSql] = useState("select now();");
  const sqlDom = useRef<HTMLTextAreaElement>(null);
  const [sqlWarn, setSqlWarn] = useState("");
  const [selectInfo, setSelectInfo] = useState<{
    selectionStart: number;
    selectionEnd: number;
  }>({ selectionStart: 0, selectionEnd: 0 });
  const sqlChange = (sqlStr: string) => {
    setSql(sqlStr.replace("’", "'"));
    localStorage.setItem("_sql", sql || "select now();");
  };

  useEffect(() => {
    let _sql = localStorage.getItem("_sql") || "select now();";
    setSql(_sql);
  }, []);

  useEffect(() => {
    if (sql) {
      let warnArr: string[] = [];
      [
        "update ",
        "insert ",
        "delete ",
        "truncate ",
        "flush",
        "reset",
        "create ",
        "alter ",
      ].map((it) => {
        if (~sql.toLocaleLowerCase().indexOf(it)) {
          warnArr.push(it);
        }
      });
      if (warnArr.length) {
        setSqlWarn(`敏感操作行为请谨慎：${warnArr.join("、")}`);
      } else {
        setSqlWarn("");
      }
    } else {
      props.onValueChange({ sql: "select now();", warn: false });
    }
  }, [sql]);

  useEffect(() => {
    props.onValueChange({ sql: sql.replace("’", "'"), warn: !!sqlWarn.length });
  }, [sql, sqlWarn]);

  // const keyDownListen = (e: KeyboardEvent) => {
  //   if (e.metaKey && e.keyCode === 191) {
  //     const { selectionStart, selectionEnd } = selectInfo;
  //     console.log("Command+/", selectionStart, selectionEnd);
  //   }
  // };

  // useEffect(() => {
  //   document.addEventListener("keydown", keyDownListen);
  //   return () => {
  //     document.removeEventListener("keydown", keyDownListen);
  //   };
  // }, [selectInfo]);

  const foucsSelectText = () => {
    if (sqlDom) {
      const { selectionStart, selectionEnd } = selectInfo;
      sqlDom.current?.setSelectionRange(selectionStart, selectionEnd);
    }
  };

  useImperativeHandle(ref, () => ({ foucsSelectText }), [selectInfo]);

  return (
    <div className="mt-3 relative">
      <Textarea
        ref={sqlDom}
        onSelect={(e) => {
          const { selectionStart, selectionEnd } = e.target as any;
          const selectSql = sql.substring(selectionStart, selectionEnd);
          if (selectSql) {
            props.onValueChange({
              sql: selectSql.replace("’", "'"),
              warn: !!sqlWarn,
            });
          } else {
            props.onValueChange({
              sql: sql.replace("’", "'"),
              warn: !!sqlWarn,
            });
          }
          setSelectInfo({ selectionStart, selectionEnd });
        }}
        onValueChange={sqlChange}
        isRequired
        labelPlacement="inside"
        label="sql语句"
        minRows={10}
        value={sql}
        isMultiline={true}
        isInvalid={sqlWarn.length > 0}
        errorMessage={sqlWarn}
        placeholder="Enter your sql"
        className="max-w"
      />
    </div>
  );
});
