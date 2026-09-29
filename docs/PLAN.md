# Kế hoạch triển khai MACHINERY-LOG

> Cập nhật: 2026-09-29
>
> Trạng thái được đối chiếu với mã nguồn hiện tại, không đánh dấu `DONE` chỉ dựa
> trên tài liệu thiết kế. `DONE` nghĩa là đã có bằng chứng trong repository và
> đã kiểm tra được ở mức phù hợp.

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
- [ ] **IN PROGRESS** — Chuẩn hóa error response, validation, pagination, timezone và định dạng ngày theo `API_SPEC.md` (đã có error envelope, validation handler, `PageResponse` và UTC; còn cần áp dụng vào các endpoint nghiệp vụ).
- [x] **DONE** — Hoàn thiện quản lý secret: bỏ giá trị mặc định nguy hiểm và kiểm tra JWT secret/thời hạn khi khởi động.
- [x] **DONE** — Thiết lập request ID (`X-Request-Id`) và global exception handler; logging/correlation nâng cao vẫn còn ở bước sau.
- [ ] **IN PROGRESS** — Bổ sung test framework, test fixtures và CI chạy backend/frontend build + test (đã có unit test nền tảng và workflow CI; còn thiếu fixture/integration test).

## 3. Giai đoạn 1 — Xác thực và phân quyền

- [x] **DONE** — Đăng nhập, refresh token và tải thông tin user ở mức nền tảng.
- [ ] **TODO** — Đối chiếu đầy đủ quyền `OPERATOR`, `ACCOUNTANT`, `ADMIN` cho từng endpoint.
- [ ] **TODO** — Hoàn thiện vòng đời refresh token (lưu/thu hồi/rotation nếu cần) và logout.
- [ ] **TODO** — Viết unit/integration test cho token hết hạn, token không hợp lệ và truy cập trái quyền.
- [x] **DONE** — Xây dựng màn hình login, lưu session trong `sessionStorage` và route guard trên frontend.

## 4. Giai đoạn 2 — OCR và nhật ký hằng ngày

- [x] **DONE** — Tạo storage service (MinIO/object storage), upload ảnh và kiểm tra loại/kích thước file.
- [ ] **IN PROGRESS** — Tích hợp Gemini Flash API với timeout, retry, giới hạn chi phí và xử lý lỗi (đã có client, timeout 30s, retry tối đa 2 lần, giới hạn ảnh cấu hình được và error mapping; còn integration test với MinIO/Gemini).
- [x] **DONE** — Xây dựng `POST /api/v1/ocr/process-log`, DTO kết quả OCR và trạng thái xử lý.
- [x] **DONE** — Xây dựng batch-save, danh sách/chi tiết daily log, approve và reopen theo API spec ở backend nền tảng.
- [x] **DONE** — Áp dụng state machine `PENDING → APPROVED/REJECTED → PENDING` khi reopen.
- [x] **DONE** — Lưu reviewer, lý do từ chối/reopen, ảnh gốc và dữ liệu OCR có thể chỉnh sửa.
- [x] **DONE** — Xây dựng UI Operator: upload/chụp ảnh, xem kết quả OCR, sửa và gửi nhật ký.
- [x] **DONE** — Xây dựng UI Accountant nền tảng: danh sách review, approve/reject/reopen và feedback loading/error/empty.
- [ ] **IN PROGRESS** — Test luồng đầu-cuối OCR → Review → Approve (đã có unit test validation upload và state machine review; còn thiếu integration test với MinIO/Gemini).

## 5. Giai đoạn 3 — Danh mục và dữ liệu nghiệp vụ

- [x] **DONE** — CRUD Customers, Equipment, Contracts và Pricing Appendices ở backend nền tảng.
- [ ] **IN PROGRESS** — Thêm validation, unique constraint, soft delete và phân quyền danh mục (đã có DTO validation, unique mapping, V2 soft-delete migration và Accountant Admin guard; còn ràng buộc liên kết/nghiệp vụ).
- [ ] **IN PROGRESS** — Bổ sung endpoint/API client và các màn hình quản lý danh mục (backend endpoint đã có; còn frontend API client/UI).
- [x] **DONE** — Kiểm tra mapping entity/DTO với migration V1 ở backend nền tảng; migration bổ sung chưa cần thiết.

## 6. Giai đoạn 4 — Nghiệm thu, tạm ứng và công nợ

