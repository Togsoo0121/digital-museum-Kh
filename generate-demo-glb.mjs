import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "models");

function align4(value) {
  return (value + 3) & ~3;
}

function padBuffer(buffer) {
  const length = align4(buffer.length);
  if (length === buffer.length) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(length - buffer.length)]);
}

function box(cx, cy, cz, sx, sy, sz, material) {
  const x = sx / 2;
  const y = sy / 2;
  const z = sz / 2;
  const faces = [
    [[1, 0, 0], [[x, -y, -z], [x, -y, z], [x, y, z], [x, y, -z]]],
    [[-1, 0, 0], [[-x, -y, z], [-x, -y, -z], [-x, y, -z], [-x, y, z]]],
    [[0, 1, 0], [[-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z]]],
    [[0, -1, 0], [[-x, -y, z], [x, -y, z], [x, -y, -z], [-x, -y, -z]]],
    [[0, 0, 1], [[x, -y, z], [-x, -y, z], [-x, y, z], [x, y, z]]],
    [[0, 0, -1], [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z]]],
  ];
  const positions = [];
  const normals = [];
  const indices = [];
  faces.forEach(([normal, vertices], faceIndex) => {
    const base = faceIndex * 4;
    vertices.forEach(([vx, vy, vz]) => {
      positions.push(cx + vx, cy + vy, cz + vz);
      normals.push(...normal);
    });
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { positions, normals, indices, material };
}

function cylinder(cx, cy, cz, radius, height, material, segments = 32) {
  const positions = [];
  const normals = [];
  const indices = [];
  const half = height / 2;
  for (let i = 0; i <= segments; i += 1) {
    const angle = (Math.PI * 2 * i) / segments;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    positions.push(cx + x * radius, cy - half, cz + z * radius, cx + x * radius, cy + half, cz + z * radius);
    normals.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < segments; i += 1) {
    const base = i * 2;
    indices.push(base, base + 1, base + 3, base, base + 3, base + 2);
  }
  const topCenter = positions.length / 3;
  positions.push(cx, cy + half, cz);
  normals.push(0, 1, 0);
  const bottomCenter = positions.length / 3;
  positions.push(cx, cy - half, cz);
  normals.push(0, -1, 0);
  for (let i = 0; i < segments; i += 1) {
    const base = i * 2;
    indices.push(topCenter, base + 1, base + 3);
    indices.push(bottomCenter, base + 2, base);
  }
  return { positions, normals, indices, material };
}

function hemisphere(cx, cy, cz, radius, material, lat = 10, lon = 32) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let y = 0; y <= lat; y += 1) {
    const theta = (Math.PI / 2) * (y / lat);
    const ringRadius = Math.sin(theta);
    const py = Math.cos(theta);
    for (let x = 0; x <= lon; x += 1) {
      const phi = (Math.PI * 2 * x) / lon;
      const nx = Math.cos(phi) * ringRadius;
      const nz = Math.sin(phi) * ringRadius;
      positions.push(cx + nx * radius, cy + py * radius, cz + nz * radius);
      normals.push(nx, py, nz);
    }
  }
  for (let y = 0; y < lat; y += 1) {
    for (let x = 0; x < lon; x += 1) {
      const a = y * (lon + 1) + x;
      const b = a + lon + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, normals, indices, material };
}

