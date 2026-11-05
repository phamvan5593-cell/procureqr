/**
 * Menu quản trị trên Google Sheet (chỉ người có quyền sửa Sheet mới thấy).
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('ProcureQR')
    .addItem('1. Tạo / kiểm tra các tab', 'menuSetup')
    .addItem('2. Đặt mã PIN người dùng', 'menuSetPins')
    .addItem('3. Tính lại tồn kho', 'menuRecalcStock')
    .addSeparator()
    .addItem('Tạo dữ liệu mẫu (chỉ dùng cho bản TEST)', 'menuSeedDemo')
    .addItem('Trang trí bảng tính', 'makeSheetBeautiful')
    .addToUi();
}

function menuSetup() {
  setupSheets_();
  SpreadsheetApp.getUi().alert('✅ Đã tạo / kiểm tra đủ các tab: ' + Object.keys(SCHEMA).join(', '));
}

function setupSheets_() {
  SpreadsheetApp.getActiveSpreadsheet().setSpreadsheetTimeZone(TZ);
  Object.keys(SCHEMA).forEach(function (name) { ensureSheet_(name); });
  var cfg = readTable_('CauHinh');
  CONFIG_KEYS.forEach(function (k) {
    if (!findIn_(cfg.rows, 'Khóa', k)) appendRow_('CauHinh', { 'Khóa': k, 'Giá Trị': '' });
  });
}

function menuSetPins() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  USERS.forEach(function (u) {
    var has = props.getProperty('PIN_' + u.id) ? ' (đã có – bỏ trống để giữ nguyên)' : '';
    var res = ui.prompt('Mã PIN cho ' + u.name + has, 'Nhập 4–8 chữ số:', ui.ButtonSet.OK_CANCEL);
    if (res.getSelectedButton() !== ui.Button.OK) return;
    var pin = res.getResponseText().trim();
    if (!pin) return;
    if (!/^\d{4,8}$/.test(pin)) { ui.alert('PIN của ' + u.name + ' không hợp lệ, bỏ qua.'); return; }
    props.setProperty('PIN_' + u.id, hash_(pin));
  });
  ui.alert('✅ Đã lưu mã PIN.');
}

function menuRecalcStock() {
  recalcStock_();
  SpreadsheetApp.getUi().alert('✅ Đã tính lại tồn kho.');
}

function menuSeedDemo() {
  var ui = SpreadsheetApp.getUi();
  var ok = ui.alert('Tạo dữ liệu mẫu', 'Thao tác này XÓA toàn bộ dữ liệu trong các tab ProcureQR rồi tạo dữ liệu mẫu. Chỉ dùng cho bản TEST. Tiếp tục?', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  seedDemo_();
  ui.alert('✅ Đã tạo dữ liệu mẫu.');
}

/** Dữ liệu mẫu để thử và bàn giao. Tên NCC/khách hàng là giả định. */
function seedDemo_() {
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ensureSheet_(name);
    if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  });
  setupSheets_();
  var vanUser = { id: 'van', name: 'Vân', role: 'staff' };
  var thuyUser = { id: 'thuy', name: 'Thùy', role: 'staff' };
  var hoang = { id: 'hoang', name: 'Anh Hoàng', role: 'manager' };

  saveConfig_({ 'Tên Công Ty': 'CÔNG TY TNHH TM-KT SONG HIỆP LỢI', 'MST': '(điền MST)', 'Địa Chỉ': '(điền địa chỉ)',
                'Điện Thoại': '(điền SĐT)', 'Email': '', 'Người Liên Hệ Mua Hàng': 'Vân' }, vanUser);

  [
    ['CB-E2E-X5ME1', 'Cảm biến tiệm cận Omron E2E-X5ME1', 'Cái', 'Cảm biến', 2],
    ['CB-E3Z-D61',   'Cảm biến quang Omron E3Z-D61',      'Cái', 'Cảm biến', 2],
    ['BD-6204-2RS',  'Bạc đạn SKF 6204-2RS',              'Cái', 'Cơ khí',   10],
    ['RL-MY2N-24VDC','Relay Omron MY2N 24VDC',            'Cái', 'Điện',     5],
    ['CC-10A',       'Cầu chì ống 10A',                   'Cái', 'Điện',     20],
    ['XL-CDJ2B16-50','Xi lanh khí SMC CDJ2B16-50',        'Cái', 'Khí nén',  1],
    ['VA-SY5120',    'Van điện từ SMC SY5120-5DZ',        'Cái', 'Khí nén',  1],
    ['DC-B52',       'Dây curoa Bando B-52',              'Sợi', 'Cơ khí',   4]
  ].forEach(function (r) {
    saveItem_({ partNo: r[0], name: r[1], unit: r[2], group: r[3], minQty: r[4], isNew: true }, vanUser);
  });

  saveSupplier_({ name: 'Cty TNHH Thiết Bị Tự Động Minh Phát (mẫu)', contact: 'Anh Phát', phone: '0900000001' }, vanUser);
  saveSupplier_({ name: 'Cửa hàng Vòng Bi Sài Gòn (mẫu)', contact: 'Chị Lan', phone: '0900000002' }, vanUser);

  // Tồn đầu kỳ
  receiveStock_({ items: [
    { partNo: 'CB-E2E-X5ME1', qty: 3 }, { partNo: 'CB-E3Z-D61', qty: 1 }, { partNo: 'BD-6204-2RS', qty: 12 }, { partNo: 'RL-MY2N-24VDC', qty: 6 },
    { partNo: 'CC-10A', qty: 30 }, { partNo: 'DC-B52', qty: 2 }
  ], note: 'Tồn đầu kỳ (dữ liệu mẫu)' }, vanUser);

  // Khách hàng & máy đã bán (tên giả định)
  var kh1 = saveCustomer_({ name: 'Cty Chất Lượng – Xưởng A (mẫu)', contact: 'Anh Bình', phone: '0900000011' }, vanUser).id;
  var kh2 = saveCustomer_({ name: 'Cty CP SX VAB (mẫu)', contact: 'Chị Hạnh', phone: '0900000012' }, vanUser).id;
  var kh3 = saveCustomer_({ name: 'Cty Lộc Trời (mẫu)', contact: 'Anh Dũng', phone: '0900000013' }, vanUser).id;
  var m1 = saveMachine_({ customerId: kh1, name: 'Máy thổi tuýp số 2', model: 'TB-200', serial: 'SN2401', handoverDate: monthsAgo_(30), warrantyMonths: 12 }, vanUser).id;
  var m2 = saveMachine_({ customerId: kh2, name: 'Dây chuyền chai nhôm 1', model: 'AL-500', serial: 'SN2512', handoverDate: monthsAgo_(4), warrantyMonths: 24 }, vanUser).id;
  var m3 = saveMachine_({ customerId: kh2, name: 'Máy dập 3', model: 'DP-80', serial: 'SN2203', handoverDate: monthsAgo_(40), warrantyMonths: 12 }, vanUser).id;
  var m4 = saveMachine_({ customerId: kh3, name: 'Máy dập 3', model: 'DP-80', serial: 'SN2310', handoverDate: monthsAgo_(26), warrantyMonths: 12 }, vanUser).id;

  // Lịch sử lắp linh kiện cũ (để thử tra bảo hành)
  backdate_(issueStock_({ partNo: 'CB-E2E-X5ME1', qty: 1, machineId: m4, warrantyMonths: 6, note: 'Lắp lần trước (mẫu)' }, thuyUser).id, 9);
  backdate_(issueStock_({ partNo: 'CB-E3Z-D61', qty: 1, machineId: m1, warrantyMonths: 12, note: 'Lắp lần trước (mẫu)' }, thuyUser).id, 3);

  // PR → duyệt → PO → nhận hàng một phần
  var p1 = savePR_({ type: 'Sửa chữa tính phí', partNo: 'CB-E3Z-D61', qty: 2, machineId: m1, reason: 'Cảm biến báo lỗi chập chờn' }, thuyUser).id;
  var p2 = savePR_({ type: 'Sửa chữa tính phí', partNo: 'XL-CDJ2B16-50', qty: 1, machineId: m1, reason: 'Xi lanh xì hơi' }, thuyUser).id;
  var p3 = savePR_({ type: 'Bảo hành', partNo: 'DC-B52', qty: 4, machineId: m2, reason: 'Dây curoa mòn, máy còn bảo hành' }, vanUser).id;
  savePR_({ type: 'Bảo hành', partNo: 'VA-SY5120', qty: 1, machineId: m3, reason: 'Van kẹt, cần thay' }, vanUser);
  var p5 = savePR_({ type: 'Mua dự trữ kho', partNo: 'CC-10A', qty: 100, reason: 'Mua dự trữ' }, vanUser).id;
  var p6 = savePR_({ type: 'Bảo hành', partNo: 'CB-E2E-X5ME1', qty: 1, machineId: m4, reason: 'Khách báo cảm biến hư, đề nghị bảo hành', requester: 'Nguyễn Văn A' }, null).id;
  approvePR_({ id: p1 }, hoang);
  approvePR_({ id: p2 }, hoang);
  approvePR_({ id: p3 }, hoang);
  rejectPR_({ id: p5, note: 'Tồn còn nhiều, chưa cần mua' }, hoang);
  toQuotePR_({ id: p6, note: 'Cảm biến hết BH linh kiện, máy hết BH – báo giá khách' }, hoang);

  var po1 = createPO_({ supplier: 'Cty TNHH Thiết Bị Tự Động Minh Phát (mẫu)', items: [
    { prId: p1, qty: 2, price: 1250000 }, { prId: p2, qty: 1, price: 980000 }
  ], note: 'Giao tại xưởng' }, vanUser).id;
  setPOStatus_({ id: po1, status: PO_STATUS.SENT }, vanUser);
  receiveStock_({ poId: po1, items: [{ partNo: 'CB-E3Z-D61', prId: p1, qty: 2 }], note: 'Xi lanh giao sau' }, thuyUser);

  var po2 = createPO_({ supplier: 'Cửa hàng Vòng Bi Sài Gòn (mẫu)', items: [{ prId: p3, qty: 6, price: 85000 }] }, vanUser).id;

  // Xuất kho bảo trì
  issueStock_({ partNo: 'BD-6204-2RS', qty: 2, machineId: m2, warrantyMonths: 6 }, thuyUser);
  issueStock_({ partNo: 'CB-E3Z-D61', qty: 1, machineId: m1, warrantyMonths: 12 }, thuyUser);
  issueStock_({ partNo: 'CC-10A', qty: 5, customer: 'Khách lẻ – sửa tại xưởng', machine: 'Máy chiết rót BVTV', warrantyMonths: 0 }, vanUser);

  saveInvoice_({ poId: po1, invoiceNo: '0001234 (mẫu)', amount: 3480000 }, vanUser);
  return { po: [po1, po2] };
}

function monthsAgo_(n) {
  var d = new Date(); d.setMonth(d.getMonth() - n); return d;
}

/** Lùi thời gian một phiếu xuất (chỉ dùng cho dữ liệu mẫu) */
function backdate_(xkId, months) {
  var r = requireRow_('SoKho', 'Mã Phiếu', xkId);
  var t = monthsAgo_(months);
  var exp = '';
  if (num_(r['Số Tháng BH']) > 0) { exp = new Date(t); exp.setMonth(exp.getMonth() + num_(r['Số Tháng BH'])); }
  updateRow_('SoKho', r._row, { 'Thời Gian': t, 'Hạn BH': exp });
}

/** Giữ lại từ taosheet.gs cũ */
function makeSheetBeautiful() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(function (sheet) {
    if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
      styleHeader_(sheet);
      sheet.setRowHeight(1, 35);
      sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 20), sheet.getLastColumn())
        .setFontFamily('Roboto').setFontSize(10)
        .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
    }
  });
  SpreadsheetApp.getUi().alert('✨ Đã trang trí lại bảng tính.');
}
