# 1. Tổng quan dự án
- **Mục tiêu:** Xây dựng hệ thống web ứng dụng (Web App) quản lý Quy trình Mua hàng - Đề xuất (PR), Đơn mua hàng (PO), Quản lý Hóa đơn VAT / Công nợ và Quản lý Xuất – Nhập – Tồn kho vật tư linh kiện máy móc sản xuất tích hợp quét mã QR Code và truy xuất bảo hành.
- **Người dùng chính:**
  - **Anh Lê Văn Công:** Giám đốc điều hành 3 công ty (Song Hiệp Lợi - SHL, Chất Lượng, VAB). Quản lý cấp cao, theo dõi công nợ, duyệt đơn.
  - **Trưởng phòng Kỹ thuật (TPKT) / Admin:** Duyệt phiếu Đề xuất mua hàng (PR), quản lý đăng nhập phân quyền.
  - **Nhân viên Kỹ thuật / Nhân viên Kho:** Tạo phiếu PR đề xuất linh kiện thay thế cho máy móc, thực hiện quét QR Code nhập kho, xuất kho bảo trì thiết bị.
  - **Bộ phận Thu mua / Kế toán:** Quản lý PO, nhập giá, chọn Nhà cung cấp, tải hóa đơn VAT lên Google Drive và theo dõi công nợ.
- **Bối cảnh doanh nghiệp/kho:**
  - **Công ty TNHH TM-KT Song Hiệp Lợi (SHL):** Nhập khẩu máy móc từ Trung Quốc, cung cấp dịch vụ hậu mãi/bảo trì.
  - **Công ty TNHH SX TM XNK Chất Lượng:** Xưởng A (Tuýp nhôm dược/mỹ phẩm/keo), Xưởng B (Chai nhôm thuốc BVTV).
  - **Công ty CP SX VAB:** Sản xuất chai nhôm cao cấp (thức uống, dược mỹ phẩm, aerosol, nhớt).
- **Trạng thái tổng thể hiện tại:** Ước lượng hoàn thành khoảng **85% - 90%** (Toàn bộ giao diện Single Page App frontend, tích hợp Apps Script API backend, luồng PR - PO - QR Kho - Bảo Hành - VAT Drive đã chạy đúng yêu cầu nghiệp vụ).

---

# 2. Yêu cầu chức năng của người dùng
- **Phiếu Đề Xuất (PR):**
  - ✅ Tạo phiếu PR với các trường: Người đề xuất, Công ty (SHL, Chất Lượng, VAB), Tên máy/Dây chuyền, Tên vật tư/thiết bị, Mã Part No, Số lượng, Lý do/Mục đích sử dụng.
  - ✅ Tự động tạo Mã PR ngẫu nhiên (dạng `PR-xxxxxx`).
  - ✅ Duyệt PR: Phân quyền nút "Duyệt Đơn" cho TPKT/Admin khi đăng nhập (mật khẩu `123456`). Khi duyệt sẽ lưu TPKT và Thời gian duyệt lên Google Sheets.
  - ❌ Đánh số PR theo thứ tự năm (chưa làm, hiện dùng mã `PR-` ngẫu nhiên/timestamp).
- **Đơn Mua Hàng (PO):**
  - ✅ Tự động chuyển đổi các đơn PR đã được duyệt sang tab PO với mã tương ứng (`PO-xxxxxx`).
  - ✅ Nhập thông tin Nhà cung cấp (NCC), Đơn giá VAT, tự động tính Thành tiền.
  - ✅ Trạng thái PO (`Chờ phát hành`, `Đã phát hành`).
  - ✅ Nút "Gửi Zalo": Tự động tạo mẫu tin nhắn đặt hàng PO, copy vào Clipboard và mở liên kết Zalo Web (`zalo.me`).
  - ❌ In/Xuất tệp PDF đơn PO trực tiếp từ web (chưa làm).
- **Nhập Kho:**
  - ✅ Nhập kho tự do không phụ thuộc PR/PO (chọn Mã Part, Tên vật tư, Số lượng, Người nhập).
  - ✅ Nhập kho theo đơn PO (nối mã PO tham chiếu).
  - ✅ Giải quyết bài toán chênh lệch số lượng: PR đề xuất 1 cái, PO mua 10 cái -> Nhập kho ghi nhận đúng 10 cái vào tồn kho của Mã Part.
- **Xuất Kho:**
  - ✅ Quét mã QR hoặc chọn Mã Part linh kiện -> Nhập Số lượng xuất, Người thực hiện.
  - ✅ Chọn **Công ty sử dụng** (SHL, Chất Lượng, VAB) và **Tên máy / Dây chuyền** để phục vụ chi phí và truy xuất.
  - ✅ Tự động trừ số lượng tồn kho thực tế của Mã Part No tương ứng.
  - ✅ **Lưu Ngày & Giờ xuất kho thực tế** kèm **Thời gian bảo hành** (3, 6, 12, 24 tháng hoặc Không BH). Tự động tính Ngày hết hạn bảo hành.
- **Tồn Kho & Quản lý Bảo Hành:**
  - ✅ Quản lý tồn kho theo danh mục chuẩn **Mã Part No.** cố định (dùng chung toàn công ty, không tạo ngẫu nhiên mã linh kiện trùng lặp).
  - ✅ Sổ nhật ký xuất kho & Tra cứu hạn bảo hành linh kiện: Hiển thị trạng thái `🟢 Còn BH (xT)` hoặc `🔴 Hết BH` trực quan, cho phép lọc tìm kiếm theo Mã Part, Tên máy.
  - ❌ Cảnh báo tồn tối thiểu tự động (chưa làm).
- **Hóa Đơn VAT & Thanh Toán Công Nợ:**
  - ✅ Đính kèm File Hóa đơn VAT (PDF/Ảnh) trực tiếp từ giao diện web.
  - ✅ Tải file trực tiếp lên Google Drive folder chỉ định (`Hoa-Don-ProcureQR` ID: `14-gWx5bo7VP2YFAKs96j2fxKavCIsFrX`). Trả về đường link cố định `https://drive.google.com/file/d/...` xem vĩnh viễn trên mọi thiết bị.
  - ✅ Lưu tạm đường dẫn DataURL/Local storage để xem tệp lập tức kể cả khi Apps Script chưa phản hồi.
  - ✅ Thay đổi trạng thái Thanh toán Công nợ giữa `⏳ Chưa Thanh Toán` và `✅ Đã Thanh Toán`.
- **Người Dùng & Phân Quyền:**
  - ✅ Chế độ xem dành cho Kỹ thuật/Nhân viên chung.
  - ✅ Đăng nhập TPKT / Admin (Mật khẩu mặc định: `123456`) để kích hoạt quyền Duyệt đơn PR.
