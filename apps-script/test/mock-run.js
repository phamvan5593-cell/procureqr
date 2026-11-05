// Chạy thử backend Apps Script trên máy bằng Google Sheet giả lập (không cần mạng).
// Cách chạy: node apps-script/test/mock-run.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

function chain() { const p = new Proxy(function () {}, { get: (o, k) => (k === 'build' ? () => ({}) : () => p) }); return p; }
function makeSheet(name) {
  const data = []; // mảng 2 chiều
  const width = () => data.reduce((m, r) => Math.max(m, r.length), 0);
  const sh = {
    name, data,
    getName: () => name,
    getLastRow: () => { for (let i = data.length - 1; i >= 0; i--) if (data[i].some(c => c !== '' && c !== null && c !== undefined)) return i + 1; return 0; },
    getLastColumn: () => { let m = 0; data.forEach(r => r.forEach((c, j) => { if (c !== '' && c !== undefined) m = Math.max(m, j + 1); })); return m; },
    getRange(r, c, nr = 1, nc = 1) {
      const cell = (i, j) => { while (data.length < i) data.push([]); const row = data[i - 1]; while (row.length < j) row.push(''); return row; };
      const api = {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const row = data[r - 1 + i] || []; const v = row[c - 1 + j]; return v === undefined ? '' : v; })),
        setValues: v => { v.forEach((row, i) => row.forEach((x, j) => { cell(r + i, c + j)[c - 1 + j] = x; })); return api; },
        setValue: x => { cell(r, c)[c - 1] = x; return api; },
        clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) cell(r + i, c + j)[c - 1 + j] = ''; return api; }
      };
      ['setBackground', 'setFontColor', 'setFontWeight', 'setHorizontalAlignment', 'setVerticalAlignment', 'setFontFamily', 'setFontSize', 'setBorder', 'setDataValidation', 'setNumberFormat'].forEach(m => api[m] = () => api);
      return api;
    },
    appendRow: row => { data.length = sh.getLastRow(); data.push(row.slice()); },
    deleteRow: r => { data.splice(r - 1, 1); },
    deleteRows: (r, n) => { data.splice(r - 1, n); },
    setFrozenRows: () => {}, setRowHeight: () => {}, getBandings: () => [], getMaxRows: () => 1000,
    getDataRange: () => sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), Math.max(sh.getLastColumn(), 1)),
    getProtections: () => [], protect: () => chain()
  };
  return sh;
}

const sheets = {};
const ss = {
  getName: () => 'ProcureQR TEST mock', setSpreadsheetTimeZone: () => {},
  getSheetByName: n => sheets[n] || null,
  insertSheet: n => (sheets[n] = makeSheet(n)),
  getSheets: () => Object.values(sheets)
};
const props = {}; const cache = {}; const files = [];
const ctx = {
  console,
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {}, getUi: () => ({ alert() {} }), BorderStyle: {}, ProtectionType: {}, newDataValidation: () => chain() },
  Utilities: {
    formatDate: (d, tz, f) => f === 'yyyy' ? String(d.getFullYear()) : d.toISOString().slice(0, 10),
    getUuid: () => crypto.randomUUID(),
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, s) => [...crypto.createHash('sha256').update(s, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
    base64Decode: s => [...Buffer.from(s, 'base64')],
    newBlob: (bytes, mime, name) => ({ bytes, mime, name })
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ put: (k, v) => (cache[k] = v), get: k => cache[k] || null }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => (props[k] = v) }) },
  DriveApp: {
    getFolderById: id => ({ createFile: b => { files.push(b); return { getUrl: () => 'https://drive.google.com/file/d/mock' + files.length }; } }),
    createFolder: name => ({ getId: () => 'mockFolder', createFile: b => { files.push(b); return { getUrl: () => 'https://drive.google.com/file/d/mock' + files.length }; } })
  },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) }
};
vm.createContext(ctx);
const src = path.join(__dirname, '..', 'src');
['Code.gs', 'QuanTri.gs'].forEach(f => vm.runInContext(fs.readFileSync(path.join(src, f), 'utf8'), ctx, { filename: f }));

