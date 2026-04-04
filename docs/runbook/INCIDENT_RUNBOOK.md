# Incident Runbook (P1 / P2)

## 1) Severity
- P1: Mất chức năng chính (login, mua hàng, nạp tiền, admin upload), hoặc lỗi tài chính.
- P2: Ảnh hưởng một phần chức năng, có workaround.

## 2) Quy trình xử lý nhanh
1. Acknowledge incident trong vòng 5 phút.
2. Gán Incident Commander (IC) + người xử lý kỹ thuật.
3. Thu thập tín hiệu:
   - Admin Dashboard: KPI/SLO, Client Errors, Business Audit.
   - Runtime logs: `.runtime-logs/client-errors.log`, `.runtime-logs/business-audit.log`.
4. Khoanh vùng phạm vi ảnh hưởng (route/user/action).
5. Chọn hướng xử lý:
   - Rollback (nếu lỗi sau deploy gần nhất)
   - Hotfix (nếu rollback không khả dụng)
6. Cập nhật trạng thái mỗi 15 phút cho stakeholder.
7. Xác nhận phục hồi và theo dõi thêm 30 phút.
8. Viết postmortem trong 24 giờ.

## 3) Checklist theo nhóm lỗi

### A. Login/Auth lỗi
- Kiểm tra rate-limit bất thường.
- Kiểm tra session `slq_user`, cookie `slq_session_role`.
- Kiểm tra log `window.error`/`unhandledrejection`.

### B. Recharge/Order lỗi
- Kiểm tra business events:
  - `recharge.requested`, `recharge.approved`, `recharge.rejected`, `order.created`.
- Đối chiếu số dư user trước/sau thao tác.
- Nếu sai lệch tài chính: đóng băng thao tác liên quan và ghi nhận danh sách affected users.

### C. Upload/API lỗi
- Kiểm tra `upload.rejected` / `upload.completed` trong `business-audit.log`.
- Kiểm tra MIME/size/count.
- Kiểm tra quyền admin request.

## 4) Mẫu thông báo incident

### Internal update
- Mức độ: P1/P2
- Bắt đầu: YYYY-MM-DD HH:mm
- Ảnh hưởng: (module/route/user)
- Tình trạng hiện tại: Investigating / Mitigating / Monitoring / Resolved
- Hành động tiếp theo: ...

### User-facing update
- Chúng tôi đang xử lý sự cố ảnh hưởng tới [chức năng].
- Một số người dùng có thể gặp [mô tả ngắn].
- Đội ngũ đang khắc phục và sẽ cập nhật sớm nhất.

## 5) Postmortem template
- Timeline
- Root cause
- Impact
- Detection gap
- Corrective actions (owner + deadline)
