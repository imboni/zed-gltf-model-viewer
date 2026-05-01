import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type ModelFile = {
  path: string;
  name: string;
  ext: "glb" | "gltf";
  size: number;
  modified: number;
};

type ScanResponse = {
  root: string;
  models: ModelFile[];
};

type ViewerConfig = {
  root: string;
  initialModel: string | null;
};

type ModelStats = {
  meshes: number;
  materials: number;
  vertices: number;
  triangles: number;
  dimensions: THREE.Vector3;
};

const canvas = getElement<HTMLCanvasElement>("viewportCanvas");
const modelList = getElement<HTMLDivElement>("modelList");
const modelCount = getElement<HTMLSpanElement>("modelCount");
const searchInput = getElement<HTMLInputElement>("searchInput");
const dropZone = getElement<HTMLButtonElement>("dropZone");
const fileInput = getElement<HTMLInputElement>("fileInput");
const modelName = getElement<HTMLHeadingElement>("modelName");
const modelPath = getElement<HTMLParagraphElement>("modelPath");
const emptyState = getElement<HTMLDivElement>("emptyState");
const loadingState = getElement<HTMLDivElement>("loadingState");
const loadingText = getElement<HTMLSpanElement>("loadingText");
const rootLabel = getElement<HTMLSpanElement>("rootLabel");
const statusLabel = getElement<HTMLSpanElement>("statusLabel");
const formatValue = getElement<HTMLElement>("formatValue");
const fileSizeValue = getElement<HTMLElement>("fileSizeValue");
const meshValue = getElement<HTMLElement>("meshValue");
const materialValue = getElement<HTMLElement>("materialValue");
const vertexValue = getElement<HTMLElement>("vertexValue");
const triangleValue = getElement<HTMLElement>("triangleValue");
const dimensionValue = getElement<HTMLElement>("dimensionValue");
const animationSelect = getElement<HTMLSelectElement>("animationSelect");
const playButton = getElement<HTMLButtonElement>("playButton");
const fitButton = getElement<HTMLButtonElement>("fitButton");
const resetButton = getElement<HTMLButtonElement>("resetButton");
const screenshotButton = getElement<HTMLButtonElement>("screenshotButton");
const gridToggle = getElement<HTMLInputElement>("gridToggle");
const axesToggle = getElement<HTMLInputElement>("axesToggle");
const wireToggle = getElement<HTMLInputElement>("wireToggle");
const rotateToggle = getElement<HTMLInputElement>("rotateToggle");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10131a);

const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10000);
camera.position.set(3, 2.2, 4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = true;
controls.target.set(0, 0.35, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const grid = new THREE.GridHelper(10, 20, 0x3a4151, 0x252a35);
grid.position.y = -0.01;
scene.add(grid);

const axes = new THREE.AxesHelper(1.6);
scene.add(axes);

scene.add(new THREE.HemisphereLight(0xe8f3ff, 0x202633, 1.8));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
keyLight.position.set(4, 5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x9db8ff, 0.7);
fillLight.position.set(-3, 2, -4);
scene.add(fillLight);

const clock = new THREE.Clock();
const loader = createLoader();
const uploadedObjectUrls = new Set<string>();

let models: ModelFile[] = [];
let selectedPath: string | null = null;
let currentModel: THREE.Object3D | null = null;
let currentFile: ModelFile | null = null;
let currentStats: ModelStats | null = null;
let mixer: THREE.AnimationMixer | null = null;
let clips: THREE.AnimationClip[] = [];
let action: THREE.AnimationAction | null = null;
let playing = false;

void initialize();
animate();

async function initialize() {
  const [config, scan] = await Promise.all([
    fetchJson<ViewerConfig>("/api/config"),
    fetchJson<ScanResponse>("/api/models")
  ]);

  rootLabel.textContent = compactPath(config.root);
  models = scan.models;
  renderModelList();

  const urlModel = new URLSearchParams(window.location.search).get("model");
  const initialModel = urlModel ?? config.initialModel;
  if (initialModel) {
    await loadWorkspaceModel(initialModel);
  } else if (models.length > 0) {
    setStatus("Workspace models found");
  } else {
    setStatus("No GLB/glTF files found");
  }
}

function createLoader(manager = THREE.DefaultLoadingManager) {
  const gltfLoader = new GLTFLoader(manager);
  const draco = new DRACOLoader(manager);
  draco.setDecoderPath("/draco/");
  gltfLoader.setDRACOLoader(draco);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  return gltfLoader;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function renderModelList() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = models.filter((model) => model.path.toLowerCase().includes(query));
  modelCount.textContent = String(filtered.length);
  modelList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list-empty";
    empty.textContent = "No matching models";
    modelList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const model of filtered) {
    const item = document.createElement("button");
    item.className = "model-item";
    item.type = "button";
    item.dataset.path = model.path;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(model.path === selectedPath));
    item.innerHTML = `
      <span class="file-badge">${model.ext.toUpperCase()}</span>
      <span class="file-main">
        <strong>${escapeHtml(model.name)}</strong>
        <span>${escapeHtml(parentPath(model.path))}</span>
      </span>
      <span class="file-size">${formatBytes(model.size)}</span>
    `;
    item.addEventListener("click", () => {
      void loadWorkspaceModel(model.path);
    });
    fragment.append(item);
  }

  modelList.append(fragment);
}

