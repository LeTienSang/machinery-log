# API_SPEC — MACHINERY-LOG (Digital Logbook)

> Đặc tả chi tiết REST API. Tất cả endpoint nghiệp vụ nằm dưới prefix `/api/v1`.
> Response chuẩn hóa theo cấu trúc (xem PROJECT-RULES.md mục 4):
> ```json
> { "success": true, "data": {}, "message": "", "errorCode": null }
> ```

---

## 0. Xác thực

| Method | Endpoint | Mô tả | Payload |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Đăng nhập, trả về access token + refresh token | `{ "username": "", "password": "" }` |
| POST | `/api/v1/auth/refresh` | Làm mới access token | `{ "refreshToken": "" }` |
| POST | `/api/v1/auth/logout` | Thu hồi refresh token hiện tại | — (Bearer token) |

Mọi endpoint bên dưới (trừ mục 0) yêu cầu header:
```
Authorization: Bearer <access_token>
```

---

## 1. OCR — Trích xuất dữ liệu từ ảnh nhật ký

### `POST /api/v1/ocr/process-log`
Upload ảnh nhật ký viết tay → gọi Gemini API trích xuất dữ liệu có cấu trúc.

- **Role:** `OPERATOR`, `ACCOUNTANT_ADMIN`
- **Content-Type:** `multipart/form-data`

