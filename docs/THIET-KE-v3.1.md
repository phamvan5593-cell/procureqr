# ProcureQR v3.1 – Bản thiết kế (chờ duyệt)

Ngày: 05/11/2026 · Trạng thái: **NHÁP – chờ A/Vân duyệt trước khi code**

## 1. Hiện trạng (đã kiểm tra thực tế, không dựa vào lời Gemini)

| Thành phần | Thực tế |
|---|---|
| Web (GitHub `phamvan5593-cell/procureqr`) | 1 file `index.html`, 15 commit ngày 3–4/11 |
| Backend đang chạy | Deployment "ProcureQR 3.0" = **phiên bản 7** (10:53 4/11), file `apps-script/_deployed_v7/ketnoiapp.gs` |
| Code trong editor Apps Script | Phiên bản 9 – **khác bản đang chạy, KHÔNG được deploy** (sẽ lệch cột) |
| Sheet | Tab PR (10 cột), PO (tiêu đề 7 cột, dữ liệu 9 cột → lệch), TonKho (trống), HoaDon (trống). Chỉ dữ liệu test |

**Lệch giữa web và backend đang chạy:**

| Web gửi | Backend v7 | Hậu quả |
|---|---|---|
| `SAVE_PR` có Công ty, Tên máy | Chỉ ghi 10 cột, bỏ Công ty/Máy | Mất thông tin công ty/máy |
| `EXPORT_STOCK` | **Không xử lý** | Xuất kho không lưu Sheet |
| `UPLOAD_VAT_FILE` | **Không xử lý** | Hóa đơn chưa từng lên Drive (thư mục trống) |
| PO (NCC, giá), tồn kho, thanh toán | Không có lệnh | Chỉ nằm trong trình duyệt |
| `DELETE_PR` | Có | Web bản mới không còn nút xoá |

**Tính năng từng có trong lịch sử git, bị bản sau làm mất:** quét QR camera (7d28031), cấu hình MST/địa chỉ (7d28031), kiểm tra mật khẩu ở server `VERIFY_PASS` (491ed90), đồng bộ toàn bộ `SYNC_ALL` (491ed90), xoá PR (539359c), kiểm tra kết nối (8bd7042).

## 2. Nguyên tắc v3.1

1. **Google Sheet là nguồn dữ liệu duy nhất.** Trình duyệt chỉ cache để hiển thị nhanh; mọi thao tác ghi phải được Sheet xác nhận mới báo "thành công".
2. **Backend ghi theo TÊN cột, không theo số thứ tự cột** → chèn/đổi thứ tự cột không làm lệch dữ liệu.
3. **Gọi backend đọc được phản hồi** (bỏ `mode: 'no-cors'`, dùng `Content-Type: text/plain`) → biết lưu được hay lỗi.
4. **LockService** khi ghi → 2 người bấm cùng lúc không trùng mã / ghi đè.
5. **Không để mật khẩu trong code web** (repo đang Public). Mật khẩu lưu ở Script Properties của Apps Script.
6. Code web + backend cùng nằm trong git, mỗi lần sửa 1 commit → không mất bản cũ.

## 3. Cấu trúc Sheet mới

> Dữ liệu hiện tại chỉ là test → đề xuất **tạo lại các tab sạch**, giữ tab cũ đổi tên `_cu_PR`, `_cu_PO` để tham khảo.

| Tab | Cột |
|---|---|
| **DanhMucVatTu** | Mã Part · Tên Vật Tư · Đơn Vị Tính · Nhóm · Tồn Tối Thiểu · Ghi Chú |
| **NhaCungCap** | Mã NCC · Tên NCC · Người Liên Hệ · SĐT/Zalo · MST · Địa Chỉ |
| **PR** | Mã PR · Ngày Tạo · Người Đề Xuất · Công Ty · Tên Máy · Mã Part · Tên Vật Tư · Số Lượng · Lý Do · Trạng Thái · Người Duyệt · Thời Gian Duyệt · Mã PO |
| **PO** | Mã PO · Ngày Tạo · Mã PR · Nhà Cung Cấp · Mã Part · Tên Vật Tư · SL Đặt · Đơn Giá VAT · Thành Tiền · SL Đã Nhận · Trạng Thái |
| **SoKho** (nhập + xuất chung 1 sổ) | Mã Phiếu · Thời Gian · Loại (NHẬP/XUẤT) · Mã Part · Tên Vật Tư · Số Lượng · Mã PO · Công Ty · Tên Máy · Số Tháng BH · Hạn BH · Người Thực Hiện · Ghi Chú |
| **TonKho** | Mã Part · Tên Vật Tư · Tồn Kho · Tồn Tối Thiểu · Cập Nhật Cuối — *script tự tính từ SoKho, không sửa tay* |
| **HoaDon** | Mã PO · Số Hóa Đơn · Nhà Cung Cấp · Tổng Tiền · Ngày Nhận HĐ · Link File · Trạng Thái Thanh Toán · Ngày Thanh Toán |
| **CauHinh** | Tên công ty · MST · Địa chỉ · SĐT (dùng cho tin Zalo/PO) |

**Đánh số:** `PR-2026-0001`, `PO-2026-0001`, `NK-2026-0001` (nhập), `XK-2026-0001` (xuất) – tăng dần theo năm, do backend cấp.