let fail = 0;
function check(label, cond) { console.log((cond ? '  ✓ ' : '  ✗ ') + label); if (!cond) fail++; }
const resetCache = () => vm.runInContext("SHEET_CACHE_ = {}; TABLE_CACHE_ = {}; SHEET_MAP_ = null;", ctx); // mỗi request Apps Script chạy mới
function post(action, data, token) {
  resetCache();
  const out = ctx.doPost({ postData: { contents: JSON.stringify({ action, data, token }) } });
  return JSON.parse(out.s);
}
const T = n => { resetCache(); return vm.runInContext(`readTable_('${n}').rows`, ctx); };

console.log('1) Tạo dữ liệu mẫu');
vm.runInContext('seedDemo_()', ctx);
check('Danh mục có 8 vật tư', T('DanhMucVatTu').length === 8);
check('PR có 6 phiếu', T('PR').length === 6);
check('Có 3 khách hàng, 4 máy', T('KhachHang').length === 3 && T('MayKhachHang').length === 4);
const prs = T('PR');
check('PR cảm biến máy thổi (thay 3 tháng trước, BH 12T) = Còn BH linh kiện', prs[0]['Tình Trạng BH'] === 'Còn BH linh kiện');
check('PR dây curoa máy mới bàn giao 4 tháng (BH máy 24T) = Còn BH máy', prs[2]['Tình Trạng BH'] === 'Còn BH máy');
check('PR van máy dập VAB (máy hết BH, chưa thay) = Hết BH', prs[3]['Tình Trạng BH'] === 'Hết BH');
check('PR mua dự trữ không kiểm BH', prs[4]['Tình Trạng BH'] === '');
check('PR cảm biến Lộc Trời (lắp 9 tháng trước, BH 6T) = Hết BH và Chờ báo giá KH', prs[5]['Tình Trạng BH'] === 'Hết BH' && prs[5]['Trạng Thái'] === 'Chờ báo giá KH');
check('PR lưu tồn kho lúc đề xuất', prs[5]['Tồn Lúc Đề Xuất'] === 2);
check('Mã PR dạng PR-yyyy-0001', /^PR-\d{4}-0001$/.test(T('PR')[0]['Mã PR']));
check('Có 2 PO', T('PO').length === 2);
const po1 = T('PO')[0];
check('PO1 nhận 1 phần', po1['Trạng Thái'] === 'Nhận 1 phần');
check('PO1 tổng tiền = 2*1.250.000 + 980.000', po1['Tổng Tiền'] === 3480000);
const ton = Object.fromEntries(T('TonKho').map(r => [r['Mã Part'], r['Tồn Kho']]));
check('Tồn CB-E3Z-D61 = 1 - 1 + 2 - 1 = 1', ton['CB-E3Z-D61'] === 1);
check('Tồn CB-E2E-X5ME1 = 3 - 1 = 2', ton['CB-E2E-X5ME1'] === 2);
check('Tồn BD-6204-2RS = 12 - 2 = 10', ton['BD-6204-2RS'] === 10);
check('Tồn CC-10A = 30 - 5 = 25', ton['CC-10A'] === 25);
check('PR bị từ chối có ghi chú', T('PR').some(r => r['Trạng Thái'] === 'Từ Chối' && r['Ghi Chú Duyệt']));
check('Hóa đơn PO1 đã lưu', T('HoaDon').length === 1);

vm.runInContext('applyValidation_()', ctx);
check('Thêm ô chọn / lịch chạy không lỗi', true);

