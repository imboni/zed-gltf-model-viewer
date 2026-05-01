import childProcess from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewerRoot = path.resolve(__dirname, "..");
const ignoredDirectories = new Set([
  ".git",
  ".hg",
  ".svn",
  ".zed",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "target",
  ".next",
  ".nuxt",
  ".vite"
]);

const mimeTypes = new Map([
  [".bin", "application/octet-stream"],
  [".glb", "model/gltf-binary"],
  [".gltf", "model/gltf+json"],
  [".hdr", "application/octet-stream"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".ktx2", "image/ktx2"],
  [".png", "image/png"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"]
]);

const options = parseArgs(process.argv.slice(2));
const root = path.resolve(options.root ?? process.cwd());
const host = options.host ?? "127.0.0.1";
const port = Number(options.port ?? 4177);
const initialModel = options.model ? normalizeModelPath(options.model, root) : null;

const vite = await createViteServer({
  root: viewerRoot,
  appType: "spa",
  server: {
    middlewareMode: true
  }
});

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (url.pathname === "/api/config") {
      sendJson(response, { root, initialModel });
      return;
    }

    if (url.pathname === "/api/models") {
      sendJson(response, await scanModels(root));
      return;
    }

    if (url.pathname.startsWith("/asset/")) {
      await serveFile(response, root, decodeURIComponent(url.pathname.slice("/asset/".length)));
      return;
    }

    if (url.pathname.startsWith("/draco/")) {
      const decoderRoot = path.join(viewerRoot, "node_modules", "three", "examples", "jsm", "libs", "draco");
      await serveFile(response, decoderRoot, decodeURIComponent(url.pathname.slice("/draco/".length)));
      return;
    }

    vite.middlewares(request, response, () => {
      response.statusCode = 404;
      response.end("Not found");
    });
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end(error instanceof Error ? error.message : String(error));
  }
});

server.listen(port, host, () => {
  const modelQuery = initialModel ? `?model=${encodeURIComponent(initialModel)}` : "";
  const url = `http://${host}:${port}/${modelQuery}`;
  console.log(`glTF Model Viewer`);
  console.log(`Root: ${root}`);
  console.log(`URL:  ${url}`);

  if (options.open) {
    openUrl(url);
  }
});

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--open") {
      parsed.open = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

function normalizeModelPath(modelPath, rootPath) {
  const absolute = path.isAbsolute(modelPath) ? path.resolve(modelPath) : path.resolve(rootPath, modelPath);
  ensureInside(rootPath, absolute);
  return toPosix(path.relative(rootPath, absolute));
}

async function scanModels(rootPath) {
  const models = [];
  const stack = [{ directory: rootPath, depth: 0 }];
  const maxDepth = 16;
  const maxEntries = 50000;
  let visited = 0;

  while (stack.length > 0) {
    const { directory, depth } = stack.pop();
    if (!directory || depth > maxDepth || visited > maxEntries) {
      continue;
    }

    let entries;
    try {
      entries = await fs.promises.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      visited += 1;
      if (visited > maxEntries) {
        break;
      }

      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          stack.push({ directory: absolute, depth: depth + 1 });
        }
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (ext !== ".glb" && ext !== ".gltf") {
        continue;
      }

      const stat = await fs.promises.stat(absolute);
      models.push({
        path: toPosix(path.relative(rootPath, absolute)),
        name: entry.name,
        ext: ext.slice(1),
        size: stat.size,
        modified: stat.mtimeMs
      });
    }
  }

  models.sort((a, b) => a.path.localeCompare(b.path));
  return { root: rootPath, models };
}

async function serveFile(response, baseDirectory, relativePath) {
  const absolute = path.resolve(baseDirectory, relativePath);
  ensureInside(baseDirectory, absolute);

  let stat;
  try {
    stat = await fs.promises.stat(absolute);
  } catch {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  if (!stat.isFile()) {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Length", stat.size);
  response.setHeader("Content-Type", mimeTypes.get(path.extname(absolute).toLowerCase()) ?? "application/octet-stream");
  fs.createReadStream(absolute).pipe(response);
}

function ensureInside(baseDirectory, candidate) {
  const relative = path.relative(path.resolve(baseDirectory), path.resolve(candidate));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Requested file is outside the configured root");
  }
}

function sendJson(response, body) {
  response.statusCode = 200;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function openUrl(url) {
  const command = os.platform() === "darwin" ? "open" : os.platform() === "win32" ? "cmd" : "xdg-open";
  const args = os.platform() === "win32" ? ["/c", "start", "", url] : [url];
  const child = childProcess.spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

