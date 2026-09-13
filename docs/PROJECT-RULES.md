# PROJECT RULES — MACHINERY-LOG (Digital Logbook)

> Tài liệu quy ước & quy tắc phát triển dùng chung cho toàn bộ team (Backend, Frontend, DevOps).
> Mọi thành viên/AI agent tham gia code base **bắt buộc** tuân thủ tài liệu này trước khi commit code.

---

## 1. Tổng quan hệ thống

**Tên dự án:** MACHINERY-LOG (Digital Logbook)
**Mục đích:** Số hóa quy trình quản lý máy móc thi công cho thuê — từ nhật ký giấy viết tay → OCR AI → duyệt số liệu → xuất báo cáo Excel tự động.

**Thành phần chính:**

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | ReactJS + TypeScript + Vite + TailwindCSS + Shadcn/ui + TanStack Table | Giao diện upload ảnh, review dữ liệu OCR, quản lý hợp đồng, xuất báo cáo |
| Backend | Java 21 + Spring Boot 3 + Spring Data JPA | API, xử lý nghiệp vụ, sinh Excel |
| AI OCR | Gemini 2.0 Flash / 3.6 Flash API | Trích xuất dữ liệu từ ảnh nhật ký viết tay |
| Database | PostgreSQL | Lưu trữ toàn bộ dữ liệu nghiệp vụ |
| Excel Engine | Apache POI | Sinh 3 báo cáo Excel từ template |

**Nguyên tắc cốt lõi:** Dữ liệu do AI trích xuất **luôn ở trạng thái chờ duyệt (PENDING)**, không được coi là dữ liệu chính thức cho tới khi Kế toán/Admin xác nhận (APPROVED). Không có luồng nào được phép tự động chuyển PENDING → APPROVED mà không có thao tác con người.

---

## 2. Quy ước đặt tên (Naming Conventions)

### 2.1. Database
- Tên bảng: số nhiều, `snake_case` (VD: `daily_logs`, `pricing_appendices`).
- Tên cột: `snake_case`, mô tả rõ đơn vị nếu là số liệu (VD: `operating_hours`, `unit_price`).
- Khóa chính: luôn là `id` (SERIAL).
- Khóa ngoại: `<tên_bảng_số_ít>_id` (VD: `contract_id`, `equipment_id`).
- Enum dạng chuỗi lưu trong VARCHAR, viết HOA_SNAKE_CASE (VD: `PENDING`, `APPROVED`, `ACTIVE`).
- `users.role` là enum chuỗi được giới hạn bằng `CHECK`: `OPERATOR`, `ACCOUNTANT_ADMIN`.
- Index: `idx_<bảng>_<cột(s)>` (VD: `idx_daily_logs_contract_date`).
- `audit_logs` dùng `JSONB` cho `old_values`/`new_values`, là append-only và không chứa password/token.

### 2.2. Backend (Java)
- Package: `com.machinerylog.<layer>` (`config`, `controller`, `dto`, `entity`, `repository`, `service`).
- Class Entity: PascalCase, số ít (VD: `DailyLog`, `Contract`, `PricingAppendix`).
- Class DTO: hậu tố `DTO` (VD: `DailyLogDTO`, `ContractDTO`).
- Class Repository: hậu tố `Repository` (VD: `DailyLogRepository`).
- Class Service: hậu tố `Service` / `ServiceImpl` nếu tách interface.
- Class Controller: hậu tố `Controller` (VD: `DailyLogController`).
- Biến, phương thức: camelCase.
- Hằng số: UPPER_SNAKE_CASE.

### 2.3. Frontend (React + TypeScript)
- Component: PascalCase, đặt tên theo file (VD: `DailyLogTable.tsx`).
- Hook tự viết: tiền tố `use` (VD: `useDailyLogs.ts`).
- Type/Interface: PascalCase, không dùng tiền tố `I` (VD: `DailyLogDTO`, không dùng `IDailyLogDTO`).
- File service gọi API: hậu tố `.service.ts` (VD: `dailyLog.service.ts`).
- Biến, hàm: camelCase. Props type đặt tên `<ComponentName>Props`.
- Thư mục theo tính năng (feature-based) trong `pages/`, dùng chung `components/` cho UI tái sử dụng.

### 2.4. API
- Endpoint: toàn bộ chữ thường, số nhiều, `kebab-case` nếu nhiều từ (VD: `/api/v1/daily-logs`).
- Query param: camelCase (VD: `?contractId=1&month=2026-07`).
- Version hóa API bắt buộc qua prefix `/api/v1/...`.

---

## 3. Phân quyền & Vai trò (Roles & Permissions)

