# DATABASE — MACHINERY-LOG (Digital Logbook)

> Tài liệu mô tả chi tiết schema PostgreSQL, quan hệ giữa các bảng, ràng buộc nghiệp vụ và quy tắc dữ liệu.

---

## 1. Sơ đồ quan hệ tổng quan (ERD — mô tả dạng văn bản)

```
users (1) ───< (n) daily_logs [operator_id/reviewer_id]
users (1) ───< (n) audit_logs [actor_user_id]
customers (1) ───< (n) contracts (1) ───< (n) pricing_appendices >─── (1) equipment
                          │                                                  │
                          │                                                  │
                          ├──< (n) daily_logs >──────────────────────────────┘
                          │
                          ├──< (n) monthly_acceptances >── (n) equipment
                          │
                          ├──< (n) advance_payments
                          │
                          └──< (n) debt_reconciliations
```

- 1 `customer` có nhiều `contract`.
- 1 `contract` có nhiều `pricing_appendix` (mỗi phụ lục gắn 1 `equipment` cụ thể + đơn giá).
- 1 `contract` + 1 `equipment` có nhiều `daily_log` (theo từng ngày).
- 1 `contract` + 1 `equipment` có nhiều `monthly_acceptance` (theo từng tháng billing).
- 1 `contract` có nhiều `advance_payment` (các lần tạm ứng).
- 1 `contract` có nhiều `debt_reconciliation` (biên bản đối chiếu công nợ theo từng lần chốt).
- 1 `user` có thể tạo nhiều log với vai trò `OPERATOR` qua `daily_logs.operator_id`.
- 1 `user` có thể review nhiều log với vai trò `ACCOUNTANT_ADMIN` qua `daily_logs.reviewer_id`.
- 1 `user` có thể tạo nhiều bản ghi audit qua `audit_logs.actor_user_id`.

> **Quyết định v1:** dùng cột `users.role` với `CHECK` constraint thay vì tách bảng `roles`. Nếu sau này một user cần nhiều role, có thể thay bằng `roles` và bảng trung gian `user_roles` trong một migration riêng.

---

## 2. Chi tiết từng bảng

### 2.1. `users` — Tài khoản đăng nhập

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Tên đăng nhập |
| password_hash | VARCHAR(255) | NOT NULL | Mật khẩu đã hash bằng BCrypt |
| display_name | VARCHAR(150) | NOT NULL | Tên hiển thị |
| role | VARCHAR(30) | NOT NULL, CHECK | `OPERATOR` hoặc `ACCOUNTANT_ADMIN` |
| is_active | BOOLEAN | DEFAULT TRUE | Khóa/mở tài khoản |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

**Quy tắc:** không lưu plaintext password. `OPERATOR` chỉ được sở hữu log của mình; `ACCOUNTANT_ADMIN` được review và quản trị nghiệp vụ. `role` phải được kiểm tra ở Service trước khi gán vào `operator_id` hoặc `reviewer_id`.

### 2.2. `customers` — Khách hàng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| company_name | VARCHAR(255) | NOT NULL | Tên công ty khách hàng |
| tax_code | VARCHAR(50) | | Mã số thuế |
| representative_name | VARCHAR(100) | | Người đại diện pháp lý |
| position | VARCHAR(100) | | Chức vụ người đại diện |
| phone_number | VARCHAR(20) | | Số điện thoại liên hệ |
| address | TEXT | | Địa chỉ công ty |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo bản ghi |

**Ghi chú nghiệp vụ:** `representative_name` + `position` được dùng để điền tự động vào phần "Đại diện bên B" trong biên bản nghiệm thu và đối chiếu công nợ.

---

### 2.3. `equipment` — Thiết bị

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| equipment_name | VARCHAR(255) | NOT NULL | Tên thiết bị (VD: Máy đào Komatsu PC200) |
| serial_registration_number | VARCHAR(100) | NOT NULL | Số seri / số đăng kiểm thiết bị |
| equipment_type | VARCHAR(50) | | Loại thiết bị (máy đào, xe cẩu, máy ủi...) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

**Ghi chú nghiệp vụ:** 1 thiết bị có thể được cho thuê trong nhiều hợp đồng khác nhau (qua bảng trung gian `pricing_appendices`), miễn là không trùng khoảng thời gian thi công thực tế (ràng buộc nghiệp vụ, chưa enforce ở tầng DB).

