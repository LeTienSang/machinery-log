# Kế hoạch triển khai MACHINERY-LOG

> Cập nhật: 2026-09-30

> Gần đây nhất: Hoàn thiện chuẩn hóa API response (bỏ ApiError wrapper) và bổ sung health check endpoint.

> Trạng thái được đối chiếu với mã nguồn hiện tại, không đánh dấu `DONE` chỉ dựa
> trên tài liệu thiết kế. `DONE` nghĩa là đã có bằng chứng trong repository và
> đã kiểm tra được ở mức phù hợp. Lưu ý cần cập nhật file này liên tục

## 0. Gần đây nhất (2026-09-30)

- [x] **DONE** — Bổ sung health check endpoint `/api/v1/health`.
  - Backend: `HealthController`, `HealthService`, `HealthCheckResult`, `HealthStatus`.
  - Backend: check database connectivity, trả 200 khi OK, 503 khi fail.
  - Frontend: `getHealth()` API client, `HealthCheckResult` type.
  - Test: `HealthControllerTest` integration test.
- [x] **DONE** — Chuẩn hóa API response: bỏ `ApiError` wrapper trên `DailyLogController`.
  - `GET /api/v1/daily-logs` trả `Page<DailyLogDto>` trực tiếp (Spring Data pagination metadata).
  - `POST /api/v1/daily-logs/batch-save` trả `List<DailyLogDto>` trực tiếp.
  - `GET /api/v1/daily-logs/{id}`, `PUT/{id}/approve`, `POST/{id}/reopen` trả `DailyLogDto` trực tiếp.
- [x] **DONE** — Fix auth flow: missing `/me` endpoint, envelope mismatch, stale state logout.
  - Backend: thêm `GET /api/v1/auth/me` trả `UserDto` (id, username, displayName, role, isActive).
  - Backend: `AuthService.me()` đọc user từ Spring Security context.
  - Frontend: `login()` fetch `/me` sau login để lấy thông tin user chính xác (id, displayName).
  - Frontend: `logout()` gọi `clearSession()` xóa token + user khỏi `sessionStorage`.
  - API spec: cập nhật `/auth/me`, response không wrapping envelope.
  - Frontend types: bổ sung `UserDto` type.

## 1. Hiện trạng đã xác nhận

- [x] **DONE** — Khởi tạo repository với `backend/`, `frontend/`, `docs/` và cấu hình Docker Compose.
- [x] **DONE** — Backend Spring Boot/Java, Flyway, PostgreSQL và cấu hình môi trường cơ bản.
- [x] **DONE** — Frontend React + TypeScript + Vite + Tailwind/shadcn nền tảng.
- [x] **DONE** — Migration V1 tạo schema nghiệp vụ theo thiết kế database.
- [x] **DONE** — Entity/repository/user role và dữ liệu dev ban đầu.
- [x] **DONE** — JWT access/refresh token, filter bảo mật, CORS và endpoint auth cơ bản.
- [x] **DONE** — `mvn test` chạy thành công với unit test nền tảng.
- [x] **DONE** — `npm run build` chạy thành công.
- [ ] **IN PROGRESS** — Kiểm thử tích hợp với PostgreSQL/MinIO thực tế và hoàn thiện README hướng dẫn chạy (README đã có hướng dẫn local; còn integration test).

## 2. Giai đoạn 0 — Chuẩn bị nền tảng

- [x] **DONE** — Chốt cấu trúc package theo Controller → Service → Repository → Entity/DTO.
- [x] **DONE** — Chuẩn hóa error response, validation, pagination, timezone và định dạng ngày theo `API_SPEC.md`.
  - `/api/v1/health`: trả trực tiếp `HealthCheckResult` (không wrapping envelope).
  - `/api/v1/daily-logs`: bỏ `ApiError` wrapper — trả `Page<DailyLogDto>`, `List<DailyLogDto>`, `DailyLogDto` trực tiếp.
  - Frontend types: `HealthCheckResult`, `HealthStatus`, `PageResponse` đã khớp backend response.
