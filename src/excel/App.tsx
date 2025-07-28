import { Card, CardBody, Tab, Tabs } from "@heroui/react";
import MergeExcel from "./MergeExcel";
import SpreadExcel from "./SpreadExcel";

function App() {
  return (
    <div className="flex w-full flex-col p-2">
      <Tabs aria-label="Options" isVertical={true}>
        <Tab key="merge" title="合并Excel">
          <Card>
            <CardBody>
              <MergeExcel />
            </CardBody>
          </Card>
        </Tab>
        <Tab key="spread" title="分割Excel">
          <Card>
            <CardBody>
              <SpreadExcel />
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

export default App;
