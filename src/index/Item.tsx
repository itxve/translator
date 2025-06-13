import { Card, CardBody, Link, CardHeader } from "@heroui/react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
export default function App(props: {
  id: string;
  title: string;
  desc?: JSX.Element;
}) {
  console.log("props::", props);

  const openPage = (key: string, title: string) => {
    new WebviewWindow(key, {
      url: key + ".html",
      title,
      x: 30,
      y: 30,
      width: 1200,
      height: 600,
      // closable: false,
      // maximizable: false,
      // minimizable: false,
      // skipTaskbar: true,
      // transparent: true,
      // decorations: false,
    });
  };
  return (
    <Card className="w-[350px]">
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600">
              {props.title}
            </h4>
          </div>
        </div>
        <Link
          isBlock
          showAnchorIcon
          color="primary"
          href="#"
          onClick={() => openPage(props.id, props.title)}
        >
          打开
        </Link>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-default-400 m-8">
        {props.desc}
      </CardBody>
    </Card>
  );
}
