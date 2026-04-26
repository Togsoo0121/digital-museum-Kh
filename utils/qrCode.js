export function qrSvgDataUrl(text = "", size = 320) {
  const safeText = String(text || "");
  const qrApiUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=" +
    encodeURIComponent(`${size}x${size}`) +
    "&data=" +
    encodeURIComponent(safeText);

  return qrApiUrl;
}