function writeGlb(fileName, parts, materials) {
  const bufferViews = [];
  const accessors = [];
  const buffers = [];
  const primitives = [];
  let byteOffset = 0;

  function addBuffer(typedArray, target) {
    const buffer = padBuffer(Buffer.from(new Uint8Array(typedArray.buffer)));
    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: typedArray.byteLength,
      target,
    });
    buffers.push(buffer);
    byteOffset += buffer.length;
    return viewIndex;
  }

  function addAccessor(typedArray, target, componentType, type, count, min, max) {
    const bufferView = addBuffer(typedArray, target);
    const accessor = {
      bufferView,
      componentType,
      count,
      type,
    };
    if (min) accessor.min = min;
    if (max) accessor.max = max;
    accessors.push(accessor);
    return accessors.length - 1;
  }

  parts.forEach((part) => {
    const positions = new Float32Array(part.positions);
    const normals = new Float32Array(part.normals);
    const indices = new Uint16Array(part.indices);
    const mins = [Infinity, Infinity, Infinity];
    const maxs = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < part.positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        mins[axis] = Math.min(mins[axis], part.positions[i + axis]);
        maxs[axis] = Math.max(maxs[axis], part.positions[i + axis]);
      }
    }
    const positionAccessor = addAccessor(positions, 34962, 5126, "VEC3", positions.length / 3, mins, maxs);
    const normalAccessor = addAccessor(normals, 34962, 5126, "VEC3", normals.length / 3);
    const indexAccessor = addAccessor(indices, 34963, 5123, "SCALAR", indices.length, [0], [Math.max(...part.indices)]);
    primitives.push({
      attributes: { POSITION: positionAccessor, NORMAL: normalAccessor },
      indices: indexAccessor,
      material: part.material,
    });
  });

  const bin = Buffer.concat(buffers);
  const gltf = {
    asset: { version: "2.0", generator: "Khentii Museum demo AR seed generator" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives }],
    materials: materials.map((material) => ({
      name: material.name,
      pbrMetallicRoughness: {
        baseColorFactor: material.color,
        metallicFactor: material.metallic ?? 0,
        roughnessFactor: material.roughness ?? 0.55,
      },
    })),
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors,
  };

  const json = padBuffer(Buffer.from(JSON.stringify(gltf), "utf8"));
  const totalLength = 12 + 8 + json.length + 8 + bin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  const output = Buffer.concat([header, jsonHeader, json, binHeader, bin]);
  mkdirSync(dirname(join(OUT_DIR, fileName)), { recursive: true });
  writeFileSync(join(OUT_DIR, fileName), output);
}

const materials = [
  { name: "dark bronze", color: [0.45, 0.28, 0.12, 1], metallic: 0.65, roughness: 0.35 },
  { name: "steel", color: [0.8, 0.78, 0.72, 1], metallic: 0.85, roughness: 0.28 },
  { name: "gold", color: [0.95, 0.62, 0.18, 1], metallic: 0.7, roughness: 0.32 },
  { name: "leather", color: [0.16, 0.08, 0.035, 1], metallic: 0.05, roughness: 0.8 },
];

writeGlb(
  "mongol-sword.glb",
  [
    box(0, 1.0, 0, 0.18, 2.3, 0.05, 1),
    box(0, -0.26, 0, 0.78, 0.12, 0.12, 2),
    cylinder(0, -0.72, 0, 0.07, 0.82, 3, 28),
    box(0, 2.22, 0, 0.04, 0.24, 0.04, 1),
    cylinder(0, -1.18, 0, 0.13, 0.14, 2, 28),
  ],
  materials
);

writeGlb(
  "horse-statue.glb",
  [
    box(0, 0.95, 0, 1.55, 0.55, 0.42, 0),
    box(0.75, 1.35, 0, 0.32, 0.75, 0.32, 0),
    box(1.05, 1.78, 0, 0.46, 0.32, 0.34, 0),
    box(-0.75, 1.12, 0, 0.38, 0.36, 0.34, 0),
    box(-0.95, 1.34, 0, 0.16, 0.82, 0.12, 0),
    box(-0.52, 0.25, 0.16, 0.18, 0.95, 0.18, 0),
    box(0.52, 0.25, 0.16, 0.18, 0.95, 0.18, 0),
    box(-0.52, 0.25, -0.16, 0.18, 0.95, 0.18, 0),
    box(0.52, 0.25, -0.16, 0.18, 0.95, 0.18, 0),
    box(0, -0.28, 0, 2.2, 0.14, 0.8, 2),
  ],
  materials
);

writeGlb(
  "warrior-helmet.glb",
  [
    hemisphere(0, 0.45, 0, 0.82, 1, 10, 36),
    box(0, 0.35, 0, 1.95, 0.16, 1.55, 1),
    box(0, 0.2, 0.78, 0.28, 0.7, 0.12, 2),
    box(0, 1.26, 0, 0.16, 0.92, 0.18, 2),
    box(0, 0.0, -0.55, 0.86, 0.68, 0.12, 1),
  ],
  materials
);