**Payload:**
| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| file | File (jpg/png/heic, ≤10MB) | ✔ | Ảnh nhật ký |
| contractId | Long | ✔ | ID hợp đồng |
| equipmentId | Long | ✔ | ID thiết bị |
| workDate | Date (`YYYY-MM-DD`) | ✔ | Ngày làm việc trên nhật ký |
| operatorId | Long | Điều kiện | Bắt buộc khi `ACCOUNTANT_ADMIN` upload thay Operator; với `OPERATOR`, backend lấy từ JWT |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dailyLogId": 1023,
    "workDate": "2026-07-15",
    "morningStartTime": "07:00",
    "morningEndTime": "11:30",
    "afternoonStartTime": "13:00",
    "afternoonEndTime": "17:00",
    "eveningStartTime": null,
    "eveningEndTime": null,
    "operatingHours": 8.5,
    "standbyHours": 0.0,
    "workDescription": "Đào móng khu A",
    "operatorName": "Nguyễn Văn A",
    "originalImageUrl": "https://storage.../logs/1/1023/uuid.jpg",
    "approvalStatus": "PENDING"
  },
  "message": "OCR processed successfully",
  "errorCode": null
}
```

**Lỗi có thể xảy ra:**
| errorCode | HTTP Status | Mô tả |
|---|---|---|
| `FILE_TOO_LARGE` | 400 | Ảnh vượt quá 10MB |
| `INVALID_FILE_TYPE` | 400 | Không phải định dạng ảnh hỗ trợ |
| `CONTRACT_NOT_FOUND` | 404 | contractId không tồn tại |
| `EQUIPMENT_NOT_FOUND` | 404 | equipmentId không tồn tại |
| `OCR_SERVICE_TIMEOUT` | 504 | Gemini API không phản hồi trong 30s |
| `OCR_SERVICE_ERROR` | 502 | Gemini API trả lỗi hoặc không đọc được nội dung |

---

## 2. Daily Logs — Nhật ký hàng ngày

### `POST /api/v1/daily-logs/batch-save`
Lưu danh sách log đã được Accountant review/sửa (chưa duyệt).

- **Role:** `ACCOUNTANT_ADMIN`
- **Payload:** `List<DailyLogDTO>`
```json
[
  {
    "id": 1023,
    "workDate": "2026-07-15",
    "morningStartTime": "07:00",
    "morningEndTime": "11:30",
    "afternoonStartTime": "13:00",
    "afternoonEndTime": "17:00",
    "eveningStartTime": null,
    "eveningEndTime": null,
    "operatingHours": 8.5,
    "standbyHours": 0.0,
    "workDescription": "Đào móng khu A",
    "operatorName": "Nguyễn Văn A"
  }
]
```
**Response (200):** danh sách `DailyLogDTO` đã lưu, giữ nguyên `approvalStatus` hiện tại (không tự động chuyển sang APPROVED).

`DailyLogDTO` bổ sung các trường `operatorId`, `operatorName`, `reviewerId`, `reviewerName` và `rejectionReason` bên cạnh các trường log hiện có. `reopenReason` chỉ thuộc request DTO của endpoint reopen, không phải trường lưu trực tiếp trên `daily_logs`. `UserDTO` chỉ trả `id`, `username`, `displayName`, `role`, `active`; không bao giờ trả `passwordHash`.

---

### `GET /api/v1/daily-logs`
Lấy danh sách nhật ký theo hợp đồng và tháng.

- **Role:** `OPERATOR` (chỉ xem log của mình), `ACCOUNTANT_ADMIN` (xem toàn bộ)
- **Query params:**

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| contractId | Long | ✔ | ID hợp đồng |
| month | String (`YYYY-MM`) | ✔ | Tháng cần lọc |
| equipmentId | Long | ✘ | Lọc thêm theo thiết bị |
| approvalStatus | String | ✘ | `PENDING` / `APPROVED` / `REJECTED` |

**Ví dụ:** `GET /api/v1/daily-logs?contractId=1&month=2026-07`

**Response (200):** `data` là mảng `DailyLogDTO`, kèm `originalImageUrl` để hiển thị song song trên Review UI.

---

### `GET /api/v1/daily-logs/{id}`
Lấy chi tiết 1 bản ghi log (kèm ảnh gốc).

- **Role:** `OPERATOR` (chỉ log của mình), `ACCOUNTANT_ADMIN`

---

### `PUT /api/v1/daily-logs/{id}/approve`
Duyệt hoặc từ chối 1 bản ghi log cụ thể — chuyển trạng thái từ `PENDING` sang `APPROVED` hoặc `REJECTED`.

- **Role:** `ACCOUNTANT_ADMIN`
- **Payload:** `DailyLogDTO` (bao gồm trường quyết định trạng thái)
```json
{
  "approvalStatus": "APPROVED"
}
```
hoặc
```json
{
  "approvalStatus": "REJECTED",
  "rejectionReason": "Giờ ghi không khớp ảnh gốc"
}
```

**Lỗi có thể xảy ra:**
| errorCode | HTTP Status | Mô tả |
|---|---|---|
| `LOG_NOT_FOUND` | 404 | id không tồn tại |
| `LOG_ALREADY_APPROVED` | 409 | Log đã ở trạng thái APPROVED, không cho duyệt lại trực tiếp (cần quy trình reopen) |
| `INVALID_APPROVAL_STATUS` | 400 | Giá trị approvalStatus không hợp lệ |
| `REJECTION_REASON_REQUIRED` | 400 | Bắt buộc nhập lý do khi từ chối |

### `POST /api/v1/daily-logs/{id}/reopen`
Mở lại log đã `APPROVED` hoặc `REJECTED` để Accountant chỉnh sửa và review lại.

- **Role:** `ACCOUNTANT_ADMIN`
- **Payload:**
```json
{
  "reopenReason": "Bổ sung giờ làm theo ảnh gốc"
}
```
- **Quy tắc:** chỉ cho phép `APPROVED → PENDING` hoặc `REJECTED → PENDING`; bắt buộc `reopenReason`; cập nhật `reviewerId` là người reopen; không xóa `originalImageUrl`; log không được tính vào export khi đang `PENDING`.
- Nếu log thuộc kỳ đã có `monthly_acceptances`, endpoint đồng thời chuyển acceptance sang `NEEDS_RECALCULATION`, set `exportInvalidatedAt` và ghi audit. Các export version cũ của kỳ đó không còn giá trị nghiệp vụ.
- **Response (200):** `DailyLogDTO` với `approvalStatus = "PENDING"`.

**Lỗi có thể xảy ra:**
| `LOG_NOT_FOUND` | 404 | id không tồn tại |
| `LOG_NOT_REOPENABLE` | 409 | Log không ở trạng thái APPROVED hoặc REJECTED |
| `REOPEN_REASON_REQUIRED` | 400 | Thiếu lý do mở lại |

---

## 3. Danh mục — Customers / Equipment / Contracts / Pricing Appendices

### 3.1. Customers

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/customers` | ACCOUNTANT_ADMIN | Danh sách khách hàng (hỗ trợ `?search=`) |
| GET | `/api/v1/customers/{id}` | ACCOUNTANT_ADMIN | Chi tiết khách hàng |
| POST | `/api/v1/customers` | ACCOUNTANT_ADMIN | Tạo khách hàng mới |
| PUT | `/api/v1/customers/{id}` | ACCOUNTANT_ADMIN | Cập nhật khách hàng |
| DELETE | `/api/v1/customers/{id}` | ACCOUNTANT_ADMIN | Xóa khách hàng (chỉ khi không có hợp đồng liên quan) |

