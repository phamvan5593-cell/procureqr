/**
 * ProcureQR v3.1 – Backend Google Apps Script (gắn vào Google Sheet)
 * Công ty TNHH TM-KT Song Hiệp Lợi
 *
 * Nguyên tắc:
 *  - Sheet là nguồn dữ liệu duy nhất. Mọi cột được đọc/ghi THEO TÊN TIÊU ĐỀ, không theo số thứ tự.
 *  - Mọi thao tác ghi đều khoá (LockService) để 2 người bấm cùng lúc không trùng mã.
 *  - Mã PIN người dùng lưu trong Script Properties (dạng băm), KHÔNG nằm trong code web.
 */

var APP_VERSION = '3.1.0';
var TZ = 'Asia/Ho_Chi_Minh';
var DEFAULT_VAT_FOLDER_ID = '14-gWx5bo7VP2YFAKs96j2fxKavCIsFrX';
var TOKEN_TTL = 21600; // 6 giờ (tối đa của CacheService)

// ===================== CẤU TRÚC BẢNG =====================
var SCHEMA = {
  CauHinh:      ['Khóa', 'Giá Trị'],
  DanhMucVatTu: ['Mã Part', 'Tên Vật Tư', 'Đơn Vị Tính', 'Nhóm', 'Tồn Tối Thiểu', 'Ghi Chú'],
  NhaCungCap:   ['Mã NCC', 'Tên NCC', 'Người Liên Hệ', 'SĐT/Zalo', 'MST', 'Địa Chỉ'],
  KhachHang:    ['Mã KH', 'Tên KH', 'Người Liên Hệ', 'SĐT/Zalo', 'MST', 'Địa Chỉ', 'Ghi Chú'],
  MayKhachHang: ['Mã Máy', 'Mã KH', 'Tên KH', 'Tên Máy', 'Model', 'Số Serial', 'Ngày Bàn Giao',
                 'Số Tháng BH Máy', 'Hạn BH Máy', 'Ghi Chú'],
  PR:           ['Mã PR', 'Ngày Tạo', 'Người Đề Xuất', 'Loại', 'Mã KH', 'Khách Hàng', 'Mã Máy', 'Tên Máy',
                 'Mã Part', 'Tên Vật Tư', 'Số Lượng', 'Lý Do', 'Tình Trạng BH', 'Chi Tiết BH', 'Tồn Lúc Đề Xuất',
                 'Trạng Thái', 'Người Duyệt', 'Thời Gian Duyệt', 'Ghi Chú Duyệt',
                 'Số Báo Giá', 'Ngày Gửi BG', 'Kết Quả BG', 'Mã PO', 'Người Tạo'],
  PO:           ['Mã PO', 'Ngày Tạo', 'Nhà Cung Cấp', 'Tổng Tiền', 'Trạng Thái', 'Ngày Phát Hành',
                 'Ghi Chú', 'Người Tạo'],
  PO_ChiTiet:   ['Mã PO', 'Mã PR', 'Mã Part', 'Tên Vật Tư', 'SL Đặt', 'Đơn Giá VAT', 'Thành Tiền', 'SL Đã Nhận'],
  SoKho:        ['Mã Phiếu', 'Thời Gian', 'Loại', 'Mã Part', 'Tên Vật Tư', 'Số Lượng', 'Mã PO',
                 'Mã KH', 'Khách Hàng', 'Mã Máy', 'Tên Máy', 'Số Tháng BH', 'Hạn BH', 'Mã PR',
                 'Người Thực Hiện', 'Ghi Chú', 'Người Nhập Liệu'],
  TonKho:       ['Mã Part', 'Tên Vật Tư', 'Đơn Vị Tính', 'Tồn Kho', 'Tồn Tối Thiểu', 'Cập Nhật Cuối'],
  HoaDon:       ['Mã PO', 'Số Hóa Đơn', 'Nhà Cung Cấp', 'Tổng Tiền', 'Ngày Nhận HĐ', 'Tên File', 'Link File',
                 'Trạng Thái Thanh Toán', 'Ngày Thanh Toán', 'Người Cập Nhật']
};

var CONFIG_KEYS = ['Tên Công Ty', 'MST', 'Địa Chỉ', 'Điện Thoại', 'Email', 'Người Liên Hệ Mua Hàng'];

// Người dùng cố định. role: staff = thao tác; manager = thao tác + duyệt PR.
var USERS = [
  { id: 'van',   name: 'Vân',       role: 'staff' },
  { id: 'thuy',  name: 'Thùy',      role: 'staff' },
  { id: 'hoang', name: 'Anh Hoàng', role: 'manager' }
];

var PR_STATUS = { WAIT: 'Chờ Duyệt', OK: 'Đã Duyệt', REJECT: 'Từ Chối', ORDERED: 'Đã Đặt Hàng', DONE: 'Đã Nhận Hàng',
                  QUOTE: 'Chờ báo giá KH', QUOTE_SENT: 'Đã gửi báo giá', QUOTE_NO: 'KH không đồng ý', ISSUED: 'Đã xuất kho' };
var PR_TYPES = ['Bảo hành', 'Sửa chữa tính phí', 'Mua dự trữ kho'];
var WARRANTY = { PART: 'Còn BH linh kiện', MACHINE: 'Còn BH máy', EXPIRED: 'Hết BH', NONE: 'Chưa có lịch sử', NA: '' };
var PO_STATUS = { DRAFT: 'Chờ phát hành', SENT: 'Đã phát hành', PART: 'Nhận 1 phần', DONE: 'Đã nhận đủ', CANCEL: 'Đã hủy' };