**Trạng thái:**
- PR: Chờ Duyệt → Đã Duyệt / Từ Chối · (Đã Hủy)
- PO: Chờ phát hành → Đã phát hành → Nhận 1 phần → Đã nhận đủ · (Hủy)

## 4. Chức năng v3.1

| # | Chức năng | Ghi chú |
|---|---|---|
| 1 | Danh mục vật tư lấy từ Sheet, chọn bằng ô tìm kiếm | Bỏ hẳn tạo mã Part ngẫu nhiên; thêm vật tư mới chỉ TPKT |
| 2 | PR: tạo, duyệt, từ chối (có lý do), xoá (TPKT) | Lấy lại `DELETE_PR` |
| 3 | PO: sinh khi duyệt PR; sửa NCC/giá **lưu Sheet**; gửi Zalo dùng MST thật từ CauHinh | |
| 4 | **Nhập kho theo PO** (chọn PO → nhập SL thực nhận, tự cập nhật SL Đã Nhận / trạng thái PO) + nhập kho tự do | Gemini ghi đã làm nhưng code không có |
| 5 | Xuất kho bảo trì: Công ty, Máy, BH 3/6/12/24 tháng/Không | Lưu SoKho, trừ tồn trên Sheet |
| 6 | **Quét QR bằng camera** cho nhập/xuất | Lấy lại từ commit 7d28031 |
| 7 | In tem QR chỉ in con tem (không in cả trang) | |
| 8 | Hóa đơn VAT: tải file lên Drive, lưu link vào HoaDon, xem được trên mọi máy | |
| 9 | Công nợ: đánh dấu đã thanh toán + ngày, **lưu Sheet** | |
| 10 | Đăng nhập TPKT kiểm tra ở server | Lấy lại ý tưởng `VERIFY_PASS` |
| 11 | Báo lỗi rõ ràng khi mất mạng / Sheet lỗi | |

**Để sau (v3.2):** xuất Excel, cảnh báo tồn tối thiểu, đăng nhập theo tài khoản từng người, PO gộp nhiều món.

## 5. Cách triển khai an toàn

1. Làm và thử trên **bản sao Sheet + bản sao Apps Script** (TEST), không đụng bản thật.
2. Khi TEST chạy ổn → cập nhật code vào project thật → **sửa deployment "ProcureQR 3.0" sang phiên bản mới** (giữ nguyên URL `AKfycbz9QK...`, web không phải đổi link).
3. Đưa `index.html` lên GitHub → GitHub Pages tự cập nhật.
4. Nếu lỗi: chọn lại phiên bản 7 trong deployment + `git revert` → quay về ngay.

## 6. Đã chốt với A (05/11/2026)

| Câu hỏi | Quyết định |
|---|---|
| Phạm vi | App cho **SHL**, tồn kho **chỉ của SHL** (1 kho) |
| QR | **1 mã QR = 1 mã vật tư** (dán lên ngăn/hộp vật tư, không phải từng cái) |
| PR | Mỗi PR 1 món *(giả định – chờ xác nhận)* |
| PO | **1 PO gồm nhiều món của cùng 1 NCC** (gộp nhiều PR đã duyệt) |
| Duyệt PO | **Không cần duyệt** |
| Người dùng | **Vân, Thùy**: thao tác (PR, PO, nhập/xuất, VAT) · **Anh Hoàng**: quản lý, **duyệt PR** · Các anh khác: **chỉ xem** PR và tồn kho |
| Thông tin công ty | Có màn hình **Cấu hình** để tự điền (lấy lại từ commit 7d28031, lưu Sheet) |
| Dữ liệu | Xoá dữ liệu test cũ; E **tự tạo bộ dữ liệu mẫu** để bàn giao |

→ Bảng PO đổi thành 2 tab: **PO** (Mã PO · Ngày Tạo · Nhà Cung Cấp · Tổng Tiền · Trạng Thái · Ghi Chú) và **PO_ChiTiet** (Mã PO · Mã PR · Mã Part · Tên Vật Tư · SL Đặt · Đơn Giá VAT · Thành Tiền · SL Đã Nhận).

→ Đăng nhập: Vân / Thùy / Hoàng mỗi người 1 mã PIN (lưu ở Apps Script, không nằm trong code web). Không đăng nhập = chế độ xem.

## 7. Câu hỏi ban đầu (đã trả lời ở mục 6)

1. **1 PR có nhiều món không?** (VD: 1 phiếu xin 3 linh kiện) Hay mỗi PR đúng 1 món như hiện tại?
2. **1 PO có gộp nhiều PR/nhiều món cùng 1 NCC không?** Hay giữ 1 PR = 1 PO?
3. **PO có cần ai duyệt không** (VD: anh Công duyệt khi trên X triệu)?
4. **Tồn kho tính chung** cho cả 3 công ty hay **tách riêng từng công ty**?
5. Có những ai dùng app, mỗi người vai trò gì? (Kỹ thuật, Kho, Thu mua, Kế toán, TPKT, Giám đốc)
6. MST, địa chỉ, SĐT công ty để in lên PO/tin Zalo.
7. Đồng ý xoá dữ liệu test và tạo lại các tab sạch?
