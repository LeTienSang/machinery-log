# ARCHITECTURE — MACHINERY-LOG (Digital Logbook)

> Tài liệu mô tả kiến trúc hệ thống, phân tầng, cơ chế xác thực/phân quyền, chiến lược lưu trữ file và các quyết định kỹ thuật quan trọng.

---

## 1. Sơ đồ kiến trúc tổng thể

```
┌──────────────┐      ảnh nhật ký       ┌──────────────────┐
│   Operator   │ ───────────────────▶  │   ReactJS UI      │
│ (Site/mobile)│                        │ (Upload / Review) │
└──────────────┘                        └─────────┬─────────┘
                                                   │ REST API (HTTPS + JWT)
                                                   ▼
                                        ┌─────────────────────┐
                                        │  Spring Boot API     │
                                        │  Controller Layer    │
                                        └─────────┬─────────────┘
                                                   │
                       ┌───────────────────────────┼───────────────────────────┐
                       ▼                           ▼                           ▼
             ┌──────────────────┐      ┌─────────────────────┐     ┌──────────────────────┐
             │  Service Layer    │      │  Gemini Flash API    │     │  Apache POI Engine    │
             │ (Business logic)  │◀────▶│  (AI OCR extraction) │     │ (Excel report engine) │
             └────────┬──────────┘      └─────────────────────┘     └──────────┬─────────────┘
                      │                                                        │
                      ▼                                                        ▼
             ┌──────────────────┐                                    ┌──────────────────────┐
             │ Repository Layer  │                                    │ Excel Templates (.xlsx)│
             │ (Spring Data JPA) │                                    │ resources/templates/  │
             └────────┬──────────┘                                    └──────────────────────┘
                      ▼
             ┌──────────────────┐
             │   PostgreSQL DB   │
             └──────────────────┘

Kết quả xuất: [Excel Bundle (.zip)] ◀── Accountant tải về sau khi bấm "Export"
```

**Luồng dữ liệu chính:**
1. Operator upload ảnh → Frontend gửi `multipart/form-data` lên `/api/v1/ocr/process-log`.
2. Backend forward ảnh tới Gemini Flash API, nhận về JSON có cấu trúc (giờ làm, mô tả công việc...).
3. Backend lưu kết quả tạm vào `daily_logs` với `approval_status = PENDING`.
4. Accountant mở Review UI → sửa nếu cần → `batch-save` → duyệt (`approve`).
5. Cuối kỳ, Accountant chọn hợp đồng + tháng → gọi `/api/v1/export/report-set` → Backend khóa contract/acceptance bằng pessimistic write, truy vấn dữ liệu đã APPROVED, đổ vào 3 template Excel qua Apache POI → nén ZIP → trả về file.
6. Nếu log thuộc kỳ đã export được reopen, Backend cùng transaction ghi audit, chuyển nghiệm thu sang `NEEDS_RECALCULATION` và đánh dấu export version cũ không còn hiệu lực.

---

## 2. Phân tầng Backend (Java Spring Boot 3)

Kiến trúc phân lớp cổ điển (**Layered Architecture**):

```
Controller  →  Service  →  Repository  →  Entity (JPA)
     ↑              ↑
     │              │
   DTO ◀────────────┘  (mapping qua DTO, không expose Entity ra ngoài)
```

| Tầng | Trách nhiệm | Ghi chú |
|---|---|---|
| **Controller** | Nhận request HTTP, validate input cơ bản (`@Valid`), gọi Service, trả response chuẩn hóa | Không chứa business logic |
| **Service** | Toàn bộ logic nghiệp vụ: tính giờ công, tính VAT, quy trình duyệt log, sinh Excel, gọi Gemini API | Nơi duy nhất thao tác `BigDecimal` cho tính toán tiền/giờ |
| **Repository** | Interface `JpaRepository<Entity, Long>`, custom query khi cần (`@Query`) | Không viết SQL thô trừ khi cần tối ưu hiệu năng |
| **Entity** | Ánh xạ 1-1 với bảng PostgreSQL | Dùng annotation JPA (`@Entity`, `@Table`, `@Column`) |
| **DTO** | Đối tượng truyền dữ liệu qua API | Tách riêng Request DTO / Response DTO khi cấu trúc khác nhau |
| **Config** | Cấu hình Gemini client, CORS, Security, DataSource | Đọc secret từ biến môi trường |