- [x] **DONE** — Xây dựng Monthly Acceptance Service và endpoint xem/chốt nghiệm thu; đã bổ sung tính lại từ `daily_logs` APPROVED theo từng máy và tháng.
- [x] **DONE** — Implement state machine nghiệm thu, khóa dữ liệu và chống tạo bản ghi trùng (đã có `PENDING_SIGNATURE → SIGNED`, pessimistic lock và unique constraint; logic tính lại gắn với approved logs).
- [x] **DONE** — Implement Advance Payments và Debt Reconciliation theo công thức trong `DATABASE.md`; đã có CRUD tạm ứng, tạo/lịch sử/chốt đối chiếu và tính `previous + acceptance - paid` theo tháng.
- [x] **DONE** — Dùng `BigDecimal` cho toàn bộ phép tính tiền/giờ; đã có service calculate với rounding `HALF_UP` và test regression cho số liệu.
- [x] **DONE** — Khi reopen log, chuyển acceptance sang `NEEDS_RECALCULATION`, set `exportInvalidatedAt` và ghi audit `EXPORT_INVALIDATED`.
- [ ] **TODO** — Xây dựng UI nghiệm thu, tạm ứng, công nợ và các trạng thái loading/error/empty.
- [ ] **IN PROGRESS** — Test race condition, timeout, số tiền biên và các chuyển trạng thái hợp lệ/không hợp lệ (đã có unit test công thức và trạng thái cơ bản; còn integration/race test).

## 7. Giai đoạn 5 — Export báo cáo Excel

- [ ] **IN PROGRESS** — Implement `ExcelExportService` bằng Apache POI cho đủ 3 báo cáo v1 (đã có 3 workbook cơ bản và ZIP; còn hoàn thiện template/định dạng nghiệp vụ).
- [x] **DONE** — Implement `GET /api/v1/export/report-set`, tham số kỳ báo cáo và quyền Accountant/Admin.
- [ ] **IN PROGRESS** — Đảm bảo dữ liệu export lấy từ acceptance đã chốt và có version/audit (đã cập nhật `lastExportedAt` và xử lý acceptance cần tính lại; còn audit log và kiểm soát SIGNED/export).
- [ ] **TODO** — Kiểm thử template, công thức, encoding, định dạng ngày/tiền và trường hợp không có dữ liệu.
- [ ] **TODO** — Xây dựng UI chọn kỳ, xem trạng thái và tải bộ báo cáo.

## 8. Giai đoạn 6 — Audit, vận hành và chất lượng

- [ ] **IN PROGRESS** — Ghi `audit_logs` JSONB theo nguyên tắc append-only, không lưu secret/ảnh nhạy cảm ngoài quy định (đã có entity/repository, trigger DB, API đọc, request correlation và ghi các action review/sign/reconcile/export; còn snapshot `oldValues/newValues` đầy đủ).
- [ ] **TODO** — Bổ sung health check, migration check, cấu hình production và backup database/object storage.
- [ ] **TODO** — Thêm test API contract, integration test với PostgreSQL/MinIO mock và frontend component/e2e test.
- [ ] **TODO** — Kiểm tra accessibility, responsive UI và các feedback state theo `UI-DESIGN.md`.
- [ ] **TODO** — Chạy checklist trước commit: không debug log/secret, build sạch, cập nhật tài liệu liên quan.
- [ ] **TODO** — Cập nhật `API_SPEC.md`, `DATABASE.md`, `ARCHITECTURE.md`, `UI-DESIGN.md` sau mỗi thay đổi tương ứng.

## 9. Thứ tự bàn giao đề xuất

1. Hoàn thiện nền tảng lỗi/validation/test và auth frontend.
2. Hoàn thiện OCR + daily logs để có luồng nghiệp vụ tối thiểu chạy được.
3. Hoàn thiện danh mục làm dữ liệu đầu vào ổn định.
4. Implement nghiệm thu → công nợ → export theo đúng dependency dữ liệu.
5. Bổ sung audit, hardening, test end-to-end và tài liệu triển khai.

## 10. Tiêu chí hoàn thành v1

- [ ] **TODO** — Operator upload ảnh và nhận dữ liệu OCR có thể chỉnh sửa.
- [ ] **TODO** — Accountant review, approve/reject/reopen được nhật ký theo đúng quyền.
- [ ] **TODO** — Hệ thống tính nghiệm thu, tạm ứng, công nợ đúng công thức và chịu được cập nhật đồng thời.
- [ ] **TODO** — Tải được đủ 3 báo cáo Excel từ dữ liệu đã chốt.
- [ ] **TODO** — Có audit trail, test cho happy path và các lỗi chính, build/CI xanh.
- [ ] **TODO** — Tài liệu API, database, kiến trúc và UI khớp với code thực tế.