async function loadWorkspaceModel(path: string) {
  const model = models.find((candidate) => candidate.path === path) ?? {
    path,
    name: path.split("/").pop() ?? path,
    ext: path.toLowerCase().endsWith(".glb") ? "glb" : "gltf",
    size: 0,
    modified: 0
  };

  currentFile = model;
  selectedPath = model.path;
  renderModelList();
  await loadModel(assetUrl(model.path), model.name, model.path, model);
}

async function loadDroppedFiles(fileList: FileList) {
  const files = Array.from(fileList);
  const model = files.find((file) => /\.(glb|gltf)$/i.test(file.name));
  if (!model) {
    setStatus("No GLB/glTF file in selection");
    return;
  }

  releaseUploadedUrls();
  const manager = new THREE.LoadingManager();
  const fileUrls = new Map<string, string>();
  for (const file of files) {
    const objectUrl = URL.createObjectURL(file);
    uploadedObjectUrls.add(objectUrl);
    const relativePath = "webkitRelativePath" in file ? String(file.webkitRelativePath) : "";
    fileUrls.set(file.name, objectUrl);
    if (relativePath) {
      fileUrls.set(relativePath, objectUrl);
    }
  }

  manager.setURLModifier((url) => {
    const cleanUrl = decodeURIComponent(url.split(/[?#]/)[0]);
    const fileName = cleanUrl.split("/").pop() ?? cleanUrl;
    return fileUrls.get(cleanUrl) ?? fileUrls.get(fileName) ?? url;
  });

  const droppedLoader = createLoader(manager);
  const entryUrl = fileUrls.get(model.name);
  if (!entryUrl) {
    setStatus("Could not read dropped model");
    return;
  }

  currentFile = {
    path: model.name,
    name: model.name,
    ext: model.name.toLowerCase().endsWith(".glb") ? "glb" : "gltf",
    size: model.size,
    modified: model.lastModified
  };
  selectedPath = null;
  renderModelList();
  await loadModel(entryUrl, model.name, "Dropped file", currentFile, droppedLoader);
}

async function loadModel(url: string, displayName: string, displayPath: string, file: ModelFile, activeLoader = loader) {
  setLoading(true, "Loading model");
  setStatus("Loading");
  emptyState.hidden = true;

  try {
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      activeLoader.load(
        url,
        resolve,
        (event) => {
          if (event.total > 0) {
            const percent = Math.round((event.loaded / event.total) * 100);
            loadingText.textContent = `Loading ${percent}%`;
          }
        },
        reject
      );
    });

    setCurrentModel(gltf);
    currentStats = computeStats(gltf.scene);
    modelName.textContent = displayName;
    modelPath.textContent = displayPath;
    formatValue.textContent = file.ext.toUpperCase();
    fileSizeValue.textContent = file.size > 0 ? formatBytes(file.size) : "-";
    meshValue.textContent = formatInteger(currentStats.meshes);
    materialValue.textContent = formatInteger(currentStats.materials);
    vertexValue.textContent = formatInteger(currentStats.vertices);
    triangleValue.textContent = formatInteger(currentStats.triangles);
    dimensionValue.textContent = formatDimensions(currentStats.dimensions);
    setStatus("Ready");
    fitToModel();
  } catch (error) {
    console.error(error);
    setStatus(error instanceof Error ? error.message : "Failed to load model");
    emptyState.hidden = false;
  } finally {
    setLoading(false);
  }
}

function setCurrentModel(gltf: GLTF) {
  clearCurrentModel();
  currentModel = gltf.scene;
  currentModel.name ||= "glTF Scene";
  scene.add(currentModel);

  clips = gltf.animations ?? [];
  mixer = clips.length > 0 ? new THREE.AnimationMixer(currentModel) : null;
  playing = false;
  action = null;
  updateAnimationUi();
  applyWireframe(wireToggle.checked);
}

function updateAnimationUi() {
  animationSelect.innerHTML = "";
  if (clips.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No clips";
    animationSelect.append(option);
    animationSelect.disabled = true;
    playButton.disabled = true;
    playButton.textContent = "Play";
    return;
  }

  clips.forEach((clip, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = clip.name || `Clip ${index + 1}`;
    animationSelect.append(option);
  });
  animationSelect.disabled = false;
  playButton.disabled = false;
  playButton.textContent = "Play";
}

function playSelectedAnimation() {
  if (!mixer || clips.length === 0) {
    return;
  }

  const clip = clips[Number(animationSelect.value) || 0];
  action?.stop();
  action = mixer.clipAction(clip);
  action.reset().play();
  playing = true;
  playButton.textContent = "Pause";
}

function pauseAnimation() {
  if (!action) {
    return;
  }
  action.paused = !action.paused;
  playing = !action.paused;
  playButton.textContent = playing ? "Pause" : "Play";
}

function fitToModel() {
  if (!currentModel) {
    resetCamera();
    return;
  }

  const box = new THREE.Box3().setFromObject(currentModel);
  if (box.isEmpty()) {
    resetCamera();
    return;
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, 0.01);
  const distance = (maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))) * 1.55;
  const direction = new THREE.Vector3(1, 0.72, 1).normalize();

  camera.near = Math.max(maxSize / 1000, 0.001);
  camera.far = Math.max(maxSize * 1000, 1000);
  camera.position.copy(center).add(direction.multiplyScalar(distance));
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.maxDistance = Math.max(distance * 12, 20);
  controls.update();

  grid.scale.setScalar(Math.max(maxSize / 10, 1));
  axes.scale.setScalar(Math.max(maxSize / 4, 0.8));
}

