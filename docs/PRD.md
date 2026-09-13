# PRD — MACHINERY-LOG (Digital Logbook)

> Product Requirement Document — Mô tả mục tiêu sản phẩm, đối tượng sử dụng, phạm vi và các use case của hệ thống.

---

## 1. Bối cảnh & Vấn đề (Problem Statement)

Các đơn vị cho thuê máy móc thi công (máy đào, máy ủi, xe cẩu...) hiện đang quản lý nhật ký vận hành hàng ngày bằng **sổ giấy viết tay tại công trường**. Cuối tháng, kế toán phải:

- Thu thập sổ giấy/ảnh chụp từ nhiều công trường.
- Nhập tay toàn bộ số liệu giờ làm vào Excel.
- Tự tính toán giờ công, đối chiếu đơn giá theo từng hợp đồng.
- Soạn thủ công 3 loại văn bản: bảng tổng hợp giờ làm, biên bản bàn giao & nghiệm thu, biên bản đối chiếu công nợ.

**Hệ quả:** tốn nhiều thời gian, dễ sai sót khi nhập liệu, khó truy vết dữ liệu gốc, chậm trễ trong việc chốt công nợ và xuất hóa đơn.

**Giải pháp:** Xây dựng hệ thống **MACHINERY-LOG** — số hóa toàn bộ quy trình từ chụp ảnh nhật ký → AI trích xuất dữ liệu → con người duyệt xác nhận → tự động sinh 3 báo cáo Excel chuẩn hóa.

---

## 2. Mục tiêu sản phẩm (Product Objectives)

### 2.1. Mục tiêu chính
1. Loại bỏ hoàn toàn việc nhập tay dữ liệu nhật ký từ giấy sang Excel.
2. Chuẩn hóa quy trình duyệt log hàng ngày (Review → Approve/Reject) có kiểm soát bởi con người.
3. Tự động sinh và xuất đồng thời 3 báo cáo Excel theo kỳ (tháng) và theo hợp đồng, chỉ với **1 thao tác bấm nút**:
   - **Bảng tổng hợp giờ làm**
   - **Biên bản bàn giao & nghiệm thu**
   - **Biên bản đối chiếu công nợ**

### 2.2. Mục tiêu phụ (đo lường được)
- Giảm thời gian xử lý nhật ký cuối tháng từ hàng giờ xuống còn vài phút thao tác duyệt.
- Giảm sai sót nhập liệu số giờ công nhờ dữ liệu được trích xuất và đối chiếu ảnh gốc.
- Đảm bảo mọi số liệu trong báo cáo Excel xuất ra đều truy vết được về ảnh nhật ký gốc (`original_image_url`).

---

## 3. Mục tiêu theo từng đối tượng người dùng

### 3.1. Machine Operator / Site Manager (Vận hành máy / Quản lý công trường)
- **Mong muốn:** Ghi nhận công việc trong ngày nhanh chóng, không cần thao tác phức tạp, chỉ cần chụp ảnh sổ và upload.
- **Mục tiêu hệ thống đáp ứng:**
  - Upload ảnh log dễ dàng từ điện thoại/máy tính bảng tại công trường.
  - Gắn đúng hợp đồng & thiết bị khi upload để tránh nhầm lẫn dữ liệu.
  - Xem lại trạng thái log mình đã gửi (PENDING/APPROVED/REJECTED).

### 3.2. Accountant / Admin (Kế toán / Quản trị)
- **Mong muốn:** Kiểm soát chất lượng dữ liệu trước khi tính tiền, và xuất báo cáo nhanh, chính xác, đúng định dạng đã quen dùng (Excel).
- **Mục tiêu hệ thống đáp ứng:**
  - Giao diện review trực quan: xem ảnh gốc song song với dữ liệu OCR, sửa nhanh nếu cần (inline edit).
  - Duyệt/từ chối log với thao tác tối thiểu.
  - Chọn kỳ + hợp đồng → xuất trọn bộ 3 báo cáo Excel dưới dạng file ZIP.
  - Quản lý danh mục khách hàng, hợp đồng, thiết bị, đơn giá, tạm ứng, đối chiếu công nợ.

### 3.3. (Định hướng mở rộng) Super Admin / Quản lý cấp cao
- Xem báo cáo tổng hợp đa hợp đồng, đa khách hàng (ngoài phạm vi v1).
- Quản lý người dùng và phân quyền hệ thống.

---

## 4. Phạm vi hệ thống (Scope)

