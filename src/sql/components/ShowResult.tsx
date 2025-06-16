import { Tab, Tabs, Card, CardBody } from "@heroui/react";
import moment from "moment-timezone";
import JsonViewer from "@src/components/JsonViewer";
import { DateFormatConfig } from "@src/utils/LocalConfigUtil";

export default function ShowSql(props: {
  baseInfo?: string;
  error?: any;
  resultArray?: Array<string>;
}) {
  const { error, baseInfo, resultArray } = props;
  const renderTitle = (rtstr: string, index: number, arr: Array<string>) => {
    if (~rtstr.indexOf("affected rows: ")) {
      return <span className="text-green-500">{rtstr}</span>;
    }
    if (~rtstr.indexOf("illegal sql: ")) {
      return <span className="text-red-600">{rtstr}</span>;
    }
  };

  const renderReustlt = (rtstr: string, index: number) => {
    const jsonArr = JSON.parse(rtstr.replace("execute result: ", ""));
    return (
      <div>
        <JsonViewer
          key={`${baseInfo}`}
          data={JSON.parse(
            JSON.stringify(
              jsonArr,
              function replacer(key, value) {
                console.log(key);

                let config = DateFormatConfig();
                let boolResult = config?.cloums.some((item) => {
                  if (~item.indexOf("*")) {
                    return ~key.indexOf(item.replace("*", ""));
                  } else {
                    return key === item;
                  }
                });

                if (boolResult && typeof value === "number" && value > 0) {
                  return moment(value).format(config.pattern);
                }
                return value;
              },
              2
            )
          )}
        />
      </div>
    );
  };

  return (
    <div>
      {error ? <span className="text-red-600">{error}</span> : ""}
      <b className="text-blue-600"> {baseInfo}</b>
      {resultArray ? (
        <div>
          {resultArray?.map((v, i) => {
            return (
              <div className="mt-5" key={"result" + i}>
                {renderTitle(v, i, resultArray)}
              </div>
            );
          })}
          <Tabs title="执行结果" className="max-w-max max-h-max">
            {resultArray
              .filter(
                (rtstr, index) =>
                  index % 2 == 1 && ~rtstr.indexOf("execute result: ")
              )
              .map((rtstr: string, index: number) => {
                return (
                  <Tab
                    key={`结果:${index + 1}`}
                    title={<b>{`结果:${index + 1}`}</b>}
                  >
                    <Card>
                      <CardBody>{renderReustlt(rtstr, index)}</CardBody>
                    </Card>
                  </Tab>
                );
              })}
          </Tabs>
        </div>
      ) : (
        <span>empty</span>
      )}
    </div>
  );
}
