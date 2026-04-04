'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: '1. Thông Tin Chúng Tôi Thu Thập',
      content: `Chúng tôi thu thập các thông tin sau khi bạn sử dụng dịch vụ:
• Thông tin tài khoản: tên đăng nhập, email, mật khẩu (đã mã hóa)
• Thông tin giao dịch: lịch sử mua hàng, nạp tiền, vòng quay
• Thông tin thiết bị: địa chỉ IP, trình duyệt, hệ điều hành
• Thông tin liên lạc khi bạn liên hệ hỗ trợ`,
    },
    {
      title: '2. Cách Chúng Tôi Sử Dụng Thông Tin',
      content: `Thông tin của bạn được sử dụng để:
• Xử lý giao dịch mua hàng và nạp tiền
• Cung cấp dịch vụ hỗ trợ khách hàng
• Gửi thông báo về đơn hàng và khuyến mãi
• Phát hiện và ngăn chặn gian lận
• Cải thiện trải nghiệm người dùng`,
    },
    {
      title: '3. Bảo Vệ Thông Tin',
      content: `Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn:
• Mật khẩu được mã hóa và không được lưu dưới dạng văn bản thường
• Dữ liệu giao dịch được bảo mật bằng SSL/TLS
• Chỉ nhân viên có thẩm quyền mới có thể truy cập thông tin khách hàng
• Không bán hoặc chia sẻ thông tin cá nhân với bên thứ ba`,
    },
    {
      title: '4. Cookie và Dữ Liệu Cục Bộ',
      content: `Website sử dụng localStorage để lưu trữ:
• Thông tin phiên đăng nhập
• Giỏ hàng và lịch sử mua hàng
• Cài đặt hiển thị (sáng/tối)

Bạn có thể xóa dữ liệu này bằng cách xóa cookie trình duyệt.`,
    },
    {
      title: '5. Quyền Của Bạn',
      content: `Bạn có quyền:
• Yêu cầu truy cập và sao chép dữ liệu cá nhân
• Yêu cầu chỉnh sửa thông tin không chính xác
• Yêu cầu xóa tài khoản và dữ liệu liên quan
• Từ chối nhận email quảng cáo bất kỳ lúc nào

Liên hệ: Zalo 0334 622 902 để thực hiện các quyền trên.`,
    },
    {
      title: '6. Liên Hệ',
      content: `Nếu bạn có thắc mắc về chính sách bảo mật, vui lòng liên hệ:
• Zalo: 0334 622 902
• Thời gian hỗ trợ: 8:00 - 22:00 hàng ngày

Chính sách này có thể được cập nhật. Chúng tôi sẽ thông báo khi có thay đổi quan trọng.`,
    },
  ];

  return (
    <>
      <Header />
      <div className="main-content" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="section-title">🔒 Chính Sách Bảo Mật</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13 }}>
          Cập nhật lần cuối: 28/03/2026
        </p>

        <div className="dash-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            ShopLienQuan cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn.
            Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn
            khi sử dụng dịch vụ tại website.
          </p>
        </div>

        {sections.map((s, i) => (
          <div key={i} className="dash-card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--accent-primary)' }}>
              {s.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {s.content}
            </p>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}
