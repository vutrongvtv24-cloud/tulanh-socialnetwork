# Changelog

All notable changes to this project will be documented in this file.

## [2026-01-30]
### Added
- **🆕 Tủ Lạnh Module (MarkNote):** Complete note-taking and URL bookmarking system.
  - Markdown editor with live preview
  - URL auto-metadata fetching (title, description)
  - Hierarchical tag system
  - Full-text search functionality
  - New route: `/notes`
  - New components: `NoteCard`, `NoteEditor`, `TagTree`
  - Database tables: `notes`, `tags`, `note_tags`
- **Config:** Tạo file `.env.local` chuẩn cho development.

### Fixed
- **Critical Migration:** Đã chạy migration `20260127_add_topic_to_posts.sql` trên Production. Tính năng Topic Filter giờ đã hoạt động 100%.
- **Data Integrity:** Chuẩn hóa dữ liệu cũ của cột `topic` thành default value (`'share'`).
- **Notes Page Bug:** Fixed infinite rendering loop caused by `loading` in useEffect dependencies.
- **Notes Layout:** Fixed content overlap with Leaderboard sidebar (changed `max-w-4xl` → `max-w-3xl`).
- **Notes Wording:** Updated từ "ghi chú" thành "kiến thức" across entire module.

### Updated
- **Dependencies:** Nâng cấp Next.js lên 16.1.3, React 19.2.3.
- **Documentation:** Viết lại toàn bộ `README.md` với hướng dẫn cài đặt, cấu hình và deploy chi tiết.
- **Audit:** Hoàn thành Full Audit Report (`docs/reports/audit_2026-01-30.md`).
- **Sidebar:** Added "Tủ Lạnh" menu item to navigation.

## [2026-01-27]
### Added
- **Community Feed Topics:** Added topic filtering (Youtube, MMO, Share) to the main feed.
- **Deep Glass Theme:** Implemented a new modern dark theme with glassmorphism effects.
- **Rank Badges:** Enhanced rank badges with better contrast and animations.
- **Database:** Added `topic` column to `posts` table (Migration: `20260127_add_topic_to_posts.sql`).
- **Internationalization:** Complete English and Vietnamese translations for Feed, Create Post, and Todo List features.
- **Deployment:** Successfully deployed to VPS (Ubuntu/aaPanel) with Nginx Reverse Proxy and SSL.

### Changed
- **Sidebar:** Removed `Youtube` and `Tricks & Courses` sub-menus to simplify navigation.
- **Create Post:** Added topic selection dropdown.
- **Feed UI:** Replaced simple list with filter pills for topic selection.
- **Text Contrast:** Improved readability on User Title Badges and Sidebar Rank Widgets.

### Fixed
- **Peer Dependencies:** Resolved NPM peer dependency conflicts during install.
- **Environment:** Automated `.env.local` creation from `vercel_env_vars.html`.
- **Console Logs:** Removed debug console logs from production code.

### Refactored
- **PostCard Component:** Split monolithic `PostCard.tsx` into 5 sub-components (`PostHeader`, `PostContent`, `PostActions`, `PostComments`, `PostApprovalStatus`) for better maintainability.
