// Các mẫu in của phòng khám (theo mẫu lấy từ phần mềm cũ): Hóa đơn dịch vụ v2, Thu tiền cọc, Phiếu chi,
// Hóa đơn thẻ trả trước (khổ A5 ngang) và Form chẩn đoán, Form bệnh án tổng quát (khổ A4 dọc).
// Tên / địa chỉ / điện thoại phòng khám lấy từ CLINIC (print.js). Truyền dữ liệu = null để in MẪU TRỐNG (viết tay).
import { fmtVND, fmtDate, todayStr, moneyToWordsVi } from "./helpers";
import { CLINIC, esc, openPrintWindow } from "./print";
import { TOOTH_STATE_LABELS } from "./constants";

const money = (n) => (Number(n) || 0).toLocaleString("vi-VN");
const addressOf = (c) => [c?.address, c?.ward, c?.province].filter(Boolean).join(", ");
const padRows = (rows, min) => rows.concat(Array.from({ length: Math.max(0, min - rows.length) }, () => null));

// "Ngày 14 tháng 10 năm 2026" — iso = null thì để trống cho viết tay
function longDate(iso) {
  if (iso === null) return "Ngày ........ tháng ........ năm ............";
  const [y, m, d] = String(iso || todayStr()).slice(0, 10).split("-");
  if (!y || !m || !d) return longDate(todayStr());
  return `Ngày ${Number(d)} tháng ${Number(m)} năm ${y}`;
}

// ── Khổ A5 ngang: hóa đơn / phiếu thu chi ───────────────────────────────────────────────────
const A5_CSS = `
  @page { size: A5 landscape; margin: 6mm; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Arial, "Segoe UI", sans-serif; color:#111; font-size:12px; line-height:1.4; }
  .v { width:198mm; margin:0 auto; padding:1mm 0; }
  .v-top { display:flex; gap:10px; align-items:flex-start; }
  .v-logo { flex:none; width:16mm; height:16mm; border-radius:5px; background:#0f766e; color:#fff; display:grid; place-items:center; font-weight:700; font-size:16px; }
  .v-co { flex:1; min-width:0; }
  .v-co b { display:block; font-size:15px; }
  .v-co div { font-size:11px; }
  .v-ref { flex:none; width:70mm; font-size:11px; }
  .v-ref b { font-size:12px; }
  .v-title { text-align:center; margin:3px 0 1px; font-size:19px; font-weight:700; letter-spacing:.5px; }
  .v-sub { text-align:center; font-size:11px; color:#444; margin-bottom:4px; }
  .v-row { display:flex; gap:16px; margin:2px 0; }
  .v-f { display:flex; flex:1; gap:6px; align-items:flex-end; min-width:0; }
  .v-l { flex:none; white-space:nowrap; color:#333; }
  .v-v { flex:1; min-width:0; border-bottom:1px dotted #666; min-height:15px; font-weight:600; word-break:break-word; }
  .v-sign { display:flex; justify-content:space-around; text-align:center; margin-top:8px; font-weight:700; page-break-inside:avoid; }
  .v-sign div { min-width:28mm; }
  .v-sign small { display:block; font-weight:400; color:#555; font-size:10px; }
  .v-sign .gap { height:10mm; }
  .v-thanks { text-align:center; margin-top:2px; font-size:11px; }
  table.v-tb { width:100%; border-collapse:collapse; margin-top:6px; font-size:11px; }
  .v-tb th, .v-tb td { border:1px solid #222; padding:2px 5px; }
  .v-tb th { text-align:center; background:#f3f4f6; }
  .v-tb tr { page-break-inside:avoid; }
  .n { text-align:right; } .c { text-align:center; }
  .v-sum { display:flex; gap:16px; margin-top:6px; }
  .v-sum .note { flex:1; font-size:11px; }
  .v-sum { line-height:1.25; }
  .v-sum table { width:78mm; font-size:11px; border-collapse:collapse; }
  .v-sum td { padding:1px 4px; } .v-sum td:last-child { text-align:right; font-weight:700; }
`;

