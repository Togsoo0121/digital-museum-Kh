const QR_VERSIONS = [
  null,
  { dataCodewords: 19, ecCodewords: 7, alignment: [] },
  { dataCodewords: 34, ecCodewords: 10, alignment: [6, 18] },
  { dataCodewords: 55, ecCodewords: 15, alignment: [6, 22] },
  { dataCodewords: 80, ecCodewords: 20, alignment: [6, 26] },
  { dataCodewords: 108, ecCodewords: 26, alignment: [6, 30] },
];

const GF_EXP = new Array(512);
const GF_LOG = new Array(256);

let gfValue = 1;
for (let i = 0; i < 255; i += 1) {
  GF_EXP[i] = gfValue;
  GF_LOG[gfValue] = i;
  gfValue <<= 1;
  if (gfValue & 0x100) gfValue ^= 0x11d;
}
for (let i = 255; i < GF_EXP.length; i += 1) {
  GF_EXP[i] = GF_EXP[i - 255];
}

function gfMultiply(left, right) {
  if (!left || !right) return 0;
  return GF_EXP[GF_LOG[left] + GF_LOG[right]];
}

function multiplyPoly(left, right) {
  const result = new Array(left.length + right.length - 1).fill(0);
  left.forEach((leftValue, leftIndex) => {
    right.forEach((rightValue, rightIndex) => {
      result[leftIndex + rightIndex] ^= gfMultiply(leftValue, rightValue);
    });
  });
  return result;
}

function generatorPolynomial(degree) {
  let generator = [1];
  for (let i = 0; i < degree; i += 1) {
    generator = multiplyPoly(generator, [1, GF_EXP[i]]);
  }
  return generator;
}

function reedSolomon(data, degree) {
  const generator = generatorPolynomial(degree);
  const result = new Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < degree; i += 1) {
      result[i] ^= gfMultiply(generator[i + 1], factor);
    }
  });
  return result;
}

function bitsToCodewords(bits, versionInfo) {
  const result = [];
  for (let i = 0; i < bits.length; i += 8) {
    result.push(Number.parseInt(bits.slice(i, i + 8).padEnd(8, "0"), 2));
  }
  let pad = 0xec;
  while (result.length < versionInfo.dataCodewords) {
    result.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }
  return result;
}

function appendBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1 ? "1" : "0");
  }
}

function makeDataCodewords(text, versionInfo) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const bits = [];
  appendBits(bits, 0x4, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const capacityBits = versionInfo.dataCodewords * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  appendBits(bits, 0, terminator);
  while (bits.length % 8) bits.push("0");

  return bitsToCodewords(bits.join(""), versionInfo);
}

function chooseVersion(text) {
  const bytes = new TextEncoder().encode(text);
  return QR_VERSIONS.findIndex((info, version) => {
    if (!version) return false;
    const requiredBits = 4 + 8 + bytes.length * 8;
    return requiredBits <= info.dataCodewords * 8;
  });
}

function createMatrix(size) {
  return {
    modules: Array.from({ length: size }, () => Array(size).fill(false)),
    reserved: Array.from({ length: size }, () => Array(size).fill(false)),
  };
}

function setFunction(matrix, x, y, dark) {
  if (y < 0 || y >= matrix.modules.length || x < 0 || x >= matrix.modules.length) return;
  matrix.modules[y][x] = dark;
  matrix.reserved[y][x] = true;
}

function placeFinder(matrix, left, top) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const xx = left + x;
      const yy = top + y;
      const inFinder = x >= 0 && x <= 6 && y >= 0 && y <= 6;
      const dark =
        inFinder &&
        (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
      setFunction(matrix, xx, yy, dark);
    }
  }
}

function placeAlignment(matrix, centerX, centerY) {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      setFunction(matrix, centerX + x, centerY + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }
  }
}

function reserveFormatAreas(matrix) {
  const size = matrix.modules.length;
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      setFunction(matrix, 8, i, false);
      setFunction(matrix, i, 8, false);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    setFunction(matrix, size - 1 - i, 8, false);
  }
  for (let i = 0; i < 7; i += 1) {
    setFunction(matrix, 8, size - 1 - i, false);
  }
}

