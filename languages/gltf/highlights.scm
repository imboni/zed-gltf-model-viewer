(pair
  key: (string (string_content) @property))

(pair
  key: (string (string_content) @keyword)
  (#any-of? @keyword
    "accessors"
    "animations"
    "asset"
    "bufferViews"
    "buffers"
    "cameras"
    "extensions"
    "extensionsRequired"
    "extensionsUsed"
    "images"
    "materials"
    "meshes"
    "nodes"
    "samplers"
    "scene"
    "scenes"
    "skins"
    "textures"))

(pair
  key: (string (string_content) @property.special)
  (#any-of? @property.special
    "POSITION"
    "NORMAL"
    "TANGENT"
    "TEXCOORD_0"
    "TEXCOORD_1"
    "COLOR_0"
    "JOINTS_0"
    "WEIGHTS_0"))

(string (string_content) @string)
(escape_sequence) @string.escape
(number) @number
[(true) (false)] @boolean
(null) @constant

[
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

[
  ","
  ":"
] @punctuation.delimiter