---

### 2.4. `contracts` — Hợp đồng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| customer_id | INT | FK → customers(id) | |
| contract_number | VARCHAR(100) | UNIQUE, NOT NULL | Số hợp đồng |
| signing_date | DATE | | Ngày ký |
| project_name | TEXT | | Tên dự án/công trình |
| construction_site | TEXT | | Địa điểm thi công |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | `ACTIVE`, `EXPIRED`, `TERMINATED` |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

**Quy tắc trạng thái:**
- `ACTIVE`: hợp đồng đang hiệu lực, cho phép tạo `daily_logs` mới.
- `EXPIRED`: hết hạn tự nhiên — không cho tạo log mới nhưng vẫn cho phép export báo cáo lịch sử.
- `TERMINATED`: chấm dứt trước hạn — tương tự `EXPIRED`, khóa tạo log mới.

---

### 2.5. `pricing_appendices` — Phụ lục đơn giá

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| contract_id | INT | FK → contracts(id) | |
| equipment_id | INT | FK → equipment(id) | |
| pricing_type | VARCHAR(50) | DEFAULT 'HOURLY' | `HOURLY`, `DAILY`, `MONTHLY` |
| unit_price | DECIMAL(15,2) | NOT NULL | Đơn giá (VNĐ) |
| unit_of_measure | VARCHAR(20) | DEFAULT 'Hours' | Đơn vị tính hiển thị trên báo cáo |

**Ghi chú nghiệp vụ:** Đây là bảng trung gian định nghĩa đơn giá áp dụng cho **1 cặp (hợp đồng, thiết bị)**. Khi tính `monthly_acceptances`, hệ thống tra cứu đơn giá hiệu lực (`applied_unit_price`) từ bảng này tại thời điểm chốt kỳ. Nếu 1 hợp đồng đổi đơn giá giữa chừng, cần tạo phụ lục mới (khuyến nghị mở rộng thêm cột `effective_from`/`effective_to` ở phiên bản sau — xem mục 5).

---

### 2.6. `daily_logs` — Nhật ký hàng ngày

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| operator_id | INT | FK → users(id), nullable | Tài khoản `OPERATOR` sở hữu log |
| contract_id | INT | FK → contracts(id) | |
| equipment_id | INT | FK → equipment(id) | |
| work_date | DATE | NOT NULL | Ngày làm việc |
| work_description | TEXT | | Mô tả công việc trong ngày |
| morning_start_time | VARCHAR(10) | | Giờ bắt đầu ca sáng |
| morning_end_time | VARCHAR(10) | | Giờ kết thúc ca sáng |
| afternoon_start_time | VARCHAR(10) | | Giờ bắt đầu ca chiều |
| afternoon_end_time | VARCHAR(10) | | Giờ kết thúc ca chiều |
| evening_start_time | VARCHAR(10) | | Giờ bắt đầu ca tối |
| evening_end_time | VARCHAR(10) | | Giờ kết thúc ca tối |
| operating_hours | DECIMAL(5,2) | DEFAULT 0.0 | Tổng số giờ vận hành thực tế trong ngày |
| standby_hours | DECIMAL(5,2) | DEFAULT 0.0 | Số giờ chờ (standby) không vận hành |
| operator_name | VARCHAR(100) | | Tên người vận hành ghi trong sổ |
| original_image_url | TEXT | | URL ảnh nhật ký gốc (lưu tại object storage) |
| approval_status | VARCHAR(50) | DEFAULT 'PENDING' | `PENDING`, `APPROVED`, `REJECTED` |
| rejection_reason | TEXT | nullable | Bắt buộc khi chuyển sang `REJECTED` |
| reviewer_id | INT | FK → users(id), nullable | Accountant thực hiện quyết định gần nhất |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

**Index:** `idx_daily_logs_contract_date` trên `(contract_id, work_date)` — tối ưu truy vấn tổng hợp báo cáo theo hợp đồng + khoảng ngày (truy vấn phổ biến nhất hệ thống).