// ===================== ĐIỂM VÀO WEB APP =====================
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getData';
  if (action === 'ping') return json_({ ok: true, version: APP_VERSION });
  return json_({ ok: true, data: getData_(null) });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var action = req.action;
    var user = req.token ? userFromToken_(req.token) : null;

    if (action === 'ping') return json_({ ok: true, version: APP_VERSION });
    if (action === 'login') return json_({ ok: true, data: login_(req.data || {}) });
    if (action === 'getData') return json_({ ok: true, data: getData_(user) });

    var handler = ACTIONS[action];
    if (!handler) throw new Error('Lệnh không hợp lệ: ' + action);
    if (!user && handler.role !== 'public') throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (handler.role === 'manager' && user.role !== 'manager') {
      throw new Error('Chỉ ' + managerNames_() + ' mới có quyền thực hiện thao tác này.');
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var result = handler.fn(req.data || {}, user);
      SpreadsheetApp.flush();
      return json_({ ok: true, data: result });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

var ACTIONS = {
  logout:        { fn: logout_ },
  changePin:     { fn: changePin_ },
  savePR:        { fn: savePR_, role: 'public' }, // nhân viên không cần đăng nhập vẫn tạo được PR
  approvePR:     { fn: approvePR_, role: 'manager' },
  rejectPR:      { fn: rejectPR_,  role: 'manager' },
  toQuotePR:     { fn: toQuotePR_, role: 'manager' },
  quoteSent:     { fn: quoteSent_ },
  quoteResult:   { fn: quoteResult_ },
  deletePR:      { fn: deletePR_ },
  checkWarranty: { fn: checkWarranty_, role: 'public' },
  saveCustomer:  { fn: saveCustomer_ },
  saveMachine:   { fn: saveMachine_ },
  resetDemo:     { fn: resetDemo_, role: 'manager' }, // chỉ chạy được trên bản TEST
  createPO:      { fn: createPO_ },
  updatePOItem:  { fn: updatePOItem_ },
  setPOStatus:   { fn: setPOStatus_ },
  receiveStock:  { fn: receiveStock_ },
  issueStock:    { fn: issueStock_ },
  saveItem:      { fn: saveItem_ },
  saveSupplier:  { fn: saveSupplier_ },
  saveConfig:    { fn: saveConfig_ },
  saveInvoice:   { fn: saveInvoice_ },
  setPaid:       { fn: setPaid_ }
};

// ===================== ĐỌC DỮ LIỆU =====================
function getData_(user) {
  var out = {
    version: APP_VERSION,
    user: user,
    users: USERS.map(function (u) { return { id: u.id, name: u.name, role: u.role }; }),
    config: readConfig_(),
    items: readTable_('DanhMucVatTu').rows,
    stock: readTable_('TonKho').rows,
    pr: readTable_('PR').rows,
    prTypes: PR_TYPES
  };
  var customers = readTable_('KhachHang').rows;
  var machines = readTable_('MayKhachHang').rows;
  var ledger = readTable_('SoKho').rows;
  // Người chỉ xem (chưa đăng nhập): PR, danh mục, tồn kho, danh sách KH/máy (không SĐT, địa chỉ)
  // và lịch sử lắp linh kiện để tra bảo hành (không có giá).
  out.customers = customers.map(function (c) { return { 'Mã KH': c['Mã KH'], 'Tên KH': c['Tên KH'] }; });
  out.machines = machines;
  out.warranty = ledger.filter(function (r) { return r['Loại'] === 'XUẤT'; }).map(function (r) {
    return pick_(r, ['Mã Phiếu', 'Thời Gian', 'Mã Part', 'Tên Vật Tư', 'Số Lượng', 'Mã KH', 'Khách Hàng', 'Mã Máy',
                     'Tên Máy', 'Số Tháng BH', 'Hạn BH', 'Người Thực Hiện']);
  });
  if (user) {
    out.customers = customers;
    out.suppliers = readTable_('NhaCungCap').rows;
    out.po = readTable_('PO').rows;
    out.poItems = readTable_('PO_ChiTiet').rows;
    out.ledger = ledger;
    out.invoices = readTable_('HoaDon').rows;
  }
  return out;
}

// ===================== ĐĂNG NHẬP =====================
function login_(d) {
  var u = findUser_(d.user);
  if (!u) throw new Error('Không tìm thấy người dùng.');
  var stored = PropertiesService.getScriptProperties().getProperty('PIN_' + u.id);
  if (!stored) throw new Error('Chưa đặt mã PIN cho ' + u.name + '. Nhờ quản trị vào Sheet → menu ProcureQR → Đặt mã PIN.');
  if (hash_(String(d.pin || '')) !== stored) throw new Error('Mã PIN không đúng.');
  var token = Utilities.getUuid();
  var info = { id: u.id, name: u.name, role: u.role };
  CacheService.getScriptCache().put('tok_' + token, JSON.stringify(info), TOKEN_TTL);
  return { token: token, user: info };
}

function logout_(d, user) {
  return true;
}

function changePin_(d, user) {
  var props = PropertiesService.getScriptProperties();
  if (hash_(String(d.oldPin || '')) !== props.getProperty('PIN_' + user.id)) throw new Error('Mã PIN cũ không đúng.');
  if (!/^\d{4,8}$/.test(String(d.newPin || ''))) throw new Error('Mã PIN mới phải gồm 4–8 chữ số.');
  props.setProperty('PIN_' + user.id, hash_(String(d.newPin)));
  return true;
}

function userFromToken_(token) {
  var raw = CacheService.getScriptCache().get('tok_' + token);
  return raw ? JSON.parse(raw) : null;
}

function findUser_(id) {
  for (var i = 0; i < USERS.length; i++) if (USERS[i].id === id) return USERS[i];
  return null;
}

function managerNames_() {
  return USERS.filter(function (u) { return u.role === 'manager'; }).map(function (u) { return u.name; }).join(', ');
}

function hash_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'procureqr:' + s, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

// ===================== PR – PHIẾU ĐỀ XUẤT =====================
function savePR_(d, user) {
  var item = requireItem_(d.partNo);
  var qty = positiveNumber_(d.qty, 'Số lượng');
  var type = str_(d.type) || PR_TYPES[0];
  if (PR_TYPES.indexOf(type) < 0) throw new Error('Loại đề xuất không hợp lệ.');
  if (!str_(d.reason)) throw new Error('Vui lòng nhập lý do đề xuất.');
  if (!user && !str_(d.requester)) throw new Error('Vui lòng ghi tên người đề xuất.');
  var target = resolveTarget_(d);
  if (type !== 'Mua dự trữ kho' && !target.customer) throw new Error('Vui lòng chọn khách hàng / máy.');
  var w = type === 'Mua dự trữ kho' ? { status: WARRANTY.NA, detail: '' } : warrantyFor_(target.machineId, item['Mã Part'], target.customer, target.machine);
  var id = nextId_('PR', 'PR', 'Mã PR');
  appendRow_('PR', {
    'Mã PR': id,
    'Ngày Tạo': new Date(),
    'Người Đề Xuất': str_(d.requester) || user.name,
    'Loại': type,
    'Mã KH': target.customerId,
    'Khách Hàng': target.customer,
    'Mã Máy': target.machineId,
    'Tên Máy': target.machine,
    'Mã Part': item['Mã Part'],
    'Tên Vật Tư': item['Tên Vật Tư'],
    'Số Lượng': qty,
    'Lý Do': str_(d.reason),
    'Tình Trạng BH': w.status,
    'Chi Tiết BH': w.detail,
    'Tồn Lúc Đề Xuất': stockOf_(item['Mã Part']),
    'Trạng Thái': PR_STATUS.WAIT,
    'Người Tạo': user ? user.name : '(nhân viên – không đăng nhập)'
  });
  return { id: id, warranty: w };
}

/** Từ chọn máy trong danh sách (machineId) hoặc chữ tự gõ → mã/tên KH và máy. */
function resolveTarget_(d) {
  var t = { customerId: '', customer: str_(d.customer), machineId: '', machine: str_(d.machine) };
  if (str_(d.machineId)) {
    var m = findIn_(readTable_('MayKhachHang').rows, 'Mã Máy', d.machineId);
    if (!m) throw new Error('Không tìm thấy máy ' + d.machineId);
    t.machineId = m['Mã Máy']; t.machine = m['Tên Máy'] + (m['Số Serial'] ? ' (S/N ' + m['Số Serial'] + ')' : '');
    t.customerId = m['Mã KH']; t.customer = m['Tên KH'];
  } else if (str_(d.customerId)) {
    var c = findIn_(readTable_('KhachHang').rows, 'Mã KH', d.customerId);
    if (c) { t.customerId = c['Mã KH']; t.customer = c['Tên KH']; }
  }
  return t;
}

// ===================== BẢO HÀNH =====================
function checkWarranty_(d) {
  var t = resolveTarget_(d);
  return warrantyFor_(t.machineId, str_(d.partNo).toUpperCase(), t.customer, t.machine);
}

/**
 * Kiểm tra bảo hành của 1 linh kiện trên 1 máy:
 *  1. Lần gần nhất xuất kho đúng mã linh kiện đó cho đúng máy đó còn hạn BH → Còn BH linh kiện
 *  2. Không thì nếu bản thân máy còn hạn BH máy → Còn BH máy
 *  3. Có lịch sử nhưng hết hạn → Hết BH;  không có gì → Chưa có lịch sử
 */
function warrantyFor_(machineId, partNo, customer, machineName) {
  var now = new Date();
  var norm = function (s) { return str_(s).toLowerCase().replace(/\s+/g, ' '); };
  var issues = readTable_('SoKho').rows.filter(function (r) {
    if (r['Loại'] !== 'XUẤT' || r['Mã Part'] !== partNo) return false;
    if (machineId) return r['Mã Máy'] === machineId;
    return customer && norm(r['Khách Hàng']) === norm(customer) && norm(r['Tên Máy']) === norm(machineName);
  }).sort(function (a, b) { return String(b['Thời Gian']).localeCompare(String(a['Thời Gian'])); });
  var last = issues[0];
  if (last && num_(last['Số Tháng BH']) > 0 && new Date(last['Hạn BH']) >= now) {
    return { status: WARRANTY.PART, detail: 'Lắp ' + fmt_(last['Thời Gian']) + ' (' + last['Mã Phiếu'] + '), BH ' + last['Số Tháng BH'] + ' tháng, hạn ' + fmt_(last['Hạn BH']), last: last };
  }
  var m = machineId ? findIn_(readTable_('MayKhachHang').rows, 'Mã Máy', machineId) : null;
  if (m && m['Hạn BH Máy'] && new Date(m['Hạn BH Máy']) >= now) {
    return { status: WARRANTY.MACHINE, detail: 'Máy bàn giao ' + fmt_(m['Ngày Bàn Giao']) + ', BH máy tới ' + fmt_(m['Hạn BH Máy']), last: last || null };
  }
  if (last) {
    var why = num_(last['Số Tháng BH']) > 0 ? 'hết hạn ' + fmt_(last['Hạn BH']) : 'lần lắp trước không bảo hành';
    return { status: WARRANTY.EXPIRED, detail: 'Lắp ' + fmt_(last['Thời Gian']) + ' (' + last['Mã Phiếu'] + '), ' + why
             + (m && m['Hạn BH Máy'] ? '; BH máy hết ' + fmt_(m['Hạn BH Máy']) : ''), last: last };
  }
  if (m && m['Hạn BH Máy']) return { status: WARRANTY.EXPIRED, detail: 'Chưa thay linh kiện này; BH máy đã hết ' + fmt_(m['Hạn BH Máy']), last: null };
  return { status: WARRANTY.NONE, detail: machineId ? 'Chưa từng lắp linh kiện này cho máy này' : 'Máy chưa có trong danh sách – không đối chiếu được', last: null };
}

function fmt_(v) {
  if (!v) return '';
  return Utilities.formatDate(new Date(v), TZ, 'dd/MM/yyyy');
}

// ===================== KHÁCH HÀNG & MÁY =====================
function saveCustomer_(d, user) {
  var name = str_(d.name);
  if (!name) throw new Error('Vui lòng nhập tên khách hàng.');
  var t = readTable_('KhachHang');
  var dup = t.rows.filter(function (r) { return str_(r['Tên KH']).toLowerCase() === name.toLowerCase() && r['Mã KH'] !== d.id; })[0];
  if (dup) throw new Error('Khách hàng "' + name + '" đã có (' + dup['Mã KH'] + ').');
  var obj = { 'Tên KH': name, 'Người Liên Hệ': str_(d.contact), 'SĐT/Zalo': str_(d.phone), 'MST': str_(d.tax),
              'Địa Chỉ': str_(d.address), 'Ghi Chú': str_(d.note) };
  var existing = d.id ? findIn_(t.rows, 'Mã KH', d.id) : null;
  if (existing) {
    updateRow_('KhachHang', existing._row, obj);
    // đồng bộ tên KH sang danh sách máy
    readTable_('MayKhachHang').rows.forEach(function (m) { if (m['Mã KH'] === d.id) updateRow_('MayKhachHang', m._row, { 'Tên KH': name }); });
    return { id: d.id };
  }
  obj['Mã KH'] = nextSimpleId_('KH', t.rows, 'Mã KH');
  appendRow_('KhachHang', obj);
  return { id: obj['Mã KH'] };
}

function saveMachine_(d, user) {
  var c = findIn_(readTable_('KhachHang').rows, 'Mã KH', d.customerId);
  if (!c) throw new Error('Vui lòng chọn khách hàng của máy.');
  if (!str_(d.name)) throw new Error('Vui lòng nhập tên máy.');
  var months = Number(d.warrantyMonths) || 0;
  var handover = d.handoverDate ? new Date(d.handoverDate) : '';
  var expire = '';
  if (handover && months > 0) { expire = new Date(handover); expire.setMonth(expire.getMonth() + months); }
  var obj = { 'Mã KH': c['Mã KH'], 'Tên KH': c['Tên KH'], 'Tên Máy': str_(d.name), 'Model': str_(d.model),
              'Số Serial': str_(d.serial), 'Ngày Bàn Giao': handover, 'Số Tháng BH Máy': months, 'Hạn BH Máy': expire,
              'Ghi Chú': str_(d.note) };
  var t = readTable_('MayKhachHang');
  var existing = d.id ? findIn_(t.rows, 'Mã Máy', d.id) : null;
  if (existing) { updateRow_('MayKhachHang', existing._row, obj); return { id: d.id }; }
  obj['Mã Máy'] = nextSimpleId_('MAY', t.rows, 'Mã Máy');
  appendRow_('MayKhachHang', obj);
  return { id: obj['Mã Máy'] };
}

function resetDemo_(d, user) {
  if (!/TEST/i.test(SpreadsheetApp.getActiveSpreadsheet().getName())) throw new Error('Chỉ dùng trên bản TEST.');
  return seedDemo_();
}

// ===================== PR HẾT BẢO HÀNH → BÁO GIÁ KHÁCH HÀNG =====================
// Báo giá làm bên ngoài app; app chỉ theo dõi trạng thái.
function toQuotePR_(d, user) {
  var pr = requireRow_('PR', 'Mã PR', d.id);
  if (pr['Trạng Thái'] !== PR_STATUS.WAIT) throw new Error('Phiếu ' + d.id + ' không ở trạng thái Chờ Duyệt.');
  updateRow_('PR', pr._row, { 'Trạng Thái': PR_STATUS.QUOTE, 'Người Duyệt': user.name, 'Thời Gian Duyệt': new Date(),
                              'Ghi Chú Duyệt': str_(d.note) || 'Hết bảo hành – báo giá khách hàng' });
  return true;
}

function quoteSent_(d, user) {
  var pr = requireRow_('PR', 'Mã PR', d.id);
  if (pr['Trạng Thái'] !== PR_STATUS.QUOTE && pr['Trạng Thái'] !== PR_STATUS.QUOTE_SENT) throw new Error('Phiếu không ở bước báo giá.');
  if (!str_(d.quoteNo)) throw new Error('Vui lòng nhập số báo giá.');
  updateRow_('PR', pr._row, { 'Trạng Thái': PR_STATUS.QUOTE_SENT, 'Số Báo Giá': str_(d.quoteNo), 'Ngày Gửi BG': new Date() });
  return true;
}

function quoteResult_(d, user) {
  var pr = requireRow_('PR', 'Mã PR', d.id);
  if (pr['Trạng Thái'] !== PR_STATUS.QUOTE_SENT) throw new Error('Phiếu chưa ghi nhận gửi báo giá.');
  var note = str_(d.note);
  if (d.accepted) {
    updateRow_('PR', pr._row, { 'Trạng Thái': PR_STATUS.OK, 'Loại': 'Sửa chữa tính phí',
                                'Kết Quả BG': 'KH đồng ý ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy') + (note ? ' – ' + note : '') + ' (' + user.name + ')' });
  } else {
    updateRow_('PR', pr._row, { 'Trạng Thái': PR_STATUS.QUOTE_NO,
                                'Kết Quả BG': 'KH không đồng ý ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy') + (note ? ' – ' + note : '') + ' (' + user.name + ')' });
  }
  return true;
}

