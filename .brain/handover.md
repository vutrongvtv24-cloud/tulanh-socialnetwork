━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HANDOVER DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Đang làm: Social Sharing & Post Details
🔢 Đến bước: Completed Deployment

✅ ĐÃ XONG:
   - Phase 01: Tạo trang chi tiết bài viết (Server-Side Rendered) tại `/post/[id]`
   - Phase 02: Tích hợp nút Share Facebook + Copy Link vào Clipboard
   - Phase 03: Fix lỗi UX/Interaction (preventDefault, stopPropagation)
   - Phase 04: Deploy lên VPS và verify code hoạt động

⏳ CÒN LẠI:
   - Kiểm tra lại Auth Flow trên domain thật (lỗi `pkce_code_verifier_not_found` có thể do cookie cũ hoặc SSL)
   - Cấu hình Domain chính thức & SSL (Let's Encrypt/Nginx)

🔧 QUYẾT ĐỊNH QUAN TRỌNG:
   - Dùng SSR cho trang chi tiết (`/post/[id]`) để đảm bảo Metadata khi share lên Facebook hiển thị đẹp.
   - Nút Share sẽ ưu tiên Copy Link + Báo Toast trước khi mở Popup (tránh bị chặn).
   - Timestamp bài viết giờ là link dẫn vào chi tiết bài.

⚠️ LƯU Ý CHO SESSION SAU:
   - Nếu lỗi Share không hiện popup, hãy check Console log.
   - Nếu lỗi Login `pkce...`, hãy thử Xóa Cache/Cookies hoặc check lại `NEXT_PUBLIC_SITE_URL` trên VPS.
   - VPS cần chạy `pm2 restart tulanh --update-env` nếu đổi biến môi trường.

📁 FILES QUAN TRỌNG:
   - `src/app/post/[id]/page.tsx` (Logic SSR Post)
   - `src/components/feed/post-card/PostActions.tsx` (Logic Share Button)
   - `.brain/brain.json` (Project Architecture)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Đã lưu! Để tiếp tục: Gõ /recap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