- [x] **DONE** — Hoàn thiện quản lý secret: bỏ giá trị mặc định nguy hiểm và kiểm tra JWT secret/thời hạn khi khởi động.
- [x] **DONE** — Thiết lập request ID (`X-Request-Id`) và global exception handler; logging/correlation nâng cao vẫn còn ở bước sau.
- [ ] **IN PROGRESS** — Bổ sung test framework, test fixtures và CI chạy backend/frontend build + test (đã có unit test nền tảng và workflow CI; còn thiếu fixture/integration test).

## 3. Giai đoạn 1 — Xác thực và phân quyền

- [x] **DONE** — Đăng nhập, refresh token và tải thông tin user ở mức nền tảng.
- [x] **DONE** — Đối chiếu đầy đủ quyền `OPERATOR`, `ACCOUNTANT`, `ADMIN` cho từng endpoint (Controller dùng `@PreAuthorize`).
- [x] **DONE** — Hoàn thiện logout endpoint (`POST /api/v1/auth/logout`) trả 204.
- [ ] **TODO** — Hoàn thiện vòng đời refresh token (lưu/thu hồi/rotation nếu cần).
- [ ] **TODO** — Viết unit/integration test cho token hết hạn, token không hợp lệ và truy cập trái quyền.
- [x] **DONE** — Xây dựng màn hình login, lưu session trong `sessionStorage` và route guard trên frontend.

## 4. Giai đoạn 2 — OCR và nhật ký hằng ngày

- [x] **DONE** — Tạo storage service (MinIO/object storage), upload ảnh và kiểm tra loại/kích thước file.
- [x] **DONE** — Tích hợp Gemini Flash API với timeout (30s), retry có exponential backoff, rate limiting (15 req/phút), phân biệt lỗi 429 quota và cơ chế fallback tạo bản nháp có thể chỉnh sửa thủ công khi gặp sự cố.
- [x] **DONE** — Xây dựng `POST /api/v1/ocr/process-log`, DTO kết quả OCR và trạng thái xử lý.
- [x] **DONE** — Xây dựng batch-save, danh sách/chi tiết daily log, approve và reopen theo API spec ở backend nền tảng.
- [x] **DONE** — Áp dụng state machine `PENDING → APPROVED/REJECTED → PENDING` khi reopen.
- [x] **DONE** — Lưu reviewer, lý do từ chối/reopen, ảnh gốc và dữ liệu OCR có thể chỉnh sửa.
- [x] **DONE** — Bổ sung filter `approvalStatus` vào `GET /daily-logs` (backend + frontend).
- [x] **DONE** — Xây dựng UI Operator: upload/chụp ảnh, xem kết quả OCR, sửa và gửi nhật ký (trang `/upload`).
- [x] **DONE** — Xây dựng UI Accountant: trang `/review` 2 cột (table + detail panel), tabs trạng thái, approve/reject/reopen với modal lý do, inline edit.
- [ ] **IN PROGRESS** — Test luồng đầu-cuối OCR → Review → Approve (đã có unit test; còn thiếu integration test với MinIO/Gemini).

## 5. Giai đoạn 3 — Danh mục và dữ liệu nghiệp vụ

- [x] **DONE** — CRUD Customers, Equipment, Contracts và Pricing Appendices ở backend nền tảng.
- [ ] **IN PROGRESS** — Thêm validation, unique constraint, soft delete và phân quyền danh mục (đã có DTO validation, unique mapping, V2 soft-delete migration và Accountant Admin guard; còn ràng buộc liên kết/nghiệp vụ).
- [x] **DONE** — Bổ sung frontend API client và các màn hình quản lý danh mục: `/customers`, `/equipment`, `/contracts`, `/contracts/:id` (Pricing Appendices).
- [x] **DONE** — Kiểm tra mapping entity/DTO với migration V1 ở backend nền tảng.

## 6. Giai đoạn 4 — Nghiệm thu, tạm ứng và công nợ

