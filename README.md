# MACHINERY-LOG

Hệ thống số hóa nhật ký vận hành máy móc: Operator nhập nhật ký từ ảnh, Accountant duyệt và hệ thống chuẩn bị dữ liệu cho nghiệm thu, công nợ và báo cáo Excel.

## Công nghệ

- Backend: Java 21, Spring Boot 3, PostgreSQL, Flyway.
- Frontend: React, TypeScript, Vite.
- Local infrastructure: PostgreSQL và MinIO qua Docker Compose.

## Chạy local

Yêu cầu: JDK 21, Maven, Node.js 22+, npm và Docker Compose.

1. Khởi động PostgreSQL và MinIO:

	```powershell
	docker compose up -d
	```

2. Tạo cấu hình backend từ `backend/.env.example`, sau đó đặt `JWT_SECRET` là chuỗi bí mật tối thiểu 32 ký tự. Khi chạy local, có thể bật profile `local` để tạo user dev.

3. Chạy backend:

	```powershell
	cd backend
	$env:SPRING_PROFILES_ACTIVE = "local"
	mvn spring-boot:run
	```

4. Chạy frontend ở terminal khác:

	```powershell
	cd frontend
	npm ci
	npm run dev
	```

Frontend mặc định ở `http://localhost:5173`, backend ở `http://localhost:8080`.

## Tài khoản mẫu (Profile `local`)

Khi chạy với `$env:SPRING_PROFILES_ACTIVE = "local"`, hệ thống tự khởi tạo 2 tài khoản dev:

| Tài khoản | Mật khẩu mặc định | Vai trò | Quyền hạn |
|---|---|---|---|
| `operator` | `operator-local-change-me` | OPERATOR | Upload nhật ký, xem log của mình |
| `accountant` | `accountant-local-change-me` | ACCOUNTANT_ADMIN | Toàn quyền: Duyệt log, Quản lý danh mục, Công nợ, Xuất báo cáo, Audit log |

*(Mật khẩu có thể ghi đè qua biến môi trường `DEV_OPERATOR_PASSWORD` và `DEV_ACCOUNTANT_PASSWORD`).*

## Health check & Actuator

- Health endpoint: `http://localhost:8080/actuator/health`

## Kiểm tra

```powershell
cd backend
mvn test
cd ../frontend
npm run build
```

API contract và kế hoạch triển khai nằm trong thư mục `docs/`.
