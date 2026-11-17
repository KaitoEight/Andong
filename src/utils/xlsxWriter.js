// Ghi file Excel .xlsx tối giản, không cần thư viện ngoài (zip "stored" + XML).
// Hỗ trợ nhiều sheet; ô chữ / số / tiền / phần trăm / ngày; dòng tiêu đề in đậm, cố định và có bộ lọc.
//
// sheet = { name, columns: [{ header, width?, type? }], rows: [[...]], totalRow?: [...] }
//   type: "text" (mặc định) | "int" | "money" | "percent" (0.123 = 12,3%) | "date" (chuỗi "YYYY-MM-DD")
//   Chữ luôn ghi dạng chữ: số điện thoại "0906…" giữ nguyên số 0 đầu.

const enc = new TextEncoder();

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Gói các file thành zip không nén. files: [{ name, data: Uint8Array }]
function zipStored(files) {
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, 0, true); h.setUint16(12, 0x21, true);                       // 00:00 ngày 01-01-1980
    h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
    h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, f.data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true);
    c.setUint16(28, name.length, true); c.setUint32(42, offset, true);            // các trường còn lại = 0
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((s, u) => s + u.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(e.buffer)];
  const out = new Uint8Array(all.reduce((s, u) => s + u.length, 0));
  let p = 0;
  for (const u of all) { out.set(u, p); p += u.length; }
  return out;
}

// Bỏ ký tự điều khiển không hợp lệ trong XML rồi thoát & < > "
const xmlText = (s) => String(s)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const colName = (i) => { let s = ""; i += 1; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

// Số ngày kiểu Excel (gốc 30-12-1899) từ "YYYY-MM-DD"
function excelDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return null;
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000);
}

// Chỉ số kiểu trong styles.xml bên dưới
const ST = { text: 0, header: 1, money: 2, date: 3, percent: 4, totalMoney: 5, totalText: 6, int: 0, totalInt: 6, totalPercent: 7 };

function cellXml(ref, value, type, total) {
  if (value === null || value === undefined || value === "") return "";
  if (type === "date") {
    const n = excelDate(value);
    if (n !== null) return `<c r="${ref}" s="${ST.date}"><v>${n}</v></c>`;   // không phải ngày (vd "Tổng"): ghi dạng chữ
  }
  if ((type === "money" || type === "int" || type === "percent") && typeof value === "number" && Number.isFinite(value)) {
    const s = type === "money" ? (total ? ST.totalMoney : ST.money)
      : type === "percent" ? (total ? ST.totalPercent : ST.percent)
      : (total ? ST.totalInt : ST.int);
    return `<c r="${ref}" s="${s}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr" s="${total ? ST.totalText : ST.text}"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
}

function sheetXml(sheet) {
  const cols = sheet.columns;
  const rows = [cols.map((c) => c.header), ...sheet.rows];
  if (sheet.totalRow) rows.push(sheet.totalRow);
  const lastCol = colName(Math.max(cols.length - 1, 0));
  const lastRow = 1 + sheet.rows.length;
  const xmlRows = rows.map((r, ri) => {
    const isHeader = ri === 0, isTotal = sheet.totalRow && ri === rows.length - 1;
    const cells = r.map((v, ci) => {
      const ref = colName(ci) + (ri + 1);
      if (isHeader) return `<c r="${ref}" t="inlineStr" s="${ST.header}"><is><t xml:space="preserve">${xmlText(v ?? "")}</t></is></c>`;
      return cellXml(ref, v, cols[ci]?.type || "text", isTotal);
    }).join("");
    return `<row r="${ri + 1}">${cells}</row>`;
  }).join("");
  const widths = cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 14}" customWidth="1"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    + `<sheetFormatPr defaultRowHeight="15"/>`
    + (widths ? `<cols>${widths}</cols>` : "")
    + `<sheetData>${xmlRows}</sheetData>`
    + (cols.length ? `<autoFilter ref="A1:${lastCol}${Math.max(lastRow, 1)}"/>` : "")
    + `</worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
  + `<numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="0.0%"/></numFmts>`
  + `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>`
  + `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>`
  + `<fill><patternFill patternType="solid"><fgColor rgb="FFD9EFE5"/><bgColor indexed="64"/></patternFill></fill></fills>`
  + `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>`
  + `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
  + `<cellXfs count="8">`
  + `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`
  + `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>`
  + `<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`
  + `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`
  + `<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`
  + `<xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>`
  + `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>`
  + `<xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>`
  + `</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

// Tên sheet hợp lệ: ≤ 31 ký tự, không chứa : \ / ? * [ ], không trùng
function sheetNames(sheets) {
  const used = new Set();
  return sheets.map((s, i) => {
    let n = String(s.name || `Sheet${i + 1}`).replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || `Sheet${i + 1}`;
    let k = 2, base = n;
    while (used.has(n.toLowerCase())) n = (base.slice(0, 28) + " " + k++).slice(0, 31);
    used.add(n.toLowerCase());
    return n;
  });
}

export function buildXlsx(sheets) {
  const names = sheetNames(sheets);
  const files = [
    { name: "[Content_Types].xml", xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
      + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
      + `<Default Extension="xml" ContentType="application/xml"/>`
      + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`
      + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")
      + `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`
      + `</Types>` },
    { name: "_rels/.rels", xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
      + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`
      + `</Relationships>` },
    { name: "xl/workbook.xml", xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
      + `<sheets>${names.map((n, i) => `<sheet name="${xmlText(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>`
      + `<definedNames>${sheets.map((s, i) => s.columns.length
        ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlText(names[i]).replace(/'/g, "''")}'!$A$1:$${colName(s.columns.length - 1)}$${Math.max(1 + s.rows.length, 1)}</definedName>` : "").join("")}</definedNames>`
      + `</workbook>` },
    { name: "xl/_rels/workbook.xml.rels", xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
      + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")
      + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
      + `</Relationships>` },
    { name: "xl/styles.xml", xml: STYLES },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, xml: sheetXml(s) })),
  ];
  return zipStored(files.map((f) => ({ name: f.name, data: enc.encode(f.xml) })));
}

// Tải file .xlsx về máy
export function downloadXlsx(filename, sheets) {
  const blob = new Blob([buildXlsx(sheets)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
