import Item from "./Item";
export default function App() {
  return (
    <div>
      <div className="flex flex-wrap gap-10 mt-10 justify-around ">
        {/* <Item id="esign" title="E签宝工具" /> */}
        <Item
          id="sql"
          title="Sql执行"
          desc={<p>商城、租机、Dc贷超 Sql执行页面</p>}
        />
        <Item
          id="deploy"
          title="oss部署工具"
          desc={<p>oss部署工具，用于多平台部署</p>}
        />
        <Item
          id="excel"
          title="excel工具"
          desc={<p>用于一些Excel数据表格合并、过滤</p>}
        />
        <Item
          id="translator"
          title="配置文件翻译"
          desc={<p>用于配置文件翻译</p>}
        />
      </div>
      <footer className="fixed bottom-0 text-center w-full">贝达🔧📦</footer>
    </div>
  );
}
