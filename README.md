# glTF

glTF language support for Zed.

## Features

- Recognizes `.gltf` files as glTF assets.
- Uses the JSON tree-sitter grammar for correct parsing and bracket behavior.
- Highlights common glTF 2.0 top-level and nested properties.
- Includes a valid sample glTF fixture for extension checks.

Binary `.glb` files are out of scope for this text-language extension because they are not JSON documents.

## Development

To develop this extension, see the [Developing Extensions](https://zed.dev/docs/extensions/developing-extensions) section of the Zed docs.

Run local checks:

```sh
git diff --check
node -e "JSON.parse(require('fs').readFileSync('fixtures/triangle.gltf', 'utf8'))"
```

## License

[MIT](LICENSE)
