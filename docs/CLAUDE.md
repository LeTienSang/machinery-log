# CLAUDE.md — Bản đồ chỉ đường dự án MACHINERY-LOG

> File này là **điểm vào đầu tiên** cho AI/Claude khi làm việc trong repo `machinery-log`.
> Mục đích: giúp AI biết **nên đọc file tài liệu nào** trước khi trả lời hoặc code, tránh suy đoán sai kiến trúc/nghiệp vụ đã được chốt.
> **Quy tắc bắt buộc:** trước khi thực hiện bất kỳ tác vụ nào bên dưới, AI phải mở và đọc file `.md` tương ứng được chỉ định — không dựa vào phỏng đoán hoặc kiến thức chung.

---

## 1. Tổng quan dự án (đọc nhanh)

**MACHINERY-LOG** là hệ thống số hóa nhật ký vận hành máy móc thi công: Operator chụp ảnh sổ nhật ký viết tay → AI OCR (Gemini) trích xuất dữ liệu → Accountant duyệt → hệ thống tự động xuất 3 báo cáo Excel (bảng tổng hợp giờ làm, biên bản bàn giao & nghiệm thu, biên bản đối chiếu công nợ).

Stack: **ReactJS + TypeScript + TailwindCSS + Shadcn/ui** (Frontend) — **Java 21 + Spring Boot 3 + Apache POI** (Backend) — **PostgreSQL** (Database) — **Gemini Flash API** (OCR).

---

## 2. Bản đồ tài liệu (Document Map)

| Khi cần... | Đọc file | Nội dung chính trong file |
|---|---|---|
| Hiểu **mục tiêu sản phẩm**, đối tượng người dùng, use case, phạm vi trong/ngoài scope | **`PRD.md`** | Bối cảnh, mục tiêu theo từng vai trò (Operator/Accountant), danh sách use case, luồng nghiệp vụ tổng quan, hạn chế hiện tại, roadmap tương lai |
| Hiểu **kiến trúc hệ thống**, cách các tầng/service tương tác, auth, lưu trữ file | **`ARCHITECTURE.md`** | Sơ đồ kiến trúc, phân tầng Backend (Controller→Service→Repository→Entity), phân tầng Frontend, xác thực JWT & phân quyền RBAC, chiến lược lưu ảnh (object storage), các ADR quan trọng, biến môi trường & cổng mặc định |
| Thiết kế/sửa **schema database**, thêm bảng, hiểu ràng buộc dữ liệu, công thức tính toán | **`DATABASE.md`** | Chi tiết 10 bảng PostgreSQL, quan hệ ERD, ràng buộc toàn vẹn dữ liệu, state machine nghiệm thu, migration, locking và mapping Entity/DTO |
| Viết/sửa **endpoint API**, biết payload/response/mã lỗi chuẩn | **`API_SPEC.md`** | Toàn bộ endpoint REST theo nhóm (Auth, OCR, Daily Logs, Danh mục, Nghiệm thu, Công nợ, Export), DTO mẫu, bảng mã lỗi (`errorCode`), quy tắc chung (phân trang, định dạng ngày...) |
| Xây dựng **giao diện UI**, chọn màu/font/component, bố cục màn hình | **`UI-DESIGN.md`** | Nguyên tắc thiết kế (sáng - đơn giản - dễ nhìn - dễ dùng), bảng màu & typography, layout tổng thể, wireframe mô tả từng màn hình chính, component library, trạng thái phản hồi (loading/error/empty) |
| Biết **quy ước code, naming, git, phân quyền, checklist trước commit** | **`PROJECT-RULES.md`** | Naming convention (DB/Backend/Frontend/API), phân quyền theo vai trò, giới hạn hệ thống, quy ước Git & commit message, quy ước comment, checklist trước khi commit/PR |

---

## 3. Quy tắc điều hướng khi thực hiện tác vụ (Routing Rules)

Dùng bảng dưới để xác định **thứ tự file cần đọc** tương ứng với loại yêu cầu:

