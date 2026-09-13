# UI-DESIGN — MACHINERY-LOG (Digital Logbook)

> Tài liệu thiết kế giao diện: định hướng phong cách, hệ thống màu/typography, layout tổng thể và wireframe mô tả cho từng màn hình chính.
> Nguyên tắc xuyên suốt: **sáng — đơn giản — dễ nhìn — dễ sử dụng**, phù hợp người dùng không rành công nghệ (Operator ngoài công trường) lẫn người dùng văn phòng (Kế toán).

---

## 1. Định hướng thiết kế (Design Principles)

1. **Sáng & sạch (Light & Clean):** nền trắng/xám rất nhạt làm chủ đạo, không dùng dark mode ở v1 — ưu tiên độ tương phản cao để dễ đọc số liệu, kể cả ngoài trời nắng (Operator dùng ngoài công trường).
2. **Đơn giản (Simple):** mỗi màn hình chỉ tập trung 1 tác vụ chính; hạn chế tối đa số bước để hoàn thành 1 hành động (VD: upload ảnh chỉ 3 bước: chọn hợp đồng/thiết bị → chọn ảnh → gửi).
3. **Dễ nhìn (Legible):** cỡ chữ tối thiểu 14px cho nội dung, 16-18px cho số liệu quan trọng (giờ công, tổng tiền); độ tương phản chữ/nền đạt chuẩn WCAG AA trở lên.
4. **Dễ sử dụng (Usable):** nút bấm lớn, dễ chạm (đặc biệt trên mobile/tablet ngoài công trường); trạng thái luôn hiển thị rõ ràng bằng màu + nhãn (badge), không chỉ dựa vào màu sắc đơn thuần (color-blind friendly).
5. **Nhất quán:** dùng chung 1 design system (màu, spacing, component) giữa toàn bộ trang — không tự chế màu/kiểu riêng cho từng màn hình.
6. **Phản hồi tức thì:** mọi hành động (lưu, duyệt, export) đều có trạng thái loading/success/error rõ ràng, tránh người dùng bấm lặp lại.

---

## 2. Hệ thống màu sắc (Color System)

Theme sáng duy nhất (v1 không có dark mode).

| Vai trò | Tên biến | Mã màu (gợi ý) | Sử dụng |
|---|---|---|---|
| Nền chính | `--bg-base` | `#FFFFFF` | Nền trang chủ đạo |
| Nền phụ | `--bg-subtle` | `#F7F8FA` | Nền sidebar, nền card, nền bảng xen kẽ dòng |
| Viền / Chia tách | `--border` | `#E4E7EB` | Viền input, border card, đường kẻ bảng |
| Chữ chính | `--text-primary` | `#1A1D23` | Tiêu đề, nội dung chính |
| Chữ phụ | `--text-secondary` | `#6B7280` | Mô tả, label phụ, placeholder |
| Thương hiệu / Primary | `--brand-primary` | `#2563EB` (xanh dương) | Nút hành động chính, link, icon active |
| Primary hover | `--brand-primary-hover` | `#1D4ED8` | Hover/active state của nút chính |
| Thành công | `--success` | `#16A34A` (xanh lá) | Trạng thái `APPROVED`, `SIGNED`, `RECONCILED` |
| Cảnh báo / Chờ xử lý | `--warning` | `#D97706` (cam/vàng) | Trạng thái `PENDING`, `PENDING_SIGNATURE`, `PENDING_RECONCILIATION`, `NEEDS_RECALCULATION` |
| Nguy hiểm / Từ chối | `--danger` | `#DC2626` (đỏ) | Trạng thái `REJECTED`, lỗi, hành động xóa |
| Nền badge thành công | `--success-bg` | `#DCFCE7` | Nền badge trạng thái APPROVED |
| Nền badge cảnh báo | `--warning-bg` | `#FEF3C7` | Nền badge trạng thái PENDING |
| Nền badge nguy hiểm | `--danger-bg` | `#FEE2E2` | Nền badge trạng thái REJECTED |

**Nguyên tắc dùng màu trạng thái (Status Color Mapping):**

