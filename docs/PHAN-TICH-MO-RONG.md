# ProcureQR – Phân tích chức năng mở rộng

Ngày: 05/11/2026 · Người viết: Claude (hỗ trợ A)

## Cách làm

So ProcureQR với cách các phần mềm quản lý phổ biến tổ chức cùng nghiệp vụ:

- **ERP:** Odoo (Purchase, Inventory, Maintenance, Field Service) và ERPNext (Material Request → RFQ → Supplier Quotation → Purchase Order → Purchase Receipt, Serial No, Warranty Claim, Maintenance Schedule).
- **CMMS, phần mềm quản lý bảo trì:** MaintainX, UpKeep, Fiix.

Rồi chỉ giữ lại những gì **hợp với SHL**: công ty nhập máy từ Trung Quốc, bán cho khách, làm bảo trì và bảo hành, một kho linh kiện, 3 người thao tác chính, chạy trên Google Sheet.

> Ghi chú: đây là tổng hợp từ hiểu biết chung về các phần mềm trên, không phải khảo sát số liệu thị trường.

## 1. ProcureQR đã có gì (sau bản 05/11)

| Nhóm | Đã có |
|---|---|
| Mua hàng | PR → duyệt → PO gộp nhiều món cùng NCC → phát hành, gửi Zalo, in PO → nhập kho theo PO (nhận 1 phần hoặc đủ) |
| Kho | Danh mục vật tư, tồn kho tự tính, tồn tối thiểu (tô đỏ), quét và in tem QR, sổ nhập xuất |
| Bảo hành | Danh sách khách hàng và máy (hạn BH máy). Tự đối chiếu BH linh kiện và BH máy khi nhập PR hoặc xuất kho. Tra cứu không cần đăng nhập |
| Khách hàng | Hết BH → báo giá KH (theo dõi số báo giá, KH đồng ý hay không) → xuất kho tính phí |
| Tài chính | Hóa đơn VAT lên Drive, đánh dấu đã thanh toán |
| Quản trị | PIN theo người, chỉ anh Hoàng duyệt, ghi tên người thao tác trên từng phiếu |

## 2. Các chức năng phần mềm khác thường có mà ProcureQR chưa có

### A. Phía bảo trì và dịch vụ khách hàng (quan trọng nhất với SHL)

| # | Chức năng | Phần mềm nào có | Vì sao hợp với SHL |
|---|---|---|---|
| A1 | **Phiếu yêu cầu dịch vụ / báo sự cố** (ticket): khách báo lỗi → giao kỹ thuật → kiểm tra → cần linh kiện thì tạo PR từ phiếu này | Odoo Field Service / Helpdesk, CMMS (work order) | Hiện PR đang thay cho phiếu sự cố. Tách ra thì biết được: khách báo lúc nào, ai đi sửa, sửa mất bao lâu, có cần thay linh kiện không. Một sự cố có thể cần nhiều linh kiện, tức nhiều PR |
| A2 | **Ảnh đính kèm** vào PR / sự cố (ảnh linh kiện hỏng, tem máy) | Tất cả CMMS | Anh Hoàng nhìn ảnh là duyệt hoặc từ chối được ngay. Có bằng chứng khi khách khiếu nại bảo hành |
| A3 | **Lịch bảo trì định kỳ** theo máy (3 hay 6 tháng, theo giờ chạy) và tự nhắc việc | Odoo Maintenance, ERPNext Maintenance Schedule, CMMS | SHL bán máy rồi bảo trì: nhắc trước 1 tuần để chủ động gọi khách. Đây là nguồn doanh thu dịch vụ |
| A4 | **Hồ sơ máy** (một trang cho mỗi máy): mọi lần sửa, linh kiện đã thay, chi phí, BH còn hay hết | CMMS (asset history) | Đã có dữ liệu, chỉ cần thêm màn hình xem gọn. Dùng để trả lời khách "máy tôi đã sửa gì" |
| A5 | **Bảo hành ngược với NCC**: linh kiện hỏng trong hạn BH của NCC thì đổi hoặc đòi NCC | ERPNext Warranty Claim, Odoo RMA | Linh kiện SHL thay miễn phí cho khách nhiều khi vẫn còn BH với NCC, đòi lại được là giảm chi phí |
| A6 | **Chi phí bảo hành** theo khách hàng / máy / model | Báo cáo CMMS | Biết model nào hay hỏng, khách nào tốn chi phí BH, từ đó làm cơ sở đàm phán với nhà sản xuất Trung Quốc |
| A7 | **Danh sách phụ tùng theo model máy** (spare parts list / BOM) | Odoo, ERPNext | Bán máy model X thì biết cần dự trữ những linh kiện nào. Khi nhập PR, lọc nhanh linh kiện đúng model |
| A8 | **Theo dõi serial** cho linh kiện đắt tiền (biến tần, PLC, servo) | ERPNext Serial No, Odoo Lots/Serial | BH chính xác theo từng con, không nhầm khi một máy thay nhiều lần |

### B. Phía mua hàng

