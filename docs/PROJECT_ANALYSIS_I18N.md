# Báo cáo phân tích tổng thể hệ thống và i18n

**Ngày phân tích:** 2026-11-15  
**Phạm vi:** `D:\taptrung\Project_nhom5`  
**Nhánh Git:** `bugfix/i18n`  
**Phương pháp:** Phân tích tĩnh, chỉ đọc source code. Không chạy ứng dụng, build, test, lint hoặc package script.

## 1. Kiến trúc FE/BE

Đây là hệ thống full-stack Next.js, không phải frontend và backend tách thành hai repository độc lập.

```text
Browser
  ├─ Next.js pages/components
  ├─ Next.js API Routes
  │    └─ DB modules → Supabase/PostgreSQL
  ├─ Supabase Auth + Realtime
  └─ Express PayOS service
       ├─ PayOS/VietQR
       ├─ Supabase
       └─ callback sang Next.js mail API
```

### Frontend

Phần giao diện tập trung tại:

- `project/src/app`: App Router, pages, layouts, route groups và API routes.
- `project/src/components`: component nghiệp vụ và component tái sử dụng.
- `project/src/shared`: UI primitives như button, input, navigation và logo.
- `project/src/data`: dữ liệu demo/template.
- `project/src/styles` và `project/tailwind.config.js`: Tailwind, SCSS và dark mode.
- `project/src/hooks`: Supabase Realtime, currency và UI utilities.

Root layout gắn header, footer, authentication context và i18n provider cho toàn ứng dụng tại `project/src/app/layout.tsx`.

### Backend chính

Backend chủ yếu nằm trong Next.js:

- 47 endpoint được quan sát trong `project/src/app/api`.
- Data-access layer tại `project/src/lib/db`.
- Supabase client tại `project/src/lib/supabase.ts`.
- JWT/cookie authentication tại `project/src/lib/auth.ts` và `project/src/lib/auth-server.ts`.
- Route protection và RBAC tại `project/src/middleware.ts`.
- Database schema/migration trong `project/supabase/migrations`.

Luồng dữ liệu phổ biến:

```text
Page/client component
→ fetch /api/*
→ API route kiểm tra JWT/role
→ src/lib/db/*
→ Supabase
→ JSON response
→ cập nhật UI
```

### Backend PayOS riêng

`project/backend-payos` là Express service chạy độc lập:

- Tạo payment link và VietQR.
- Xử lý webhook PayOS.
- Cập nhật payment, booking, service order và loyalty point.
- Gửi email hoặc gọi ngược về Next.js mail API.

Điểm vào là `project/backend-payos/server.js`.

## 2. Technology Stack

Stack được xác nhận từ `project/package.json`:

- Next.js 13.4 App Router.
- React 18 và TypeScript 5, `strict: true`.
- Tailwind CSS 3 và Sass/SCSS.
- Supabase PostgreSQL, Auth và Realtime.
- JWT bằng `jose`; đồng thời có Supabase Auth.
- React Hook Form và Zod.
- Headless UI, Heroicons và Lucide.
- PayOS/VietQR qua Express service.
- Nodemailer.
- Recharts.
- Vitest cho unit/integration.
- Playwright cho E2E.
- `i18next` và `react-i18next`.

Repository có đồng thời `package-lock.json` và `yarn.lock`, nhưng `package.json` không quy định package manager chuẩn. Điều này có thể gây lệch dependency resolution giữa các thành viên.

## 3. Module và chức năng hiện có

Các module chính được quan sát từ pages, API routes, types và migrations:

- Authentication và registration.
- RBAC cho `ADMIN`, `RECEPTIONIST`, `HOUSEKEEPING`, `KITCHEN`, `CUSTOMER`.
- Quản lý phòng, loại phòng và room availability.
- Đặt phòng, xác nhận, hủy, check-in và checkout.
- Room locking và occupancy.
- Housekeeping, checkout request và trạng thái phòng.
- Service catalog và service orders.
- Kitchen order queue với Supabase Realtime.
- Laundry booking/order.
- Car booking/order.
- Experience booking và lịch trình.
- Thanh toán, PayOS/VietQR và invoice.
- Customer loyalty point.
- Incident, compensation và lost-and-found.
- Admin dashboard, user management, reports và payments.
- Email confirmation.
- OCR endpoint.
- Chat/request endpoints.
- Các trang template Chisfis cũ: stay, car, flight, experience, real estate, blog và add-listing.

