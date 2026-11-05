# HƯỚNG DẪN SỬ DỤNG ProcureQR v3.1

**Công ty TNHH TM-KT Song Hiệp Lợi** · Quản lý đề xuất mua hàng (PR), đơn mua (PO), kho, bảo hành, hóa đơn VAT
Cập nhật: 05/11/2026

---

## 0. Mở app

| Bản | Link | Dùng để |
|---|---|---|
| **Bản thử (TEST)** | https://phamvan5593-cell.github.io/procureqr/v31/?env=test | Tập dùng, bấm thoải mái, dữ liệu không thật |
| Bản thật | https://phamvan5593-cell.github.io/procureqr/ | *Chuyển sang v3.1 sau khi mọi người đồng ý* |

- Mở được trên **máy tính và điện thoại** (Chrome, Safari, Zalo trình duyệt).
- Mẹo cho điện thoại: mở link → menu trình duyệt → **"Thêm vào màn hình chính"** để có biểu tượng như ứng dụng.
- Mỗi thao tác chờ khoảng **3–7 giây**. Góc trên bên phải hiện **"⏳ Đang xử lý..."** thì đợi, **đừng bấm lại**.
- Bấm **Làm mới** để xem dữ liệu mới nhất do người khác vừa nhập.

## 1. Ai được làm gì

| Người | Đăng nhập | Được làm |
|---|---|---|
| **Nhân viên kỹ thuật và các anh khác** | Không cần | Tạo phiếu đề xuất (PR), xem danh sách PR, xem tồn kho, **tra cứu bảo hành** |
| **Vân, Thùy** | Mã PIN | Như trên + đơn mua (PO), **nhập / xuất kho**, danh mục vật tư, khách hàng & máy, hóa đơn VAT, công nợ, cấu hình |
| **Anh Hoàng** (quản lý) | Mã PIN | **Duyệt / Từ chối / Chuyển báo giá KH** cho PR, xem tất cả, PO, VAT. *Không nhập / xuất kho* |

**Đăng nhập:** bấm **Đăng nhập** (góc trên phải) → chọn tên → nhập PIN.
**Đổi PIN:** tab **8. Cấu hình → Đổi mã PIN của tôi** (4–8 chữ số).
**Đăng xuất:** bấm vào tên mình ở góc trên phải → **Đồng ý**.
> ⚠️ Dùng máy chung thì **đăng xuất sau khi làm xong**, để người sau không thao tác dưới tên mình.

## 2. Quy trình tổng thể

```
Kỹ thuật tạo PR ──► Anh Hoàng xem bảo hành + tồn kho
                     ├─ Duyệt ─┬─ Kho còn hàng ──► Vân/Thùy "📤 Xuất kho" theo PR
                     │         └─ Kho hết ──► Vân/Thùy tạo PO ► Phát hành & gửi Zalo
                     │                         ► 📦 Nhập kho khi hàng về ► Hóa đơn VAT ► Đã thanh toán
                     ├─ Báo giá KH (hết bảo hành) ──► Vân/Thùy gửi báo giá (làm ngoài app)
                     │                         ► KH đồng ý → thành "Đã Duyệt" (tính phí) │ KH không đồng ý → đóng
                     └─ Từ chối (ghi lý do)
```

## 3. Tạo phiếu đề xuất (PR) — tab **1. Đề xuất (PR)**

1. **Người đề xuất**: ghi họ tên – bộ phận (VD: *Minh – Kỹ thuật*).
2. **Loại đề xuất**:
   - **Bảo hành**: thay miễn phí cho khách.
   - **Sửa chữa tính phí**: khách trả tiền.
   - **Mua dự trữ kho**: mua để sẵn trong kho, không cần chọn khách hàng.
3. **Khách hàng**: gõ vài chữ của tên (VD: *VAB*, *Lộc Trời*) rồi chọn.
4. **Máy / dây chuyền**: khách có 1 máy thì app tự chọn; nhiều máy thì chọn đúng máy. Máy chưa có trong danh sách thì chọn **"+ Máy khác (tự ghi tên)"**.
5. **Vật tư**: gõ mã hoặc tên (VD: *relay*, *6204*). Dưới ô hiện **✓ tên vật tư · Tồn: …**.
   - Không có trong danh mục: ghi rõ tên, quy cách vào **Lý do**, hoặc nhờ Vân/Thùy thêm vật tư (nút **+**).
6. **Ô bảo hành** tự hiện ngay khi chọn đủ khách hàng, máy và vật tư:
   - 🟢 **Còn BH linh kiện**: lần thay trước còn hạn bảo hành.
   - 🟢 **Còn BH máy**: máy còn trong thời gian bảo hành.
   - 🔴 **Hết BH**: có lịch sử nhưng đã hết hạn, hoặc máy hết BH.
   - ⚪ **Chưa có lịch sử**: máy chưa có trong danh sách hoặc chưa từng thay linh kiện này.