**Quy tắc nghiệp vụ quan trọng:**
- `operating_hours` = tổng thời lượng giữa các cặp (start_time, end_time) của 3 ca sáng/chiều/tối, do OCR trích xuất và/hoặc Accountant tính/sửa tay.
- Log **chỉ được tính vào báo cáo Excel khi `approval_status = 'APPROVED'`** — log `PENDING`/`REJECTED` không xuất hiện trong `monthly_acceptances`.
- `operator_id` phải trỏ tới user có role `OPERATOR`; `reviewer_id` phải trỏ tới user có role `ACCOUNTANT_ADMIN`. Đây là ràng buộc nghiệp vụ cần enforce ở Service, vì FK đơn thuần không kiểm tra được role.
- Khi `approval_status = 'REJECTED'`, `rejection_reason` bắt buộc không rỗng. Khi approve lại, Service phải xóa `rejection_reason`; khi reopen về `PENDING`, lý do từ chối gần nhất có thể được giữ lại để tra cứu cho tới khi log được quyết định lại.
- `reviewer_id` được cập nhật khi approve, reject hoặc reopen; muốn truy vết toàn bộ lịch sử phải có `audit_logs`.
- `original_image_url` không bao giờ bị xóa, kể cả khi log bị `REJECTED`, để phục vụ tra soát về sau.
- Giờ lưu dạng `VARCHAR(10)` (VD: "07:30") thay vì kiểu TIME để linh hoạt với dữ liệu OCR thô có thể chưa chuẩn hóa hoàn toàn trước khi Accountant duyệt.

---

### 2.7. `monthly_acceptances` — Biên bản nghiệm thu theo tháng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| contract_id | INT | FK → contracts(id) | |
| equipment_id | INT | FK → equipment(id) | |
| billing_month | VARCHAR(7) | NOT NULL | Định dạng `YYYY-MM` |
| from_date | DATE | | Ngày bắt đầu kỳ tính |
| to_date | DATE | | Ngày kết thúc kỳ tính |
| total_operating_hours | DECIMAL(8,2) | | Tổng giờ vận hành đã APPROVED trong kỳ |
| applied_unit_price | DECIMAL(15,2) | | Đơn giá áp dụng (snapshot tại thời điểm chốt) |
| subtotal_before_vat | DECIMAL(15,2) | | = total_operating_hours × applied_unit_price |
| vat_percentage | INT | DEFAULT 8 | % thuế GTGT áp dụng |
| vat_amount | DECIMAL(15,2) | | = subtotal_before_vat × vat_percentage / 100 |
| total_amount | DECIMAL(15,2) | | = subtotal_before_vat + vat_amount |
| status | VARCHAR(50) | DEFAULT 'PENDING_SIGNATURE' | `PENDING_SIGNATURE`, `SIGNED` |
| export_version | INT | DEFAULT 1 | Phiên bản dữ liệu đã dùng để sinh export |
| last_exported_at | TIMESTAMP | nullable | Thời điểm export thành công gần nhất |
| export_invalidated_at | TIMESTAMP | nullable | Thời điểm export cũ bị vô hiệu hóa |

**Ràng buộc:** `UNIQUE(contract_id, equipment_id, billing_month)` với tên constraint `uq_monthly_acceptances_contract_equipment_month`.

**Quy tắc nghiệp vụ:**
- Bản ghi này được **sinh tự động** khi Accountant bấm "Export" cho 1 hợp đồng + tháng — tổng hợp toàn bộ `daily_logs` có `approval_status = APPROVED` trong khoảng `[from_date, to_date]`.
- `applied_unit_price` được snapshot lại từ `pricing_appendices` tại thời điểm export, **không** tham chiếu động — đảm bảo báo cáo không đổi ngay cả khi đơn giá hợp đồng thay đổi sau này.
- `status = SIGNED` được Accountant cập nhật thủ công sau khi khách hàng ký biên bản giấy (v1 chưa có e-signature).
- `status = NEEDS_RECALCULATION` nghĩa là dữ liệu nguồn đã thay đổi sau lần export; export cũ không còn là bản có giá trị nghiệp vụ. Export mới phải tính lại và tăng `export_version`.

---

### 2.8. `advance_payments` — Tạm ứng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| contract_id | INT | FK → contracts(id) | |
| document_date | DATE | NOT NULL | Ngày chứng từ tạm ứng |
| document_number | VARCHAR(100) | | Số chứng từ (phiếu thu/UNC...) |
| description | TEXT | | Diễn giải |
| amount | DECIMAL(15,2) | NOT NULL | Số tiền tạm ứng |

**Ghi chú nghiệp vụ:** Tổng các `amount` trong kỳ được cộng vào `total_paid` khi tính `debt_reconciliations`.

---