### 4.1. Trong phạm vi (In-scope) — Phiên bản 1
- Quản lý danh mục: Khách hàng (Customers), Thiết bị (Equipment), Hợp đồng (Contracts), Phụ lục đơn giá (Pricing Appendices).
- Upload ảnh nhật ký + OCR tự động qua Gemini API.
- Review UI: sửa dữ liệu OCR, duyệt/từ chối log theo từng bản ghi.
- Quản lý biên bản nghiệm thu theo tháng (Monthly Acceptances).
- Lưu audit trail bằng chứng cho các thao tác dữ liệu và trạng thái quan trọng.
- Quản lý tạm ứng (Advance Payments) theo hợp đồng.
- Đối chiếu công nợ theo hợp đồng (Debt Reconciliation).
- Xuất báo cáo Excel (3 loại) theo hợp đồng + tháng, đóng gói ZIP.
- API RESTful phục vụ Frontend, có xác thực & phân quyền cơ bản (OPERATOR / ACCOUNTANT-ADMIN).

### 4.2. Ngoài phạm vi (Out-of-scope) — Phiên bản 1
- Ứng dụng di động (mobile app) riêng biệt — v1 dùng web responsive.
- Tích hợp hóa đơn điện tử (e-invoice) trực tiếp với cơ quan thuế.
- Xử lý nhiều thiết bị trong 1 ảnh nhật ký duy nhất.
- Ký số điện tử (e-signature) cho biên bản nghiệm thu — v1 chỉ đánh dấu trạng thái `SIGNED` thủ công.
- Đa ngôn ngữ (chỉ tiếng Việt ở v1).
- Xuất báo cáo hàng loạt cho nhiều hợp đồng cùng lúc.
- Thông báo tự động (email/SMS) khi log được duyệt/từ chối.
- Phân tích dữ liệu nâng cao / dashboard BI.

---

## 5. Danh sách Use Case

| Mã | Use Case | Actor | Mô tả ngắn |
|---|---|---|---|
| UC-01 | Upload ảnh nhật ký hàng ngày | Operator | Chụp/chọn ảnh sổ nhật ký, chọn hợp đồng + thiết bị, upload lên hệ thống |
| UC-02 | Trích xuất dữ liệu bằng AI OCR | Hệ thống (tự động) | Gọi Gemini API để đọc chữ viết tay, trả về dữ liệu có cấu trúc (giờ bắt đầu/kết thúc, mô tả công việc...) |
| UC-03 | Xem & sửa dữ liệu OCR | Accountant | Xem ảnh gốc song song dữ liệu trích xuất, chỉnh sửa nếu OCR đọc sai |
| UC-04 | Duyệt / Từ chối log | Accountant | Chuyển trạng thái log từ PENDING → APPROVED hoặc REJECTED, bắt buộc lý do khi từ chối |
| UC-04a | Mở lại log | Accountant | Chuyển log APPROVED/REJECTED về PENDING kèm lý do để chỉnh sửa và review lại |
| UC-05 | Quản lý danh mục Khách hàng | Accountant/Admin | Thêm/sửa/xem thông tin công ty khách hàng, người đại diện |
| UC-06 | Quản lý danh mục Thiết bị | Accountant/Admin | Thêm/sửa/xem thiết bị (tên, số seri/đăng kiểm, loại thiết bị) |
| UC-07 | Quản lý Hợp đồng | Accountant/Admin | Tạo hợp đồng, gắn khách hàng, công trình, trạng thái (ACTIVE/EXPIRED/TERMINATED) |
| UC-08 | Quản lý Phụ lục đơn giá | Accountant/Admin | Gắn đơn giá theo giờ/ngày/tháng cho từng cặp hợp đồng-thiết bị |
| UC-09 | Xem danh sách log theo hợp đồng & tháng | Accountant | Lọc log theo `contractId` + `month` để chuẩn bị chốt kỳ |
| UC-10 | Xuất bộ 3 báo cáo Excel | Accountant | Chọn hợp đồng + tháng → hệ thống sinh & xuất file ZIP gồm 3 Excel |
| UC-11 | Quản lý tạm ứng | Accountant/Admin | Ghi nhận các khoản khách hàng đã tạm ứng theo hợp đồng |
| UC-12 | Đối chiếu công nợ | Accountant/Admin | Tính công nợ còn lại = dư nợ kỳ trước + phát sinh kỳ này − đã thanh toán |
| UC-13 | Theo dõi trạng thái biên bản nghiệm thu | Accountant | Xem trạng thái PENDING_SIGNATURE / SIGNED / NEEDS_RECALCULATION của từng `monthly_acceptances` |
| UC-14 | Audit lịch sử thao tác | Accountant/Admin | Tra cứu actor, hành động, dữ liệu trước/sau và lý do thay đổi |

