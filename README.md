# SVG Editor · Lab1 Phase 1

TypeScript 面向对象命令行 SVG 编辑器，支持六种图形、容器树、编辑、撤销重做与 SVG 文件读写。

## 快速启动

环境要求：Node.js 24 或更高版本，npm。已在 Node.js 24.19.0 验证。

在项目目录打开终端：

```text
npm ci
npm run cli
```

本地交付目录已安装依赖，可直接双击 Windows 的 **start-editor.cmd**，或运行第二条命令。ZIP 解压后的项目先执行 npm ci。

输入以下命令试用：

```text
init 800 600
create g node
create rect r 100 100 160 60 #4a90d9 in node
create text title 135 135 "开始" in node
move node 50 0
undo
tree
save demo.svg
```

把 demo.svg 拖入浏览器即可预览。help 显示全部命令。交互模式显示 svg>；Ctrl+C 或 Ctrl+D 退出。输入重定向时不打印提示符或启动横幅；遇到错误继续读后续行，但进程最终返回非零退出码。

## 验证与示例

```text
npm run check
```

包含 TypeScript 严格检查、代码格式检查和 61 项自动测试。测试过程中使用临时目录，不需要远程服务。

Windows PowerShell 回放示例：

```powershell
Get-Content -Encoding utf8 examples/flowchart.commands | npm.cmd run cli
```

macOS / Linux：

```sh
npm run cli < examples/flowchart.commands
```

- [生成的 SVG](examples/flowchart.svg)
- [浏览器渲染预览](examples/flowchart-preview.png)
- [示例运行记录](doc/validation/flowchart-transcript.txt)
- [测试原始报告](doc/validation/tests.tap)
- [作业文档：架构、协作过程、一致性与质量保证](doc/README.md)
- [关键代码导读](doc/代码导读.md)
- [提交前核对](doc/提交核对.md)
- [学生手动验收原始输出](doc/validation/student-cli-transcript.txt)

## 范围说明

实现 rect / circle / ellipse / line / text / g。box 和插件加载属于后续阶段，当前 create box 按要求报未知类型。

SVG 读入支持上述六种元素、嵌套、公共样式以及常用文字展示属性。它是课程指定子集的编辑器。transform、path、复杂 CSS、tspan、非标准 viewBox 等未支持内容会报错；读取失败不会替换当前文档。详细规则见作业文档。

## Git 与远程提交

远程仓库：[UchinaItachi06/svg-editor-phase1](https://github.com/UchinaItachi06/svg-editor-phase1)，私有仓库。main 保留分阶段开发历史及 GitHub 初始化提交；final 标签指向最终交付版本。

本地开发采用 SVG Lab Development / svg-lab@localhost 作为项目作者标识，不代表真实个人邮箱。没有伪造提交时间。GitHub 新仓库的初始化 README 与完整项目说明发生新增冲突，合并后保留本说明；原初始化提交仍可在 Git 历史中查阅。

核对远程分支和标签：

```text
git remote -v
git ls-remote origin refs/heads/main refs/tags/final
```

新电脑上获取项目：

```text
git clone https://github.com/UchinaItachi06/svg-editor-phase1.git
cd svg-editor-phase1
npm ci
npm run check
```

私有仓库需要有权限的 GitHub 账号。课程材料没有具体截止时间，仍需核对课程平台，并按老师要求提供仓库访问权限。

## 项目内容

src/ 是程序；test/ 是自动测试；examples/ 是回放和 SVG；doc/ 是作业文档；package-lock.json 固定依赖版本。ZIP 附带 Git bundle，可恢复全部历史；本地交付目录自身已有 .git。