| Vai trò | Quyền hạn |
|---|---|
| **OPERATOR** (Vận hành máy / Quản lý công trường) | - Chụp ảnh & upload nhật ký hàng ngày.<br>- Xem log do chính mình tạo.<br>- **Không** được sửa/xóa log sau khi đã upload (chỉ được yêu cầu hủy qua Accountant). |
| **ACCOUNTANT / ADMIN** (Kế toán / Quản trị) | - Xem & sửa dữ liệu OCR trong Review UI.<br>- Duyệt (APPROVE) / Từ chối (REJECT) log.<br>- Chọn kỳ (Billing Month) + Hợp đồng → xuất 3 báo cáo Excel.<br>- Quản lý Customers, Contracts, Equipment, Pricing Appendices.<br>- Quản lý Advance Payments & Debt Reconciliation. |
| **SUPER_ADMIN** *(dự phòng mở rộng)* | - Toàn quyền hệ thống + quản lý tài khoản người dùng, phân quyền. |

**Nguyên tắc phân quyền:**
- Mọi endpoint ghi dữ liệu (POST/PUT/DELETE) phải kiểm tra role ở tầng Controller/Service (annotation `@PreAuthorize` hoặc filter tương đương), **không** kiểm tra role chỉ ở Frontend.
- OPERATOR không có quyền truy cập các endpoint export báo cáo, quản lý hợp đồng, hoặc reconciliation.
- Log đã ở trạng thái `APPROVED` hoặc `REJECTED` không được sửa trực tiếp; muốn sửa phải qua endpoint reopen do `ACCOUNTANT_ADMIN` thực hiện, bắt buộc lý do và chuyển về `PENDING`.
- `rejection_reason` bắt buộc khi reject. `operator_id` phải là user `OPERATOR`; `reviewer_id` phải là user `ACCOUNTANT_ADMIN`.
- Khi reopen log thuộc kỳ đã export, bắt buộc chuyển `monthly_acceptances` sang `NEEDS_RECALCULATION` và vô hiệu hóa export version cũ trong cùng transaction.

---

## 4. Quy ước API

- Chuẩn REST, response JSON, dùng đúng HTTP method theo hành động (GET đọc, POST tạo, PUT cập nhật, DELETE xóa).
- Cấu trúc response thống nhất:
```json
{
  "success": true,
  "data": {},
  "message": "",
  "errorCode": null
}
```
- Mã lỗi nghiệp vụ dùng `errorCode` dạng UPPER_SNAKE_CASE (VD: `CONTRACT_NOT_FOUND`, `LOG_ALREADY_APPROVED`).
- Reopen log dùng `POST /api/v1/daily-logs/{id}/reopen`, không cho phép đổi trực tiếp `APPROVED ↔ REJECTED`.
- HTTP status code phải phản ánh đúng bản chất lỗi: 400 (dữ liệu sai), 401 (chưa xác thực), 403 (không có quyền), 404 (không tìm thấy), 409 (xung đột trạng thái, VD duyệt log đã duyệt), 500 (lỗi hệ thống).
- Toàn bộ payload ngày tháng dùng chuẩn ISO `YYYY-MM-DD`; tháng billing dùng `YYYY-MM`.
- Upload file dùng `multipart/form-data`, giới hạn kích thước theo mục 5.
- Không trả về entity JPA trực tiếp ra ngoài API — luôn map qua DTO.

---

## 5. Giới hạn hệ thống (System Constraints)

| Hạng mục | Giới hạn |
|---|---|
| Kích thước ảnh upload | Tối đa 10MB (Frontend nén ảnh trước khi upload nếu vượt) |
| Định dạng ảnh hỗ trợ | JPG, JPEG, PNG, HEIC (convert sang JPEG trước khi gửi Gemini) |
| Số dòng log / 1 ảnh | Giả định 1 ảnh = 1 ngày công của 1 thiết bị (không xử lý multi-equipment trong 1 ảnh ở v1) |
| Thời gian phản hồi OCR | Timeout tối đa 30s / request tới Gemini API, có cơ chế retry tối đa 2 lần |
| Đồng thời sửa log | Last-write-wins cho review thông thường; calculate acceptance/export bắt buộc dùng pessimistic write lock |
| Định dạng số liệu tiền tệ | VNĐ, luôn dùng `BigDecimal`, không dùng `float/double` |
| VAT | Mặc định 8%, có thể cấu hình theo từng `monthly_acceptances` |
| Giới hạn export | 1 lần export = 1 hợp đồng + 1 tháng billing (không hỗ trợ export hàng loạt nhiều hợp đồng ở v1) |
| Ngôn ngữ giao diện | Tiếng Việt là ngôn ngữ chính; dữ liệu OCR gốc là tiếng Việt viết tay |

---

## 6. Quy ước Git