### 2.9. `debt_reconciliations` — Đối chiếu công nợ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | SERIAL | PK | |
| contract_id | INT | FK → contracts(id) | |
| reconciliation_date | DATE | | Ngày lập biên bản đối chiếu |
| previous_balance | DECIMAL(15,2) | DEFAULT 0 | Dư nợ kỳ trước chuyển sang |
| current_period_acceptance | DECIMAL(15,2) | | Tổng giá trị nghiệm thu phát sinh trong kỳ (từ `monthly_acceptances`) |
| total_paid | DECIMAL(15,2) | | Tổng đã thanh toán/tạm ứng trong kỳ (từ `advance_payments`) |
| remaining_balance | DECIMAL(15,2) | | = previous_balance + current_period_acceptance − total_paid |
| status | VARCHAR(50) | DEFAULT 'PENDING_RECONCILIATION' | `PENDING_RECONCILIATION`, `RECONCILED` |

**Công thức chốt công nợ:**
```
remaining_balance = previous_balance + current_period_acceptance - total_paid
```
`previous_balance` của kỳ hiện tại = `remaining_balance` của bản ghi `debt_reconciliations` gần nhất trước đó (theo `contract_id`, sắp xếp theo `reconciliation_date`).

### 2.10. `audit_logs` — Lịch sử thao tác dữ liệu

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| actor_user_id | INT | FK → users(id), nullable | User hoặc tác nhân hệ thống thực hiện thao tác |
| action | VARCHAR(50) | NOT NULL | `CREATE`, `UPDATE`, `APPROVE`, `REJECT`, `REOPEN`, `SIGN`, `RECONCILE`, `EXPORT_CREATED`, `EXPORT_INVALIDATED` |
| entity_type | VARCHAR(100) | NOT NULL | Tên entity, VD: `DailyLog`, `MonthlyAcceptance` |
| entity_id | BIGINT | NOT NULL | ID bản ghi bị tác động |
| old_values | JSONB | nullable | Snapshot trước thay đổi |
| new_values | JSONB | nullable | Snapshot sau thay đổi |
| reason | TEXT | nullable | Lý do reject/reopen hoặc mô tả thao tác |
| request_id | UUID | nullable | Correlation ID để truy vết request |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Thời điểm ghi audit |

**Quy tắc:** audit log là append-only; không update/delete qua API nghiệp vụ. JSONB chỉ lưu dữ liệu nghiệp vụ cần truy vết, không lưu password/token. Index trên `(entity_type, entity_id, created_at)` và `(actor_user_id, created_at)`.

---

## 3. Ràng buộc toàn vẹn dữ liệu (Data Integrity Rules)

- Tất cả khóa ngoại (`contract_id`, `equipment_id`, `customer_id`, `operator_id`, `reviewer_id`) phải tồn tại trước khi insert bản ghi con — enforce bằng FK constraint ở DB, đồng thời validate ở tầng Service để trả lỗi nghiệp vụ rõ ràng (thay vì lỗi SQL thô).
- `daily_logs.work_date` không được là ngày tương lai (validate ở tầng Service).
- `daily_logs.approval_status` cho phép các chuyển trạng thái: `PENDING → APPROVED`, `PENDING → REJECTED`, `APPROVED → PENDING` hoặc `REJECTED → PENDING` thông qua endpoint reopen riêng. Không cho phép đổi trực tiếp giữa `APPROVED` và `REJECTED`.
- Reopen chỉ do `ACCOUNTANT_ADMIN` thực hiện, bắt buộc có `reopen_reason`; cập nhật `reviewer_id`, giữ nguyên ảnh gốc và không được đưa log vào báo cáo cho tới khi được approve lại.
- Nếu log reopen thuộc `(contract_id, equipment_id, billing_month)` đã có `monthly_acceptances`, cùng transaction phải chuyển acceptance sang `NEEDS_RECALCULATION`, set `export_invalidated_at`, ghi `EXPORT_INVALIDATED`/`REOPEN` vào `audit_logs`. Nếu file ZIP chỉ stream và không lưu server, việc vô hiệu hóa là logical invalidation; file đã tải xuống không thể bị thu hồi vật lý.
- `monthly_acceptances` không được tạo trùng cho cùng `(contract_id, equipment_id, billing_month)` — enforce bằng unique constraint ở DB và xử lý lỗi xung đột ở Service.
- `pricing_appendices.unit_price` phải > 0.
- `vat_percentage` trong khoảng hợp lệ (0–100).
- `audit_logs` chỉ được append, không cho phép sửa/xóa qua API thông thường.