7. Nhập **Số lượng**, **Lý do** → bấm **Gửi phiếu đề xuất**.

> App lưu luôn **kết quả bảo hành** và **tồn kho lúc đề xuất** vào phiếu, nên anh Hoàng không phải tra lại.

## 4. Duyệt PR (anh Hoàng)

Trong danh sách PR, phiếu **Chờ Duyệt** có 3 nút ngay dưới trạng thái:

| Nút | Khi nào dùng | Kết quả |
|---|---|---|
| **Duyệt** | Cần thay / cần mua | Phiếu thành **Đã Duyệt**. Vân/Thùy xuất kho (nếu còn hàng) hoặc tạo PO |
| **Báo giá KH** (tô cam khi 🔴 Hết BH) | Hết bảo hành, khách phải trả tiền | Phiếu thành **Chờ báo giá KH** |
| **Từ chối** | Không cần thay / không mua | Bắt buộc ghi lý do. Phiếu thành **Từ Chối** |

## 5. Báo giá khách hàng (Vân, Thùy)

Báo giá **làm ngoài app** (Excel / Word như hiện nay). App chỉ theo dõi trạng thái:
1. Gửi báo giá xong → bấm **Đã gửi báo giá** → nhập **số báo giá**.
2. Khách trả lời:
   - **KH đồng ý**: phiếu thành **Đã Duyệt**, loại **Sửa chữa tính phí**, rồi làm tiếp như phiếu đã duyệt.
   - **KH không đồng ý**: phiếu đóng (xóa được nếu muốn).

## 6. Đơn mua hàng (PO) — tab **2. Đơn mua (PO)** (Vân, Thùy)

### Tạo PO
1. Chọn **Nhà cung cấp** (chưa có thì bấm **+ NCC mới**).
2. Tích các PR **cùng nhà cung cấp** → sửa **SL đặt** (được đặt nhiều hơn đề xuất) → nhập **Đơn giá đã gồm VAT**.
3. Ghi chú (giao hàng, thanh toán...) → bấm **Tạo PO**.

### 4 bước của một PO
Mỗi PO có thanh bước, bước đang làm **tô xanh dương**, kèm dòng 👉 gợi ý việc cần làm tiếp:

| Bước | Trạng thái | Việc cần làm |
|---|---|---|
| 1. Soạn PO | Chờ phát hành | Kiểm tra lại SL, giá (còn sửa được) → **Phát hành & gửi Zalo** |
| 2. Gửi NCC | Đã phát hành | App copy sẵn tin nhắn: mở Zalo NCC → dán (Ctrl+V). Hàng về → **📦 Nhập kho** |
| 3. Nhận hàng | Nhận 1 phần → Đã nhận đủ | Hàng về nhiều lần thì bấm Nhập kho nhiều lần |
| 4. Hóa đơn & thanh toán | | **Nhập hóa đơn VAT** (số HĐ, file PDF/ảnh) → trả tiền xong bấm **Đánh dấu đã thanh toán** → ✅ Hoàn tất |

- **Hủy PO**: chỉ khi chưa nhận hàng. Các PR quay về **Đã Duyệt** để đặt lại với NCC khác.
- **In PO**: in ra giấy hoặc lưu PDF.
- **Gửi lại tin Zalo**: copy lại nội dung PO để gửi NCC lần nữa.

## 7. Nhập / Xuất kho — tab **3. Nhập / Xuất kho** (Vân, Thùy)

### Nhập kho
- **Theo PO**: bấm **📦 Nhập kho** trên PO (hoặc chọn PO trong ô "Nhập theo"). App điền sẵn số còn thiếu, sửa theo **số thực nhận**.
- **Nhập tự do** (không có PO, VD: tồn đầu kỳ, hàng thu hồi): chọn "Nhập tự do", quét QR hoặc gõ vật tư, nhập số lượng.

### Xuất kho bảo trì
- **Theo PR đã duyệt**: trên PR có nút **📤 Xuất kho** (khi kho còn hàng). App tự điền vật tư, số lượng, khách hàng, máy. Sau khi xuất, PR thành **Đã xuất kho**.
- **Xuất trực tiếp**: bấm **Xuất kho bảo trì** → quét QR hoặc gõ vật tư → chọn khách hàng, máy → chọn **thời gian bảo hành** (Không / 3 / 6 / 12 / 24 tháng) → **Xác nhận xuất kho**.
- App **không cho xuất quá số tồn**.
- **Thời gian bảo hành chọn lúc xuất** chính là căn cứ để lần sau app báo còn hay hết BH, nên **chọn đúng**.

### Quét QR
Bấm **Quét mã QR** → cho phép trình duyệt dùng camera → đưa tem vào khung → app tự điền vật tư.
*(Camera chỉ mở được khi trang chạy bằng https, link github.io là https.)*

## 8. Tồn kho & tem QR — tab **4. Tồn kho**