function approvePR_(d, user) {
  var pr = requireRow_('PR', 'Mã PR', d.id);
  if (pr['Trạng Thái'] !== PR_STATUS.WAIT) throw new Error('Phiếu ' + d.id + ' không ở trạng thái Chờ Duyệt.');
  updateRow_('PR', pr._row, {
    'Trạng Thái': PR_STATUS.OK, 'Người Duyệt': user.name, 'Thời Gian Duyệt': new Date(), 'Ghi Chú Duyệt': str_(d.note)
  });
  return true;
}

function rejectPR_(d, user) {
  var pr = requireRow_('PR', 'Mã PR', d.id);
  if (pr['Trạng Thái'] !== PR_STATUS.WAIT) throw new Error('Phiếu ' + d.id + ' không ở trạng thái Chờ Duyệt.');
  if (!str_(d.note)) throw new Error('Vui lòng ghi lý do từ chối.');
  updateRow_('PR', pr._row, {
    'Trạng Thái': PR_STATUS.REJECT, 'Người Duyệt': user.name, 'Thời Gian Duyệt': new Date(), 'Ghi Chú Duyệt': str_(d.note)
  });
  return true;
}

function deletePR_(d, user) {
  var pr = requireRow_('PR', 'Mã PR', d.id);
  if ([PR_STATUS.WAIT, PR_STATUS.REJECT, PR_STATUS.QUOTE_NO].indexOf(pr['Trạng Thái']) < 0) {
    throw new Error('Chỉ xóa được phiếu Chờ Duyệt, Từ Chối hoặc KH không đồng ý.');
  }
  sheet_('PR').deleteRow(pr._row);
  return true;
}

