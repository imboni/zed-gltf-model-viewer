# glTF Model Viewer for Zed

[中文说明](README.zh-CN.md)

A Zed extension helper plus a dark companion viewer for browsing and previewing `.glb` and `.gltf` files from a code worktree.

> Current Zed extensions do not expose a WebView or custom editor-view API. This project therefore ships a Zed extension shell and a local Three.js companion viewer. When Zed exposes native custom views, the viewer code can be moved into an in-editor panel.

## Features

- Workspace scanner for `.glb` and `.gltf` files
- Local asset server for glTF buffers, images, Draco assets, and related files
- Dark Zed-friendly interface with model browser, viewport, toolbar, and inspector
- Orbit, pan, zoom, reset, and fit-to-model controls
- Grid, axes, wireframe, and auto-rotate toggles
- Animation clip selection and playback
- Mesh, material, vertex, triangle, size, dimension, and format metadata
- Drag-and-drop loading for local GLB/glTF files
- Canvas screenshot export
- Zed slash command helper: `/model-preview`
- Example Zed tasks for launching the companion viewer

## Quick Start

```sh
git clone https://github.com/imboni/zed-gltf-model-viewer.git
cd zed-gltf-model-viewer/viewer
npm install
npm run dev -- --root .. --model sample-models/triangle.gltf
```

Open the URL printed by the server.

To preview models from another project:

```sh
cd viewer
npm run dev -- --root /path/to/project
```

To load a specific model first:

```sh
npm run dev -- --root /path/to/project --model assets/model.glb --open
```

## Zed Usage

Install this repository as a Zed dev extension:

1. Open Zed.
2. Run `zed: extensions`.
3. Choose the dev-extension flow and select this repository folder.
4. Run `/model-preview` from Zed Assistant to get a launch command for the active worktree.

You can also copy `examples/zed-tasks.json` into another project's `.zed/tasks.json` and replace `<absolute-path-to-this-repo>` with this repository path.

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
cargo check

cd viewer
npm install
npm run build
```

The lockfiles are intentionally committed:

- `Cargo.lock` keeps the Rust 1.76-compatible transitive dependency set.
- `viewer/package-lock.json` keeps the viewer dependency graph reproducible.

## Repository Layout

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

## Publishing to Zed Extensions

Zed extension registry entries are submitted to `zed-industries/extensions` as submodules. The extension ID is `gltf-model-viewer`; do not rename it after publication.

Because this project depends on a companion viewer until Zed exposes native WebView/custom editor support, describe it as a launcher/helper extension when submitting it for review.

## License

MIT