function resetCamera() {
  camera.position.set(3, 2.2, 4);
  camera.near = 0.01;
  camera.far = 10000;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0.35, 0);
  controls.update();
}

function computeStats(object: THREE.Object3D): ModelStats {
  let meshes = 0;
  let vertices = 0;
  let triangles = 0;
  const materials = new Set<string>();

  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) {
      return;
    }

    meshes += 1;
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    if (position) {
      vertices += position.count;
      triangles += geometry.index ? geometry.index.count / 3 : position.count / 3;
    }

    const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materialList) {
      if (material) {
        materials.add(material.uuid);
      }
    }
  });

  const box = new THREE.Box3().setFromObject(object);
  const dimensions = box.isEmpty() ? new THREE.Vector3() : box.getSize(new THREE.Vector3());
  return {
    meshes,
    materials: materials.size,
    vertices,
    triangles: Math.round(triangles),
    dimensions
  };
}

function applyWireframe(enabled: boolean) {
  if (!currentModel) {
    return;
  }

  currentModel.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materialList.forEach((material) => {
      if ("wireframe" in material) {
        material.wireframe = enabled;
        material.needsUpdate = true;
      }
    });
  });
}

function clearCurrentModel() {
  if (currentModel) {
    scene.remove(currentModel);
    disposeObject(currentModel);
  }
  currentModel = null;
  currentStats = null;
  mixer = null;
  clips = [];
  action = null;
  playing = false;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    mesh.geometry?.dispose();
    const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materialList.forEach((material) => {
      disposeMaterial(material);
    });
  });
}

function disposeMaterial(material: THREE.Material) {
  Object.values(material).forEach((value) => {
    if (value && typeof value === "object" && "isTexture" in value) {
      (value as THREE.Texture).dispose();
    }
  });
  material.dispose();
}

function updateCanvasSize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateCanvasSize();
  const delta = clock.getDelta();
  if (mixer && playing) {
    mixer.update(delta);
  }
  controls.autoRotate = rotateToggle.checked;
  controls.update();
  renderer.render(scene, camera);
}

function setLoading(active: boolean, message = "Loading") {
  loadingState.hidden = !active;
  loadingText.textContent = message;
}

function setStatus(message: string) {
  statusLabel.textContent = message;
}

function assetUrl(path: string) {
  return `/asset/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function compactPath(value: string) {
  const home = "~";
  return value.replace(/^\/Users\/[^/]+/, home);
}

function parentPath(value: string) {
  const parts = value.split("/");
  parts.pop();
  return parts.join("/") || ".";
}

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatDimensions(value: THREE.Vector3) {
  return `${formatScalar(value.x)} x ${formatScalar(value.y)} x ${formatScalar(value.z)}`;
}

function formatScalar(value: number) {
  if (value === 0) {
    return "0";
  }
  if (Math.abs(value) >= 100 || Math.abs(value) < 0.01) {
    return value.toExponential(2);
  }
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function releaseUploadedUrls() {
  uploadedObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  uploadedObjectUrls.clear();
}

function getElement<T extends HTMLElement>(id: string) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
}

searchInput.addEventListener("input", renderModelList);

dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files) {
    void loadDroppedFiles(fileInput.files);
  }
});

window.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

window.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

window.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  if (event.dataTransfer?.files) {
    void loadDroppedFiles(event.dataTransfer.files);
  }
});

gridToggle.addEventListener("change", () => {
  grid.visible = gridToggle.checked;
});

axesToggle.addEventListener("change", () => {
  axes.visible = axesToggle.checked;
});

wireToggle.addEventListener("change", () => {
  applyWireframe(wireToggle.checked);
});

fitButton.addEventListener("click", fitToModel);
resetButton.addEventListener("click", resetCamera);

playButton.addEventListener("click", () => {
  if (!action) {
    playSelectedAnimation();
  } else {
    pauseAnimation();
  }
});

animationSelect.addEventListener("change", () => {
  if (playing) {
    playSelectedAnimation();
  } else {
    action = null;
    playButton.textContent = "Play";
  }
});

screenshotButton.addEventListener("click", () => {
  renderer.domElement.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const link = document.createElement("a");
    link.download = `${currentFile?.name ?? "model-preview"}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
});

window.addEventListener("beforeunload", releaseUploadedUrls);