Domain types tập trung tại `project/src/types/hotel.ts`. Dashboard navigation tại `project/src/app/dashboard/layout.tsx` thể hiện các module và quyền truy cập chính.

## 4. Coding conventions và workflow

Các convention được quan sát:

- App Router: `page.tsx`, `layout.tsx`, `route.ts`.
- Import alias `@/* → src/*` trong `project/tsconfig.json`.
- Client component dùng `"use client"`.
- TypeScript strict, nhưng vẫn còn nhiều vị trí dùng `any`.
- Styling chủ yếu bằng Tailwind; màu theme ánh xạ qua CSS variables.
- Component dùng PascalCase; hook dùng tiền tố `use`.
- API route thường kiểm tra current user/role rồi gọi DB module.
- RBAC được thực hiện ở middleware, layout guard và API route.
- Không tìm thấy cấu hình Prettier, `.editorconfig` hoặc ESLint riêng ngoài `eslint-config-next`.
- Root repository chứa nhiều script sửa source dạng ad-hoc như `update_*.js`, `fix_*.js`, `translate_*.js`.
- Git history tại thời điểm phân tích chỉ có một commit, chưa đủ để kết luận convention PR/commit thực tế.
- Một số tài liệu mô tả không sửa template cũ, nhưng source hiện đã tích hợp authentication và i18n vào root layout/template components. Tài liệu có dấu hiệu chưa đồng bộ hoàn toàn với code.

## 5. Phân tích sâu i18n

### 5.1. Cơ chế đang hoạt động

Cơ chế chính dùng `react-i18next` trong `project/src/lib/i18n.ts`:

- Resources: `en/common.json` và `vn/common.json`.
- Locale nội bộ: `en`, `vn`.
- Ngôn ngữ mặc định: `vn`.
- Fallback: `vn`.
- Namespace duy nhất: `common`.

`project/src/components/I18nProvider.tsx` thực hiện:

- Đọc ngôn ngữ từ `localStorage`.
- Lưu ngôn ngữ vào `localStorage`.
- Lưu cookie `site-language`.
- Cập nhật thuộc tính `lang` của `<html>`.
- Lắng nghe sự kiện `languageChanged`.

### 5.2. Translation files

Hiện có hai bộ translation.

#### Bộ đang hoạt động

- `project/src/locales/en/common.json`
- `project/src/locales/vn/common.json`
- Mỗi file có 373 leaf keys tại thời điểm phân tích.
- Hai file đồng bộ tên key.

#### Bộ legacy/không được sử dụng

- `project/src/locales/en.json`
- `project/src/locales/vi.json`
- Được đọc bởi `project/src/lib/translate.ts`.
- Cơ chế này xác định locale từ URL `/vi`.
- Không tìm thấy import sử dụng `translate.ts`.
- Không tìm thấy route `[locale]`, `/vi` hoặc `/en`.

Codebase vì vậy đang chứa hai thiết kế không tương thích:

- `en/vn` với state trong `localStorage` và cookie.
- `en/vi` với locale lấy từ URL.

### 5.3. Locale state và chuyển ngôn ngữ

`LangDropdown.tsx` gọi trực tiếp `i18n.changeLanguage(item.id)`.

Dropdown được gắn vào:

- Main navigation desktop.
- Header 3.
- Mobile navigation.

`LangDropdownSingle.tsx` tồn tại nhưng không tìm thấy nơi import, có khả năng là component dư.

### 5.4. Server-side locale

Root HTML luôn được render ban đầu với `lang="vn"` trong `project/src/app/layout.tsx`.

Page `project/src/app/rooms/page.tsx` đọc cookie phía server nhưng tự viết các biểu thức song ngữ:

```tsx
language === "vn" ? "..." : "..."
```

thay vì sử dụng translation files.

Hệ quả cần xác minh bằng runtime test:

- Returning user chọn English có thể nhận first paint tiếng Việt ở phần client-rendered trước khi `useEffect` khôi phục locale.
- Server và client chưa có cơ chế locale thống nhất.
- Page phòng tạo thêm nguồn translation thứ ba là chuỗi song ngữ viết trực tiếp trong component.