- [x] **DONE** — Xây dựng Monthly Acceptance Service và endpoint xem/chốt nghiệm thu; đã bổ sung tính lại từ `daily_logs` APPROVED theo từng máy và tháng.
- [x] **DONE** — Implement state machine nghiệm thu, khóa dữ liệu và chống tạo bản ghi trùng (đã có `PENDING_SIGNATURE → SIGNED`, pessimistic lock và unique constraint; logic tính lại gắn với approved logs).
- [x] **DONE** — Implement Advance Payments và Debt Reconciliation theo công thức trong `DATABASE.md`.
- [x] **DONE** — Dùng `BigDecimal` cho toàn bộ phép tính tiền/giờ; đã có service calculate với rounding `HALF_UP`.
- [x] **DONE** — Khi reopen log, chuyển acceptance sang `NEEDS_RECALCULATION`, set `exportInvalidatedAt` và ghi audit `EXPORT_INVALIDATED`.
- [x] **DONE** — Xây dựng UI nghiệm thu tích hợp vào trang `/export` (bảng acceptance, ký biên bản).
- [x] **DONE** — Xây dựng UI tạm ứng & công nợ trang `/debt`: 2 tab (Lịch sử đối chiếu / Lịch sử tạm ứng), tạo mới, chốt đối chiếu.
- [ ] **IN PROGRESS** — Test race condition, timeout, số tiền biên và các chuyển trạng thái hợp lệ/không hợp lệ.

## 7. Giai đoạn 5 — Export báo cáo Excel

- [x] **DONE** — Implement `ExcelExportService` bằng Apache POI cho đủ 3 báo cáo v1 (3 workbook và ZIP).
- [x] **DONE** — Implement `GET /api/v1/export/report-set`, tham số kỳ báo cáo và quyền Accountant/Admin.
- [x] **DONE** — Dữ liệu export lấy từ acceptance đã chốt, tự động tính lại khi `NEEDS_RECALCULATION`, cập nhật `lastExportedAt`.
- [x] **DONE** — Xây dựng UI trang `/export`: chọn hợp đồng + tháng, preview số liệu (tổng giờ, tạm tính, VAT, tổng cộng), cảnh báo `NEEDS_RECALCULATION`, nút download ZIP.
- [ ] **TODO** — Kiểm thử template, công thức, encoding, định dạng ngày/tiền và trường hợp không có dữ liệu.

## 8. Giai đoạn 6 — Audit, vận hành và chất lượng

- [x] **DONE** — Ghi `audit_logs` JSONB theo nguyên tắc append-only; đã ghi các action review/sign/reconcile/export.
- [x] **DONE** — Xây dựng UI trang `/audit`: bộ lọc entity type, action, khoảng thời gian; expandable rows hiển thị oldValues/newValues.
- [x] **DONE** — Dashboard trang `/dashboard`: metric cards, quick actions, recent logs theo role.
- [ ] **TODO** — Bổ sung health check, migration check, cấu hình production và backup database/object storage.
- [ ] **TODO** — Thêm test API contract, integration test với PostgreSQL/MinIO mock và frontend component/e2e test.
- [ ] **TODO** — Kiểm tra accessibility, responsive UI và các feedback state theo `UI-DESIGN.md`.

## 9. Thứ tự bàn giao đề xuất

1. ~~Hoàn thiện nền tảng lỗi/validation/test và auth frontend.~~ ✅
2. ~~Hoàn thiện OCR + daily logs để có luồng nghiệp vụ tối thiểu chạy được.~~ ✅
3. ~~Hoàn thiện danh mục làm dữ liệu đầu vào ổn định.~~ ✅
4. ~~Implement nghiệm thu → công nợ → export theo đúng dependency dữ liệu.~~ ✅
5. Bổ sung audit, hardening, test end-to-end và tài liệu triển khai. (còn lại)

## 10. Tiêu chí hoàn thành v1

- [x] **DONE** — Operator upload ảnh và nhận dữ liệu OCR có thể chỉnh sửa.
- [x] **DONE** — Accountant review, approve/reject/reopen được nhật ký theo đúng quyền.
- [x] **DONE** — Hệ thống tính nghiệm thu, tạm ứng, công nợ đúng công thức và chịu được cập nhật đồng thời.
- [x] **DONE** — Tải được đủ 3 báo cáo Excel từ dữ liệu đã chốt.
- [ ] **TODO** — Có audit trail đầy đủ, test cho happy path và các lỗi chính, build/CI xanh.
- [ ] **TODO** — Tài liệu API, database, kiến trúc và UI khớp với code thực tế.