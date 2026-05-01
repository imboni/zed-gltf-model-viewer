<div align="center">

# glTF Model Viewer for Zed

面向 Zed 工作区的深色 GLB/glTF 模型预览工具。

<p>
  <a href="README.md">English</a>
  ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <a href="https://github.com/imboni/zed-gltf-model-viewer/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/imboni/zed-gltf-model-viewer/actions/workflows/ci.yml/badge.svg"></a>
</p>

</div>

## 项目简介

glTF Model Viewer for Zed 用于在代码工作区中浏览和检查 `.glb`、`.gltf` 模型文件。项目包含一个轻量的 Zed 扩展壳，以及一个基于 Three.js 的本地伴随预览器，界面采用适合编辑器场景的深色设计。

Zed 扩展目前还没有开放 WebView 或自定义编辑器视图 API，因此 3D 视图暂时以本地伴随预览器的方式运行，而不是直接嵌入 Zed 编辑器面板。预览器代码已经按独立模块组织，后续如果 Zed 提供原生自定义视图能力，可以迁移到 Zed 内部面板。

## 功能特性

- 扫描工作区中的 `.glb` 和 `.gltf` 模型文件
- 从指定工作区根目录提供 glTF 关联资源
- 支持轨道旋转、平移、缩放、重置视角和适配模型大小
- 支持网格、坐标轴、线框和自动旋转开关
- 展示格式、文件大小、网格数、材质数、顶点数、三角面数和尺寸信息
- 模型包含动画时，可选择并播放动画片段
- 支持拖拽加载本地 GLB/glTF 文件
- 支持导出当前画布截图
- 提供 Zed slash command：`/model-preview`
- 提供 Zed task 示例，便于在 Zed 中启动预览器

## 快速开始

```sh
git clone https://github.com/imboni/zed-gltf-model-viewer.git
cd zed-gltf-model-viewer/viewer
npm install
npm run dev -- --root .. --model sample-models/triangle.gltf
```

启动后，打开终端输出的本地地址即可查看示例模型。

## 使用方法

预览其他项目中的所有 GLB/glTF 文件：

```sh
cd viewer
npm run dev -- --root /path/to/project
```

启动时直接打开指定模型：

```sh
npm run dev -- --root /path/to/project --model assets/model.glb --open
```

### 命令参数

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `--root` | 要扫描并提供资源的工作区根目录 | 当前目录 |
| `--model` | 相对于 `--root` 的初始模型路径 | 无 |
| `--port` | 本地服务端口 | `4177` |
| `--host` | 本地服务地址 | `127.0.0.1` |
| `--open` | 启动后自动打开默认浏览器 | 关闭 |

## Zed 集成

把本仓库作为 Zed dev extension 加载：

1. 打开 Zed。
2. 执行 `zed: extensions`。
3. 选择 dev extension 加载方式。
4. 选择本仓库目录。
5. 在 Zed Assistant 中执行 `/model-preview`，获取当前 worktree 的启动命令。

如需在其他项目中通过 Zed task 启动预览器，可以把 `examples/zed-tasks.json` 复制到目标项目的 `.zed/tasks.json`，并把 `<absolute-path-to-this-repo>` 替换成本仓库的绝对路径。

本仓库自带 `.zed/tasks.json`，包含：

- `Run sample model viewer`
- `Build model viewer`
- `Check Zed extension`

## 开发

环境要求：

- Node.js 20 或更新版本
- Rust 1.76，当前固定使用 `zed_extension_api = "0.1.0"`

检查命令：

```sh
cargo check --locked

cd viewer
npm install
npm run build
```

锁文件会提交到仓库中：

- `Cargo.lock`：锁定兼容 Rust 1.76 的 Rust 依赖版本
- `viewer/package-lock.json`：锁定前端依赖版本

## 项目结构

```text
.
├── extension.toml              # Zed 扩展清单
├── src/lib.rs                  # Zed slash command 扩展壳
├── viewer/                     # Three.js 伴随预览器
│   ├── scripts/dev-server.mjs  # 模型扫描和本地资源服务
│   └── src/                    # 预览器前端代码
├── examples/zed-tasks.json     # 可复制到其他项目的 Zed task 示例
├── sample-models/triangle.gltf # 最小示例模型
└── .zed/tasks.json             # 本项目开发用 Zed task
```

## 路线图

- 等 Zed 提供受支持的自定义视图 API 后，将预览器迁移到原生 Zed 面板。
- 增加可选的模型环境光照预设。
- 增加更完整的材质和贴图信息检查。
- 为常用视图操作增加快捷键。

## 贡献

欢迎提交改进。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，保持变更聚焦，并在提交 pull request 前运行检查命令。

## 许可证

[MIT](LICENSE)