**Module nghiệp vụ chính trong Service Layer:**
- `OcrService`: gọi Gemini API, parse JSON response thành `DailyLogDTO`.
- `DailyLogService`: CRUD + workflow duyệt (PENDING → APPROVED/REJECTED).
- `ContractService`, `CustomerService`, `EquipmentService`, `PricingAppendixService`: quản lý danh mục.
- `MonthlyAcceptanceService`: tổng hợp giờ công theo kỳ, tính đơn giá áp dụng, subtotal, VAT, tổng tiền.
- `DebtReconciliationService`: tính công nợ (dư nợ kỳ trước + phát sinh kỳ này − đã thanh toán).
- `ExcelExportService`: điều phối Apache POI đổ dữ liệu vào 3 template, đóng gói ZIP.
- `AuditLogService`: ghi actor, action, entity, old/new JSONB và lý do cho các thay đổi dữ liệu/trạng thái.

### Khóa đồng thời cho nghiệm thu và export

- `MonthlyAcceptanceService.calculate` và `ExcelExportService.export` phải chạy trong `@Transactional`.
- Luôn lock bản ghi `Contract` bằng `@Lock(LockModeType.PESSIMISTIC_WRITE)` làm khóa gốc theo `contractId`; sau đó lock `MonthlyAcceptance` hiện hữu cùng cặp contract/equipment/month.
- Khi chưa có `MonthlyAcceptance`, khóa `Contract` vẫn ngăn hai transaction đồng thời tạo bản ghi; unique constraint là lớp bảo vệ cuối cùng.
- Nếu không lấy được lock trong timeout cấu hình, trả lỗi `RESOURCE_LOCK_TIMEOUT` và không sinh file dở dang.

Ví dụ Spring Data JPA:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select c from Contract c where c.id = :id")
Optional<Contract> findByIdForUpdate(@Param("id") Long id);

@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select ma from MonthlyAcceptance ma "
   + "where ma.contract.id = :contractId "
   + "and ma.equipment.id = :equipmentId "
   + "and ma.billingMonth = :billingMonth")
Optional<MonthlyAcceptance> findForUpdate(
  Long contractId, Long equipmentId, String billingMonth);