- **Giao Diện & Trải Nghiệm:**
  - ✅ Giao diện Single Page App (SPA) responsive chuẩn Tailwind CSS, hỗ trợ tiếng Việt.
  - ✅ Lưu vị trí Tab đang mở trong `localStorage` (`shl_active_tab`). Khi người dùng F5 Reload lại trang vẫn giữ nguyên Tab đang làm việc.

---

# 3. Kiến trúc kỹ thuật
- **Frontend:**
  - HTML5, JavaScript ES6 thuần, Tailwind CSS (CDN), FontAwesome (CDN).
  - Thư viện mã QR: `qrcode.min.js` (tạo mã QR linh kiện) và `html5-qrcode.min.js` (quét QR camera).
  - Hosting: GitHub Pages (giao diện tĩnh `index.html`).
  - URL Web App: `https://phamvan5593-cell.github.io/...` [CẦN XÁC NHẬN URL chính xác từ repo của user].
- **Backend:**
  - Google Apps Script (GAS) triển khai dạng Web App (URL chứa `/exec`).
  - Phương thức gọi backend:
    - `fetch(url + '?action=getData')` (GET) để lấy toàn bộ dữ liệu từ các Tab Sheets.
    - `fetch(url, { method: 'POST', mode: 'no-cors', ... })` hoặc `Content-Type: 'text/plain'` đối với ghi dữ liệu và tải file Base64.
  - CORS Handling: Xử lý qua Apps Script `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)`.
- **Dữ liệu (Google Sheets):**
  - Tên File Spreadsheet: *ProcureQR - Quản Lý Mua Hàng SHL* [CHƯA CHẮC ID chính xác].
  - **Danh sách Cột chi tiết các Tab:**
    1. **Tab `PR`:**
       - Cột: `Mã PR` (PK), `Người Đề Xuất`, `Công Ty`, `Tên Máy`, `Tên Vật Tư`, `Mã Part`, `Số Lượng`, `Lý Do`, `Ngày Tạo`, `Trạng Thái`, `Người Duyệt`, `Thời Gian Duyệt`.
    2. **Tab `PO`:**
       - Cột: `Mã PO` (PK, liên kết `PR`), `Mã PR`, `Tên Vật Tư`, `Số Lượng`, `Nhà Cung Cấp`, `Đơn Giá VAT`, `Thành Tiền`, `Trạng Thái PO`, `Trạng Thái VAT`, `Link Hóa Đơn Drive`.
    3. **Tab `TonKho`:**
       - Cột: `Mã Part` (PK), `Tên Linh Kiện`, `Số Lượng Tồn`, `Đơn Vị Tính`.
    4. **Tab `LichSuXuatKho`:**
       - Cột: `Mã Part` (FK), `Tên Linh Kiện`, `Số Lượng`, `Công Ty`, `Tên Máy`, `Thời Gian Xuất`, `Số Tháng BH`, `Hạn Bảo Hành`, `Người Xuất`.
- **Sơ đồ luồng dữ liệu:**
```
[User Form / QR Scanner]
          │
          ├──► LocalStorage (Cache UI tức thì: PR, PO, Tồn kho, File DataURL)
          │
          └──► POST / GET (Fetch API) 
                    │
                    ▼
          [Google Apps Script (ketnoiapp.gs)]
                    │
                    ├──► Ghi/Đọc dòng dữ liệu ──► [Google Sheets (Database)]
                    │
                    └──► Tạo File hóa đơn Base64 ──► [Google Drive Folder]
```

---

# 4. Cấu trúc mã nguồn
- **Danh sách File:**
  - `index.html`: Mã nguồn giao diện chính Web Single Page App (chứa HTML, CSS Tailwind, và JavaScript xử lý logic Client UI).
  - `ketnoiapp.gs`: Mã nguồn Google Apps Script phục vụ API backend (xử lý `doGet`, `doPost`, upload file Drive và ghi Sheets).
- **Các API/Action Backend chính (`ketnoiapp.gs`):**
  - `doGet(e)`: Trả về JSON bao gồm toàn bộ danh sách `pr`, `po`, `inventory`, `exportHistory`.
  - `doPost(e)` nhận JSON `payload`:
    - `payload.type === "SAVE_PR"`: Thêm phiếu PR mới vào tab `PR`.
    - `payload.type === "APPROVE_PR"`: Cập nhật cột Trạng Thái = "Đã Duyệt", Người Duyệt, Thời Gian Duyệt ở tab `PR`.
    - `payload.type === "EXPORT_STOCK"`: Ghi lịch sử xuất kho & hạn bảo hành vào tab `LichSuXuatKho`.
    - `payload.type === "UPLOAD_VAT_FILE"`: Giải mã Base64 `fileData`, tạo file trong Drive Folder `VAT_FOLDER_ID`, phân quyền VIEW public link và cập nhật link vào tab `PO`.
- **Quy ước đặt tên mã:**
  - Mã PR: `PR-` + 6 chữ số timestamp (VD: `PR-220380`).
  - Mã PO: `PO-` + mã số PR tương ứng (VD: `PO-220380`).
  - Mã Part No: Cố định theo linh kiện (VD: `PART-CB01`, `PART-BD02`).

---

# 5. Quy trình nghiệp vụ đã thống nhất
1. **Tạo PR:** Nhân viên kỹ thuật nhập đề xuất mua linh kiện -> Hệ thống tạo đơn `PR-xxxxxx` ở trạng thái `Chờ Duyệt`.
2. **Duyệt PR:** TPKT đăng nhập Admin (Pass: `123456`), bấm "Duyệt Đơn" -> Chuyển trạng thái PR thành `Đã Duyệt` (ghi chú Người duyệt & Ngày giờ duyệt).
3. **Tạo PO & Thương lượng:** Khi PR được duyệt, hệ thống tự động sinh dòng ở Tab PO. Thu mua nhập tên NCC, Đơn giá VAT -> Hệ thống tính Thành tiền. Bấm "📲 Gửi Zalo" để gửi thông tin đơn cho NCC.
4. **Nhập kho linh kiện:** Thu mua/Kho chọn Nhập Kho -> Chọn Mã Part No chuẩn -> Nhập số lượng thực tế nhận từ NCC (dù PO đặt nhiều hơn PR vẫn ghi nhận đúng số lượng tồn thực tế).
5. **Xuất kho & Bảo hành:** Kỹ thuật chọn Xuất kho -> Quét mã QR hoặc nhập Mã Part -> Chọn Công ty sử dụng (SHL/Chất Lượng/VAB), Tên máy/Dây chuyền, Số tháng BH (6, 12, 24T) và Người xuất -> Hệ thống tự động trừ Tồn kho và ghi nhật ký Bảo hành.
6. **Hóa đơn VAT & Công nợ:** Kế toán chọn "📷 Tải File Hóa Đơn" -> File tải lên Google Drive -> Trực quan hóa nút "👁️ Xem File" link cố định vĩnh viễn và đổi trạng thái công nợ sang "✅ Đã Thanh Toán".

---