// ===================== PO – ĐƠN MUA HÀNG =====================
function createPO_(d, user) {
  var supplier = str_(d.supplier);
  if (!supplier) throw new Error('Vui lòng chọn nhà cung cấp.');
  var lines = d.items || [];
  if (!lines.length) throw new Error('PO phải có ít nhất 1 món.');

  var prTable = readTable_('PR');
  var poId = nextId_('PO', 'PO', 'Mã PO');
  var total = 0;
  var details = lines.map(function (l) {
    var pr = null;
    if (l.prId) {
      pr = findIn_(prTable.rows, 'Mã PR', l.prId);
      if (!pr) throw new Error('Không tìm thấy phiếu ' + l.prId);
      if (pr['Trạng Thái'] !== PR_STATUS.OK) throw new Error('Phiếu ' + l.prId + ' chưa được duyệt hoặc đã đặt hàng.');
    }
    var item = requireItem_(pr ? pr['Mã Part'] : l.partNo);
    var qty = positiveNumber_(l.qty || (pr && pr['Số Lượng']), 'Số lượng đặt');
    var price = nonNegativeNumber_(l.price, 'Đơn giá');
    total += qty * price;
    return { pr: pr, row: {
      'Mã PO': poId, 'Mã PR': pr ? pr['Mã PR'] : '', 'Mã Part': item['Mã Part'], 'Tên Vật Tư': item['Tên Vật Tư'],
      'SL Đặt': qty, 'Đơn Giá VAT': price, 'Thành Tiền': qty * price, 'SL Đã Nhận': 0 } };
  });

  appendRow_('PO', {
    'Mã PO': poId, 'Ngày Tạo': new Date(), 'Nhà Cung Cấp': supplier, 'Tổng Tiền': total,
    'Trạng Thái': PO_STATUS.DRAFT, 'Ghi Chú': str_(d.note), 'Người Tạo': user.name
  });
  details.forEach(function (x) {
    appendRow_('PO_ChiTiet', x.row);
    if (x.pr) updateRow_('PR', x.pr._row, { 'Trạng Thái': PR_STATUS.ORDERED, 'Mã PO': poId });
  });
  return { id: poId };
}

