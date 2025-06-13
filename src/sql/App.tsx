import { Button, CardBody, Tabs, Tab, Card } from "@heroui/react";
import { fetch } from "@tauri-apps/plugin-http";
import { useRef, useState } from "react";
import md5 from "md5";
import { groupArray } from "@src/utils";
import ShowResult from "./components/ShowResult";
import ServerConfig from "./components/ServerConfig";
import SqlExec, { SqlRef } from "./components/SqlExec";
import { REQUESTINFO, SQL_STATE } from "@src/types";
import { setLable } from "@src/utils/ServerConfigUtil";

function App() {
  const [excuteList, setExcuteList] = useState<REQUESTINFO[]>([]);
  const [rt, setRt] = useState<
    Record<
      string,
      {
        baseInfo?: string;
        results?: Array<string>;
        error?: any;
      }
    >
  >({});
  const [sqlInfo, setSqlInfo] = useState<SQL_STATE>({ sql: "", warn: false });
  const [sqlExcuteLoading, setSqlExcuteLoading] = useState(false);
  const sqldom = useRef<SqlRef>(null);
  const excuteSql = () => {
    sqldom.current?.foucsSelectText();
    excuteList.map((it) => {
      return excuteDataBase(
        it.BASE_NAME,
        it.url,
        it.SQL_REQUEST_KEY,
        it.SQL_SIGN_SECRET
      );
    });
  };
  const setDatabase = (base: REQUESTINFO[]) => {
    if (base.length == 0) {
      setRt({});
    }
    setExcuteList(base);
  };
  const getSuccessRate = () => {
    let success = 0;
    let fail = 0;

    Object.keys(rt).forEach((k) => {
      if (rt[k].error) {
        fail += 1;
      } else {
        success += 1;
      }
    });
    return (
      <>
        <b className="text-green-800">{success}</b>/
        <b className="text-red-600">{fail}</b>
      </>
    );
  };
  const excuteDataBase = async (
    baseKey: string,
    url: string,
    SQL_REQUEST_KEY: string,
    SQL_SIGN_SECRET: string
  ) => {
    setSqlExcuteLoading(true);
    console.log(baseKey, url);
    const bd: Record<string, string> = {};
    const key = SQL_REQUEST_KEY;
    const timestamp = Date.now().toString();
    bd["key"] = key;
    bd["sql"] = sqlInfo.sql;
    bd["timestamp"] = timestamp;
    bd["sign"] = md5(md5(key + timestamp + SQL_SIGN_SECRET));

    fetch(url + "/execute-sql", {
      connectTimeout: 1000 * 10,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;charset=UTF-8",
      },
      body: JSON.stringify(bd),
    })
      .then((res) => res.text())
      .then((res: string) => {
        const [baseInfo, ...result] = res.split(";\n");

        const base = rt[baseKey];
        if (!base) {
          rt[baseKey] = {};
        }
        rt[baseKey].error = "";
        rt[baseKey].baseInfo = baseInfo;
        if (baseInfo) {
          let m = baseInfo.match(/app-code:(.*);app-name:(.*)/);
          if (m) {
            const [_, label_key, label_name] = m;
            setLable(label_key, label_name);
          }
        }
        rt[baseKey].results = groupArray(result).filter((it) => it);
        setRt({ ...rt });
      })
      .catch((e) => {
        const base = rt[baseKey];
        if (!base) {
          rt[baseKey] = {};
        }
        rt[baseKey].baseInfo = "";
        rt[baseKey].error = e;
        rt[baseKey].results = [];
        setRt({ ...rt });
      })
      .finally(() => setSqlExcuteLoading(false));
  };

  const sqlChange = (sqlInfo: SQL_STATE) => {
    setSqlInfo(sqlInfo);
  };

  return (
    <div className="relative">
      <Card>
        <CardBody>
          <div className="flex gap-1 items-center">
            <ServerConfig className="w-[500px]" selectBase={setDatabase} />
            <Button
              color={sqlInfo.warn ? "warning" : "primary"}
              isLoading={sqlExcuteLoading}
              onClick={excuteSql}
            >
              ► 执行sql
            </Button>
            {getSuccessRate()}
          </div>
          <SqlExec ref={sqldom} onValueChange={sqlChange} />
          <div className="flex w-full flex-col mt-2">
            <Tabs className="max-w-max">
              {excuteList.map((database) => {
                return (
                  <Tab
                    key={database.BASE_NAME}
                    title={
                      <b
                        className={
                          rt[database.BASE_NAME]?.error
                            ? "text-red-500"
                            : "text-green-700"
                        }
                      >
                        {database.BASE_NAME}
                      </b>
                    }
                  >
                    <Card>
                      <CardBody>
                        <div className="xl:min-h-[800px] sm:min-h-[300px]">
                          <ShowResult
                            key={database.BASE_NAME}
                            error={rt[database.BASE_NAME]?.error}
                            baseInfo={rt[database.BASE_NAME]?.baseInfo}
                            resultArray={rt[database.BASE_NAME]?.results}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  </Tab>
                );
              })}
            </Tabs>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default App;