| Trạng thái | Màu chữ | Màu nền badge |
|---|---|---|
| PENDING / PENDING_SIGNATURE / PENDING_RECONCILIATION / NEEDS_RECALCULATION | `--warning` | `--warning-bg` |
| APPROVED / SIGNED / RECONCILED / ACTIVE | `--success` | `--success-bg` |
| REJECTED / TERMINATED | `--danger` | `--danger-bg` |
| EXPIRED | `--text-secondary` | `--bg-subtle` |

---

## 3. Typography

| Cấp độ | Font-size | Font-weight | Sử dụng |
|---|---|---|---|
| Display / Số liệu lớn | 28–32px | 700 (Bold) | Tổng tiền, tổng giờ công nổi bật trên dashboard |
| H1 — Tiêu đề trang | 24px | 700 | Tiêu đề đầu mỗi trang (VD: "Duyệt nhật ký") |
| H2 — Tiêu đề khối | 18px | 600 | Tiêu đề card, tiêu đề section |
| Body — Nội dung | 14–15px | 400 | Text thường, nội dung bảng |
| Label / Caption | 12–13px | 500 | Nhãn field, chú thích, timestamp |

**Font đề xuất:** Inter hoặc hệ font hỗ trợ tốt dấu tiếng Việt (Be Vietnam Pro là lựa chọn thay thế tối ưu cho tiếng Việt), sans-serif, dễ đọc trên cả màn hình nhỏ.

---

## 4. Spacing, Bo góc & Đổ bóng (Layout Tokens)

| Token | Giá trị | Sử dụng |
|---|---|---|
| Spacing base unit | 4px | Toàn bộ margin/padding là bội số của 4 (8, 12, 16, 24, 32) |
| Border-radius nhỏ | 6px | Input, badge, button nhỏ |
| Border-radius vừa | 10px | Card, modal |
| Shadow nhẹ | `0 1px 2px rgba(0,0,0,0.05)` | Card mặc định |
| Shadow nổi | `0 4px 12px rgba(0,0,0,0.08)` | Modal, dropdown, popover |
| Max content width | 1280px | Giới hạn chiều rộng nội dung chính trên desktop, căn giữa |

---

## 5. Layout tổng thể (Application Shell)