function updatePOItem_(d, user) {
  var po = requireRow_('PO', 'Mã PO', d.poId);
  if (po['Trạng Thái'] !== PO_STATUS.DRAFT) throw new Error('Chỉ sửa được PO đang Chờ phát hành.');
  var t = readTable_('PO_ChiTiet');
  var line = t.rows.filter(function (r) { return r['Mã PO'] === d.poId && r['Mã Part'] === d.partNo && String(r['Mã PR']) === String(d.prId || ''); })[0];
  if (!line) throw new Error('Không tìm thấy dòng hàng trong PO.');
  var qty = positiveNumber_(d.qty, 'Số lượng đặt');
  var price = nonNegativeNumber_(d.price, 'Đơn giá');
  updateRow_('PO_ChiTiet', line._row, { 'SL Đặt': qty, 'Đơn Giá VAT': price, 'Thành Tiền': qty * price });
  recalcPOTotal_(d.poId);
  return true;
}

function setPOStatus_(d, user) {
  var po = requireRow_('PO', 'Mã PO', d.id);
  var cur = po['Trạng Thái'];
  if (d.status === PO_STATUS.SENT) {
    if (cur !== PO_STATUS.DRAFT) throw new Error('PO đã phát hành rồi.');
    updateRow_('PO', po._row, { 'Trạng Thái': PO_STATUS.SENT, 'Ngày Phát Hành': new Date() });
  } else if (d.status === PO_STATUS.CANCEL) {
    if (cur !== PO_STATUS.DRAFT && cur !== PO_STATUS.SENT) throw new Error('PO đã nhận hàng, không hủy được.');
    updateRow_('PO', po._row, { 'Trạng Thái': PO_STATUS.CANCEL });
    // Trả các PR về trạng thái Đã Duyệt để đặt lại với NCC khác
    var prT = readTable_('PR');
    prT.rows.forEach(function (r) {
      if (r['Mã PO'] === d.id) updateRow_('PR', r._row, { 'Trạng Thái': PR_STATUS.OK, 'Mã PO': '' });
    });
  } else {
    throw new Error('Trạng thái không hợp lệ.');
  }
  return true;
}

