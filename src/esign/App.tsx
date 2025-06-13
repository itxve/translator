import esign from "@src/utils/esign";
import {
  Button,
  Card,
  CardBody,
  Input,
  Spinner,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";
import { useState } from "react";
import JsonViewer from "@src/components/JsonViewer";

function App() {
  const [server, setServer] = useState("http://47.110.35.200:8080");
  const [appId, setAppId] = useState("zuji");
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [disable, setDisable] = useState(false);
  const [msg, setMsg] = useState("");

  const [err, setErr] = useState({
    server: false,
    smsg: "",
    id: false,
    idmsg: "",
  });

  const loadConf = () => {
    if (server && appId) {
      setDisable(true);
      esign
        .loadConfig(server, appId)
        .then(() => {
          setErr({
            server: false,
            smsg: "",
            id: false,
            idmsg: "",
          });

          loadComponets();
        })
        .catch(({ status, error }) => {
          console.log(status, error);
          if (status == 404) {
            setErr({ ...err, id: true, idmsg: String(error) });
            setComponents([]);
          } else if (status == 500) {
            setErr({ ...err, server: true, smsg: String(error) });
            setComponents([]);
          }
        })
        .finally(() => setDisable(false));
    }
  };

  const loadComponets = () => {
    setLoading(true);
    esign
      .getComponentList("", "GET")
      .then((res) => {
        if (res.code == 0) {
          setComponents(
            res.data.components.filter(
              (c: any) => ~c.componentName.indexOf("签署区")
            )
          );
          setMsg("");
        } else {
          setMsg(res.message);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card>
      <CardBody>
        <div className="flex w-full flex-wrap md:flex-nowrap gap-4 items-center">
          <Input
            variant="bordered"
            label="apllo地址"
            value={server}
            readOnly={disable}
            endContent={disable ? <Spinner size="sm" /> : <></>}
            isInvalid={err.server}
            errorMessage={err.smsg}
            autoComplete="off"
            onChange={(e) => {
              setServer(e.target.value);
            }}
          />
          <Input
            variant="bordered"
            label="appId"
            value={appId}
            readOnly={disable}
            isInvalid={err.id}
            errorMessage={err.idmsg}
            endContent={disable ? <Spinner size="sm" /> : <></>}
            onChange={(e) => {
              setAppId(e.target.value);
            }}
          />
          <div>
            <Button color="primary" isLoading={loading} onClick={loadConf}>
              获取签署区信息
            </Button>
          </div>
        </div>
        {msg && <b className="text-red-600">{msg}</b>}
        <Tabs title="Components" className="max-w-max max-h-max mt-2">
          {components.map((c: any) => (
            <Tab key={c.componentId} title={<b>{c.componentName}</b>}>
              <Card>
                <CardBody>
                  <Textarea
                    minRows={15}
                    maxRows={30}
                    readOnly
                    value={JSON.stringify(c, null, 2)}
                  ></Textarea>
                </CardBody>
              </Card>
            </Tab>
          ))}
        </Tabs>
        <details>
          <summary className="cursor-pointer">展开配置</summary>
          <JsonViewer data={esign.config} />
        </details>
      </CardBody>
    </Card>
  );
}

export default App;
