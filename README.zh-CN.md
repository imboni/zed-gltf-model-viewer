# glTF Model Viewer for Zed

[English](README.md)

这是一个面向 Zed 编辑器的 glTF/GLB 模型预览辅助扩展，包含 Zed extension 壳和一个深色风格的 Three.js 本地伴随预览器。它可以扫描代码目录中的 `.glb` 和 `.gltf` 文件，并提供可交互的 3D 模型查看界面。

> 说明：Zed 当前还没有开放 WebView 或自定义编辑器视图 API，因此暂时无法把 3D 画布真正嵌入 Zed 编辑器面板。本项目采用“Zed 扩展辅助命令 + 本地伴随预览器”的方式实现。等 Zed 开放原生自定义视图后，`viewer/` 中的代码可以迁移到 Zed 内部面板。

## 功能

- 扫描工作目录中的 `.glb` 和 `.gltf` 模型文件
- 本地资源服务，支持 glTF 关联的 buffer、图片、Draco 等资源
- 深色系、接近 Zed 使用场景的界面
- 左侧模型列表、中间 3D 视图、右侧模型信息面板
- 轨道旋转、平移、缩放、重置视角、适配模型大小
- 网格、坐标轴、线框、自动旋转开关
- 动画片段选择和播放
- 模型格式、大小、网格数、材质数、顶点数、三角面数、尺寸信息
- 支持拖拽加载本地 GLB/glTF 文件
- 支持导出当前画布截图
- Zed slash command：`/model-preview`
- 提供 Zed task 示例，方便从 Zed 启动预览器

## 快速开始

```sh
git clone https://github.com/imboni/zed-gltf-model-viewer.git
cd zed-gltf-model-viewer/viewer
npm install
npm run dev -- --root .. --model sample-models/triangle.gltf
```

命令启动后，打开终端中输出的本地地址即可查看示例模型。

预览其他项目中的模型：

```sh
cd viewer
npm run dev -- --root /path/to/project
```

启动时直接打开指定模型：

```sh
npm run dev -- --root /path/to/project --model assets/model.glb --open
```

参数说明：

- `--root`：要扫描的项目根目录
- `--model`：相对于 `--root` 的模型路径，可选
- `--open`：启动后自动打开浏览器，可选
- `--port`：自定义端口，默认 `4177`

## 在 Zed 中使用

把本仓库作为 Zed dev extension 加载：

1. 打开 Zed。
2. 执行 `zed: extensions`。
3. 选择 dev extension 加载方式，并选择本仓库目录。
4. 在 Zed Assistant 中执行 `/model-preview`，它会根据当前 worktree 输出启动命令。

也可以把 `examples/zed-tasks.json` 复制到目标项目的 `.zed/tasks.json`，并把 `<absolute-path-to-this-repo>` 替换成本仓库的绝对路径。之后就可以在 Zed 任务中启动模型预览。

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
cargo check

cd viewer
npm install
npm run build
```

锁文件会提交到仓库中：

- `Cargo.lock`：锁定兼容 Rust 1.76 的 Rust 依赖版本
- `viewer/package-lock.json`：锁定前端依赖版本

## 目录结构

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

## 上架 Zed Extensions

Zed 官方扩展市场通过 `zed-industries/extensions` 仓库提交扩展条目。该仓库会把扩展作为 submodule 引入。

本项目的 extension ID 是 `gltf-model-viewer`，发布后不要再修改。

由于当前实现依赖伴随预览器，在提交审核时建议描述为 “GLB/glTF companion viewer launcher/helper”，不要描述成已经原生嵌入 Zed 的 WebView 面板。

## 许可证

MIT