**CustomerDTO:**
```json
{
  "id": 1,
  "companyName": "Công ty TNHH Xây dựng ABC",
  "taxCode": "0312345678",
  "representativeName": "Trần Văn B",
  "position": "Giám đốc",
  "phoneNumber": "0909xxxxxx",
  "address": "123 Đường X, Quận Y, TP.HCM"
}
```

### 3.2. Equipment

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/equipment` | ACCOUNTANT_ADMIN, OPERATOR | Danh sách thiết bị |
| GET | `/api/v1/equipment/{id}` | ACCOUNTANT_ADMIN, OPERATOR | Chi tiết thiết bị |
| POST | `/api/v1/equipment` | ACCOUNTANT_ADMIN | Tạo thiết bị mới |
| PUT | `/api/v1/equipment/{id}` | ACCOUNTANT_ADMIN | Cập nhật thiết bị |
| DELETE | `/api/v1/equipment/{id}` | ACCOUNTANT_ADMIN | Xóa thiết bị (chỉ khi không có log/phụ lục liên quan) |

### 3.3. Contracts

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/contracts` | ACCOUNTANT_ADMIN | Danh sách hợp đồng (hỗ trợ `?status=`, `?customerId=`) |
| GET | `/api/v1/contracts/{id}` | ACCOUNTANT_ADMIN | Chi tiết hợp đồng |
| POST | `/api/v1/contracts` | ACCOUNTANT_ADMIN | Tạo hợp đồng mới |
| PUT | `/api/v1/contracts/{id}` | ACCOUNTANT_ADMIN | Cập nhật hợp đồng |
| PUT | `/api/v1/contracts/{id}/status` | ACCOUNTANT_ADMIN | Đổi trạng thái (`ACTIVE`/`EXPIRED`/`TERMINATED`) |

### 3.4. Pricing Appendices

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/contracts/{contractId}/pricing-appendices` | ACCOUNTANT_ADMIN | Danh sách đơn giá theo hợp đồng |
| POST | `/api/v1/contracts/{contractId}/pricing-appendices` | ACCOUNTANT_ADMIN | Thêm đơn giá cho 1 thiết bị trong hợp đồng |
| PUT | `/api/v1/pricing-appendices/{id}` | ACCOUNTANT_ADMIN | Cập nhật đơn giá |
| DELETE | `/api/v1/pricing-appendices/{id}` | ACCOUNTANT_ADMIN | Xóa đơn giá (chỉ khi chưa phát sinh nghiệm thu liên quan) |

---

## 4. Monthly Acceptances — Biên bản nghiệm thu

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/monthly-acceptances` | ACCOUNTANT_ADMIN | Danh sách biên bản nghiệm thu (`?contractId=&month=`), gồm cả `NEEDS_RECALCULATION` |
| GET | `/api/v1/monthly-acceptances/{id}` | ACCOUNTANT_ADMIN | Chi tiết 1 biên bản |
| PUT | `/api/v1/monthly-acceptances/{id}/sign` | ACCOUNTANT_ADMIN | Đánh dấu `status = SIGNED` sau khi khách hàng ký giấy |

**Ghi chú:** bản ghi `monthly_acceptances` được **tự động sinh** khi gọi `/api/v1/export/report-set` (mục 6), không có endpoint tạo thủ công. Database bảo vệ không cho trùng `(contractId, equipmentId, billingMonth)`.

