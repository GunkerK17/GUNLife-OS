# GunLifeOS — checklist 3 ngày trước khi bàn giao

## Ngày 1 — dữ liệu và bảo mật

- Đổi lại `SUPABASE_SERVICE_ROLE_KEY` vì key cũ đã từng được chia sẻ trong lúc phát triển.
- Kiểm tra Vercel chỉ có secret trong Environment Variables; không commit `.env.local`.
- Chạy đủ migration `001` đến `010` trên đúng Supabase project.
- Kiểm tra RLS bằng hai tài khoản khác nhau: tài khoản A không được đọc/sửa dữ liệu của B.
- Quyết định mức riêng tư ảnh. Các bucket hiện dùng public URL; trước khi mở công khai nên chuyển ảnh body/workout/activity/nutrition sang private bucket và signed URL.

## Ngày 2 — smoke test nghiệp vụ

- Auth: đăng ký email, xác nhận email, đăng nhập Google, đăng xuất, vào route bảo vệ.
- Timeline: thêm/sửa/xóa block, preset chỉ vào ngày chọn, chống trùng giờ, Done/Skip/Undo.
- Workout: chọn lịch tập, tick Done từ Timeline, bổ sung calo/nhịp tim/ảnh, xóa log và kiểm tra Timeline trở lại pending.
- Tracking: Activities, Nutrition, Weight tạo/sửa/xóa log và ảnh; đổi ngày không lẫn dữ liệu.
- Goals/Skills: tạo Goal học tập có Skill liên kết, Timeline không sinh hai block trùng, xóa Goal không để Skill mồ côi.
- Finance: thu/chi/chuyển tiền, ví trả sau, ngân sách, ví tiết kiệm và phần trăm Goal.
- Journal/AI: lưu nhật ký, dopamine score, tạo/đổi tên/xóa cuộc trò chuyện, kiểm tra thông báo hết quota Gemini.

## Ngày 3 — giao diện và phát hành

- Kiểm tra chiều rộng `320`, `375`, `390`, `768`, `1024`, `1366`, `1920` px.
- Kiểm tra dialog với bàn phím mobile, thanh bottom nav, safe area và không có cuộn ngang.
- Kiểm tra cả `VN` và `EN` trên mọi route chính.
- Chạy `npm run lint`, `npm exec tsc -- --noEmit`, `npm run build`.
- Đặt Supabase Auth Site URL và Redirect URLs đúng domain Vercel.
- Tạo một bản backup database trước demo/bàn giao.

## Các rủi ro còn lại

- Chưa có test tự động; hiện dự án phụ thuộc build, lint và smoke test thủ công.
- Gemini free tier có quota, không thể dùng vô hạn. Cần hiển thị lỗi quota rõ ràng hoặc cấu hình billing/fallback nếu mở cho nhiều người.
- Ảnh sức khỏe đang dùng public bucket; phù hợp private beta nhưng chưa nên xem là cấu hình production cuối cùng.
