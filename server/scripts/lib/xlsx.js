// Đọc file .xlsx không cần thư viện ngoài (zip + XML). Dùng chung cho các công cụ nhập dữ liệu.
const fs = require("fs");
const zlib = require("zlib");

// ─── đọc xlsx (không cần thư viện ngoài) ─────────────────────────────────────
function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Không phải file .xlsx hợp lệ (không tìm thấy cấu trúc zip).");
  const total = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let n = 0; n < total; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("Zip bị hỏng.");
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nlen = buf.readUInt16LE(off + 28);
    const elen = buf.readUInt16LE(off + 30);
    const clen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nlen);
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(start, start + csize);
    if (!name.endsWith("/")) {
      files[name] = method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null;
      if (files[name] === null) throw new Error(`Kiểu nén không hỗ trợ (${method}) ở ${name}`);
    }
    off += 46 + nlen + elen + clen;
  }
  return files;
}

const decodeXml = (s) => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

const textOf = (xml) => {
  let out = "";
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let m;
  while ((m = re.exec(xml))) out += decodeXml(m[1]);
  return out;
};

const colIndex = (ref) => {
  let n = 0;
  for (const ch of /^[A-Z]+/.exec(ref)[0]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

function readXlsxRows(file) {
  const files = readZip(fs.readFileSync(file));
  const shared = [];
  if (files["xl/sharedStrings.xml"]) {
    const sx = files["xl/sharedStrings.xml"].toString("utf8");
    const re = /<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = re.exec(sx))) shared.push(textOf(m[1]));
  }
  const sheetName = Object.keys(files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0];
  if (!sheetName) throw new Error("Không tìm thấy sheet dữ liệu.");
  const xml = files[sheetName].toString("utf8");
  const rows = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const cells = {};
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm;
    while ((cm = cellRe.exec(rm[1]))) {
      const attrs = cm[1];
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs);
      if (!ref) continue;
      const t = (/\bt="([^"]+)"/.exec(attrs) || [])[1];
      const inner = cm[2] || "";
      let val = "";
      if (t === "inlineStr") val = textOf(inner);
      else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (v) val = t === "s" ? (shared[Number(v[1])] || "") : decodeXml(v[1]);
      }
      cells[colIndex(ref[1])] = val;
    }
    const width = Object.keys(cells).length ? Math.max(...Object.keys(cells).map(Number)) + 1 : 0;
    rows.push(Array.from({ length: width }, (_, i) => (cells[i] === undefined ? "" : cells[i])));
  }
  return rows;
}

module.exports = { readXlsxRows };