function topBlock(refHtml = "") {
  return `<div class="v-top">
    <div class="v-logo">AĐ</div>
    <div class="v-co"><b>${esc(CLINIC.name)}</b><div>Add: ${esc(CLINIC.address)}</div><div>Tel: ${esc(CLINIC.phone)}</div></div>
    <div class="v-ref">${refHtml}</div>
  </div>`;
}
const fld = (label, value) => `<div class="v-f"><span class="v-l">${label}</span><span class="v-v">${esc(value)}</span></div>`;
const QD_FORM = "Mẫu số 02 - TT";
const QD_LAW = "(Ban hành theo QĐ số 48/2006/QĐ-BTC Ngày 14/09/2006 của Bộ trưởng BTC)";

function signRow(names) {
  return `<div class="v-sign">${names.map((n) => `<div>${n}<small>(ký, họ tên)</small><div class="gap"></div></div>`).join("")}</div>`;
}

// ── Hóa đơn dịch vụ v2 (A5) ─────────────────────────────────────────────────────────────────
export function printInvoice(inv, customer, opts = {}) {
  const blank = !inv;
  const items = (inv?.items || []).map((it) => {
    const qty = Number(it.qty) || 0, price = Number(it.price) || 0;
    const root = price * qty, disc = Number(it.discount) || 0, vat = Number(it.vatAmount) || 0;
    return { code: it.code || "", name: it.name, qty, price, root, disc, vat, after: root - disc };
  });
  const total = inv?.total ?? items.reduce((s, it) => s + it.after, 0);
  const vatSum = items.reduce((s, it) => s + it.vat, 0);
  const paid = Number(inv?.paid) || 0, depositUsed = Number(inv?.depositUsed) || 0;
  const left = Math.max(0, total - paid - depositUsed);
  const rows = padRows(items, blank ? 5 : 1).map((it, i) => it
    ? `<tr><td class="c">${i + 1}</td><td>${esc(it.code)}</td><td>${esc(it.name)}</td><td class="c">${it.qty}</td><td class="n">${money(it.price)}</td><td class="n">${money(it.root)}</td><td class="n">${money(it.disc)}</td><td class="n">${money(it.vat)}</td><td class="n">${money(it.after)}</td></tr>`
    : `<tr><td class="c">&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("");
  const line = (label, val) => `<tr><td class="n" style="font-weight:400">${label}</td><td>${blank ? "" : money(val)}</td></tr>`;

  const body = `<div class="v">
    ${topBlock(`<div style="text-align:right">Mã hóa đơn<br/><b>${esc(inv?.code || "")}</b></div>`)}
    <div class="v-title">HÓA ĐƠN DỊCH VỤ</div>
    <div class="v-sub">${longDate(blank ? null : inv.date)}</div>
    <div class="v-row">${fld("Quý khách hàng:", customer?.name)}${fld("Mã khách hàng:", customer?.code)}</div>
    <div class="v-row">${fld("Số điện thoại:", customer?.phone)}${fld("Hình thức thanh toán:", inv?.method)}</div>
    <div class="v-row">${fld("Địa chỉ:", addressOf(customer))}</div>
    <table class="v-tb">
      <thead><tr><th style="width:8mm">STT</th><th style="width:22mm">Mã Hàng</th><th>Tên DV-SP</th><th style="width:10mm">SL</th><th style="width:22mm">Đơn Giá</th><th style="width:24mm">Thành Tiền</th><th style="width:16mm">Giảm</th><th style="width:16mm">VAT</th><th style="width:24mm">Sau Giảm</th></tr></thead>
      <tbody>${rows}
        <tr><td colspan="8" class="n"><b>Tổng Thành Tiền:</b></td><td class="n"><b>${blank ? "" : money(total)}</b></td></tr>
      </tbody>
    </table>
    <div class="v-sum">
      <div class="note">Ghi chú: ${esc(inv?.note || "")}</div>
      <table>${line("Chưa thanh toán:", total)}${line("(Vat)", vatSum)}${line("Thanh toán:", paid)}${line("(Trừ Cọc)", depositUsed)}${line("Còn lại:", left)}</table>
    </div>
    ${signRow(["Thu Ngân", "Điều Trị Viên", "Khách Hàng", "Kế Toán Trưởng"])}
    <div class="v-thanks">Cảm ơn quý khách và hẹn gặp lại!</div>
  </div>`;
  openPrintWindow(blank ? "Hóa đơn dịch vụ (mẫu trống)" : `Hóa đơn ${inv.code || ""}`, body, { css: A5_CSS, base: false, preview: opts.preview });
}

// ── Thu tiền cọc (A5) ───────────────────────────────────────────────────────────────────────
export function printDepositReceipt(dep, customer, opts = {}) {
  const blank = !dep;
  const body = `<div class="v">
    ${topBlock(`<b>${QD_FORM}</b><br/>${QD_LAW}<div style="margin-top:3px">Mã phiếu: <b>${esc(dep?.code || "")}</b></div>`)}
    <div class="v-title">PHIẾU THU TIỀN CỌC</div>
    <div class="v-sub">${longDate(blank ? null : dep.date)}</div>
    <div class="v-row">${fld("Quý khách hàng:", customer?.name)}${fld("Mã khách hàng:", customer?.code)}</div>
    <div class="v-row">${fld("Số điện thoại:", customer?.phone)}${fld("Hình thức cọc:", dep?.method)}</div>
    <div class="v-row">${fld("Địa chỉ:", addressOf(customer))}</div>
    <div class="v-row">${fld("Nội dung:", dep?.content)}</div>
    <div class="v-row">${fld("Số tiền:", blank ? "" : fmtVND(dep.amount))}</div>
    <div class="v-row">${fld("(Viết bằng chữ)", blank ? "" : moneyToWordsVi(dep.amount))}</div>
    ${signRow(["Thu Ngân", "Khách Hàng", "Kế Toán Trưởng"])}
    <div class="v-thanks">Cảm ơn quý khách và hẹn gặp lại !</div>
  </div>`;
  openPrintWindow("Phiếu thu tiền cọc", body, { css: A5_CSS, base: false, preview: opts.preview });
}

// ── Phiếu thu (A5): một đợt thu tiền của khách ─────────────────────────────────────────────
// rc = { code, date, paid, method, note, staff }; customer = khách. Còn nợ = nợ sau đợt thu (nếu truyền vào).
export function printReceipt(rc, customer, opts = {}) {
  const blank = !rc;
  const body = `<div class="v">
    ${topBlock(`<b>Mẫu số 01 - TT</b><br/>${QD_LAW}<div style="margin-top:3px">Số phiếu: <b>${esc(rc?.code || "")}</b></div>`)}
    <div class="v-title">PHIẾU THU</div>
    <div class="v-sub">${longDate(blank ? null : rc.date)}</div>
    <div class="v-row">${fld("Họ tên người nộp tiền:", customer?.name)}${fld("Mã khách hàng:", customer?.code)}</div>
    <div class="v-row">${fld("Số điện thoại:", customer?.phone)}${fld("Hình thức thanh toán:", rc?.method)}</div>
    <div class="v-row">${fld("Địa chỉ:", addressOf(customer))}</div>
    <div class="v-row">${fld("Lý do nộp:", rc?.note)}</div>
    <div class="v-row">${fld("Số tiền:", blank ? "" : fmtVND(rc.paid))}${opts.debt !== undefined && !blank ? fld("Còn nợ:", fmtVND(opts.debt)) : ""}</div>
    <div class="v-row">${fld("(Viết bằng chữ)", blank ? "" : moneyToWordsVi(rc.paid))}</div>
    <div class="v-sign">
      <div>Người nộp tiền<small>(ký, họ tên)</small><div class="gap"></div>${esc(customer?.name || "")}</div>
      <div>Người lập phiếu<small>(ký, họ tên)</small><div class="gap"></div>${esc(rc?.staff || "")}</div>
      <div>Kế Toán Trưởng<small>(ký, họ tên)</small><div class="gap"></div></div>
    </div>
    <div class="v-thanks" style="margin-top:10px">Cảm ơn quý khách và hẹn gặp lại !</div>
  </div>`;
  openPrintWindow(blank ? "Phiếu thu (mẫu trống)" : `Phiếu thu ${rc.code || ""}`, body, { css: A5_CSS, base: false, preview: opts.preview });
}

// ── Phiếu chi (A5) ──────────────────────────────────────────────────────────────────────────
export function printPaymentVoucher(pv, opts = {}) {
  const blank = !pv;
  const dot = 'style="border-bottom:1px dotted #666"';
  const ref = `<b>${QD_FORM}</b><br/>${QD_LAW}
    <table style="width:100%;border-collapse:collapse;margin-top:4px;font-size:11px">
      <tr><td ${dot}><b>Số: ${esc(pv?.code || "")}</b></td></tr><tr><td ${dot}>Quyển số:</td></tr><tr><td ${dot}>Nợ:</td></tr><tr><td ${dot}>Có:</td></tr>
    </table>`;
  const body = `<div class="v">
    ${topBlock(ref)}
    <div class="v-title">PHIẾU CHI</div>
    <div class="v-sub">${longDate(blank ? null : pv.date)}</div>
    <div class="v-row">${fld("Họ tên người nhận tiền:", pv?.receiver)}</div>
    <div class="v-row">${fld("Lý do:", pv?.reason)}</div>
    <div class="v-row">${fld("Số tiền:", blank ? "" : fmtVND(pv.amount))}</div>
    <div class="v-row">${fld("(Viết bằng chữ)", blank ? "" : moneyToWordsVi(pv.amount))}</div>
    <div class="v-row">${fld("Ghi chú:", pv?.note)}</div>
    <div class="v-row">${fld("Kèm theo:", pv?.attached)}${fld("Chứng từ gốc:", pv?.original)}</div>
    ${signRow(["Giám đốc", "Người nhận", "Kế toán trưởng", "Thủ quỹ", "Người lập phiếu", "Quản lý"])}
    <div class="v-row">${fld("Đã nhận đủ số tiền bằng chữ:", "")}</div>
  </div>`;
  openPrintWindow("Phiếu chi", body, { css: A5_CSS, base: false, preview: opts.preview });
}

// ── Hóa đơn thẻ trả trước (A5) ──────────────────────────────────────────────────────────────
export function printPrepaidCard(card, customer, opts = {}) {
  const blank = !card;
  const body = `<div class="v">
    ${topBlock(`<b>Mẫu số 02 - TT</b><div style="margin-top:3px">Số: <b>${esc(card?.code || "")}</b></div>`)}
    <div class="v-title">THANH TOÁN THẺ TRẢ TRƯỚC</div>
    <div class="v-sub">${longDate(blank ? null : card.date)}</div>
    <div class="v-row">${fld("Tên khách hàng:", customer?.name)}${fld("Mã số:", customer?.code)}</div>
    <div class="v-row">${fld("Số điện thoại:", customer?.phone)}</div>
    <div class="v-row">${fld("Địa chỉ:", addressOf(customer))}</div>
    <div class="v-row">${fld("Tên Thẻ:", card?.cardName)}</div>
    <div class="v-row">${fld("Số tiền:", blank ? "" : fmtVND(card.amount))}</div>
    <div class="v-row">${fld("(Viết bằng chữ)", blank ? "" : moneyToWordsVi(card.amount))}</div>
    <div class="v-row">${fld("Nội dung thanh toán:", card?.content)}</div>
    ${signRow(["Khách Hàng", "Người lập phiếu"])}
  </div>`;
  openPrintWindow("Thanh toán thẻ trả trước", body, { css: A5_CSS, base: false, preview: opts.preview });
}

// ── Khổ A4 dọc: form chẩn đoán, bệnh án ─────────────────────────────────────────────────────
const A4_CSS = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Arial, "Segoe UI", sans-serif; color:#1f2937; font-size:11px; line-height:1.4; }
  .m { max-width:186mm; margin:0 auto; }
  .m-head { display:flex; gap:10px; align-items:flex-start; }
  .m-logo { flex:none; width:20mm; height:20mm; border-radius:5px; background:#0f766e; color:#fff; display:grid; place-items:center; font-weight:700; font-size:18px; }
  .m-co { flex:1; } .m-co b { display:block; font-size:15px; } .m-co div { font-size:11px; }
  .m-ref { flex:none; width:62mm; font-size:11px; } .m-ref div { margin-bottom:3px; }
  .m-title { text-align:center; font-size:18px; font-weight:700; margin:10px 0 0; }
  .m-sub { text-align:center; font-size:11px; color:#4b5563; margin-bottom:10px; }
  .m-sec { margin:12px 0 4px; font-size:12.5px; font-weight:700; text-transform:uppercase; page-break-after:avoid; }
  .m-q { margin:8px 0 3px; font-weight:700; page-break-after:avoid; }
  .m-grid { display:grid; grid-template-columns:1fr 1fr; gap:3px 18px; }
  .m-line { border-bottom:1px dotted #777; min-height:15px; }
  .m-line span { color:#4b5563; }
  .m-line b { font-weight:600; color:#111; }
  .cb { display:inline-block; width:11px; height:11px; border:1px solid #444; border-radius:2px; vertical-align:-2px; margin-right:5px; text-align:center; line-height:10px; font-size:10px; font-weight:700; }
  .m-chk { display:flex; flex-wrap:wrap; gap:4px 22px; margin:3px 0; }
  .m-box { border:1px solid #9ca3af; border-radius:4px; min-height:11mm; padding:4px 7px; margin:3px 0 6px; white-space:pre-wrap; }
  table.m-tb { width:100%; border-collapse:collapse; margin:4px 0 8px; font-size:11px; }
  .m-tb th, .m-tb td { border:1px solid #6b7280; padding:3px 5px; text-align:left; vertical-align:top; }
  .m-tb th { background:#f3f4f6; text-align:center; text-transform:uppercase; font-size:10.5px; }
  .m-tb thead { display:table-header-group; } .m-tb tr { page-break-inside:avoid; }
  .m-sign { display:flex; justify-content:space-around; text-align:center; margin-top:16px; font-weight:700; page-break-inside:avoid; }
  .m-sign small { display:block; font-weight:400; color:#555; font-size:10px; }
  .m-sign .gap { height:13mm; }
  .orange { color:#ea580c; }
`;
const cb = (on) => `<span class="cb">${on ? "✓" : ""}</span>`;
const mline = (label, value) => `<div class="m-line"><span>${label}</span> <b>${esc(value)}</b></div>`;
// Đầu form A4: logo + tên phòng khám bên trái, thông tin tham chiếu (mã hồ sơ, địa chỉ…) bên phải.
// logoOnly: chỉ logo bên trái (khi thông tin phòng khám đã nằm ở khối bên phải, như Form bệnh án).
const mhead = (refHtml, { logoOnly = false } = {}) => `<div class="m-head"><div class="m-logo">AĐ</div>
  ${logoOnly ? '<div class="m-co"></div>' : `<div class="m-co"><b>${esc(CLINIC.name)}</b><div>${esc(CLINIC.address)}</div><div>ĐT: ${esc(CLINIC.phone)}</div></div>`}
  <div class="m-ref">${refHtml}</div></div>`;

// ── Form chẩn đoán — Phiếu tư vấn khách hàng ────────────────────────────────────────────────
const HEALTH_ITEMS = [
  ["Hen Xuyễn (Asthma)", "Dị Ứng (Allergies)"],
  ["Máu Khó Đông (Hemophilia)", "Động Kinh (Epilepsy)"],
  ["Cao Huyết Áp (High Blood Pressure)", "Lao (Tuberculosis)"],
  ["Bệnh Lý Tuần Hoàn (Circulatory Problems)", "Tiểu Đường (Diabetes)"],
  ["Bệnh Lý Thận (Kidney Diseases)", "Hóa Trị (Chemotherapy)"],
  ["Bệnh Lý Hô Hấp (Respiratory Problems)", "Xạ Trị (Radiation Therapy)"],
  ["Bệnh Lý Tiêu Hóa (Digestive Problems)", "Khác (Others)"],
  ["Phụ Nữ Có Thai (Pregnancy)", "Phụ Nữ Cho Con Bú (Breastfeeding)"],
];

export function printDiagnosisForm(c, opts = {}) {
  // Chỉ điền những gì hồ sơ ghi rõ ràng; các ô sức khỏe để trống cho khách tự đánh dấu (không đoán từ văn bản).
  const hasAllergy = !!(c?.allergy || "").trim();
  const health = HEALTH_ITEMS.flat().map((label) => `<div>${cb(hasAllergy && label.startsWith("Dị Ứng"))}${label}</div>`).join("");
  const body = `<div class="m">
    ${mhead(`<div>Số Hồ Sơ (Code): <b>${esc(c?.code || "")}</b></div><div>Ngày Khám (Visit Date): <b>${esc(c ? fmtDate(todayStr()) : "")}</b></div>`)}
    <div class="m-title orange">PHIẾU TƯ VẤN KHÁCH HÀNG</div>
    <div class="m-sub orange">(PATIENT INFORMATION)</div>

    <div class="m-sec orange">Thông tin cá nhân (Patient Information)</div>
    <div class="m-grid">
      ${mline("Họ Và Tên (Name):", c?.name)}${mline("Giới Tính (Gender):", c?.gender)}
      ${mline("Ngày Sinh (Dob):", c?.dob ? fmtDate(c.dob) : "")}${mline("Nghề Nghiệp (Occupation):", c?.occupation)}
    </div>
    <div class="m-grid" style="grid-template-columns:1fr">${mline("Địa Chỉ (Address):", addressOf(c))}${mline("Email:", c?.email)}</div>

    <div class="m-q orange">Bạn Biết Đến Thẩm Mỹ Qua Thông Tin Nào (Referred By):</div>
    <div class="m-chk"><div>${cb(false)}Ti Vi (Tvs)</div><div>${cb(false)}Internet</div><div>${cb(false)}Báo Chí/ Tạp Chí (Newspaper/Magazine)</div><div>${cb(false)}Khác (Other)</div></div>

    <div class="m-sec orange">Tự đánh giá tình trạng sức khỏe toàn thân - Tiền sử y khoa (Medical History)</div>
    <div class="m-chk"><div>${cb(false)}Khỏe Mạnh (Normal)</div><div>${cb(false)}Có Vấn Đề (Problem)</div></div>
    <div class="m-q">Bạn Vui Lòng Đánh Dấu Vào Những Thông Tin Sau: (Please Check If You Have Or Have Any Of The Following):</div>
    <div class="m-grid" style="gap:5px 18px">${health}</div>
    ${c?.medicalHistory ? `<div class="m-q">Tiền sử đã ghi trong hồ sơ:</div><div class="m-box" style="min-height:0">${esc(c.medicalHistory)}</div>` : ""}

    <div class="m-q">Liệt Kê Các Loại Thuốc Bạn Đang Sử Dụng (Please List Any Medications You Are Currently Taking):</div><div class="m-box"></div>
    <div class="m-q">Bạn Có Dị Ứng Với Thuốc Không ? (Are You Allergic To Any Medications) ?</div><div class="m-box">${esc(c?.allergy || "")}</div>
    <div class="m-q">Bạn Đã Từng Phẫu Thuật Chưa? (Have You Ever Had An Operation?)</div><div class="m-box"></div>

    <div class="m-sec orange">Tiền sử thẩm mỹ (Detal History)</div>
    <div class="m-q">Những Vấn Đề Bạn Đang Gặp Phải (What Problems Are You Facing?)</div><div class="m-box" style="min-height:17mm"></div>

    <div class="m-sign"><div>Khách hàng<small>(ký, họ tên)</small><div class="gap"></div></div><div>Bác sĩ tư vấn<small>(ký, họ tên)</small><div class="gap"></div></div></div>
  </div>`;
  openPrintWindow(c ? `Form chẩn đoán - ${c.name}` : "Form chẩn đoán (mẫu trống)", body, { css: A4_CSS, base: false, preview: opts.preview });
}

// ── Form bệnh án (Tổng quát) ────────────────────────────────────────────────────────────────
const HISTORY_ITEMS = [
  "Huyết áp thấp", "Tim mạch", "Dị ứng, suyễn", "Gan, thận, dạ dày", "Lao",
  "Huyết áp cao", "Phổi", "Truyền nhiễm", "Tiểu đường", "Phản ứng thuốc",
  "Chảy máu răng", "Nghiến răng", "Răng nhạy cảm", "Tiếng kêu hoặc đau khớp", "Đã điều trị CHRM",
];
// Thứ tự hiển thị răng theo sơ đồ (hàm trên rồi hàm dưới)
const TOOTH_ORDER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

function toothRows(teeth) {
  const t = teeth || {};
  return TOOTH_ORDER
    .filter((n) => t[n] && ((t[n].state && t[n].state !== "healthy") || t[n].note))
    .map((n) => ({ n, state: TOOTH_STATE_LABELS[t[n].state] || "", note: t[n].note || "" }));
}

export function printMedicalRecord(c, opts = {}) {
  const teeth = padRows(toothRows(c?.teeth), 3).map((r, i) => r
    ? `<tr><td class="c">${i + 1}</td><td>${r.n}</td><td>${esc(r.state)}</td><td></td><td></td><td>${esc(r.note)}</td></tr>`
    : `<tr><td class="c">&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>`).join("");
  const treats = [...(c?.treatments || [])].sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
  const trRows = padRows(treats, 3).map((r, i) => r
    ? `<tr><td class="c">${i + 1}</td><td>${esc(fmtDate(r.date))}</td><td>${esc(r.doctor || "")}</td><td>${esc(r.support || r.tech || "")}</td><td>${esc([r.serviceName, r.content].filter(Boolean).join(" — "))}</td><td>${esc(r.diseaseNote || "")}</td></tr>`
    : `<tr><td class="c">&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>`).join("");
  const important = [c?.allergy && `Dị ứng: ${c.allergy}`, c?.medicalHistory && `Tiền sử: ${c.medicalHistory}`].filter(Boolean).join("\n");

  const body = `<div class="m">
    ${mhead(`<div><b>${esc(CLINIC.name)}</b></div><div>${esc(CLINIC.address)}</div><div>ĐT: ${esc(CLINIC.phone)}</div>`, { logoOnly: true })}
    <div class="m-title">FORM BỆNH ÁN (TỔNG QUÁT)</div>
    <div class="m-sub">${longDate(c ? (c.createdAt || todayStr()) : null)}</div>
    <div class="m-grid">
      ${mline("Khách Hàng:", c?.name)}${mline("Mã Khách Hàng:", c?.code)}
      ${mline("Ngày Sinh:", c?.dob ? fmtDate(c.dob) : "")}${mline("Giới Tính:", c?.gender)}
    </div>
    <div class="m-grid" style="grid-template-columns:1fr">${mline("Địa Chỉ:", addressOf(c))}</div>

    <div class="m-sec">A. Tình trạng răng</div>
    <table class="m-tb"><thead><tr><th style="width:9mm">#</th><th style="width:16mm">Răng</th><th>Tình trạng</th><th>Điều trị</th><th>Phân loại</th><th>Nội dung</th></tr></thead><tbody>${teeth}</tbody></table>

    <div class="m-sec">B. Tiền sử bệnh</div>
    <div class="m-grid" style="grid-template-columns:repeat(5,1fr);gap:7px 10px">${HISTORY_ITEMS.map((l) => `<div>${cb(false)}${l}</div>`).join("")}</div>
    <div class="m-q">Ghi chú quan trọng:</div><div class="m-box" style="min-height:10mm">${esc(important)}</div>

    <div class="m-sec">D. Lý do đến khám</div><div class="m-box"></div>
    <div class="m-sec">E. Đánh giá tình trạng</div><div class="m-box"></div>
    <div class="m-sec">F. Kế hoạch điều trị chung</div><div class="m-box"></div>

    <div class="m-sec">H. Thông tin điều trị</div>
    <table class="m-tb"><thead><tr><th style="width:9mm">#</th><th style="width:22mm">Ngày</th><th style="width:30mm">Bác sĩ</th><th style="width:26mm">Phụ tá</th><th>Nội dung điều trị</th><th style="width:32mm">Ghi chú</th></tr></thead><tbody>${trRows}</tbody></table>
  </div>`;
  openPrintWindow(c ? `Bệnh án - ${c.name}` : "Form bệnh án (mẫu trống)", body, { css: A4_CSS, base: false, preview: opts.preview });
}

// ── Danh sách mẫu (trang Cấu Hình → Cấu Hình Mẫu In) ────────────────────────────────────────
const SAMPLE_CUSTOMER = {
  name: "Nguyễn Văn A", code: "NDD00000001", phone: "0901 000 000", gender: "Nam", dob: "1990-05-20",
  address: "123 Đường Mẫu, Phường 1", province: "Thành phố Hồ Chí Minh", occupation: "Nhân viên văn phòng", email: "vana@example.com",
  allergy: "Dị ứng Penicillin", medicalHistory: "Cao huyết áp, đang dùng thuốc",
  createdAt: todayStr(),
  teeth: { 16: { state: "caries", note: "Sâu mặt nhai" }, 36: { state: "crown", note: "" }, 48: { state: "missing", note: "Đã nhổ" } },
  treatments: [
    { date: todayStr(), doctor: "Bác sĩ Mẫu", support: "Phụ tá Mẫu", serviceName: "Trám răng", content: "Trám răng 16", diseaseNote: "" },
  ],
};
const SAMPLE_INVOICE = {
  code: "HD000001", date: todayStr(), method: "Tiền mặt", paid: 1500000, total: 2300000, note: "Hóa đơn mẫu",
  items: [{ name: "Trám răng thẩm mỹ", qty: 2, price: 400000 }, { name: "Cạo vôi răng", qty: 1, price: 350000, discount: 50000 }, { name: "Tẩy trắng răng", qty: 1, price: 1200000 }],
};

export const PRINT_FORMS = [
  { id: "service-invoice", name: "Hóa đơn dịch vụ v2 (A5)", icon: "🧾", where: "Kế Toán → Hoá Đơn → nút in",
    desc: "Hóa đơn thanh toán dịch vụ: mã hàng, giảm giá, VAT, trừ cọc, còn lại.",
    sample: (o) => printInvoice(SAMPLE_INVOICE, SAMPLE_CUSTOMER, o), blank: (o) => printInvoice(null, null, o) },
  { id: "deposit", name: "Thu tiền cọc (A5)", icon: "💵", where: "In mẫu trống để viết tay",
    desc: "Phiếu thu tiền cọc của khách, có dòng viết số tiền bằng chữ.",
    sample: (o) => printDepositReceipt({ code: "PTC000001", date: todayStr(), method: "Tiền mặt", content: "Cọc lịch hẹn", amount: 500000 }, SAMPLE_CUSTOMER, o),
    blank: (o) => printDepositReceipt(null, null, o) },
  { id: "receipt", name: "Phiếu thu (A5)", icon: "🧾", where: "Hồ sơ khách → Thanh Toán → nút in ở mỗi đợt thu",
    desc: "Phiếu thu tiền của khách cho từng đợt thanh toán, có số tiền bằng chữ.",
    sample: (o) => printReceipt({ code: "HD20261109.001", date: todayStr(), paid: 1500000, method: "Chuyển khoản", note: "Thanh toán chi phí dịch vụ nha khoa", staff: "Lễ tân" }, SAMPLE_CUSTOMER, { ...o, debt: 800000 }),
    blank: (o) => printReceipt(null, null, o) },
  { id: "payment-voucher", name: "Phiếu chi (A5)", icon: "📤", where: "In mẫu trống để viết tay",
    desc: "Phiếu chi tiền: người nhận, lý do, số tiền, chữ ký giám đốc / kế toán / thủ quỹ.",
    sample: (o) => printPaymentVoucher({ code: "PC000001", date: todayStr(), receiver: "Nguyễn Văn B", reason: "Mua vật tư nha khoa", amount: 1250000, note: "", attached: "1 hóa đơn", original: "HĐ 0001234" }, o),
    blank: (o) => printPaymentVoucher(null, o) },
  { id: "prepaid-card", name: "Hóa đơn thẻ trả trước (A5)", icon: "💳", where: "In mẫu trống để viết tay",
    desc: "Phiếu thanh toán thẻ trả trước của khách.",
    sample: (o) => printPrepaidCard({ code: "HT000001", date: todayStr(), cardName: "Thẻ trả trước 5.000.000đ", amount: 5000000, content: "Nạp thẻ trả trước" }, SAMPLE_CUSTOMER, o),
    blank: (o) => printPrepaidCard(null, null, o) },
  { id: "diagnosis", name: "Form chẩn đoán (A4)", icon: "📋", where: "Hồ sơ khách hàng → nút In form chẩn đoán",
    desc: "Phiếu tư vấn khách hàng: thông tin cá nhân, tiền sử y khoa, tiền sử thẩm mỹ.",
    sample: (o) => printDiagnosisForm(SAMPLE_CUSTOMER, o), blank: (o) => printDiagnosisForm(null, o) },
  { id: "medical-record", name: "Form bệnh án - Tổng quát (A4)", icon: "🦷", where: "Hồ sơ khách hàng → nút In bệnh án",
    desc: "Bệnh án: tình trạng răng, tiền sử bệnh, lý do khám, kế hoạch và thông tin điều trị.",
    sample: (o) => printMedicalRecord(SAMPLE_CUSTOMER, o), blank: (o) => printMedicalRecord(null, o) },
];