function recalcPOTotal_(poId) {
  var lines = readTable_('PO_ChiTiet').rows.filter(function (r) { return r['Mã PO'] === poId; });
  var total = lines.reduce(function (s, r) { return s + num_(r['Thành Tiền']); }, 0);
  var po = requireRow_('PO', 'Mã PO', poId);
  updateRow_('PO', po._row, { 'Tổng Tiền': total });
}

// ===================== KHO – NHẬP / XUẤT =====================
function receiveStock_(d, user) {
  var lines = d.items || [];
  if (!lines.length) throw new Error('Phiếu nhập phải có ít nhất 1 món.');
  var po = null, poLines = null;
  if (d.poId) {
    po = requireRow_('PO', 'Mã PO', d.poId);
    if (po['Trạng Thái'] === PO_STATUS.CANCEL || po['Trạng Thái'] === PO_STATUS.DONE) {
      throw new Error('PO ' + d.poId + ' đã ' + po['Trạng Thái'].toLowerCase() + ', không nhập thêm được.');
    }
    poLines = readTable_('PO_ChiTiet').rows.filter(function (r) { return r['Mã PO'] === d.poId; });
  }
  var id = nextId_('NK', 'SoKho', 'Mã Phiếu');
  var now = new Date();
  var count = 0;
  lines.forEach(function (l) {
    var qty = Number(l.qty);
    if (!qty) return; // bỏ qua dòng nhập 0
    if (qty < 0) throw new Error('Số lượng nhập không được âm.');
    var item = requireItem_(l.partNo);
    appendRow_('SoKho', {
      'Mã Phiếu': id, 'Thời Gian': now, 'Loại': 'NHẬP', 'Mã Part': item['Mã Part'], 'Tên Vật Tư': item['Tên Vật Tư'],
      'Số Lượng': qty, 'Mã PO': d.poId || '', 'Người Thực Hiện': str_(d.performer) || user.name,
      'Ghi Chú': str_(d.note), 'Người Nhập Liệu': user.name
    });
    if (poLines) {
      var pl = poLines.filter(function (r) { return r['Mã Part'] === item['Mã Part'] && String(r['Mã PR']) === String(l.prId || r['Mã PR']); })[0];
      if (!pl) throw new Error('Mã ' + item['Mã Part'] + ' không có trong PO ' + d.poId);
      pl['SL Đã Nhận'] = num_(pl['SL Đã Nhận']) + qty;
      updateRow_('PO_ChiTiet', pl._row, { 'SL Đã Nhận': pl['SL Đã Nhận'] });
    }
    count++;
  });
  if (!count) throw new Error('Chưa nhập số lượng cho món nào.');

  if (po) {
    var full = poLines.every(function (r) { return num_(r['SL Đã Nhận']) >= num_(r['SL Đặt']); });
    updateRow_('PO', po._row, { 'Trạng Thái': full ? PO_STATUS.DONE : PO_STATUS.PART });
    if (full) {
      var prT = readTable_('PR');
      prT.rows.forEach(function (r) {
        if (r['Mã PO'] === d.poId) updateRow_('PR', r._row, { 'Trạng Thái': PR_STATUS.DONE });
      });
    }
  }
  recalcStock_();
  return { id: id };
}

function issueStock_(d, user) {
  var item = requireItem_(d.partNo);
  var qty = positiveNumber_(d.qty, 'Số lượng xuất');
  var target = resolveTarget_(d);
  if (!target.customer) throw new Error('Vui lòng chọn khách hàng / công ty sử dụng.');
  if (!target.machine) throw new Error('Vui lòng chọn hoặc nhập tên máy / dây chuyền.');
  var pr = null;
  if (str_(d.prId)) {
    pr = requireRow_('PR', 'Mã PR', d.prId);
    if (pr['Trạng Thái'] !== PR_STATUS.OK && pr['Trạng Thái'] !== PR_STATUS.DONE) throw new Error('Phiếu ' + d.prId + ' chưa được duyệt.');
  }
  var stock = stockOf_(item['Mã Part']);
  if (stock < qty) throw new Error('Tồn kho ' + item['Mã Part'] + ' chỉ còn ' + stock + ', không đủ xuất ' + qty + '.');

  var months = Number(d.warrantyMonths) || 0;
  var now = new Date();
  var expire = '';
  if (months > 0) { expire = new Date(now); expire.setMonth(expire.getMonth() + months); }
  var id = nextId_('XK', 'SoKho', 'Mã Phiếu');
  appendRow_('SoKho', {
    'Mã Phiếu': id, 'Thời Gian': now, 'Loại': 'XUẤT', 'Mã Part': item['Mã Part'], 'Tên Vật Tư': item['Tên Vật Tư'],
    'Số Lượng': qty, 'Mã KH': target.customerId, 'Khách Hàng': target.customer, 'Mã Máy': target.machineId,
    'Tên Máy': target.machine, 'Số Tháng BH': months, 'Hạn BH': expire, 'Mã PR': pr ? pr['Mã PR'] : '',
    'Người Thực Hiện': str_(d.performer) || user.name, 'Ghi Chú': str_(d.note), 'Người Nhập Liệu': user.name
  });
  if (pr) updateRow_('PR', pr._row, { 'Trạng Thái': PR_STATUS.ISSUED });
  recalcStock_();
  return { id: id };
}

