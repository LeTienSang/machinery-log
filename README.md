# MACHINERY-LOG

Hệ thống số hóa nhật ký vận hành máy móc: Operator nhập nhật ký từ ảnh, Accountant duyệt và hệ thống chuẩn bị dữ liệu cho nghiệm thu, công nợ và báo cáo Excel.

## Công nghệ

- Backend: Java 21, Spring Boot 3, PostgreSQL, Flyway.
- Frontend: React, TypeScript, Vite.
- Local infrastructure: PostgreSQL và MinIO qua Docker Compose.

## Yêu cầu hệ thống

Trước khi bắt đầu, kiểm tra các công cụ sau đã cài đặt:

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---------|---------------------|----------|
| JDK | 21 | `java -version` |
| Maven | 3.8+ | `mvn -version` |
| Node.js | 22+ | `node -version` |
| npm | 10+ | `npm -version` |
| Docker Desktop / Docker Compose | 2.0+ | `docker compose version` |

## Chạy local

### Bước 1: Khởi động PostgreSQL và MinIO

```powershell
docker compose up -d
```

Kiểm tra containers đang chạy:

```powershell
docker compose ps
```

Kết quả mong đợi: 2 containers `postgres` và `minio` với status `Up`.

### Bước 2: Cấu hình Backend

Tạo file `.env` từ template:

```powershell
cd backend
Copy-Item .env.example .env
```

Mở file `backend/.env` và thay đổi `JWT_SECRET`:

```bash
# Generate JWT secret (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Hoặc dùng chuỗi ngẫu nhiên tối thiểu 32 ký tự
JWT_SECRET=your-super-secret-key-min-32-chars-1234567890abcdef
```

**Quan trọng:** Đổi `GEMINI_API_KEY` nếu muốn test OCR. Để mặc định `replace-me` vẫn chạy được (fallback mode).

### Bước 3: Chạy Backend

Ở terminal thứ nhất:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE = "local"
mvn spring-boot:run
```

Chờ đến khi thấy log:
```
Started MachineryLogApplication in X.XXX seconds
```

Kiểm tra health:
```powershell
curl http://localhost:8080/api/v1/health
```

### Bước 4: Chạy Frontend

Mở terminal thứ hai:

```powershell
cd frontend
npm ci
npm run dev
```

Chờ đến khi thấy:
```
VITE v7.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Bước 5: Truy cập ứng dụng

Mở trình duyệt: **http://localhost:5173**

| Service | URL | Mô tả |
|---------|-----|-------|
| **Frontend** | http://localhost:5173 | Giao diện chính |
| **Backend API** | http://localhost:8080 | REST API |
| **Health Check** | http://localhost:8080/api/v1/health | Trạng thái hệ thống |
| **PostgreSQL** | localhost:5432 | Database (user: `machinery_log`, password: `machinery_log`) |
| **MinIO Console** | http://localhost:9001 | Object storage UI (user: `machinery-log`, password: `machinery-log-local`) |
| **MinIO API** | http://localhost:9000 | S3-compatible API |

## Tài khoản mẫu (Profile `local`)

Khi chạy với `$env:SPRING_PROFILES_ACTIVE = "local"`, hệ thống tự khởi tạo 2 tài khoản dev:

| Tài khoản | Mật khẩu mặc định | Vai trò | Quyền hạn |
|---|---|---|---|
| `operator` | `operator-local-change-me` | OPERATOR | Upload nhật ký, xem log của mình |
| `accountant` | `accountant-local-change-me` | ACCOUNTANT_ADMIN | Toàn quyền: Duyệt log, Quản lý danh mục, Công nợ, Xuất báo cáo, Audit log |

*(Mật khẩu có thể ghi đè qua biến môi trường `DEV_OPERATOR_PASSWORD` và `DEV_ACCOUNTANT_PASSWORD`).*

## Troubleshooting

### Port đã bị chiếm

Nếu gặp lỗi `port already in use`:

```powershell
# Kiểm tra process đang dùng port
netstat -ano | findstr :5432   # PostgreSQL
netstat -ano | findstr :9000   # MinIO API
netstat -ano | findstr :9001   # MinIO Console
netstat -ano | findstr :8080   # Backend
netstat -ano | findstr :5173   # Frontend

# Dừng process hoặc đổi port trong docker-compose.yml / backend application.properties / frontend vite.config.ts
```

### Docker container không start

```powershell
# Kiểm tra logs
docker compose logs postgres
docker compose logs minio

# Restart containers
docker compose down
docker compose up -d
```

### Backend không connect database

Kiểm tra:
1. Container `postgres` đã chạy: `docker compose ps`
2. File `backend/.env` có đúng thông tin kết nối
3. PostgreSQL port 5432 không bị chặn bởi firewall

### Frontend không gọi được API (CORS)

Kiểm tra `backend/.env`:
```
FRONTEND_ORIGIN=http://localhost:5173
```

Phải khớp với URL frontend thực tế.

### Lỗi "JWT secret too short"

`JWT_SECRET` trong `backend/.env` phải tối thiểu 32 ký tự. Generate lại:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### OCR không hoạt động

Nếu `GEMINI_API_KEY=replace-me`, OCR sẽ chạy ở fallback mode (trả dữ liệu mẫu có thể edit). Để dùng OCR thật:
1. Lấy API key tại https://aistudio.google.com/apikey
2. Cập nhật `GEMINI_API_KEY` trong `backend/.env`
3. Restart backend

## Dừng và dọn dẹp

```powershell
# Dừng backend/frontend: Ctrl+C trong terminal tương ứng

# Dừng Docker containers
docker compose down

# Xóa data để reset database/MinIO (cẩn thận!)
docker compose down -v
```

## Kiểm tra

```powershell
# Test backend
cd backend
mvn test

# Build frontend
cd ../frontend
npm run build
```

## Tài liệu

API contract, schema database, kiến trúc và kế hoạch triển khai nằm trong thư mục `docs/`:

- `docs/CLAUDE.md` — Bản đồ chỉ đường cho AI/developer
- `docs/PRD.md` — Product Requirement Document
- `docs/ARCHITECTURE.md` — Kiến trúc hệ thống
- `docs/DATABASE.md` — Schema database
- `docs/API_SPEC.md` — Đặc tả REST API
- `docs/UI-DESIGN.md` — Thiết kế giao diện
- `docs/PROJECT-RULES.md` — Quy ước code & git
- `docs/PLAN.md` — Tiến độ triển khai