## 6. Các vấn đề i18n cần kiểm tra tiếp

### Mức cao

1. Có bốn translation key được gọi nhưng không tồn tại trong cả hai active locale files:

   - `adminReportsTitle`
   - `checkoutAlreadyPaid`
   - `checkoutDeposit`
   - `paydoneYourOrder`

   Các vị trí liên quan gồm:

   - `project/src/app/admin/reports/page.tsx`
   - `project/src/app/checkout/PageMain.tsx`
   - `project/src/app/pay-done/page.tsx`

2. Các biểu thức `t("key") || "fallback"` không tạo fallback khi key thiếu. Mặc định i18next trả lại chính tên key, là string truthy. Người dùng có thể nhìn thấy tên key trên UI.

3. Chỉ 14/73 `page.tsx` trực tiếp dùng `useTranslation`. Con số này không chứng minh 59 page còn lại đều chưa dịch vì một số page có thể dùng component con, nhưng source xác nhận nhiều luồng quan trọng vẫn hard-code tiếng Việt hoặc tiếng Anh:

   - Booking detail và cancellation.
   - Experience detail/schedule.
   - Dashboard và admin sidebar.
   - Service checkout actions.
   - Car, laundry và housekeeping flows.

4. `vn` không phải mã ngôn ngữ HTML/BCP 47 chuẩn cho tiếng Việt; mã chuẩn là `vi`. Hiện `<html lang>` cũng được cập nhật thành `vn`, ảnh hưởng accessibility, browser language tooling và SEO.

### Mức trung bình

5. Có hai hệ thống locale `vn` và `vi`. Cần chọn một hệ thống authoritative trước khi mở rộng.

6. Active locale JSON có các key chỉ khác hoa/thường:

   - `signUp` / `Signup`
   - `Experiences Detail` / `Experiences detail`
   - `Real Estate Listings` / `Real estate listings`

   Điều này có thể gây lỗi với tooling/parser không phân biệt hoa thường và làm key khó quản lý.

7. Locale files trộn hai kiểu key:

   - Semantic key, ví dụ `checkoutTotal`.
   - Nguyên văn UI làm key, ví dụ `Real Estate Listings`.

8. Dữ liệu động như `RoomType.name`, `Service.name` và `description` chỉ là một chuỗi, không có cấu trúc theo locale trong `project/src/types/hotel.ts`. Chuyển ngôn ngữ UI sẽ không tự dịch dữ liệu lấy từ database.

9. API và DB layer trả nhiều error message tiếng Anh viết trực tiếp. Nếu UI hiển thị `error.message`, ngôn ngữ sẽ không theo locale của người dùng.

10. Language cookie được ghi ở client nhưng không được đưa vào khởi tạo i18next phía server. Cần kiểm tra flash of wrong language và consistency sau reload.

### Mức thấp nhưng nên chuẩn hóa

11. Không tìm thấy i18n test trong unit, integration hoặc E2E.

12. Chưa có kiểm tra tự động cho:

   - Key thiếu giữa hai locale.
   - Key được dùng nhưng không tồn tại.
   - Chuỗi UI hard-code.
   - Chuyển ngôn ngữ và giữ locale sau reload.
   - `<html lang>` đúng locale.
   - Locale của date, number và currency.

13. Một số nơi format dựa trên `i18n.language === "vn"`, trong khi nơi khác luôn dùng `vi-VN`. Cần có quy tắc mapping rõ ràng giữa application locale và `Intl` locale.

## 7. Verification commands được phát hiện — chưa chạy

Từ `project/package.json`:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`

Backend PayOS:

- `npm start` trong `project/backend-payos`.

Không command nào ở trên được chạy trong lần phân tích này.

## 8. Kết luận

Hệ thống đã có nền tảng i18n hoạt động cho một phần UI, nhưng quá trình chuyển đổi chưa hoàn tất: có hai cơ chế locale, nhiều chuỗi hard-code, bốn key đang thiếu, SSR locale chưa thống nhất và chưa có test bảo vệ.

Báo cáo này chỉ ghi nhận hiện trạng và các vấn đề cần kiểm tra tiếp. Chưa có thay đổi hoặc refactor source code nào được thực hiện.
