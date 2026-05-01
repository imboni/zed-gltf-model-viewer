# Contributing

Thanks for improving glTF Model Viewer for Zed.

## Development

Use Node.js 20 or newer and Rust 1.76 for the current pinned Zed extension API.

```sh
cargo check

cd viewer
npm install
npm run build
```

To run the sample viewer:

```sh
cd viewer
npm run dev -- --root .. --model sample-models/triangle.gltf
```

## Pull Requests

- Keep changes focused and documented.
- Run `cargo check` and `npm run build` before opening a pull request.
- Do not commit generated folders such as `target/`, `viewer/node_modules/`, or `viewer/dist/`.
- Note any Zed API assumptions in the pull request body.