# 6. Lịch sử làm việc
- **Giai đoạn 1:** Xây dựng giao diện ProcureQR v1.0 - v2.0 đơn giản quản lý PR/PO và liên kết Zalo.
- **Giai đoạn 2:** Phát triển v3.0 bổ sung Quản lý Kho QR Code và Hóa đơn VAT đính kèm file Drive.
- **Giai đoạn 3 (Các sự cố & Quyết định quan trọng):**
  - *Sự cố Link Blob:* Trước đây dùng đường dẫn tạm `blob:http...` dẫn đến khi F5 trang web bị lỗi `ERR_FILE_NOT_FOUND`. *Quyết định:* Chuyển sang lưu DataURL mã hóa Base64 ở LocalStorage tạm thời và đẩy lưu trữ vĩnh viễn trên Google Drive.
  - *Sự cố Mã Part No trùng lặp:* Nhân viên tạo PR bị ngẫu nhiên mã Part No mới. *Quyết định:* Chuẩn hóa Danh mục Mã Part No cố định để quản lý tồn kho và in tem QR dán linh kiện.
  - *Bổ sung Yêu cầu Xuất Kho:* Người dùng yêu cầu thêm Thời gian xuất kho thực tế (Ngày/Giờ) và Số tháng bảo hành để tra cứu tuổi thọ linh kiện lắp trên từng máy.
  - *Khắc phục lỗi Commit GitHub:* Lỗi "File could not be edited" do file HTML quá dài khi chỉnh sửa trên trình duyệt -> Giải pháp: Rút gọn cấu trúc mã HTML hoặc xóa/tạo lại file.

---

# 7. Cách làm việc giữa chúng ta
- **Quy trình cập nhật mã:**
  - Copy mã Google Apps Script -> Dán vào Editor Script của Google -> Bấm **Deploy / Triển khai** -> Chọn **Bản triển khai mới (New deployment)** để lấy API URL mới.
  - Copy mã HTML -> Push/Commit trực tiếp lên branch `main` của GitHub Repository để GitHub Pages tự động build lại giao diện web.
- **Thói quen của người dùng (Anh Công):**
  - Yêu cầu cung cấp toàn bộ mã nguồn hoàn chỉnh (Full file code) thay vì đoạn sửa nhỏ lẻ để dễ dàng copy/paste.
  - Đóng góp phản hồi cực kỳ chi tiết kèm ảnh chụp màn hình thực tế bị lỗi.
  - Ưu tiên tính thực tế vận hành sản xuất (chính xác từng tên công ty, từng loại máy, công nợ VAT và thời gian bảo hành).

---

# 8. Lỗi đã biết & vấn đề tồn đọng
- 🟡 **Cập nhật đồng bộ 2 chiều Sheets:** Phương thức gọi `no-cors` từ JavaScript đến Apps Script đôi khi làm chậm thời gian phản hồi cập nhật ngược từ Google Sheets về giao diện nếu không bấm nút "Đồng bộ Sheets".
- 🟡 **Tự động quét QR trên một số thiết bị di động cũ:** Cần cấp quyền Camera trình duyệt trực tiếp trên HTTPS.

---

# 9. Việc cần làm tiếp (Backlog)
1. **Xuất báo cáo Excel / PDF (Ưu tiên Cao):** Bổ sung nút xuất danh sách PR/PO và Nhật ký xuất kho ra file Excel (.xlsx).
2. **Cảnh báo tồn kho tối thiểu (Ưu tiên Trung bình):** Đánh dấu màu đỏ khi số lượng tồn của Mã Part xuống dưới ngưỡng an toàn (VD: < 2 cái).
3. **Phân quyền người dùng nâng cao (Ưu tiên Thấp):** Đăng nhập bằng tài khoản/email riêng thay vì dùng mật khẩu chung `123456`.

---

# 10. Câu hỏi còn mở
- Cần xác nhận URL chính xác của Google Sheet Database và Web App Deployment URL thực tế đang chạy ở môi trường sản xuất của anh Công.
- Có cần mở rộng thêm danh mục Vật tư/Linh kiện mẫu cố định cho xưởng A và xưởng B của công ty Chất Lượng hay không.

---

# 11. Phụ lục: Mã nguồn mới nhất

### File 1: `ketnoiapp.gs` (Google Apps Script Backend)
```javascript
var VAT_FOLDER_ID = "14-gWx5bo7VP2YFAKs96j2fxKavCIsFrX"; 

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", 
    pr: getSheetData(ss.getSheetByName("PR")), 
    po: getSheetData(ss.getSheetByName("PO")), 
    inventory: getSheetData(ss.getSheetByName("TonKho")),
    exportHistory: getSheetData(ss.getSheetByName("LichSuXuatKho"))
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. LƯU ĐƠN PR MỚI
    if (payload.type === "SAVE_PR" && payload.data) {
      var sheetPR = ss.getSheetByName("PR") || ss.insertSheet("PR");
      checkHeaders(sheetPR, ["Mã PR", "Người Đề Xuất", "Công Ty", "Tên Máy", "Tên Vật Tư", "Mã Part", "Số Lượng", "Lý Do", "Ngày Tạo", "Trạng Thái", "Người Duyệt", "Thời Gian Duyệt"]);
      var d = payload.data;
      sheetPR.appendRow([d.id, d.requester, d.company, d.machine, d.itemName, d.partNo, d.qty, d.reason, d.date, d.status, "", ""]);
    }

    // 2. DUYỆT PR TỪ ADMIN
    if (payload.type === "APPROVE_PR" && payload.id) {
      var sheetPR = ss.getSheetByName("PR");
      if (sheetPR) {
        var data = sheetPR.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] == payload.id) {
            sheetPR.getRange(i + 1, 10).setValue("Đã Duyệt");
            sheetPR.getRange(i + 1, 11).setValue(payload.approver || "TPKT");
            sheetPR.getRange(i + 1, 12).setValue(payload.approvedTime || new Date().toLocaleString("vi-VN"));
            break;
          }
        }
      }
    }

    // 3. XUẤT KHO & LƯU LỊCH SỬ BẢO HÀNH
    if (payload.type === "EXPORT_STOCK" && payload.data) {
      var sheetHistory = ss.getSheetByName("LichSuXuatKho") || ss.insertSheet("LichSuXuatKho");
      checkHeaders(sheetHistory, ["Mã Part", "Tên Linh Kiện", "Số Lượng", "Công Ty", "Tên Máy", "Thời Gian Xuất", "Số Tháng BH", "Hạn Bảo Hành", "Người Xuất"]);
      var h = payload.data;
      sheetHistory.appendRow([h.partNo, h.itemName, h.qty, h.company, h.machine, h.exportTime, h.warrantyMonths, h.warrantyExpireDate, h.exporter]);
    }

    // 4. UPLOAD FILE HÓA ĐƠN VAT
    if (payload.type === "UPLOAD_VAT_FILE" && payload.fileData) {
      var folder = DriveApp.getFolderById(VAT_FOLDER_ID);
      var blob = Utilities.newBlob(Utilities.base64Decode(payload.fileData), payload.mimeType, payload.fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var fileUrl = file.getUrl();

      var sheetPO = ss.getSheetByName("PO");
      if (sheetPO) {
        var data = sheetPO.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] == payload.poId) {
            sheetPO.getRange(i + 1, 10).setValue(fileUrl);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", fileUrl: fileUrl })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function checkHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

function getSheetData(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) { obj[headers[j]] = data[i][j]; }
    result.push(obj);
  }
  return result;
}
```

