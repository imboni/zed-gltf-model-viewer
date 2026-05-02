<div align="center">

# 3D Model Viewer for Zed

Dark 3D model previewing for Zed worktrees.

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

## Overview

3D Model Viewer for Zed helps you browse and inspect 3D model files from a code workspace. It currently supports `.glb` and `.gltf`, and includes a lightweight Zed extension shell plus a local Three.js companion viewer with a dark, Zed-friendly interface.

Zed extensions do not currently expose a WebView or custom editor-view API, so the 3D viewport runs as a local companion viewer instead of an embedded editor pane. The viewer is structured so it can be moved into a native Zed view if that API becomes available.

## Features

- Scan a workspace for supported 3D model files
- Serve related glTF assets from the selected workspace root
- Preview models with orbit, pan, zoom, reset, and fit-to-model controls
- Toggle grid, axes, wireframe, and auto-rotate modes
- Inspect format, file size, mesh count, material count, vertices, triangles, and dimensions
- Select and play animation clips when the model includes animations
- Drag and drop local 3D model files into the viewer
- Export a screenshot of the current canvas
- Launch helper instructions from Zed with `/model-preview`
- Run bundled Zed tasks for local development and sample previewing

## Quick Start

```sh
git clone https://github.com/imboni/zed-gltf-model-viewer.git
cd zed-gltf-model-viewer/viewer
npm install
npm run dev -- --root .. --model sample-models/triangle.gltf
```

Open the URL printed by the dev server.

## Usage

Preview all supported 3D model files in another project:

```sh
cd viewer
npm run dev -- --root /path/to/project
```

Open a specific model on startup:

```sh
npm run dev -- --root /path/to/project --model assets/model.glb --open
```

### CLI Options

| Option | Description | Default |
| --- | --- | --- |
| `--root` | Workspace root to scan and serve assets from | current directory |
| `--model` | Initial model path relative to `--root` | none |
| `--port` | Local server port | `4177` |
| `--host` | Local server host | `127.0.0.1` |
| `--open` | Open the viewer in the default browser | disabled |

## Zed Integration

Install this repository as a Zed dev extension:

1. Open Zed.
2. Run `zed: extensions`.
3. Choose the dev-extension flow.
4. Select this repository folder.
5. Run `/model-preview` from Zed Assistant to get a launch command for the active worktree.

For project-level tasks, copy `examples/zed-tasks.json` into another project's `.zed/tasks.json` and replace `<absolute-path-to-this-repo>` with this repository path.

This repository also includes local tasks in `.zed/tasks.json`:

- `Run sample model viewer`
- `Build model viewer`
- `Check Zed extension`

## Development

Requirements:

- Node.js 20 or newer
- Rust 1.76 for the currently pinned `zed_extension_api = "0.1.0"`

Run checks:

```sh
cargo check --locked

cd viewer
npm install
npm run build
```

The lockfiles are intentionally committed:

- `Cargo.lock` keeps the Rust dependency set compatible with Rust 1.76.
- `viewer/package-lock.json` keeps the viewer dependency graph reproducible.

## Project Structure

```text
.
├── extension.toml              # Zed extension manifest
├── src/lib.rs                  # Zed slash command extension shell
├── viewer/                     # Three.js companion viewer
│   ├── scripts/dev-server.mjs  # model scanner and local asset server
│   └── src/                    # viewer application
├── examples/zed-tasks.json     # task template for other projects
├── sample-models/triangle.gltf # small sample model
└── .zed/tasks.json             # local development tasks
```

## Roadmap

- Move the viewer into a native Zed panel when Zed exposes a supported custom-view API.
- Add optional model environment presets.
- Add richer material and texture inspection.
- Add keyboard shortcuts for common viewport actions.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), keep changes focused, and run the checks before opening a pull request.

## License

[MIT](LICENSE)