function stockOf_(partNo) {
  return readTable_('SoKho').rows.reduce(function (s, r) {
    if (r['Mã Part'] !== partNo) return s;
    return s + (r['Loại'] === 'XUẤT' ? -num_(r['Số Lượng']) : num_(r['Số Lượng']));
  }, 0);
}

/** Tính lại toàn bộ tab TonKho từ DanhMucVatTu + SoKho. Không sửa tay tab TonKho. */
function recalcStock_() {
  var items = readTable_('DanhMucVatTu').rows;
  var sums = {};
  readTable_('SoKho').rows.forEach(function (r) {
    var k = r['Mã Part'];
    sums[k] = (sums[k] || 0) + (r['Loại'] === 'XUẤT' ? -num_(r['Số Lượng']) : num_(r['Số Lượng']));
  });
  var now = new Date();
  var sh = ensureSheet_('TonKho');
  var headers = headers_(sh);
  var rows = items.map(function (it) {
    var obj = {
      'Mã Part': it['Mã Part'], 'Tên Vật Tư': it['Tên Vật Tư'], 'Đơn Vị Tính': it['Đơn Vị Tính'],
      'Tồn Kho': sums[it['Mã Part']] || 0, 'Tồn Tối Thiểu': num_(it['Tồn Tối Thiểu']), 'Cập Nhật Cuối': now
    };
    return headers.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; });
  });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

// ===================== DANH MỤC =====================
function saveItem_(d, user) {
  var name = str_(d.name);
  if (!name) throw new Error('Vui lòng nhập tên vật tư.');
  var t = readTable_('DanhMucVatTu');
  var code = str_(d.partNo).toUpperCase();
  var existing = code ? findIn_(t.rows, 'Mã Part', code) : null;
  var obj = { 'Tên Vật Tư': name, 'Đơn Vị Tính': str_(d.unit) || 'Cái', 'Nhóm': str_(d.group),
              'Tồn Tối Thiểu': Number(d.minQty) || 0, 'Ghi Chú': str_(d.note) };
  if (existing && d.isNew) throw new Error('Mã ' + code + ' đã tồn tại (' + existing['Tên Vật Tư'] + ').');
  if (existing) {
    updateRow_('DanhMucVatTu', existing._row, obj);
  } else {
    if (!code) code = nextSimpleId_('VT', t.rows, 'Mã Part');
    obj['Mã Part'] = code;
    appendRow_('DanhMucVatTu', obj);
  }
  recalcStock_();
  return { partNo: code };
}

function saveSupplier_(d, user) {
  var name = str_(d.name);
  if (!name) throw new Error('Vui lòng nhập tên nhà cung cấp.');
  var t = readTable_('NhaCungCap');
  var existing = d.id ? findIn_(t.rows, 'Mã NCC', d.id) : null;
  var obj = { 'Tên NCC': name, 'Người Liên Hệ': str_(d.contact), 'SĐT/Zalo': str_(d.phone),
              'MST': str_(d.tax), 'Địa Chỉ': str_(d.address) };
  if (existing) {
    updateRow_('NhaCungCap', existing._row, obj);
    return { id: d.id };
  }
  obj['Mã NCC'] = nextSimpleId_('NCC', t.rows, 'Mã NCC');
  appendRow_('NhaCungCap', obj);
  return { id: obj['Mã NCC'] };
}

function saveConfig_(d, user) {
  var t = readTable_('CauHinh');
  CONFIG_KEYS.forEach(function (k) {
    if (!d.hasOwnProperty(k)) return;
    var row = findIn_(t.rows, 'Khóa', k);
    if (row) updateRow_('CauHinh', row._row, { 'Giá Trị': str_(d[k]) });
    else appendRow_('CauHinh', { 'Khóa': k, 'Giá Trị': str_(d[k]) });
  });
  return readConfig_();
}

function readConfig_() {
  var cfg = {};
  CONFIG_KEYS.forEach(function (k) { cfg[k] = ''; });
  readTable_('CauHinh').rows.forEach(function (r) { cfg[r['Khóa']] = r['Giá Trị']; });
  return cfg;
}

