# Contributing

Thanks for improving the glTF extension for Zed.

## Development

This is a language extension. Keep changes within the extension surfaces supported by Zed's official registry.

Before opening a pull request, run:

```sh
git diff --check
node -e "JSON.parse(require('fs').readFileSync('fixtures/triangle.gltf', 'utf8'))"
```