---

## 4. Quy tắc tính toán số liệu (Business Calculation Rules)

| Bảng | Công thức |
|---|---|
| `daily_logs.operating_hours` | Tổng giờ giữa các cặp start/end time của ca sáng + chiều + tối (trừ thời gian nghỉ nếu có cấu hình) |
| `monthly_acceptances.subtotal_before_vat` | `total_operating_hours × applied_unit_price` |
| `monthly_acceptances.vat_amount` | `subtotal_before_vat × vat_percentage / 100` |
| `monthly_acceptances.total_amount` | `subtotal_before_vat + vat_amount` |
| `debt_reconciliations.remaining_balance` | `previous_balance + current_period_acceptance − total_paid` |

> **Quy tắc bắt buộc:** mọi phép tính trên phải thực hiện bằng `BigDecimal` với `RoundingMode` được thống nhất (khuyến nghị `HALF_UP`, làm tròn 2 chữ số thập phân) để tránh sai lệch giữa các lần tính và đảm bảo khớp với số liệu trình bày trên Excel.

---

## 5. SQL Migration chuẩn (v1)

Migration triển khai thực tế nằm tại `backend/src/main/resources/db/migration/V1__create_machinery_log_schema.sql` và được Flyway chạy tự động khi ứng dụng khởi động. Flyway tự quản lý transaction; không thêm `BEGIN`/`COMMIT` trong file migration.

```sql
BEGIN;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('OPERATOR', 'ACCOUNTANT_ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE daily_logs
    ADD COLUMN operator_id INT,
    ADD COLUMN rejection_reason TEXT,
    ADD COLUMN reviewer_id INT;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id INT REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    request_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE monthly_acceptances
    ADD COLUMN export_version INT NOT NULL DEFAULT 1,
    ADD COLUMN last_exported_at TIMESTAMP,
    ADD COLUMN export_invalidated_at TIMESTAMP;

ALTER TABLE monthly_acceptances
    ADD CONSTRAINT ck_monthly_acceptances_status
    CHECK (status IN ('PENDING_SIGNATURE', 'SIGNED', 'NEEDS_RECALCULATION'));

ALTER TABLE daily_logs
    ADD CONSTRAINT fk_daily_logs_operator
        FOREIGN KEY (operator_id) REFERENCES users(id),
    ADD CONSTRAINT fk_daily_logs_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES users(id),
    ADD CONSTRAINT ck_daily_logs_rejection_reason
        CHECK (approval_status <> 'REJECTED'
            OR NULLIF(BTRIM(rejection_reason), '') IS NOT NULL);

CREATE INDEX idx_daily_logs_operator ON daily_logs(operator_id);
CREATE INDEX idx_daily_logs_reviewer ON daily_logs(reviewer_id);
CREATE INDEX idx_audit_logs_entity_created
    ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_logs_actor_created
    ON audit_logs(actor_user_id, created_at);

-- 1. Backfill operator_id từ nguồn mapping đã được nghiệp vụ xác nhận.
-- Không suy đoán từ operator_name nếu có nhiều user trùng tên.
CREATE TEMP TABLE operator_backfill_map (
    daily_log_id INT PRIMARY KEY REFERENCES daily_logs(id),
    operator_id INT NOT NULL REFERENCES users(id)
);
-- INSERT INTO operator_backfill_map(daily_log_id, operator_id) VALUES (...);
UPDATE daily_logs dl
SET operator_id = m.operator_id
FROM operator_backfill_map m
WHERE dl.id = m.daily_log_id
  AND dl.operator_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM daily_logs WHERE operator_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill operator_id is incomplete';
    END IF;
END $$;

-- 2. Lưu các acceptance trùng để review trước khi xóa bản ghi dư.
CREATE TABLE monthly_acceptances_dedup_archive AS
SELECT ma.*, CURRENT_TIMESTAMP AS archived_at
FROM (
    SELECT ma.*,
           ROW_NUMBER() OVER (
               PARTITION BY contract_id, equipment_id, billing_month
               ORDER BY id DESC
           ) AS duplicate_rank
    FROM monthly_acceptances ma
) ma
WHERE ma.duplicate_rank > 1;

-- 3. Giữ bản ghi mới nhất trong mỗi kỳ rồi mới gán UNIQUE constraint.
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY contract_id, equipment_id, billing_month
               ORDER BY id DESC
           ) AS duplicate_rank
    FROM monthly_acceptances
)
DELETE FROM monthly_acceptances ma
USING ranked r
WHERE ma.id = r.id
  AND r.duplicate_rank > 1;

ALTER TABLE monthly_acceptances
    ADD CONSTRAINT uq_monthly_acceptances_contract_equipment_month
    UNIQUE (contract_id, equipment_id, billing_month);

COMMIT;

-- Rollback (chỉ chạy khi cần hoàn tác migration này)
-- ALTER TABLE monthly_acceptances
--     DROP CONSTRAINT uq_monthly_acceptances_contract_equipment_month;
-- ALTER TABLE monthly_acceptances
--     DROP CONSTRAINT ck_monthly_acceptances_status,
--     DROP COLUMN export_invalidated_at,
--     DROP COLUMN last_exported_at,
--     DROP COLUMN export_version;
-- DROP TABLE monthly_acceptances_dedup_archive;
-- DROP INDEX idx_daily_logs_reviewer;
-- DROP INDEX idx_daily_logs_operator;
-- DROP INDEX idx_audit_logs_actor_created;
-- DROP INDEX idx_audit_logs_entity_created;
-- ALTER TABLE daily_logs
--     DROP CONSTRAINT ck_daily_logs_rejection_reason,
--     DROP CONSTRAINT fk_daily_logs_reviewer,
--     DROP CONSTRAINT fk_daily_logs_operator,
--     DROP COLUMN reviewer_id,
--     DROP COLUMN rejection_reason,
--     DROP COLUMN operator_id;
-- DROP TABLE audit_logs;
-- DROP TABLE users;
```