console.log('2) Đăng nhập & phân quyền qua doPost');
props['PIN_van'] = vm.runInContext("hash_('1111')", ctx);
props['PIN_hoang'] = vm.runInContext("hash_('2222')", ctx);
check('Sai PIN bị từ chối', post('login', { user: 'van', pin: '0000' }).ok === false);
const tv = post('login', { user: 'van', pin: '1111' }).data.token;
const th = post('login', { user: 'hoang', pin: '2222' }).data.token;
check('Đăng nhập đúng PIN có token', !!tv && !!th);
const pub = post('getData', {});
check('Chưa đăng nhập: không thấy PO / giá', pub.ok && pub.data.po === undefined && pub.data.invoices === undefined);
check('Chưa đăng nhập: thấy PR và tồn kho', pub.data.pr.length >= 5 && pub.data.stock.length === 8);
check('Không đăng nhập: tạo PR được nếu ghi tên', post('savePR', { partNo: 'CC-10A', qty: 1, reason: 'x', requester: 'Tuấn – Kỹ thuật', customer: 'Khách lẻ', machine: 'Máy X' }).ok);
check('Không đăng nhập: thiếu tên người đề xuất bị chặn', post('savePR', { partNo: 'CC-10A', qty: 1, reason: 'x' }).ok === false);
check('Không đăng nhập: không tạo PO được', post('createPO', { supplier: 'x', items: [] }).ok === false);
check('Không đăng nhập: không duyệt được', post('approvePR', { id: 'PR-x' }).ok === false);
const newPr = post('savePR', { partNo: 'cc-10a', qty: 3, reason: 'Thử', customer: 'KH thử', machine: 'Máy thử' }, tv);
check('Vân tạo PR được (mã part chữ thường vẫn nhận)', newPr.ok);
check('Vân KHÔNG duyệt được PR', post('approvePR', { id: newPr.data.id }, tv).ok === false);
check('Anh Hoàng duyệt được PR', post('approvePR', { id: newPr.data.id }, th).ok);
check('Vật tư ngoài danh mục bị chặn', post('savePR', { partNo: 'XYZ', qty: 1, reason: 'x' }, tv).ok === false);

console.log('3) Kho');
check('Anh Hoàng KHÔNG nhập kho được', post('receiveStock', { items: [{ partNo: 'CC-10A', qty: 1 }] }, th).ok === false);
check('Anh Hoàng KHÔNG xuất kho được', post('issueStock', { partNo: 'CC-10A', qty: 1, customer: 'A', machine: 'B' }, th).ok === false);
const rv = post('receiveStock', { items: [{ partNo: 'CC-10A', qty: 1 }], performer: '' }, tv);
check('Nhập kho ghi Người nhập liệu = người đăng nhập', rv.ok && T('SoKho').find(r => r['Mã Phiếu'] === rv.data.id)['Người Nhập Liệu'] === 'Vân');
check('Xuất quá tồn bị chặn', post('issueStock', { partNo: 'DC-B52', qty: 99, customer: 'A', machine: 'B' }, tv).ok === false);
check('Xuất thiếu khách hàng bị chặn', post('issueStock', { partNo: 'CC-10A', qty: 1, machine: 'B' }, tv).ok === false);
const po2 = T('PO')[1]['Mã PO'];
check('Nhập theo PO chưa phát hành vẫn được (nhận sớm)', post('receiveStock', { poId: po2, items: [{ partNo: 'DC-B52', qty: 6, prId: T('PO_ChiTiet').find(l => l['Mã PO'] === po2)['Mã PR'] }] }, tv).ok);
check('PO2 thành Đã nhận đủ', T('PO')[1]['Trạng Thái'] === 'Đã nhận đủ');
check('PR của PO2 thành Đã Nhận Hàng', T('PR').some(r => r['Mã PO'] === po2 && r['Trạng Thái'] === 'Đã Nhận Hàng'));
check('Tồn DC-B52 = 2 + 6 = 8', T('TonKho').find(r => r['Mã Part'] === 'DC-B52')['Tồn Kho'] === 8);