| # | Chức năng | Phần mềm nào có | Ghi chú |
|---|---|---|---|
| B1 | **Hạn giao hàng** trên PO và cảnh báo trễ | Odoo, ERPNext | Biết NCC nào hay giao trễ |
| B2 | **Lịch sử giá mua** theo vật tư và NCC (giá lần trước, cảnh báo tăng giá) | Odoo, ERPNext | Khi tạo PO hiện "lần trước mua 1.200.000 ở NCC A" |
| B3 | **Hỏi giá nhiều NCC** rồi so sánh trước khi chọn (RFQ) | ERPNext Supplier Quotation, Odoo Call for Tender | Có ích với món giá trị lớn. Món nhỏ thì không cần |
| B4 | **Đối chiếu 3 chiều**: PO – phiếu nhập – hóa đơn khớp số lượng và tiền thì mới thanh toán | Odoo, ERPNext (3-way match) | Tránh trả tiền cho hàng chưa nhận hoặc nhận thiếu |
| B5 | **Hạn thanh toán công nợ** theo điều khoản NCC (VD: 30 ngày), tổng nợ theo NCC, cảnh báo đến hạn | Odoo, ERPNext | Hiện mới có đã trả hay chưa trả, chưa có ngày đến hạn |
| B6 | **Trả hàng NCC** (hàng lỗi khi nhận) | Odoo, ERPNext | Hiện chỉ nhập số nhận thực tế, chưa ghi được nhận lỗi và trả lại |
| B7 | Hạn mức duyệt PO theo giá trị | Odoo, ERPNext | A đã chốt PO không cần duyệt. Để dành nếu sau này cần |

### C. Phía kho

| # | Chức năng | Phần mềm nào có | Ghi chú |
|---|---|---|---|
| C1 | **Gợi ý mua khi tồn dưới mức tối thiểu**: một nút tạo PR dự trữ cho tất cả món thiếu | Odoo Reordering Rules, ERPNext Reorder Level | Đã có tồn tối thiểu, chỉ thiếu nút tạo PR |
| C2 | **Kiểm kê bằng quét QR** và phiếu điều chỉnh chênh lệch | Odoo, ERPNext Stock Reconciliation | Kiểm kê tháng hoặc quý, quét từng ngăn, app tự so với sổ |
| C3 | **Vị trí kho** (kệ / ngăn) in trên tem QR | Odoo Locations | Người mới vào tìm hàng nhanh |
| C4 | **Trả lại kho** (xuất ra không dùng hết) và **thu hồi linh kiện hỏng** | Odoo, ERPNext | Hiện chỉ có nhập tự do, nên tách loại phiếu cho rõ |
| C5 | **Giá trị tồn kho** (giá vốn bình quân từ giá PO) | Odoo, ERPNext | Kế toán cần; anh Công xem kho đang "nằm" bao nhiêu tiền |
| C6 | Hàng tồn lâu không dùng | Báo cáo ERP | Có dữ liệu, chỉ cần thêm báo cáo |

### D. Quản trị và tiện ích

| # | Chức năng | Ghi chú |
|---|---|---|
| D1 | **Bảng tổng quan** (dashboard): PR chờ duyệt, PO trễ, hàng dưới mức, công nợ đến hạn, BH sắp hết, bảo trì sắp tới | Màn hình đầu tiên anh Hoàng và anh Công mở |
| D2 | **Thông báo** khi có PR mới hoặc PR được duyệt (Email hoặc Telegram; Zalo OA cần đăng ký doanh nghiệp) | Anh Hoàng không cần mở app thường xuyên |
| D3 | **Xuất Excel** các danh sách | Đã nằm trong backlog |
| D4 | **Nhật ký thao tác** (ai sửa gì, lúc nào) | Đã ghi tên người trên từng phiếu, chưa có nhật ký chung |
| D5 | **Sao lưu tự động** Sheet mỗi tuần | Phòng xóa nhầm |

## 3. Đề xuất thứ tự làm

| Đợt | Chức năng | Lý do |
|---|---|---|
| **Đợt 1** (nhanh, giá trị cao) | A2 ảnh đính kèm PR · D1 dashboard · D2 thông báo PR mới · C1 gợi ý mua khi dưới mức · B5 hạn công nợ · B1 hạn giao PO · D3 Excel | Phần lớn dùng dữ liệu đã có, mỗi mục mất ít công |
| **Đợt 2** (đổi cách làm việc) | A1 phiếu sự cố · A3 bảo trì định kỳ · A4 hồ sơ máy · C2 kiểm kê QR · B2 lịch sử giá · C4 trả kho / thu hồi | Cần A và anh Hoàng chốt quy trình trước |
| **Đợt 3** (khi đã dùng ổn) | A5 BH ngược NCC · A6 chi phí BH · A7 phụ tùng theo model · A8 serial · C5 giá trị tồn · B3 so sánh báo giá · B4 đối chiếu 3 chiều · D4, D5 | Cần dữ liệu tích lũy vài tháng mới có ý nghĩa |

## 4. Giới hạn cần biết

- **Google Sheet + Apps Script** chạy tốt với vài nghìn đến vài chục nghìn dòng. Mỗi thao tác chờ 2–5 giây là bình thường. Nếu sau 2–3 năm dữ liệu lớn, có thể chuyển sổ kho cũ sang tab lưu trữ, hoặc chuyển sang cơ sở dữ liệu thật. Code đã tách phần đọc/ghi theo tên cột nên chuyển được.
- **Đăng nhập bằng PIN** đủ cho 3 người nội bộ. Nếu mở cho khách hàng tự tra bảo hành thì nên làm trang riêng, chỉ tra theo số serial.
- **Link web công khai:** ai có link đều tạo được PR và xem được danh sách khách hàng và máy (không có SĐT, giá). Nếu cần kín hơn thì cho nhân viên đăng nhập bằng một PIN chung.
