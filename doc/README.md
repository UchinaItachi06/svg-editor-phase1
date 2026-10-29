# Lab1 Phase 1：SVG 命令行编辑器

## 架构方案（初版）

TypeScript 面向对象实现。model 管理文档树及几何行为；commands 封装编辑操作；application 协调事务与历史；cli 解析输入和显示结果；infrastructure 处理 SVG 和文件。入口负责组装，model 不依赖终端、文件或命令。

Command 支持编辑和撤销，Composite 统一容器与叶子。命令分发和图形工厂是仅有的按名字分派位置，作为后续注册机制的待重构项。

开发按骨架、模型、命令和历史、SVG 与 CLI、验收和文档逐步提交。
