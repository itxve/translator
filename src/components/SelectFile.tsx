import { Button } from "@heroui/react";
import * as dialog from "@tauri-apps/plugin-dialog";

export default function SelectFile(
  props: dialog.OpenDialogOptions & { onFileSelect: (filePath: string) => void }
) {
  const fileSelect = async () => {
    let selectPathObject: any = await dialog.open({
      multiple: false,
      directory: false,
      ...props,
    });
    props.onFileSelect(selectPathObject.path);
  };

  return (
    <Button color={"primary"} variant="faded" onPress={fileSelect}>
      {props.title}
    </Button>
  );
}