State machine của acceptance: `PENDING_SIGNATURE → SIGNED`; khi một daily log thuộc kỳ đã export bị reopen, `PENDING_SIGNATURE` hoặc `SIGNED → NEEDS_RECALCULATION`; chỉ lần calculate/export thành công mới chuyển `NEEDS_RECALCULATION → PENDING_SIGNATURE`.

`MonthlyAcceptanceDTO` gồm thêm `exportVersion`, `lastExportedAt` và `exportInvalidatedAt`. Khi ở `NEEDS_RECALCULATION`, UI không được cho tải lại export version cũ.

### Audit Logs

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/audit-logs` | ACCOUNTANT_ADMIN | Tra cứu audit theo `entityType`, `entityId`, `actorUserId`, `action`, `from`, `to` |

Audit API chỉ đọc; không có endpoint sửa/xóa. `oldValues` và `newValues` trả JSON object từ PostgreSQL JSONB, không chứa password/token.

---

## 5. Advance Payments & Debt Reconciliation

### 5.1. Advance Payments

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/contracts/{contractId}/advance-payments` | ACCOUNTANT_ADMIN | Danh sách tạm ứng theo hợp đồng |
| POST | `/api/v1/contracts/{contractId}/advance-payments` | ACCOUNTANT_ADMIN | Ghi nhận 1 khoản tạm ứng mới |
| DELETE | `/api/v1/advance-payments/{id}` | ACCOUNTANT_ADMIN | Xóa/hủy 1 khoản tạm ứng (chỉ khi chưa đưa vào đối chiếu công nợ) |

### 5.2. Debt Reconciliation

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/contracts/{contractId}/debt-reconciliations` | ACCOUNTANT_ADMIN | Lịch sử đối chiếu công nợ của hợp đồng |
| POST | `/api/v1/contracts/{contractId}/debt-reconciliations` | ACCOUNTANT_ADMIN | Tạo bản đối chiếu công nợ mới cho kỳ hiện tại |
| PUT | `/api/v1/debt-reconciliations/{id}/status` | ACCOUNTANT_ADMIN | Cập nhật trạng thái (`RECONCILED`) |

**Logic khi POST tạo mới:**
1. Lấy `remaining_balance` của bản ghi gần nhất (theo `contractId`) làm `previous_balance`.
2. Tổng hợp `current_period_acceptance` từ các `monthly_acceptances` trong kỳ chưa được đối chiếu.
3. Tổng hợp `total_paid` từ `advance_payments` trong kỳ.
4. Tính `remaining_balance = previous_balance + current_period_acceptance - total_paid`.

---

## 6. Export — Xuất báo cáo Excel

### `GET /api/v1/export/report-set`
Xuất bộ 3 báo cáo Excel (Bảng tổng hợp giờ làm, Biên bản bàn giao & nghiệm thu, Biên bản đối chiếu công nợ) dưới dạng file ZIP.

- **Role:** `ACCOUNTANT_ADMIN`
- **Query params:**

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| contractId | Long | ✔ | ID hợp đồng cần xuất báo cáo |
| month | String (`YYYY-MM`) | ✔ | Tháng billing |

**Ví dụ:** `GET /api/v1/export/report-set?contractId=1&month=2026-07`

**Response (200):**
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="report-set_contract1_2026-07.zip"`
- Nội dung ZIP gồm 3 file:
  - `bang-tong-hop-gio-lam_2026-07.xlsx`
  - `bien-ban-ban-giao-nghiem-thu_2026-07.xlsx`
  - `bien-ban-doi-chieu-cong-no_2026-07.xlsx`