// ===================== HÓA ĐƠN VAT & CÔNG NỢ =====================
function saveInvoice_(d, user) {
  var po = requireRow_('PO', 'Mã PO', d.poId);
  var obj = {
    'Mã PO': po['Mã PO'], 'Nhà Cung Cấp': po['Nhà Cung Cấp'],
    'Số Hóa Đơn': str_(d.invoiceNo), 'Tổng Tiền': d.amount !== undefined && d.amount !== '' ? Number(d.amount) : po['Tổng Tiền'],
    'Ngày Nhận HĐ': d.date ? new Date(d.date) : new Date(), 'Người Cập Nhật': user.name
  };
  if (d.fileData) {
    var folder = vatFolder_();
    var safeName = (po['Mã PO'] + '_' + str_(d.fileName)).replace(/[\\\/:*?"<>|]/g, '_');
    var blob = Utilities.newBlob(Utilities.base64Decode(d.fileData), d.mimeType || 'application/octet-stream', safeName);
    var file = folder.createFile(blob);
    obj['Tên File'] = safeName;
    obj['Link File'] = file.getUrl(); // chỉ người được chia sẻ thư mục mới mở được
  }
  var t = readTable_('HoaDon');
  var existing = findIn_(t.rows, 'Mã PO', po['Mã PO']);
  if (existing) {
    updateRow_('HoaDon', existing._row, obj);
  } else {
    obj['Trạng Thái Thanh Toán'] = 'Chưa thanh toán';
    appendRow_('HoaDon', obj);
  }
  return { link: obj['Link File'] || (existing && existing['Link File']) || '' };
}

/** Bản TEST (tên Sheet có chữ TEST) dùng thư mục hóa đơn riêng, không ghi vào thư mục thật. */
function vatFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('VAT_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (/TEST/i.test(ss.getName())) {
    var folder = DriveApp.createFolder('ProcureQR TEST – Hóa đơn (bản thử)');
    props.setProperty('VAT_FOLDER_ID', folder.getId());
    return folder;
  }
  return DriveApp.getFolderById(DEFAULT_VAT_FOLDER_ID);
}

function setPaid_(d, user) {
  var t = readTable_('HoaDon');
  var row = findIn_(t.rows, 'Mã PO', d.poId);
  if (!row) {
    var po = requireRow_('PO', 'Mã PO', d.poId);
    appendRow_('HoaDon', { 'Mã PO': po['Mã PO'], 'Nhà Cung Cấp': po['Nhà Cung Cấp'], 'Tổng Tiền': po['Tổng Tiền'] });
    row = findIn_(readTable_('HoaDon').rows, 'Mã PO', d.poId);
  }
  updateRow_('HoaDon', row._row, {
    'Trạng Thái Thanh Toán': d.paid ? 'Đã thanh toán' : 'Chưa thanh toán',
    'Ngày Thanh Toán': d.paid ? new Date() : '', 'Người Cập Nhật': user.name
  });
  return true;
}

// ===================== HÀM TIỆN ÍCH BẢNG (THEO TÊN CỘT) =====================
function sheet_(name) {
  return ensureSheet_(name);
}

/** Tạo tab nếu chưa có; thêm các cột còn thiếu vào cuối (không xoá, không đảo cột có sẵn). */
function ensureSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  var want = SCHEMA[name];
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, want.length).setValues([want]);
    styleHeader_(sh);
    return sh;
  }
  if (sh.getLastColumn() === 0) {
    sh.getRange(1, 1, 1, want.length).setValues([want]);
    styleHeader_(sh);
    return sh;
  }
  var have = headers_(sh);
  var missing = want.filter(function (h) { return have.indexOf(h) < 0; });
  if (missing.length) {
    sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
    styleHeader_(sh);
  }
  return sh;
}

function headers_(sh) {
  if (sh.getLastColumn() === 0) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
}

function readTable_(name) {
  var sh = ensureSheet_(name);
  var headers = headers_(sh);
  var rows = [];
  if (sh.getLastRow() > 1) {
    var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
    values.forEach(function (v, i) {
      if (v.every(function (c) { return c === '' || c === null; })) return;
      var obj = { _row: i + 2 };
      headers.forEach(function (h, j) { if (h) obj[h] = serialize_(v[j]); });
      rows.push(obj);
    });
  }
  return { sheet: sh, headers: headers, rows: rows };
}

function appendRow_(name, obj) {
  var sh = ensureSheet_(name);
  var headers = headers_(sh);
  sh.appendRow(headers.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; }));
}

function updateRow_(name, row, obj) {
  var sh = ensureSheet_(name);
  var headers = headers_(sh);
  Object.keys(obj).forEach(function (k) {
    var col = headers.indexOf(k);
    if (col < 0) throw new Error('Tab ' + name + ' thiếu cột "' + k + '".');
    sh.getRange(row, col + 1).setValue(obj[k]);
  });
}

function findIn_(rows, key, value) {
  var v = String(value || '').trim();
  for (var i = 0; i < rows.length; i++) if (String(rows[i][key]).trim() === v) return rows[i];
  return null;
}

function requireRow_(table, key, value) {
  var r = findIn_(readTable_(table).rows, key, value);
  if (!r) throw new Error('Không tìm thấy ' + key + ' = ' + value);
  return r;
}

function requireItem_(partNo) {
  if (!str_(partNo)) throw new Error('Vui lòng chọn vật tư từ danh mục.');
  var it = findIn_(readTable_('DanhMucVatTu').rows, 'Mã Part', str_(partNo).toUpperCase());
  if (!it) throw new Error('Mã ' + partNo + ' chưa có trong danh mục vật tư. Thêm vào danh mục trước.');
  return it;
}

/** Mã theo năm: PR-2026-0001 */
function nextId_(prefix, table, col) {
  var year = Utilities.formatDate(new Date(), TZ, 'yyyy');
  var re = new RegExp('^' + prefix + '-' + year + '-(\\d+)$');
  var max = 0;
  readTable_(table).rows.forEach(function (r) {
    var m = String(r[col]).match(re);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return prefix + '-' + year + '-' + ('000' + (max + 1)).slice(-4);
}

/** Mã đơn giản: VT-0001, NCC-001 */
function nextSimpleId_(prefix, rows, col) {
  var re = new RegExp('^' + prefix + '-(\\d+)$');
  var max = 0;
  rows.forEach(function (r) { var m = String(r[col]).match(re); if (m) max = Math.max(max, Number(m[1])); });
  return prefix + '-' + ('000' + (max + 1)).slice(-4);
}

function serialize_(v) {
  if (v instanceof Date) return v.toISOString();
  return v;
}

function pick_(obj, keys) {
  var o = {};
  keys.forEach(function (k) { o[k] = obj[k]; });
  return o;
}

function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num_(v) { var n = Number(v); return isNaN(n) ? 0 : n; }
function positiveNumber_(v, label) {
  var n = Number(v);
  if (!(n > 0)) throw new Error(label + ' phải lớn hơn 0.');
  return n;
}
function nonNegativeNumber_(v, label) {
  var n = Number(v || 0);
  if (isNaN(n) || n < 0) throw new Error(label + ' không hợp lệ.');
  return n;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function styleHeader_(sh) {
  var r = sh.getRange(1, 1, 1, sh.getLastColumn());
  r.setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sh.setFrozenRows(1);
}