function placePatterns(matrix, versionInfo) {
  const size = matrix.modules.length;
  placeFinder(matrix, 0, 0);
  placeFinder(matrix, size - 7, 0);
  placeFinder(matrix, 0, size - 7);

  for (let i = 8; i < size - 8; i += 1) {
    setFunction(matrix, i, 6, i % 2 === 0);
    setFunction(matrix, 6, i, i % 2 === 0);
  }

  versionInfo.alignment.forEach((y) => {
    versionInfo.alignment.forEach((x) => {
      const overlapsFinder =
        (x === 6 && y === 6) ||
        (x === 6 && y === size - 7) ||
        (x === size - 7 && y === 6);
      if (!overlapsFinder) placeAlignment(matrix, x, y);
    });
  });

  reserveFormatAreas(matrix);
  setFunction(matrix, 8, size - 8, true);
}

function shouldMask(x, y) {
  return (x + y) % 2 === 0;
}

function placeData(matrix, codewords) {
  const size = matrix.modules.length;
  const bits = codewords.flatMap((byte) =>
    Array.from({ length: 8 }, (_, index) => ((byte >>> (7 - index)) & 1) === 1)
  );
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let row = 0; row < size; row += 1) {
      const y = upward ? size - 1 - row : row;
      for (let columnOffset = 0; columnOffset < 2; columnOffset += 1) {
        const x = right - columnOffset;
        if (matrix.reserved[y][x]) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex] : false;
        matrix.modules[y][x] = bit !== shouldMask(x, y);
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

function formatBits() {
  const errorCorrectionLow = 0x1;
  const mask = 0;
  const data = (errorCorrectionLow << 3) | mask;
  let bits = data << 10;
  const generator = 0x537;
  for (let i = 14; i >= 10; i -= 1) {
    if ((bits >>> i) & 1) bits ^= generator << (i - 10);
  }
  return (((data << 10) | bits) ^ 0x5412) & 0x7fff;
}

function getFormatBit(bits, index) {
  return ((bits >>> index) & 1) === 1;
}

function placeFormat(matrix) {
  const size = matrix.modules.length;
  const bits = formatBits();

  for (let i = 0; i <= 5; i += 1) setFunction(matrix, 8, i, getFormatBit(bits, i));
  setFunction(matrix, 8, 7, getFormatBit(bits, 6));
  setFunction(matrix, 8, 8, getFormatBit(bits, 7));
  setFunction(matrix, 7, 8, getFormatBit(bits, 8));
  for (let i = 9; i < 15; i += 1) setFunction(matrix, 14 - i, 8, getFormatBit(bits, i));

  for (let i = 0; i < 8; i += 1) setFunction(matrix, size - 1 - i, 8, getFormatBit(bits, i));
  for (let i = 8; i < 15; i += 1) setFunction(matrix, 8, size - 15 + i, getFormatBit(bits, i));
  setFunction(matrix, 8, size - 8, true);
}

function svgDataUrl(matrix, pixels) {
  const quiet = 4;
  const size = matrix.modules.length;
  const viewBoxSize = size + quiet * 2;
  const rects = [];
  matrix.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) rects.push(`<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>`);
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fffdf8"/><g fill="#171615">${rects.join("")}</g></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function qrSvgDataUrl(value, pixels = 320) {
  const text = String(value || "");
  const version = chooseVersion(text);
  if (version < 1) {
    const shortened = Array.from(new TextEncoder().encode(text)).slice(0, 100);
    const fallbackText = new TextDecoder().decode(new Uint8Array(shortened)) || "QR";
    return qrSvgDataUrl(fallbackText, pixels);
  }

  const versionInfo = QR_VERSIONS[version];
  const dataCodewords = makeDataCodewords(text, versionInfo);
  const ecCodewords = reedSolomon(dataCodewords, versionInfo.ecCodewords);
  const size = 21 + (version - 1) * 4;
  const matrix = createMatrix(size);
  placePatterns(matrix, versionInfo);
  placeData(matrix, [...dataCodewords, ...ecCodewords]);
  placeFormat(matrix);
  return svgDataUrl(matrix, pixels);
}