---

## 6. Luồng nghiệp vụ tổng quan (High-level Workflow)

```
[Operator]
   1. Chụp ảnh sổ nhật ký tại công trường
   2. Upload ảnh + chọn hợp đồng/thiết bị
        ↓
[Hệ thống - AI OCR]
   3. Gọi Gemini API trích xuất: giờ làm, mô tả công việc, tên vận hành viên...
   4. Lưu log ở trạng thái PENDING
        ↓
[Accountant]
   5. Mở Review UI, đối chiếu ảnh gốc và dữ liệu OCR
   6. Sửa nếu cần → Lưu (batch-save)
   7. Duyệt (APPROVE) hoặc từ chối (REJECT, bắt buộc lý do); nếu cần sửa lại, Accountant thực hiện REOPEN về PENDING
   8. Nếu log thuộc tháng đã xuất nghiệm thu, hệ thống đánh dấu nghiệm thu `NEEDS_RECALCULATION` và vô hiệu hóa export cũ
        ↓
[Cuối kỳ - Accountant]
   9. Chọn Hợp đồng + Tháng billing
  10. Bấm "Xuất báo cáo" → hệ thống khóa dữ liệu, tổng hợp log đã APPROVED
  11. Sinh 3 file Excel từ template (Apache POI) → đóng gói ZIP → tải về
```

---

## 7. Kết quả đạt được (Deliverables) & Hạn chế hiện tại

### 7.1. Kết quả đạt được (mục tiêu v1)
- Quy trình số hóa xuyên suốt: từ ảnh giấy đến báo cáo Excel hoàn chỉnh, không cần nhập tay.
- Dữ liệu tập trung trên PostgreSQL, có thể truy vấn, tra cứu lịch sử theo hợp đồng/thiết bị/tháng bất kỳ lúc nào.
- Giảm thiểu sai số tính toán tiền tệ nhờ dùng `BigDecimal` xuyên suốt backend.
- Cơ chế duyệt log đảm bảo luôn có con người xác nhận trước khi tính tiền, giảm rủi ro từ lỗi OCR.
- Template Excel được chuẩn hóa, đảm bảo tính nhất quán giữa các kỳ báo cáo.

### 7.2. Hạn chế hiện tại (Known Limitations)
- Độ chính xác OCR phụ thuộc chất lượng ảnh chụp và chữ viết tay của người vận hành — chưa có cơ chế đánh giá độ tin cậy (confidence score) hiển thị cho Accountant.
- Chưa hỗ trợ xử lý 1 ảnh chứa nhiều thiết bị/nhiều ngày.
- Audit log chi tiết và cơ chế invalidation export là Enterprise baseline; việc lưu file export vật lý lâu dài vẫn ngoài phạm vi v1.
- Chưa hỗ trợ export hàng loạt nhiều hợp đồng cùng lúc, gây chậm nếu số lượng hợp đồng lớn vào cuối tháng.
- Chưa có cơ chế thông báo tự động (email/notification) cho Operator khi log bị từ chối.
- Chưa hỗ trợ offline-first cho Operator ở khu vực công trường không có mạng ổn định.

---

## 8. Hướng phát triển tương lai (Future Roadmap)

| Giai đoạn | Định hướng |
|---|---|
| **V1.1** | Thêm audit trail chi tiết (ai/khi nào sửa từng trường); hiển thị confidence score của OCR để Accountant ưu tiên kiểm tra log đáng ngờ. |
| **V1.2** | Hỗ trợ export hàng loạt nhiều hợp đồng trong 1 lần; thêm cơ chế thông báo (email/notification) khi log bị từ chối hoặc kỳ báo cáo sẵn sàng. |
| **V2.0** | Ứng dụng mobile riêng (React Native/Flutter) hỗ trợ chụp ảnh & upload offline, đồng bộ khi có mạng. |
| **V2.1** | Tích hợp ký số điện tử (e-signature) cho biên bản nghiệm thu và đối chiếu công nợ. |
| **V2.2** | Dashboard BI: thống kê hiệu suất sử dụng thiết bị, doanh thu theo khách hàng/thiết bị/thời gian. |
| **V3.0** | Tích hợp hóa đơn điện tử (e-invoice) tự động phát hành sau khi biên bản nghiệm thu được ký. |
| **Liên tục** | Cải thiện độ chính xác OCR bằng cách fine-tune prompt Gemini theo mẫu sổ nhật ký thực tế của từng khách hàng/công trường. |