- Tồn kho **tự tính** từ các phiếu nhập / xuất, **không sửa tay**.
- Dòng **tô đỏ ⚠️** là hàng dưới **mức tối thiểu**. Tích "Chỉ hàng dưới mức tối thiểu" để lọc.
- **Tem QR**: bấm **Tem QR** → **In tem** (khổ khoảng 5 cm). Mỗi mã vật tư một tem, dán lên ngăn hoặc hộp chứa vật tư đó.
- **+ Vật tư mới** (Vân, Thùy): nhập mã in trên linh kiện, hoặc để trống để app tự cấp mã VT-xxxx. Đặt **Tồn tối thiểu** để app cảnh báo.

## 9. Tra cứu bảo hành & sổ kho — tab **5**

- **Ai cũng xem được**, không cần đăng nhập. Gõ mã vật tư, tên máy, hoặc tên khách hàng để lọc.
- Mỗi lần xuất kho hiện: ngày lắp, khách hàng, máy, hạn BH, 🟢 Còn BH / 🔴 Hết BH.
- Vân, Thùy thấy thêm các phiếu **nhập** kho.

## 10. Hóa đơn VAT & công nợ — tab **6**

Danh sách mọi PO đã phát hành: số hóa đơn, file, đã hoặc chưa thanh toán. Cũng thao tác được ngay trên thẻ PO (mục 6).

## 11. Khách hàng & máy — tab **7** (Vân, Thùy)

- **Thêm khách hàng**: tên (không được trùng), người liên hệ, SĐT/Zalo, MST, địa chỉ.
- **Thêm máy** (nút **+ Máy** trên dòng khách hàng): tên máy, model, **số serial**, **ngày bàn giao**, **số tháng bảo hành máy**. App tự tính hạn bảo hành máy.
- Bấm vào **số lần thay linh kiện** để xem lịch sử sửa chữa của máy đó.

> Nhập đủ **máy đã bán** và **ngày bàn giao** thì app mới báo bảo hành chính xác.

## 12. Cấu hình — tab **8**

- **Thông tin công ty** (tên, MST, địa chỉ, SĐT, người liên hệ): in lên PO và tin Zalo.
- **Nhà cung cấp**: thêm / sửa.
- **Đổi mã PIN**.

## 13. Google Sheet (dữ liệu gốc)

- Mọi dữ liệu nằm trong Google Sheet **ProcureQR**, mỗi loại một tab: PR, PO, PO_ChiTiet, SoKho, TonKho, DanhMucVatTu, KhachHang, MayKhachHang, NhaCungCap, HoaDon, CauHinh.
- **Nên làm mọi thao tác trên app.** Sửa thẳng trên Sheet thì app **không tự trừ tồn, không đổi trạng thái** PR/PO.
- Sheet dùng để **xem, lọc, xuất Excel** (Tệp → Tải xuống → .xlsx), sửa chữ gõ nhầm (tên, ghi chú).
- Các cột đã có **ô chọn** (trạng thái, mã…) và **lịch** (nhấp đúp vào ô ngày), nên khó nhập sai.
- Menu **ProcureQR** trên Sheet (người quản trị):
  1. Tạo / kiểm tra các tab
  2. **Đặt mã PIN** người dùng (khi ai đó quên PIN)
  3. Tính lại tồn kho
  4. Thêm ô chọn / lịch cho các cột

## 14. Gặp lỗi

| Hiện tượng | Cách xử lý |
|---|---|
| "Phiên đăng nhập đã hết hạn" | Đăng nhập lại (phiên tự hết sau 6 giờ) |
| "Mã PIN không đúng" / quên PIN | Nhờ người quản trị Sheet: menu **ProcureQR → 2. Đặt mã PIN** |
| "Chưa có trong danh mục" | Gõ đúng mã hoặc tên. Nếu là vật tư mới, Vân/Thùy thêm ở tab 4 |
| "Tồn kho chỉ còn …" | Không đủ hàng, cần tạo PR / PO mua thêm |
| Không mở được camera | Cho phép camera trong cài đặt trình duyệt. Dùng link **https** |
| Dữ liệu không thấy cập nhật | Bấm **Làm mới** |
| Báo lỗi lạ | Chụp màn hình (kèm giờ) gửi người hỗ trợ |

---

## Phụ lục – Cho người quản trị / hỗ trợ kỹ thuật

- Code: GitHub `phamvan5593-cell/procureqr`. Nhánh **`v3.1-dev`** chứa toàn bộ code v3.1, nhánh `main` là trang đang chạy.
- Backend: `apps-script/src` (Code.gs, QuanTri.gs). Đưa lên bằng `clasp -P apps-script/.clasp.test.json push` (bản TEST) hoặc `.clasp.prod.json` (bản thật).
- Kiểm thử tự động: `node apps-script/test/mock-run.js`.
- Thiết kế: `docs/THIET-KE-v3.1.md` · Phân tích mở rộng: `docs/PHAN-TICH-MO-RONG.md`.