```

Không giữ lock trong lúc gọi Gemini hoặc thao tác mạng không cần thiết; chỉ lock từ lúc đọc dữ liệu tính toán đến khi lưu acceptance và xác định export version.

---

## 3. Phân tầng Frontend (ReactJS + TypeScript)

```
src/
├── pages/          # Trang cấp cao nhất, ghép các components (Dashboard, Review, Reports, Contracts...)
├── components/      # UI components tái sử dụng (Table, Upload UI, Modal, Form...)
├── services/        # Axios API clients, 1 file/1 resource (dailyLog.service.ts, contract.service.ts...)
├── types/           # TypeScript interfaces/DTO dùng chung giữa các trang
├── hooks/           # Custom hooks (useDailyLogs, useAuth...)
└── lib / utils/     # Hàm tiện ích dùng chung (format ngày, format tiền tệ...)
```

**Nguyên tắc tổ chức:**
- Tách biệt rõ **presentational components** (chỉ nhận props, không gọi API) và **container/page components** (gọi API qua `services/`, quản lý state).
- Toàn bộ gọi API đi qua lớp `services/` — component không gọi `axios` trực tiếp.
- State server (dữ liệu từ API) nên quản lý qua React Query/TanStack Query (khuyến nghị) để tận dụng cache & tự động refetch sau khi duyệt log.
- Bảng dữ liệu (Review UI, danh sách log) dùng TanStack Table + Shadcn/ui, hỗ trợ inline edit trực tiếp trên ô.
- Modal xác nhận bắt buộc cho các hành động không thể hoàn tác (Approve/Reject hàng loạt, Export báo cáo).

**Luồng UI chính:**
1. **Trang Upload:** Operator chọn hợp đồng + thiết bị → chọn/chụp ảnh → xem preview → submit.
2. **Trang Review:** Accountant xem danh sách log PENDING theo hợp đồng/tháng, mở từng dòng để so sánh ảnh gốc & dữ liệu, sửa inline, duyệt/từ chối.
3. **Trang Reports:** Accountant chọn hợp đồng + tháng billing → xem preview tổng số giờ/tổng tiền → bấm Export → tải file ZIP.
4. **Trang Contracts/Customers/Equipment:** CRUD danh mục.

---

## 4. Xác thực & Phân quyền (Authentication & Authorization)

> *Ghi chú: PRD gốc chưa mô tả chi tiết cơ chế auth cụ thể; phần dưới đây là quyết định kiến trúc được chốt cho hệ thống, tuân theo nguyên tắc bảo mật chuẩn cho ứng dụng nội bộ doanh nghiệp.*

- **Cơ chế xác thực:** JWT (JSON Web Token), cấp qua endpoint đăng nhập (`/api/v1/auth/login`), gửi kèm mỗi request qua header `Authorization: Bearer <token>`.
- **Access Token / Refresh Token:** Access token thời hạn ngắn (VD: 2 giờ), Refresh token thời hạn dài hơn (VD: 7 ngày), lưu refresh token an toàn (httpOnly cookie hoặc secure storage).
- **Phân quyền (Authorization):** Dựa trên Role (RBAC) — `OPERATOR`, `ACCOUNTANT_ADMIN`; `SUPER_ADMIN` là vai trò dự phòng.
  - Backend enforce quyền tại tầng Controller/Service bằng `@PreAuthorize("hasRole('ACCOUNTANT_ADMIN')")` hoặc filter tương đương.
  - Frontend chỉ ẩn/hiện UI theo role — **không** được coi là lớp bảo mật chính.
- **Endpoint không cần xác thực:** chỉ `/api/v1/auth/login`, `/api/v1/auth/refresh`, health-check.
- **CORS:** whitelist domain Frontend cụ thể theo môi trường (dev/staging/production), không dùng `*` ở production.
- **Mật khẩu:** hash bằng BCrypt, không lưu plaintext.

**Nguồn dữ liệu identity:** bảng `users` lưu `username`, `password_hash`, `display_name`, `role` và `is_active`. v1 dùng enum chuỗi `UserRole { OPERATOR, ACCOUNTANT_ADMIN }`; không trả `password_hash` trong DTO. `daily_logs.operator_id` tham chiếu user sở hữu log, còn `reviewer_id` tham chiếu Accountant thực hiện approve/reject/reopen.

---

## 5. Chiến lược lưu trữ file (File Storage Strategy)

- **Ảnh nhật ký gốc (`original_image_url`):** lưu trên object storage (khuyến nghị: AWS S3 / MinIO tự host tương thích S3 API), **không** lưu binary trực tiếp trong PostgreSQL.
  - Đường dẫn lưu trong DB chỉ là URL/key trỏ tới object storage.
  - Ảnh được đặt tên theo cấu trúc tránh trùng lặp: `logs/{contractId}/{equipmentId}/{yyyy-MM}/{uuid}.jpg`.
  - Ảnh gốc **không bao giờ bị xóa** khi log bị từ chối — phục vụ truy vết/khiếu nại sau này.
- **File Excel template (`.xlsx`):** lưu tĩnh trong `backend/src/main/resources/templates/excel/`, được đóng gói cùng ứng dụng (không sửa runtime).
- **File Excel export kết quả:** sinh động (in-memory hoặc temp file), trả về client dưới dạng stream ZIP, **không lưu trữ lâu dài trên server** (tránh phình dung lượng). Khi log làm thay đổi kỳ đã export, `monthly_acceptances.status = NEEDS_RECALCULATION`, export mới tăng version và ghi audit `EXPORT_INVALIDATED`. File đã tải xuống không thể thu hồi vật lý, nhưng bị vô hiệu hóa về mặt nghiệp vụ.
- **Giới hạn dung lượng:** ảnh tối đa 10MB/file (validate ở Frontend trước khi upload + validate lại ở Backend).
- **Nén ảnh:** Frontend tự động nén ảnh vượt ngưỡng trước khi gửi, giảm tải băng thông và chi phí lưu trữ.

---

## 6. Các quyết định quan trọng (Architecture Decision Records — tóm tắt)

| # | Quyết định | Lý do |
|---|---|---|
| ADR-01 | Dùng `BigDecimal` cho mọi phép tính tiền tệ & giờ công thay vì `double/float` | Tránh sai số dấu phẩy động, đặc biệt quan trọng khi số liệu đi vào văn bản có giá trị pháp lý (nghiệm thu, công nợ) |
| ADR-02 | Excel sinh từ template có sẵn (Apache POI đổ dữ liệu), không dựng layout bằng code | Đảm bảo định dạng ổn định, đúng chuẩn đã thống nhất với Kế toán, dễ chỉnh sửa template mà không cần sửa code |
| ADR-03 | Ảnh gốc lưu object storage, DB chỉ lưu URL | Giảm tải cho PostgreSQL, dễ scale, hỗ trợ CDN nếu cần xem ảnh nhanh |
| ADR-04 | Trạng thái log mặc định là `PENDING`, không tự động APPROVE | Đảm bảo luôn có bước xác nhận của con người trước khi tính tiền, giảm rủi ro từ lỗi OCR |
| ADR-05 | Phân quyền RBAC 2 vai trò chính (OPERATOR, ACCOUNTANT_ADMIN) | Phù hợp quy mô nghiệp vụ hiện tại, dễ mở rộng thêm SUPER_ADMIN sau này |
| ADR-06 | API versioning qua prefix `/api/v1/` | Cho phép nâng cấp API sau này (v2) mà không phá vỡ client cũ |
| ADR-07 | Dùng Gemini 2.0 Flash / 3.6 Flash thay vì model nặng hơn | Cân bằng giữa tốc độ phản hồi, chi phí và độ chính xác đủ dùng cho OCR chữ viết tay |
| ADR-08 | Index `(contract_id, work_date)` trên `daily_logs` | Tối ưu truy vấn tổng hợp báo cáo theo hợp đồng + khoảng thời gian, là truy vấn phổ biến nhất hệ thống |
| ADR-09 | Dùng `users.role` với CHECK constraint trong v1 | Đủ cho RBAC hai vai trò, giảm join và vẫn có đường nâng cấp sang `roles/user_roles` khi cần nhiều role |
| ADR-10 | Reopen log qua endpoint riêng, bắt buộc lý do | Cho phép sửa dữ liệu sau approve/reject nhưng không làm mất kiểm soát trạng thái và truy vết người thao tác |
| ADR-11 | Unique `(contract_id, equipment_id, billing_month)` trên `monthly_acceptances` | Ngăn export lặp tạo nhiều biên bản cho cùng thiết bị trong cùng kỳ |
| ADR-12 | Audit log append-only với PostgreSQL JSONB | Lưu snapshot trước/sau và actor linh hoạt cho compliance, điều tra và truy vết |
| ADR-13 | Reopen làm acceptance thành `NEEDS_RECALCULATION` | Ngăn dùng lại báo cáo cũ sau khi dữ liệu nguồn thay đổi |
| ADR-14 | Pessimistic write lock cho calculate/export | Chống race condition khi nhiều request cùng chốt một hợp đồng/kỳ |

---

## 7. Môi trường & cổng mặc định (Environments & Default Ports)

| Thành phần | Cổng mặc định (local dev) | Ghi chú |
|---|---|---|
| Frontend (Vite dev server) | `5173` | `npm run dev` |
| Backend (Spring Boot) | `8080` | Context path mặc định `/`, API dưới `/api/v1` |
| PostgreSQL | `5432` | Database name khuyến nghị: `machinery_log_db` |
| Gemini API | N/A (external) | Gọi qua HTTPS REST tới Google AI Studio, không mở cổng nội bộ |

**Biến môi trường bắt buộc (Backend):**
```
GEMINI_API_KEY=<secret>
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/machinery_log_db
SPRING_DATASOURCE_USERNAME=<db_user>
SPRING_DATASOURCE_PASSWORD=<db_password>
JWT_SECRET=<secret>
JWT_EXPIRATION_MS=7200000
FILE_STORAGE_ENDPOINT=<s3-compatible-endpoint>
FILE_STORAGE_BUCKET=machinery-log-images
```

**Môi trường triển khai đề xuất:**
| Môi trường | Mục đích |
|---|---|
| `local` | Phát triển trên máy cá nhân, dùng PostgreSQL local hoặc Docker Compose |
| `staging` | Kiểm thử trước khi release, dữ liệu giả lập |
| `production` | Môi trường chính thức, backup DB định kỳ, giám sát log lỗi Gemini API (rate limit, timeout) |

---

## 8. Khả năng mở rộng & Rủi ro kỹ thuật (Scalability & Risks)

- **Rủi ro:** Gemini API có thể rate-limit hoặc timeout khi nhiều Operator upload cùng lúc cuối ngày → cần hàng đợi xử lý (queue) nếu tải tăng cao (định hướng dùng message queue như RabbitMQ/Kafka ở giai đoạn sau).
- **Rủi ro:** Sinh Excel cho hợp đồng có khối lượng log lớn (nhiều tháng liên tục) có thể chậm nếu không tối ưu truy vấn — đã có index `idx_daily_logs_contract_date` để giảm thiểu.
- **Khả năng mở rộng:** Kiến trúc phân tầng rõ ràng cho phép tách `OcrService` hoặc `ExcelExportService` thành microservice riêng trong tương lai nếu tải tăng, mà không ảnh hưởng các module khác.
- **Khả năng mở rộng:** Object storage cho ảnh giúp dễ dàng chuyển sang CDN hoặc multi-region khi mở rộng quy mô công trường.