```
┌─────────────────────────────────────────────────────────────┐
│  Topbar: [Logo] MACHINERY-LOG      [Tên user ▾] [Đăng xuất]  │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│   Sidebar     │              Nội dung chính (Content)          │
│  (menu trái)  │                                               │
│  - Dashboard  │   [Breadcrumb / Tiêu đề trang]                │
│  - Upload     │   [Bộ lọc / Action bar]                        │
│  - Duyệt log  │   [Bảng dữ liệu / Card / Form]                 │
│  - Hợp đồng   │                                               │
│  - Khách hàng │                                               │
│  - Thiết bị   │                                               │
│  - Báo cáo    │                                               │
│  - Công nợ    │                                               │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

- **Sidebar:** cố định bên trái trên desktop (≥1024px), thu gọn thành bottom-nav hoặc menu hamburger trên mobile/tablet (Operator dùng ngoài công trường chủ yếu qua điện thoại).
- **Topbar:** luôn hiển thị tên người dùng + vai trò (Operator/Accountant) để tránh nhầm lẫn quyền hạn.
- **Nội dung chính:** luôn có tiêu đề trang rõ ràng (H1) + breadcrumb khi vào sâu (VD: Hợp đồng → HD-001 → Phụ lục đơn giá).
- **Responsive breakpoint:** Mobile `<768px` (Operator ngoài công trường), Tablet `768–1024px`, Desktop `≥1024px` (Accountant văn phòng).

**Điều hướng theo vai trò:**
- OPERATOR chỉ thấy menu: Dashboard (rút gọn), **Upload nhật ký**, **Log của tôi**.
- ACCOUNTANT_ADMIN thấy đầy đủ menu: Dashboard, Duyệt log, Hợp đồng, Khách hàng, Thiết bị, Báo cáo, Tạm ứng & Công nợ, Lịch sử thao tác.

---

## 6. Wireframe mô tả từng màn hình chính

### 6.1. Màn hình Upload nhật ký (Operator) — ưu tiên tối giản, thao tác nhanh

```
┌──────────────────────────────────┐
│  ← Upload nhật ký hôm nay          │
├──────────────────────────────────┤
│  Hợp đồng:      [Dropdown ▾]      │
│  Thiết bị:      [Dropdown ▾]      │
│  Ngày làm việc: [Date picker]     │
│                                    │
│  ┌──────────────────────────┐     │
│  │   📷 Chạm để chụp/chọn ảnh │     │
│  │      (kéo thả trên desktop)│    │
│  └──────────────────────────┘     │
│  [Preview ảnh đã chọn]             │
│                                    │
│         [ Gửi nhật ký ]  (nút lớn, │
│          full-width trên mobile)   │
└──────────────────────────────────┘
```
- Nút "Gửi nhật ký" chuyển trạng thái: `Đang gửi... → Đang xử lý OCR... → Đã gửi ✔` để Operator biết chắc thao tác thành công dù không rành công nghệ.
- Sau khi gửi, hiển thị toast: *"Nhật ký đã được gửi, đang chờ Kế toán duyệt."*

### 6.2. Màn hình "Log của tôi" (Operator)

```
┌──────────────────────────────────────────┐
│  Log của tôi              [Lọc theo tháng ▾]│
├──────────────────────────────────────────┤
│  15/07/2026  ●Đang chờ duyệt   [Xem ảnh]  │
│  14/07/2026  ●Đã duyệt         [Xem ảnh]  │
│  13/07/2026  ●Bị từ chối       [Xem lý do]│
└──────────────────────────────────────────┘
```
- Danh sách dạng thẻ (card list) thay vì bảng dày đặc — dễ đọc trên điện thoại.
- Badge trạng thái dùng màu theo mục 2 (cam/xanh lá/đỏ).

### 6.3. Màn hình Duyệt nhật ký / Review UI (Accountant) — màn hình quan trọng nhất hệ thống

```
┌───────────────────────────────────────────────────────────────┐
│  Duyệt nhật ký   Hợp đồng: [Dropdown ▾]  Tháng: [Chọn tháng ▾]  │
├───────────────────────────────────────────────────────────────┤
│  [Tất cả] [Chờ duyệt (12)] [Đã duyệt] [Từ chối]   [Duyệt hàng loạt]│
├───────────────────────────────────────────────────────────────┤
│  Bảng (TanStack Table, inline edit):                            │
│  ┌────┬──────────┬────────┬──────┬────────┬───────────┬───────┐│
│  │ ☐  │ Ngày     │Thiết bị │Giờ ca│Tổng giờ│Người vận  │Trạng  ││
│  │    │          │        │sáng/..│ hành   │hành       │thái   ││
│  ├────┼──────────┼────────┼──────┼────────┼───────────┼───────┤│
│  │ ☐  │15/07     │PC200   │07-11.5│  8.5   │Nguyễn V.A │●Chờ  ││
│  └────┴──────────┴────────┴──────┴────────┴───────────┴───────┘│
│  (Click 1 dòng → mở panel bên phải)                             │
├───────────────────────────────────────────────┬─────────────────┤
│                                                 │ [Ảnh gốc]        │
│                                                 │ (zoom/pan được)  │
│                                                 │                  │
│                                                 │ [Form sửa số liệu│
│                                                 │  đối chiếu ảnh]  │
│                                                 │                  │
│                                                 │ [Duyệt] [Từ chối]│
└─────────────────────────────────────────────────┴─────────────────┘
```
- **Layout 2 cột khi mở chi tiết:** trái là bảng danh sách rút gọn, phải là panel "ảnh gốc + form sửa" để Accountant vừa nhìn ảnh vừa sửa số liệu mà không cần chuyển màn hình — đây là màn hình quyết định trải nghiệm cốt lõi của sản phẩm.
- Cho phép chọn nhiều dòng (checkbox) để "Duyệt hàng loạt" khi dữ liệu OCR đã chính xác, giảm thao tác lặp lại.
- Khi bấm "Từ chối", bắt buộc nhập lý do (input ngắn) trước khi xác nhận.
- Với log đã `APPROVED` hoặc `REJECTED`, hiển thị hành động "Mở lại" trong menu thao tác; bắt buộc nhập lý do, sau đó log quay về `PENDING` để sửa và review lại.
- Tab đếm số lượng theo trạng thái (`Chờ duyệt (12)`) giúp Accountant biết khối lượng công việc còn lại.

### 6.4. Màn hình Báo cáo / Export (Accountant)

```
┌───────────────────────────────────────────────┐
│  Xuất báo cáo tháng                              │
├───────────────────────────────────────────────┤
│  Hợp đồng: [Dropdown ▾]   Tháng: [Chọn tháng ▾]  │
│                                                    │
│  ┌─ Xem trước số liệu ─────────────────────────┐ │
│  │ Tổng giờ vận hành:      186.5 giờ            │ │
│  │ Đơn giá áp dụng:        350,000 đ/giờ        │ │
│  │ Tạm tính trước thuế:    65,275,000 đ         │ │
│  │ VAT (8%):               5,222,000 đ          │ │
│  │ Tổng cộng:               70,497,000 đ         │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│            [ Xuất báo cáo Excel (.zip) ]           │
│         (nút primary, lớn, căn giữa/nổi bật)       │
└───────────────────────────────────────────────┘
```
- Luôn hiển thị **preview số liệu tổng hợp trước khi xuất** để Accountant kiểm tra nhanh, tránh xuất nhầm.
- Khi trạng thái là `NEEDS_RECALCULATION`, hiển thị cảnh báo "Dữ liệu đã thay đổi, cần tính lại nghiệm thu"; vô hiệu hóa tải export cũ và yêu cầu tính lại trước khi cho phép export mới.
- Nếu không có log nào đã duyệt trong kỳ → hiển thị trạng thái rỗng (empty state) rõ ràng: *"Chưa có nhật ký nào được duyệt trong tháng này."* kèm nút điều hướng sang màn hình Duyệt log.
- Sau khi bấm xuất: nút chuyển "Đang tạo báo cáo..." → tự động tải file ZIP về khi xong.

### 6.5. Màn hình Danh mục (Khách hàng / Thiết bị / Hợp đồng)

- Dùng layout thống nhất: bảng danh sách (TanStack Table) + nút "Thêm mới" góc trên phải + ô tìm kiếm.
- Form thêm/sửa hiển thị dạng **modal/slide-over panel** (trượt từ phải vào), không chuyển sang trang riêng — giữ ngữ cảnh danh sách phía sau.
- Trạng thái hợp đồng (ACTIVE/EXPIRED/TERMINATED) hiển thị bằng badge màu theo mục 2.

### 6.6. Màn hình Công nợ & Tạm ứng

```
┌───────────────────────────────────────────────┐
│  Công nợ — Hợp đồng HD-001                       │
├───────────────────────────────────────────────┤
│  Dư nợ hiện tại:        12,500,000 đ  ●Chưa đối chiếu│
│                                                    │
│  [Lịch sử đối chiếu công nợ]  [Lịch sử tạm ứng]    │
│  (2 tab)                                          │
│                                                    │
│         [ Tạo đối chiếu công nợ kỳ mới ]           │
└───────────────────────────────────────────────┘
```
- Số dư nợ hiển thị nổi bật ở đầu trang (dùng cỡ chữ Display, màu cảnh báo nếu > 0).
- Tách 2 tab lịch sử để không dồn quá nhiều bảng trên 1 màn hình.

### 6.7. Màn hình Lịch sử thao tác (Accountant/Admin)

- Hiển thị bảng append-only với bộ lọc actor, loại entity, action và khoảng thời gian.
- Với `DailyLog`/`MonthlyAcceptance`, cho phép mở rộng `oldValues` và `newValues` dạng JSON để đối chiếu thay đổi.
- Không hiển thị dữ liệu nhạy cảm như password hoặc token; không có nút sửa/xóa audit.

---

## 7. Thư viện Component chuẩn (Component Library)

Dựa trên **Shadcn/ui + TailwindCSS**, các component dùng chung xuyên suốt hệ thống:

| Component | Sử dụng |
|---|---|
| `Button` (primary/secondary/ghost/destructive) | Hành động chính dùng `primary`, hành động phụ dùng `secondary`/`ghost`, xóa/từ chối dùng `destructive` |
| `Badge` | Hiển thị trạng thái (PENDING/APPROVED/REJECTED...) theo màu ở mục 2 |
| `DataTable` (TanStack Table + Shadcn) | Mọi danh sách dữ liệu, hỗ trợ sort, filter, pagination, inline edit |
| `Dialog` / `Sheet` (slide-over) | Form thêm/sửa danh mục, xác nhận hành động quan trọng |
| `Toast` | Thông báo kết quả hành động (thành công/lỗi), tự ẩn sau 3–4s |
| `Skeleton` | Trạng thái loading khi tải dữ liệu bảng/chi tiết |
| `EmptyState` | Khi danh sách rỗng (chưa có log, chưa có hợp đồng...) kèm hướng dẫn/nút hành động tiếp theo |
| `Tabs` | Phân nhóm nội dung cùng ngữ cảnh (VD: Chờ duyệt/Đã duyệt/Từ chối) |
| `DatePicker` / `MonthPicker` | Chọn ngày làm việc, chọn tháng billing |
| `ImageViewer` (zoom/pan) | Xem ảnh nhật ký gốc trong Review UI |

**Icon set:** dùng `lucide-react` — bộ icon đơn giản, nét mảnh, đồng nhất với phong cách "sáng - tối giản".

---

## 8. Trạng thái & Phản hồi hệ thống (Feedback States)

| Tình huống | Cách xử lý UI |
|---|---|
| Đang tải dữ liệu | Hiển thị `Skeleton` thay vì spinner toàn màn hình, giữ layout ổn định |
| Thao tác đang xử lý (lưu, duyệt, export) | Nút chuyển trạng thái loading (disable + spinner nhỏ trong nút), không cho bấm lặp |
| Thành công | `Toast` màu xanh lá góc trên-phải, biến mất sau vài giây |
| Lỗi nghiệp vụ (validation, đã duyệt rồi...) | `Toast` màu đỏ + thông báo rõ nguyên nhân bằng tiếng Việt dễ hiểu (map từ `errorCode`) |
| Export cũ bị vô hiệu hóa | Banner cảnh báo + badge `NEEDS_RECALCULATION`; không cho tải lại bản export cũ |
| Lỗi hệ thống (500) | Thông báo chung: *"Có lỗi xảy ra, vui lòng thử lại sau."* kèm nút "Thử lại" |
| Danh sách rỗng | `EmptyState` với icon minh họa nhẹ nhàng + câu hướng dẫn + nút hành động (VD: "Chưa có log nào, [Upload ngay]") |
| Mất kết nối mạng (Operator ngoài công trường) | Banner cảnh báo cố định đầu trang: *"Không có kết nối mạng — ảnh sẽ được gửi lại khi có mạng"* (định hướng offline, xem PRD mục Future Roadmap) |

---

## 9. Khả năng tiếp cận (Accessibility)

- Độ tương phản chữ/nền tối thiểu đạt WCAG AA (4.5:1 cho text thường).
- Mọi trạng thái không chỉ dựa vào màu sắc — luôn kèm text/label hoặc icon đi kèm (color-blind friendly).
- Kích thước vùng chạm (tap target) tối thiểu 44×44px trên mobile, đặc biệt cho nút "Duyệt"/"Từ chối"/"Gửi nhật ký".
- Toàn bộ input có `label` rõ ràng, không chỉ dùng placeholder làm nhãn.
- Hỗ trợ điều hướng bàn phím (Tab/Enter) cho các thao tác chính trên Desktop (Accountant dùng nhiều).

---

## 10. Ghi chú triển khai

- Toàn bộ token màu/spacing/typography ở trên nên khai báo dưới dạng CSS variables hoặc Tailwind config (`tailwind.config.js` — `theme.extend.colors`) để đảm bảo đồng bộ và dễ điều chỉnh toàn hệ thống chỉ từ 1 nơi.
- Không tự ý thêm màu mới ngoài bảng màu ở mục 2 khi phát triển tính năng mới — nếu cần màu semantic mới (VD: trạng thái mới), phải cập nhật tài liệu này trước.
- Mọi màn hình mới thêm sau này cần tuân theo layout tổng thể ở mục 5 (Topbar + Sidebar + Content) để giữ tính nhất quán trải nghiệm.