| Loại yêu cầu | Thứ tự đọc file bắt buộc |
|---|---|
| Thêm/sửa tính năng nghiệp vụ mới (VD: thêm loại báo cáo) | `PRD.md` → `DATABASE.md` → `API_SPEC.md` → `ARCHITECTURE.md` → `PROJECT-RULES.md` |
| Thêm/sửa endpoint API | `API_SPEC.md` → `DATABASE.md` (nếu đụng schema) → `PROJECT-RULES.md` (naming/quy ước) |
| Thêm/sửa bảng, cột, migration | `DATABASE.md` → `ARCHITECTURE.md` (mục ADR liên quan) → cập nhật lại `DATABASE.md` sau khi đổi |
| Xây dựng màn hình/component Frontend mới | `UI-DESIGN.md` → `PRD.md` (use case liên quan) → `API_SPEC.md` (dữ liệu cần gọi) |
| Review/refactor code, mở PR | `PROJECT-RULES.md` (naming, checklist commit) trước tiên |
| Câu hỏi về vai trò/phân quyền | `PROJECT-RULES.md` (mục phân quyền) + `ARCHITECTURE.md` (mục xác thực & phân quyền) |
| Câu hỏi về giới hạn hệ thống (dung lượng ảnh, timeout OCR...) | `PROJECT-RULES.md` (mục giới hạn hệ thống) |
| Không chắc bắt đầu từ đâu | Đọc `PRD.md` trước để hiểu bối cảnh tổng thể, sau đó rẽ theo bảng trên |

**Nguyên tắc vàng:** Nếu 1 tác vụ động chạm tới nhiều tài liệu (VD: thêm tính năng mới vừa đổi DB vừa đổi API vừa đổi UI), AI phải đọc **đủ tất cả** file liên quan trước khi bắt đầu code, không chỉ đọc 1 file rồi suy đoán phần còn lại.

---

## 4. Nguyên tắc cập nhật tài liệu (Documentation Sync Rule)

- Khi thay đổi **schema DB** → phải cập nhật `DATABASE.md` trong cùng PR.
- Khi thêm/sửa **endpoint API** → phải cập nhật `API_SPEC.md` trong cùng PR.
- Khi thay đổi **layout/component/màu sắc chuẩn** → phải cập nhật `UI-DESIGN.md`.
- Khi có **quyết định kiến trúc mới** (ADR) → bổ sung vào `ARCHITECTURE.md` mục 6, không tạo file rời rạc khác.
- Khi thay đổi **quy ước code/git/phân quyền** → cập nhật `PROJECT-RULES.md`.
- **Không để tài liệu lệch với code thực tế** — tài liệu lệch code còn nguy hiểm hơn không có tài liệu, vì AI sẽ tin sai.

---

## 5. Những điều KHÔNG được suy đoán (Non-negotiables)

AI **không được tự suy đoán** các điều sau — luôn phải tra cứu đúng file:

- Công thức tính giờ công, VAT, công nợ → tra `DATABASE.md` mục 4.
- Cấu trúc response chuẩn & mã lỗi API → tra `API_SPEC.md`.
- Vai trò nào được gọi endpoint nào → tra `PROJECT-RULES.md` mục 3 + `API_SPEC.md` (cột Role).
- Màu sắc/trạng thái hiển thị trên UI → tra `UI-DESIGN.md` mục 2.
- Cách lưu trữ ảnh nhật ký gốc → tra `ARCHITECTURE.md` mục 5.

---

## 6. Danh sách file tài liệu đầy đủ

```
docs/
├── CLAUDE.md            ← bạn đang ở đây (bản đồ chỉ đường)
├── PRD.md                 (mục tiêu sản phẩm & use case)
├── ARCHITECTURE.md        (kiến trúc hệ thống & quyết định kỹ thuật)
├── DATABASE.md            (schema & quy tắc dữ liệu)
├── API_SPEC.md            (đặc tả API)
├── UI-DESIGN.md           (thiết kế giao diện)
└── PROJECT-RULES.md       (quy ước & quy tắc phát triển)
```