**Quy trình xử lý phía Backend:**
1. Mở transaction và lấy pessimistic write lock trên `Contract`, sau đó lock `MonthlyAcceptance` hiện hữu của từng thiết bị trong kỳ.
2. Kiểm tra hợp đồng tồn tại và có ít nhất 1 `daily_log` với `approvalStatus = APPROVED` trong tháng.
3. Nếu chưa có acceptance hoặc acceptance là `NEEDS_RECALCULATION`, tính lại và tăng `exportVersion`; nếu acceptance còn hợp lệ thì dùng lại bản ghi hiện tại.
4. Đổ dữ liệu vào 3 template `.xlsx` tương ứng qua Apache POI.
5. Cập nhật `lastExportedAt`, ghi audit `EXPORT_CREATED`, nén 3 file vào ZIP và trả về client dưới dạng stream.

**Lỗi có thể xảy ra:**
| errorCode | HTTP Status | Mô tả |
|---|---|---|
| `CONTRACT_NOT_FOUND` | 404 | contractId không tồn tại |
| `NO_APPROVED_LOGS` | 400 | Không có log nào đã APPROVED trong tháng để xuất báo cáo |
| `EXCEL_GENERATION_ERROR` | 500 | Lỗi khi đổ dữ liệu vào template Excel |
| `RESOURCE_LOCK_TIMEOUT` | 409 | Không lấy được pessimistic lock để tính nghiệm thu/export |

**Query param mở rộng (tùy chọn):**
| Param | Kiểu | Mô tả |
|---|---|---|
| recalculate | Boolean | Nếu `true`, tính lại `monthly_acceptances`; bắt buộc khi acceptance có `NEEDS_RECALCULATION` (server vẫn kiểm tra trạng thái, không tin cậy flag từ client) |

---

## 7. Bảng tổng hợp tất cả Endpoint (Tóm tắt)

| Method | Endpoint | Nhóm |
|---|---|---|
| POST | `/api/v1/auth/login` | Auth |
| POST | `/api/v1/auth/refresh` | Auth |
| POST | `/api/v1/auth/logout` | Auth |
| POST | `/api/v1/ocr/process-log` | OCR |
| POST | `/api/v1/daily-logs/batch-save` | Daily Logs |
| GET | `/api/v1/daily-logs` | Daily Logs |
| GET | `/api/v1/daily-logs/{id}` | Daily Logs |
| PUT | `/api/v1/daily-logs/{id}/approve` | Daily Logs |
| POST | `/api/v1/daily-logs/{id}/reopen` | Daily Logs |
| GET/POST/PUT/DELETE | `/api/v1/customers[...]` | Danh mục |
| GET/POST/PUT/DELETE | `/api/v1/equipment[...]` | Danh mục |
| GET/POST/PUT | `/api/v1/contracts[...]` | Danh mục |
| GET/POST/PUT/DELETE | `/api/v1/contracts/{contractId}/pricing-appendices[...]` | Danh mục |
| GET | `/api/v1/monthly-acceptances` | Nghiệm thu |
| PUT | `/api/v1/monthly-acceptances/{id}/sign` | Nghiệm thu |
| GET | `/api/v1/audit-logs` | Audit |
| GET/POST/DELETE | `/api/v1/contracts/{contractId}/advance-payments[...]` | Công nợ |
| GET/POST/PUT | `/api/v1/contracts/{contractId}/debt-reconciliations[...]` | Công nợ |
| GET | `/api/v1/export/report-set` | Export |

---

## 8. Quy tắc chung áp dụng cho toàn bộ API

- Toàn bộ endpoint ghi dữ liệu (POST/PUT/DELETE) đều yêu cầu xác thực JWT hợp lệ và kiểm tra role tương ứng.
- Toàn bộ số tiền trong request/response là số nguyên hoặc thập phân dạng chuỗi/number chuẩn JSON, backend luôn xử lý bằng `BigDecimal`.
- Ngày dùng định dạng ISO `YYYY-MM-DD`; tháng billing dùng `YYYY-MM`.
- Danh sách (GET nhiều bản ghi) hỗ trợ phân trang qua `?page=&size=` (mặc định `page=0&size=20`) — áp dụng cho các danh mục có thể lớn dần theo thời gian (`daily-logs`, `customers`, `contracts`).
- Lỗi hệ thống không rõ nguyên nhân trả `errorCode: "INTERNAL_SERVER_ERROR"`, HTTP 500, không lộ chi tiết stack trace ra response.