---

### File 2: `index.html` (Frontend Web App)
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProcureQR v3.0 - Công Ty TNHH TM-KT Song Hiệp Lợi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">

    <!-- Header -->
    <header class="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <img src="https://lh3.googleusercontent.com/d/16ASDaeXMxyZn7qkDuKkdo-bmBR8BAGjP" alt="Logo SHL" class="h-11 w-auto object-contain bg-white p-1 rounded">
                <div>
                    <h1 class="text-base font-bold leading-tight text-blue-300 tracking-wide uppercase">CÔNG TY TNHH TM-KT SONG HIỆP LỢI</h1>
                    <p class="text-xs text-slate-300 font-medium">ProcureQR <span class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">v3.0</span> - Xuất Nhập Kho & Hóa Đơn VAT</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button onclick="fetchDataFromSheet()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow flex items-center space-x-1.5">
                    <i class="fa-solid fa-rotate"></i><span>Lấy Dữ Liệu Sheets</span>
                </button>
                <button id="adminLoginBtn" onclick="toggleAdminLogin()" class="bg-blue-800 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg border border-blue-600 flex items-center space-x-1.5 shadow-sm">
                    <i class="fa-solid fa-user-shield"></i><span id="adminBtnText">Đăng nhập TPKT / Admin</span>
                </button>
            </div>
        </div>
        
        <!-- Navigation Tabs -->
        <nav class="bg-slate-800 text-slate-300 text-sm font-medium border-t border-slate-700">
            <div class="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto">
                <button onclick="switchTab('prTab')" id="btn-prTab" class="tab-btn px-4 py-3 flex items-center space-x-2 border-b-2 border-blue-500 text-white bg-slate-700/50">
                    <i class="fa-solid fa-file-pen text-blue-400"></i><span>1. Đề Xuất (PR)</span>
                </button>
                <button onclick="switchTab('poTab')" id="btn-poTab" class="tab-btn px-4 py-3 flex items-center space-x-2 border-b-2 border-transparent hover:text-white">
                    <i class="fa-solid fa-cart-shopping text-emerald-400"></i><span>2. Đơn Mua (PO)</span>
                </button>
                <button onclick="switchTab('qrTab')" id="btn-qrTab" class="tab-btn px-4 py-3 flex items-center space-x-2 border-b-2 border-transparent hover:text-white">
                    <i class="fa-solid fa-boxes-stacked text-purple-400"></i><span>3. Kho & QR (Xuất / Nhập)</span>
                </button>
                <button onclick="switchTab('historyTab')" id="btn-historyTab" class="tab-btn px-4 py-3 flex items-center space-x-2 border-b-2 border-transparent hover:text-white">
                    <i class="fa-solid fa-clock-rotate-left text-cyan-400"></i><span>4. Nhật Ký Xuất & Bảo Hành</span>
                </button>
                <button onclick="switchTab('vatTab')" id="btn-vatTab" class="tab-btn px-4 py-3 flex items-center space-x-2 border-b-2 border-transparent hover:text-white">
                    <i class="fa-solid fa-receipt text-amber-400"></i><span>5. Hóa Đơn VAT & Công Nợ</span>
                </button>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 flex-grow w-full">

        <!-- TAB 1: PHIẾU ĐỀ XUẤT MUA HÀNG (PR) -->
        <div id="prTab" class="tab-content active space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 class="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
                        <i class="fa-solid fa-circle-plus text-blue-600"></i>
                        <span>Tạo Phiếu Đề Xuất Mua Hàng</span>
                    </h2>
                    <form id="prForm" onsubmit="handleCreatePR(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Người Đề Xuất *</label>
                            <input type="text" id="prRequester" required placeholder="Anh Tuấn (Kỹ thuật)..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Công Ty *</label>
                                <select id="prCompany" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                    <option value="Song Hiệp Lợi (SHL)">Song Hiệp Lợi (SHL)</option>
                                    <option value="Chất Lượng">Chất Lượng</option>
                                    <option value="VAB">VAB</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên Máy / Dây Chuyền</label>
                                <input type="text" id="prMachine" placeholder="Máy thổi tuýp..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Chọn Vật Tư / Thiết Bị *</label>
                            <input type="text" id="prItemName" list="masterItems" required placeholder="Chọn hoặc nhập tên vật tư..." onchange="onSelectItem(this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                            <datalist id="masterItems">
                                <option value="Cảm biến quang Omron (PART-CB01)"></option>
                                <option value="Bạc đạn 6204 (PART-BD02)"></option>
                                <option value="Cầu chì 10A (PART-CC03)"></option>
                            </datalist>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Mã Part No.</label>
                                <input type="text" id="prPartNo" required class="w-full px-3 py-2 border border-slate-200 bg-slate-100 font-mono text-slate-700 rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Số Lượng *</label>
                                <input type="number" id="prQty" required min="1" value="1" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Lý Do Đề Xuất *</label>
                            <textarea id="prReason" required rows="2" placeholder="Thay thế máy sản xuất..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></textarea>
                        </div>
                        <button type="submit" class="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg text-sm shadow flex items-center justify-center space-x-2">
                            <i class="fa-solid fa-paper-plane"></i><span>Gửi Phiếu Đề Xuất (PR)</span>
                        </button>
                    </form>
                </div>

                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-base font-bold text-slate-800 flex items-center space-x-2">
                            <i class="fa-solid fa-list-check text-slate-600"></i>
                            <span>Danh Sách Đề Xuất Mua Hàng</span>
                        </h2>
                        <span id="prCount" class="text-xs bg-slate-100 font-semibold text-slate-600 px-2.5 py-1 rounded-full">0 đơn</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-3">Mã PR</th>
                                    <th class="py-3 px-3">Công Ty / Máy</th>
                                    <th class="py-3 px-3">Vật Tư & Mã Part</th>
                                    <th class="py-3 px-3 text-center">SL</th>
                                    <th class="py-3 px-3">Trạng Thái</th>
                                    <th class="py-3 px-3 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody id="prTableBody" class="divide-y divide-slate-100"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 2: ĐƠN MUA HÀNG (PO) -->
        <div id="poTab" class="tab-content space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-base font-bold text-slate-800 flex items-center space-x-2">
                        <i class="fa-solid fa-truck-ramp-box text-emerald-600"></i>
                        <span>Quản Lý Đơn Mua Hàng (PO) & Gửi Nhà Cung Cấp</span>
                    </h2>
                    <span id="poCount" class="text-xs bg-emerald-100 font-semibold text-emerald-800 px-2.5 py-1 rounded-full">0 đơn</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="py-3 px-3">Mã PO</th>
                                <th class="py-3 px-3">Nhà Cung Cấp</th>
                                <th class="py-3 px-3">Vật Tư</th>
                                <th class="py-3 px-3 text-center">SL</th>
                                <th class="py-3 px-3">Đơn Giá VAT (đ)</th>
                                <th class="py-3 px-3">Thành Tiền (đ)</th>
                                <th class="py-3 px-3">Trạng Thái PO</th>
                                <th class="py-3 px-3 text-center">Thao Tác Zalo</th>
                            </tr>
                        </thead>
                        <tbody id="poTableBody" class="divide-y divide-slate-100"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB 3: KHO & MÃ QR -->
        <div id="qrTab" class="tab-content space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                    <div class="flex space-x-2 border-b border-slate-200 pb-2">
                        <button onclick="setStockMode('in')" id="btnModeIn" class="flex-1 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white shadow">📦 Nhập Kho</button>
                        <button onclick="setStockMode('out')" id="btnModeOut" class="flex-1 py-1.5 text-xs font-bold rounded bg-slate-200 text-slate-700">📤 Xuất Kho Bảo Trì</button>
                    </div>

                    <div id="qr-reader" class="w-full bg-slate-900 rounded-lg overflow-hidden min-h-[160px]"></div>
                    <button onclick="startQRScanner()" class="w-full bg-blue-600 text-white py-2 rounded text-xs font-semibold shadow">📷 Bật Camera Quét Mã QR</button>

                    <form id="formStockAction" onsubmit="handleStockAction(event)" class="space-y-3 pt-2">
                        <div>
                            <label class="block text-[11px] font-medium text-slate-600">Mã Part No. *</label>
                            <input type="text" id="stockPartNo" required placeholder="PART-CB01..." onblur="autoFillItemName(this.value)" class="w-full text-xs p-2 border border-slate-300 rounded font-mono">
                        </div>
                        <div>
                            <label class="block text-[11px] font-medium text-slate-600">Tên Linh Kiện *</label>
                            <input type="text" id="stockItemName" required class="w-full text-xs p-2 border border-slate-300 rounded">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[11px] font-medium text-slate-600">Số Lượng *</label>
                                <input type="number" id="stockQty" min="1" value="1" required class="w-full text-xs p-2 border border-slate-300 rounded font-bold">
                            </div>
                            <div>
                                <label class="block text-[11px] font-medium text-slate-600">Người Thực Hiện *</label>
                                <input type="text" id="stockExporter" required placeholder="Kỹ thuật..." class="w-full text-xs p-2 border border-slate-300 rounded">
                            </div>
                        </div>

                        <div id="exportFields" class="space-y-3 bg-amber-50 p-3 rounded-lg border border-amber-200 hidden">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] font-semibold text-amber-900">Công Ty Sử Dụng *</label>
                                    <select id="stockCompany" class="w-full text-xs p-2 border border-amber-300 rounded bg-white">
                                        <option value="Song Hiệp Lợi (SHL)">Song Hiệp Lợi (SHL)</option>
                                        <option value="Chất Lượng">Chất Lượng</option>
                                        <option value="VAB">VAB</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[11px] font-semibold text-amber-900">Tên Máy / Dây Chuyền *</label>
                                    <input type="text" id="stockMachine" placeholder="Máy thổi..." class="w-full text-xs p-2 border border-amber-300 rounded bg-white">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-semibold text-amber-900">Thời Gian Bảo Hành (Tháng)</label>
                                <select id="stockWarrantyMonths" class="w-full text-xs p-2 border border-amber-300 rounded bg-white font-bold">
                                    <option value="6">6 Tháng</option>
                                    <option value="12" selected>12 Tháng (1 Năm)</option>
                                    <option value="24">24 Tháng (2 Năm)</option>
                                    <option value="0">Không Bảo Hành</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" id="btnStockSubmit" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded text-xs shadow">Xác Nhận Nhập Kho</button>
                    </form>
                </div>

                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 class="text-base font-bold text-slate-800 mb-4">Danh Mục Linh Kiện Tồn Kho & Tem QR</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-3">Mã Part No.</th>
                                    <th class="py-3 px-3">Tên Linh Kiện</th>
                                    <th class="py-3 px-3 text-center">Tồn Kho</th>
                                    <th class="py-3 px-3 text-right">In Tem QR Code</th>
                                </tr>
                            </thead>
                            <tbody id="inventoryTableBody" class="divide-y divide-slate-100"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 4: NHẬT KÝ XUẤT KHO & BẢO HÀNH -->
        <div id="historyTab" class="tab-content space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-base font-bold text-slate-800 flex items-center space-x-2">
                        <i class="fa-solid fa-shield-halved text-cyan-600"></i>
                        <span>Sổ Nhật Ký Xuất Kho & Tra Cứu Bảo Hành Linh Kiện</span>
                    </h2>
                    <input type="text" id="searchHistory" onkeyup="filterHistory()" placeholder="Tìm Mã Part, Tên máy..." class="text-xs p-2 border border-slate-300 rounded-lg w-64">
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="py-3 px-3">Mã Part</th>
                                <th class="py-3 px-3">Tên Linh Kiện</th>
                                <th class="py-3 px-3 text-center">SL Xuất</th>
                                <th class="py-3 px-3">Công Ty / Máy</th>
                                <th class="py-3 px-3">Thời Gian Xuất</th>
                                <th class="py-3 px-3">Hạn Bảo Hành</th>
                                <th class="py-3 px-3 text-center">Trạng Thái BH</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody" class="divide-y divide-slate-100"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB 5: HÓA ĐƠN VAT & CÔNG NỢ -->
        <div id="vatTab" class="tab-content space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-base font-bold text-slate-800 mb-4">Sổ Theo Dõi Hóa Đơn VAT & Thanh Toán Công Nợ</h2>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="py-3 px-3">Mã PO</th>
                                <th class="py-3 px-3">Nhà Cung Cấp</th>
                                <th class="py-3 px-3">Tổng Tiền (đ)</th>
                                <th class="py-3 px-3">File Hóa Đơn (Drive / Máy)</th>
                                <th class="py-3 px-3">Trạng Thái VAT</th>
                                <th class="py-3 px-3 text-center">Thanh Toán</th>
                            </tr>
                        </thead>
                        <tbody id="vatTableBody" class="divide-y divide-slate-100"></tbody>
                    </table>
                </div>
            </div>
        </div>

    </main>

    <!-- MODAL IN TEM QR CODE -->
    <div id="modalQR" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 class="font-bold text-slate-800 text-sm uppercase">Tem Linh Kiện - Song Hiệp Lợi</h3>
            <div id="qrCodeContainer" class="flex justify-center p-3 bg-white border border-slate-200 rounded-lg"></div>
            <div id="qrModalInfo" class="text-xs font-mono font-bold text-slate-700"></div>
            <div class="flex space-x-2">
                <button onclick="window.print()" class="flex-1 bg-blue-600 text-white text-xs font-medium py-2 rounded-lg">In Tem</button>
                <button onclick="closeQRModal()" class="bg-slate-200 text-slate-700 text-xs font-medium py-2 px-4 rounded-lg">Đóng</button>
            </div>
        </div>
    </div>

    <script>
        const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9QKi7B706ODgoCXmvzBeJwWqv2fAiYUHkq_Q1vAiHY8U9SPLQIPLMgxJJBtI0QzBQKw/exec";
        const ADMIN_PASS = "123456";

        let isAdmin = false;
        let scriptUrl = localStorage.getItem('shl_script_url') || DEFAULT_SCRIPT_URL;
        let stockMode = 'in';

        let inventory = JSON.parse(localStorage.getItem('shl_inventory')) || [
            { code: 'PART-CB01', name: 'Cảm biến quang Omron', qty: 10 },
            { code: 'PART-BD02', name: 'Bạc đạn 6204', qty: 25 },
            { code: 'PART-CC03', name: 'Cầu chì 10A', qty: 50 }
        ];

        let exportHistory = JSON.parse(localStorage.getItem('shl_export_history')) || [];

        document.addEventListener('DOMContentLoaded', () => {
            const activeTab = localStorage.getItem('shl_active_tab') || 'prTab';
            switchTab(activeTab);
            fetchDataFromSheet();
        });

        function switchTab(tabId) {
            localStorage.setItem('shl_active_tab', tabId);
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('border-blue-500', 'text-white', 'bg-slate-700/50'));
            
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add('active');
            
            const btn = document.getElementById('btn-' + tabId);
            if (btn) btn.classList.add('border-blue-500', 'text-white', 'bg-slate-700/50');
        }

        function toggleAdminLogin() {
            if (isAdmin) {
                isAdmin = false;
                document.getElementById('adminBtnText').textContent = "Đăng nhập TPKT / Admin";
                renderPRTable();
            } else {
                const pass = prompt('Nhập mật khẩu xác thực TPKT:');
                if (pass === ADMIN_PASS) {
                    isAdmin = true;
                    document.getElementById('adminBtnText').textContent = "Thoát Quyền TPKT";
                    renderPRTable();
                    alert('✅ Đăng nhập TPKT thành công!');
                } else if (pass !== null) alert('❌ Mật khẩu không chính xác!');
            }
        }

        function fetchDataFromSheet() {
            fetch(scriptUrl + '?action=getData')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success' && data.pr) {
                        let formattedPR = data.pr.map(row => ({
                            id: row['Mã PR'],
                            requester: row['Người Đề Xuất'],
                            company: row['Công Ty'] || 'Song Hiệp Lợi (SHL)',
                            machine: row['Tên Máy'] || '',
                            itemName: row['Tên Vật Tư'],
                            partNo: row['Mã Part'],
                            qty: row['Số Lượng'],
                            reason: row['Lý Do'],
                            status: row['Trạng Thái']
                        }));
                        localStorage.setItem('shl_pr_list', JSON.stringify(formattedPR));
                    }
                    renderPRTable();
                    renderPOTable();
                    renderInventoryTable();
                    renderHistoryTable();
                    renderVATTable();
                }).catch(() => {
                    renderPRTable();
                    renderPOTable();
                    renderInventoryTable();
                    renderHistoryTable();
                    renderVATTable();
                });
        }

        function onSelectItem(val) {
            if (val.includes('PART-CB01')) document.getElementById('prPartNo').value = 'PART-CB01';
            else if (val.includes('PART-BD02')) document.getElementById('prPartNo').value = 'PART-BD02';
            else if (val.includes('PART-CC03')) document.getElementById('prPartNo').value = 'PART-CC03';
            else document.getElementById('prPartNo').value = 'PART-' + Math.floor(1000 + Math.random() * 9000);
        }

        function handleCreatePR(e) {
            e.preventDefault();
            const prData = {
                id: 'PR-' + Date.now().toString().slice(-6),
                requester: document.getElementById('prRequester').value,
                company: document.getElementById('prCompany').value,
                machine: document.getElementById('prMachine').value,
                itemName: document.getElementById('prItemName').value,
                partNo: document.getElementById('prPartNo').value,
                qty: document.getElementById('prQty').value,
                reason: document.getElementById('prReason').value,
                status: 'Chờ Duyệt',
                date: new Date().toLocaleDateString('vi-VN')
            };

            let prList = JSON.parse(localStorage.getItem('shl_pr_list') || '[]');
            prList.unshift(prData);
            localStorage.setItem('shl_pr_list', JSON.stringify(prList));

            fetch(scriptUrl, {
                method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SAVE_PR', data: prData })
            }).then(() => {
                alert('🎉 Tạo phiếu PR thành công!');
                document.getElementById('prForm').reset();
                renderPRTable();
            });
        }

        function approvePR(prId) {
            if (!isAdmin) { alert('🔒 Chỉ TPKT mới có quyền duyệt!'); return; }
            let prList = JSON.parse(localStorage.getItem('shl_pr_list') || '[]');
            let item = prList.find(i => i.id === prId);
            if (item) {
                item.status = 'Đã Duyệt';
                localStorage.setItem('shl_pr_list', JSON.stringify(prList));
            }

            fetch(scriptUrl, {
                method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'APPROVE_PR', id: prId, approver: "TPKT", approvedTime: new Date().toLocaleString('vi-VN') })
            });

            alert('✅ TPKT đã duyệt đơn ' + prId + '!');
            renderPRTable(); renderPOTable(); renderVATTable();
        }

        function sendPOViaZalo(poId) {
            let poList = JSON.parse(localStorage.getItem('shl_po_list') || '[]');
            let po = poList.find(p => p.poId === poId);
            if (!po) return;

            po.status = "Đã phát hành";
            localStorage.setItem('shl_po_list', JSON.stringify(poList));
            renderPOTable();

            const totalMoney = (parseFloat(po.unitPrice) || 0) * parseInt(po.qty);
            const msg = `📩 *ĐƠN ĐẶT HÀNG (PO) - SONG HIỆP LỢI*\n----------------------------------\nKính gửi: *${po.supplier || 'Nhà Cung Cấp'}*\nMã Đơn PO: *${po.poId}*\n\nChi tiết vật tư:\n- *Tên vật tư:* ${po.itemName}\n- *Số lượng đặt:* ${po.qty}\n- *Đơn giá VAT:* ${(parseFloat(po.unitPrice)||0).toLocaleString('vi-VN')} VNĐ\n- *Tổng giá trị:* ${totalMoney.toLocaleString('vi-VN')} VNĐ\n\n📌 CÔNG TY TNHH TM-KT SONG HIỆP LỢI\nMST: 0305xxxxxx\n----------------------------------\nNhờ Anh/Chị xác nhận tiến độ giao hàng và xuất Hóa đơn VAT nhé!`;

            navigator.clipboard.writeText(msg).then(() => {
                alert('✅ Đã sao chép nội dung đơn PO!\nĐã mở Zalo Web, chọn NCC và nhấn Ctrl+V để gửi.');
                window.open('https://zalo.me/vi/', '_blank');
            });
        }

        function uploadVATFile(poId, inputEl) {
            const file = inputEl.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const fileDataUrl = e.target.result;
                const base64Data = fileDataUrl.split(',')[1];

                let poList = JSON.parse(localStorage.getItem('shl_po_list') || '[]');
                let po = poList.find(p => p.poId === poId);
                if (po) {
                    po.vatFileUrl = fileDataUrl;
                    po.vatFileName = file.name;
                    po.vatStatus = 'Đã Nhận VAT';
                    localStorage.setItem('shl_po_list', JSON.stringify(poList));
                    renderVATTable();
                }

                fetch(scriptUrl, {
                    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'UPLOAD_VAT_FILE', poId, fileName: poId + '_' + file.name, mimeType: file.type, fileData: base64Data })
                });

                alert('✅ Đã đính kèm file Hóa đơn VAT thành công!');
            };
            reader.readAsDataURL(file);
        }

        function togglePaymentStatus(poId) {
            let poList = JSON.parse(localStorage.getItem('shl_po_list') || '[]');
            let po = poList.find(p => p.poId === poId);
            if (po) {
                po.paid = !po.paid;
                localStorage.setItem('shl_po_list', JSON.stringify(poList));
                renderVATTable();
            }
        }

        function setStockMode(mode) {
            stockMode = mode;
            if (mode === 'in') {
                document.getElementById('btnModeIn').className = 'flex-1 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white shadow';
                document.getElementById('btnModeOut').className = 'flex-1 py-1.5 text-xs font-bold rounded bg-slate-200 text-slate-700';
                document.getElementById('exportFields').classList.add('hidden');
                document.getElementById('btnStockSubmit').innerText = 'Xác Nhận Nhập Kho';
            } else {
                document.getElementById('btnModeIn').className = 'flex-1 py-1.5 text-xs font-bold rounded bg-slate-200 text-slate-700';
                document.getElementById('btnModeOut').className = 'flex-1 py-1.5 text-xs font-bold rounded bg-amber-600 text-white shadow';
                document.getElementById('exportFields').classList.remove('hidden');
                document.getElementById('btnStockSubmit').innerText = 'Xác Nhận Xuất Kho Bảo Trì';
            }
        }

        function handleStockAction(e) {
            e.preventDefault();
            const code = document.getElementById('stockPartNo').value;
            const name = document.getElementById('stockItemName').value;
            const qty = parseInt(document.getElementById('stockQty').value);
            const exporter = document.getElementById('stockExporter').value;

            let item = inventory.find(i => i.code === code);

            if (stockMode === 'in') {
                if (item) item.qty += qty; else inventory.push({ code, name, qty });
                alert(`📦 Đã nhập kho ${qty} linh kiện [${code}]!`);
            } else {
                if (!item || item.qty < qty) { alert('❌ Tồn kho không đủ để xuất!'); return; }
                const company = document.getElementById('stockCompany').value;
                const machine = document.getElementById('stockMachine').value || 'Thiết bị xưởng';
                const warrantyMonths = parseInt(document.getElementById('stockWarrantyMonths').value);

                const now = new Date();
                const exportTimeStr = now.toLocaleString('vi-VN');
                let expireDate = new Date(); expireDate.setMonth(expireDate.getMonth() + warrantyMonths);
                const expireDateStr = warrantyMonths > 0 ? expireDate.toLocaleDateString('vi-VN') : 'Không BH';

                item.qty -= qty;
                const exportRecord = { partNo: code, itemName: name, qty, company, machine, exportTime: exportTimeStr, warrantyMonths, warrantyExpireDate: expireDateStr, exporter };
                exportHistory.unshift(exportRecord);
                localStorage.setItem('shl_export_history', JSON.stringify(exportHistory));

                fetch(scriptUrl, {
                    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'EXPORT_STOCK', data: exportRecord })
                });

                alert(`📤 Xuất kho thành công!\nLinh kiện [${code}] cho máy ${machine}.\nHạn bảo hành đến: ${expireDateStr}`);
            }

            localStorage.setItem('shl_inventory', JSON.stringify(inventory));
            renderInventoryTable(); renderHistoryTable();
            document.getElementById('formStockAction').reset(); setStockMode('in');
        }

        function renderPRTable() {
            let prList = JSON.parse(localStorage.getItem('shl_pr_list') || '[]');
            const tbody = document.getElementById('prTableBody');
            document.getElementById('prCount').textContent = prList.length + ' đơn';

            tbody.innerHTML = prList.map(item => `
                <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-semibold text-blue-900">${item.id}</td>
                    <td class="py-3 px-3">
                        <div class="font-bold text-slate-800 text-xs">${item.company || 'SHL'}</div>
                        <div class="text-[11px] text-slate-500">${item.machine || ''}</div>
                    </td>
                    <td class="py-3 px-3">
                        <div class="font-medium">${item.itemName}</div>
                        <div class="text-xs text-slate-400 font-mono">${item.partNo || ''}</div>
                    </td>
                    <td class="py-3 px-3 text-center font-bold text-blue-900">${item.qty}</td>
                    <td class="py-3 px-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full ${item.status === 'Đã Duyệt' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${item.status}</span></td>
                    <td class="py-3 px-3 text-right">
                        ${isAdmin && item.status !== 'Đã Duyệt' ? `<button onclick="approvePR('${item.id}')" class="text-xs bg-blue-600 text-white px-2.5 py-1 rounded">Duyệt Đơn</button>` : `<span class="text-xs text-slate-400 italic">Cần TPKT</span>`}
                    </td>
                </tr>
            `).join('');
        }

        function renderPOTable() {
            let prList = JSON.parse(localStorage.getItem('shl_pr_list') || '[]');
            let approvedPRs = prList.filter(item => item.status === 'Đã Duyệt');
            let poList = JSON.parse(localStorage.getItem('shl_po_list') || '[]');
            
            approvedPRs.forEach(pr => {
                let poId = 'PO-' + pr.id.replace('PR-', '');
                if (!poList.some(p => p.poId === poId)) {
                    poList.push({ poId, prId: pr.id, itemName: pr.itemName, qty: pr.qty, supplier: '', unitPrice: 0, status: 'Chờ phát hành' });
                }
            });
            localStorage.setItem('shl_po_list', JSON.stringify(poList));
            const tbody = document.getElementById('poTableBody');

            tbody.innerHTML = poList.map(item => `
                <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-semibold text-emerald-900">${item.poId}</td>
                    <td class="py-3 px-3"><input type="text" value="${item.supplier || ''}" placeholder="Nhập NCC..." onchange="updatePOSupplier('${item.poId}', this.value)" class="text-xs p-1 border rounded w-32"></td>
                    <td class="py-3 px-3 font-medium">${item.itemName}</td>
                    <td class="py-3 px-3 text-center font-bold">${item.qty}</td>
                    <td class="py-3 px-3"><input type="number" value="${item.unitPrice || 0}" onchange="updatePOPrice('${item.poId}', this.value)" class="text-xs p-1 border rounded w-24"></td>
                    <td class="py-3 px-3 font-bold text-emerald-700">${((parseFloat(item.unitPrice)||0)*parseInt(item.qty)).toLocaleString('vi-VN')} đ</td>
                    <td class="py-3 px-3"><span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">${item.status || 'Chờ phát hành'}</span></td>
                    <td class="py-3 px-3 text-center"><button onclick="sendPOViaZalo('${item.poId}')" class="bg-emerald-600 text-white text-xs px-2 py-1 rounded shadow">📲 Gửi Zalo</button></td>
                </tr>
            `).join('');
        }

        function updatePOSupplier(poId, val) {
            let poList = JSON.parse(localStorage.getItem('shl_po_list') || '[]');
            let item = poList.find(p => p.poId === poId);
            if (item) { item.supplier = val; localStorage.setItem('shl_po_list', JSON.stringify(poList)); renderVATTable(); }
        }

        function updatePOPrice(poId, val) {
            let poList = JSON.parse(localStorage.getItem('shl_po_list') || '[]');
            let item = poList.find(p => p.poId === poId);
            if (item) { item.unitPrice = parseFloat(val) || 0; localStorage.setItem('shl_po_list', JSON.stringify(poList)); renderPOTable(); renderVATTable(); }
        }

        function renderInventoryTable() {
            document.getElementById('inventoryTableBody').innerHTML = inventory.map(item => `
                <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-mono font-bold text-slate-700">${item.code}</td>
                    <td class="py-3 px-3 font-medium">${item.name}</td>
                    <td class="py-3 px-3 text-center font-bold ${item.qty > 0 ? 'text-emerald-700':'text-red-600'}">${item.qty}</td>
                    <td class="py-3 px-3 text-right"><button onclick="showQRModal('${item.code}', '${item.name}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs p-1.5 rounded"><i class="fa-solid fa-qrcode"></i> In Tem QR</button></td>
                </tr>
            `).join('');
        }

        function renderHistoryTable() {
            const tbody = document.getElementById('historyTableBody');
            if (exportHistory.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400">Chưa có lịch sử xuất kho linh kiện</td></tr>`;
                return;
            }
            const today = new Date();
            tbody.innerHTML = exportHistory.map(h => {
                let isExpired = false;
                if (h.warrantyExpireDate !== 'Không BH') {
                    const parts = h.warrantyExpireDate.split('/');
                    if (parts.length === 3 && new Date(parts[2], parts[1] - 1, parts[0]) < today) isExpired = true;
                }
                return `
                    <tr class="hover:bg-slate-50">
                        <td class="py-3 px-3 font-mono font-bold">${h.partNo}</td>
                        <td class="py-3 px-3 font-medium">${h.itemName}</td>
                        <td class="py-3 px-3 text-center font-bold text-amber-700">${h.qty}</td>
                        <td class="py-3 px-3"><div class="font-bold text-xs">${h.company}</div><div class="text-[11px] text-slate-500">${h.machine}</div></td>
                        <td class="py-3 px-3 text-xs">${h.exportTime}</td>
                        <td class="py-3 px-3 text-xs font-bold text-blue-900">${h.warrantyExpireDate}</td>
                        <td class="py-3 px-3 text-center">${h.warrantyMonths === 0 ? `<span class="text-xs bg-slate-100 px-2 py-0.5 rounded">Không BH</span>` : isExpired ? `<span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">🔴 Hết BH</span>` : `<span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">🟢 Còn BH (${h.warrantyMonths}T)</span>`}</td>
                    </tr>
                `;
            }).join('');
        }

        function renderVATTable() {
            let poList = JSON.parse(localStorage.getItem('shl_po_list') || '[]');
            document.getElementById('vatTableBody').innerHTML = poList.map(po => `
                <tr class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-semibold">${po.poId}</td>
                    <td class="py-3 px-3">${po.supplier || 'Chưa chọn NCC'}</td>
                    <td class="py-3 px-3 font-bold">${((parseFloat(po.unitPrice)||0)*parseInt(po.qty)).toLocaleString('vi-VN')} đ</td>
                    <td class="py-3 px-3">
                        ${po.vatFileUrl ? `
                            <a href="${po.vatFileUrl}" target="_blank" class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-semibold inline-flex items-center space-x-1 border border-emerald-300">
                                <i class="fa-solid fa-file-invoice"></i><span>👁️ Xem File (${po.vatFileName || 'VAT'})</span>
                            </a>
                        ` : `
                            <label class="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer border inline-flex items-center space-x-1">
                                <i class="fa-solid fa-cloud-arrow-up text-blue-600"></i><span>📷 Tải File Hóa Đơn</span>
                                <input type="file" accept="image/*,application/pdf" onchange="uploadVATFile('${po.poId}', this)" class="hidden">
                            </label>
                        `}
                    </td>
                    <td class="py-3 px-3"><span class="text-xs font-bold ${po.vatFileUrl?'text-emerald-600':'text-red-600'}">${po.vatFileUrl?'✓ Đã Có VAT':'✕ Chưa VAT'}</span></td>
                    <td class="py-3 px-3 text-center">
                        <button onclick="togglePaymentStatus('${po.poId}')" class="text-xs font-bold px-2 py-1 rounded border ${po.paid ? 'bg-emerald-100 text-emerald-800 border-emerald-300':'bg-amber-100 text-amber-800 border-amber-300'}">
                            ${po.paid ? '✅ Đã Thanh Toán' : '⏳ Chưa Thanh Toán'}
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function autoFillItemName(code) {
            let item = inventory.find(i => i.code === code);
            if (item) document.getElementById('stockItemName').value = item.name;
        }

        function filterHistory() {
            const q = document.getElementById('searchHistory').value.toLowerCase();
            document.querySelectorAll('#historyTableBody tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
        }

        function showQRModal(code, name) {
            document.getElementById('modalQR').classList.remove('hidden');
            document.getElementById('modalQR').classList.add('flex');
            document.getElementById('qrModalInfo').innerText = `${name} (${code})`;
            document.getElementById('qrCodeContainer').innerHTML = '';
            new QRCode(document.getElementById('qrCodeContainer'), { text: code, width: 140, height: 140 });
        }

        function closeQRModal() {
            document.getElementById('modalQR').classList.add('hidden');
            document.getElementById('modalQR').classList.remove('flex');
        }
    </script>
</body>
</html>
```