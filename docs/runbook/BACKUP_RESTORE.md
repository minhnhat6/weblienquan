# Backup / Restore (Sprint 4)

## Scope
Ứng dụng hiện tại dùng localStorage làm nguồn dữ liệu runtime chính.
Backup/restore áp dụng cho toàn bộ key bắt đầu bằng `slq_`.

## Cách tạo backup
1. Vào Admin → Cài Đặt → tab **📟 Vận Hành**.
2. Bấm **📦 Export Backup**.
3. File JSON sẽ được tải về máy.

## Cách restore
1. Vào Admin → Cài Đặt → tab **📟 Vận Hành**.
2. Bấm **♻️ Import Restore** và chọn file backup JSON hợp lệ.
3. Hệ thống tự xóa dữ liệu `slq_*` cũ và áp snapshot mới.
4. Reload trang để cập nhật state.

## Kiểm tra restore
- Đã có test tự động ở `src/lib/backup.test.ts`.
- Điều kiện pass: số key restore đúng và key cũ bị xóa đúng.

## Lưu ý
- Không restore file không rõ nguồn gốc.
- Snapshot chỉ chứa dữ liệu localStorage của app, không chứa cookie HttpOnly/server DB.