> Migration Enterprise bắt buộc theo thứ tự: tạo bảng audit → backfill `operator_id` từ mapping được phê duyệt → kiểm tra không còn null → archive/deduplicate `monthly_acceptances` → mới tạo unique constraint. `reviewer_id` vẫn nullable vì log chưa review không có reviewer.

## 6. Entity và DTO contract

### 6.1. JPA Entity tối thiểu

```java
@Entity
@Table(name = "users")
class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 100)
    private String username;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;
    @Column(name = "is_active", nullable = false)
    private boolean active;
}

enum UserRole { OPERATOR, ACCOUNTANT_ADMIN }

@Entity
@Table(name = "daily_logs")
class DailyLog {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private User operator;
    @Column(name = "rejection_reason")
    private String rejectionReason;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;
}

@Entity
@Table(name = "audit_logs")
class AuditLog {
    @Column(nullable = false, length = 50)
    private String action;
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;
    @Column(name = "entity_id", nullable = false)
    private Long entityId;
    @Column(name = "old_values", columnDefinition = "jsonb")
    private JsonNode oldValues;
    @Column(name = "new_values", columnDefinition = "jsonb")
    private JsonNode newValues;
}
```

Entity thực tế phải giữ đầy đủ các trường hiện có; đoạn trên chỉ minh họa phần bổ sung. `MonthlyAcceptance` cần khai báo `@UniqueConstraint` tương ứng với constraint SQL.

### 6.2. DTO tối thiểu

`DailyLogDTO` bổ sung `operatorId`, `operatorName`, `reviewerId`, `reviewerName`, `rejectionReason` và `approvalStatus`. `UserDTO` chỉ trả `id`, `username`, `displayName`, `role`, `active`; tuyệt đối không trả `passwordHash`.

`MonthlyAcceptanceDTO` bổ sung `status`, `exportVersion`, `lastExportedAt` và `exportInvalidatedAt`. `AuditLogDTO` trả `id`, `actorUserId`, `action`, `entityType`, `entityId`, `oldValues`, `newValues`, `reason`, `requestId`, `createdAt`.

## 7. Đề xuất mở rộng schema (Future Schema Considerations)

*Không nằm trong schema hiện tại, ghi nhận để cân nhắc khi phát triển các phiên bản sau:*

- Thêm cột `effective_from` / `effective_to` vào `pricing_appendices` để hỗ trợ nhiều mức giá theo thời gian trong cùng 1 hợp đồng.
- Nếu cần phân quyền nhiều role cho một tài khoản, tách `roles` và `user_roles` thay cho `users.role`.