console.log('4) PO');
const pr6 = newPr.data.id;
const c = post('createPO', { supplier: 'NCC thử', items: [{ prId: pr6, qty: 3, price: 1000 }] }, tv);
check('Tạo PO từ PR vừa duyệt', c.ok);
check('Không tạo PO lần 2 cho cùng PR', post('createPO', { supplier: 'NCC thử', items: [{ prId: pr6, qty: 3, price: 1000 }] }, tv).ok === false);
check('Sửa giá khi chờ phát hành', post('updatePOItem', { poId: c.data.id, partNo: 'CC-10A', prId: pr6, qty: 4, price: 2000 }, tv).ok);
check('Tổng tiền cập nhật = 8000', T('PO').find(p => p['Mã PO'] === c.data.id)['Tổng Tiền'] === 8000);
check('Hủy PO trả PR về Đã Duyệt', post('setPOStatus', { id: c.data.id, status: 'Đã hủy' }, tv).ok && T('PR').find(r => r['Mã PR'] === pr6)['Trạng Thái'] === 'Đã Duyệt');

console.log('4b) Bảo hành & báo giá');
const wq = post('checkWarranty', { machineId: T('MayKhachHang')[3]['Mã Máy'], partNo: 'CB-E2E-X5ME1' });
check('Tra BH không cần đăng nhập', wq.ok && wq.data.status === 'Hết BH');
const pubD = post('getData', {}).data;
check('Không đăng nhập: danh sách KH không có SĐT', pubD.customers.length === 3 && pubD.customers[0]['SĐT/Zalo'] === undefined);
check('Không đăng nhập: có lịch sử lắp để tra BH', pubD.warranty.length >= 4 && pubD.warranty[0]['Đơn Giá VAT'] === undefined);
const q = prs[5]['Mã PR'];
check('Báo KH kết quả trước khi gửi BG bị chặn', post('quoteResult', { id: q, accepted: true }, tv).ok === false);
check('Ghi nhận đã gửi báo giá', post('quoteSent', { id: q, quoteNo: 'BG-001' }, tv).ok && T('PR')[5]['Trạng Thái'] === 'Đã gửi báo giá');
check('KH đồng ý → Đã Duyệt, loại Sửa chữa tính phí', post('quoteResult', { id: q, accepted: true, note: 'OK qua Zalo' }, tv).ok && T('PR')[5]['Trạng Thái'] === 'Đã Duyệt' && T('PR')[5]['Loại'] === 'Sửa chữa tính phí');
check('Xuất kho theo PR đã duyệt → PR Đã xuất kho', post('issueStock', { partNo: 'CB-E2E-X5ME1', qty: 1, machineId: T('MayKhachHang')[3]['Mã Máy'], warrantyMonths: 6, prId: q }, tv).ok && T('PR')[5]['Trạng Thái'] === 'Đã xuất kho');
const wq2 = post('checkWarranty', { machineId: T('MayKhachHang')[3]['Mã Máy'], partNo: 'CB-E2E-X5ME1' });
check('Sau khi thay mới, tra lại = Còn BH linh kiện', wq2.data.status === 'Còn BH linh kiện');
check('PR thiếu khách hàng (không phải dự trữ) bị chặn', post('savePR', { type: 'Bảo hành', partNo: 'CC-10A', qty: 1, reason: 'x', requester: 'A' }).ok === false);

check('Lệnh ghi trả kèm dữ liệu mới (all)', post('savePR', { type: 'Mua dự trữ kho', partNo: 'CC-10A', qty: 1, reason: 'kiểm tra all' }, tv).all.pr.some(r => r['Lý Do'] === 'kiểm tra all'));

console.log('5) Đọc/ghi theo tên cột (chèn cột lạ vào giữa)');
const prSh = sheets['PR'];
prSh.data.forEach((row, i) => row.splice(2, 0, i === 0 ? 'Cột Chèn Thêm' : 'zz'));
const r2 = post('savePR', { type: 'Mua dự trữ kho', partNo: 'CC-10A', qty: 1, reason: 'Sau khi chèn cột' }, tv);
const last = T('PR').find(r => r['Mã PR'] === r2.data.id);
check('Sau khi chèn cột, PR mới vẫn đúng cột', r2.ok && last['Lý Do'] === 'Sau khi chèn cột' && last['Tên Vật Tư'] === 'Cầu chì ống 10A');

console.log(fail ? `\n❌ ${fail} kiểm tra lỗi` : '\n✅ Tất cả kiểm tra đều đạt');
process.exit(fail ? 1 : 0);