### 6.1. Nhánh (Branching)
- `main`: code luôn ở trạng thái deploy được (production-ready).
- `develop`: nhánh tích hợp tính năng trước khi release.
- `feature/<mô-tả-ngắn>`: nhánh phát triển tính năng (VD: `feature/ocr-review-ui`).
- `fix/<mô-tả-ngắn>`: sửa lỗi.
- `hotfix/<mô-tả-ngắn>`: sửa lỗi khẩn cấp trên `main`.

### 6.2. Commit message
Theo chuẩn Conventional Commits:
```
<type>(<scope>): <mô tả ngắn gọn, tiếng Anh hoặc tiếng Việt không dấu>

VD:
feat(daily-log): add batch save endpoint for reviewed logs
fix(export): correct VAT rounding in monthly acceptance report
refactor(ocr): extract gemini client into separate service
docs(readme): update setup instructions
```
Các `type` hợp lệ: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`.

### 6.3. Pull Request
- Mỗi PR chỉ giải quyết 1 vấn đề/tính năng, không gộp nhiều việc không liên quan.
- Tiêu đề PR = commit message chính, mô tả PR nêu rõ: mục đích, thay đổi chính, cách test.
- Bắt buộc self-review diff trước khi request review.
- Không merge PR khi CI (build/test) chưa pass.

---

## 7. Quy ước Comment & Documentation trong code

- Comment giải thích **tại sao** (why), không lặp lại điều code đã tự nói (what).
- Mọi method Service xử lý nghiệp vụ phức tạp (tính giờ làm, tính VAT, sinh Excel) phải có Javadoc mô tả input/output/ràng buộc.
- TODO/FIXME phải có định dạng: `// TODO(tên-người): mô tả + ngày` để dễ truy vết.
- Không để lại code đã comment out (dead code) khi merge vào `develop`/`main`.
- File template Excel (`.xlsx`) trong `resources/templates/excel/` phải có file `README.md` đi kèm mô tả cấu trúc placeholder/cell mapping.

---

## 8. Checklist trước khi commit / tạo Pull Request

- [ ] Code build thành công (backend: `mvn clean install`, frontend: `npm run build`).
- [ ] Không còn `console.log`, `System.out.println` debug thừa.
- [ ] Không hardcode secret (API key Gemini, DB password...) — đã dùng biến môi trường.
- [ ] Đã dùng `BigDecimal` cho mọi phép tính tiền tệ/giờ công, không dùng `float`/`double`.
- [ ] DTO có validation annotation (`@NotNull`, `@Size`,...) cho các trường bắt buộc.
- [ ] Đã kiểm tra phân quyền (role) cho endpoint mới thêm.
- [ ] Đã viết/migration script SQL nếu có thay đổi schema, kèm rollback nếu cần.
- [ ] Đã kiểm tra migration `users`, `daily_logs.operator_id/reviewer_id/rejection_reason` và unique constraint `monthly_acceptances` trên dữ liệu hiện hữu.
- [ ] Migration đã backfill `operator_id`, archive/deduplicate `monthly_acceptances` trước khi tạo unique constraint.
- [ ] Đã tạo `audit_logs` JSONB, kiểm tra append-only và không lưu secret.
- [ ] `MonthlyAcceptanceService`/`ExcelExportService` dùng `@Transactional` và `@Lock(PESSIMISTIC_WRITE)`; đã test timeout và race condition.
- [ ] Đã test reopen log làm acceptance thành `NEEDS_RECALCULATION` và vô hiệu hóa export version cũ.
- [ ] Đã test các chuyển trạng thái `PENDING → APPROVED/REJECTED` và `APPROVED/REJECTED → PENDING` qua reopen.
- [ ] Đã test luồng chính bằng tay hoặc unit test (đặc biệt luồng OCR → Review → Approve → Export).
- [ ] Không commit file ảnh test, file Excel export mẫu, node_modules, target/.
- [ ] Đã cập nhật tài liệu liên quan (API_SPEC.md, DATABASE.md...) nếu thay đổi cấu trúc API/DB.
- [ ] Message commit đúng chuẩn Conventional Commits.

---

## 9. Nguyên tắc chung khi phát triển

1. **Không tự động hóa quá mức OCR:** kết quả AI luôn cần con người xác nhận trước khi dùng để tính tiền.
2. **Excel là hợp đồng dữ liệu:** không thay đổi cấu trúc template Excel khi chưa thống nhất với Kế toán, vì các báo cáo này có giá trị pháp lý (nghiệm thu, đối chiếu công nợ).
3. **Ưu tiên tính đúng đắn số liệu hơn tốc độ phát triển** — mọi logic tính giờ làm, công nợ, VAT phải có unit test riêng.
4. **Không phá vỡ khả năng truy vết (audit trail):** mọi thay đổi trạng thái quan trọng (APPROVED, SIGNED, RECONCILED) nên lưu lại thời điểm & người thực hiện (mở rộng schema nếu cần, xem ARCHITECTURE.md mục quyết định quan trọng).
