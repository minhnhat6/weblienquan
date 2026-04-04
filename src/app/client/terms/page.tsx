'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Điều Khoản Chung',
      content: `Bằng việc sử dụng dịch vụ tại ShopLienQuan, bạn đồng ý tuân thủ các điều khoản sau:
• Bạn phải từ 13 tuổi trở lên để sử dụng dịch vụ
• Thông tin đăng ký phải chính xác và đầy đủ
• Mỗi người dùng chỉ được phép có một tài khoản
• Không được chia sẻ tài khoản với người khác`,
    },
    {
      title: '2. Quy Định Mua Hàng',
      content: `Khi mua sản phẩm tại shop:
• Sản phẩm được giao tự động ngay sau khi thanh toán thành công
• Không hỗ trợ hoàn tiền sau khi đã nhận thông tin tài khoản
• Thông tin tài khoản chỉ được cung cấp một lần duy nhất
• Khách hàng chịu trách nhiệm bảo mật thông tin đã nhận
• Không đăng thông tin tài khoản lên mạng xã hội`,
    },
    {
      title: '3. Quy Định Nạp Tiền',
      content: `Về việc nạp tiền vào ví:
• Số tiền nạp tối thiểu là 10.000đ
• Tiền nạp không thể rút về và chỉ dùng để mua sản phẩm
• Giao dịch có thể mất 5-15 phút để xử lý (chuyển khoản ngân hàng)
• Nạp thẻ cào sẽ trừ 10% phí xử lý
• Liên hệ hỗ trợ nếu giao dịch chưa được xử lý sau 30 phút`,
    },
    {
      title: '4. Hành Vi Bị Cấm',
      content: `Các hành vi sau đây bị cấm nghiêm:
• Cung cấp thông tin sai lệch khi đăng ký
• Sử dụng bot, script tự động để mua hàng
• Cố tình lợi dụng lỗi hệ thống để trục lợi
• Gian lận trong quá trình nạp tiền
• Spam, quảng cáo không được phép
• Tấn công hoặc can thiệp vào hệ thống`,
    },
    {
      title: '5. Giới Hạn Trách Nhiệm',
      content: `ShopLienQuan không chịu trách nhiệm trong các trường hợp:
• Tài khoản bị khóa bởi nhà phát triển game
• Người dùng tự mình vi phạm điều khoản game
• Hỏng hóc do thiên tai hoặc sự cố kỹ thuật bất khả kháng
• Thiệt hại từ việc chia sẻ thông tin tài khoản với người khác`,
    },
    {
      title: '6. Thay Đổi Điều Khoản',
      content: `Chúng tôi có quyền thay đổi điều khoản dịch vụ bất kỳ lúc nào.
Thay đổi sẽ có hiệu lực ngay khi đăng lên website.
Việc tiếp tục sử dụng dịch vụ sau khi thay đổi đồng nghĩa với việc bạn chấp nhận điều khoản mới.

Liên hệ: Zalo 0334 622 902 nếu có thắc mắc.`,
    },
  ];

  return (
    <>
      <Header />
      <div className="main-content" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="section-title">📋 Điều Khoản Dịch Vụ</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13 }}>
          Cập nhật lần cuối: 28/03/2026
        </p>

        <div className="dash-card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Vui lòng đọc kỹ điều khoản dịch vụ trước khi sử dụng. Bằng việc tạo tài khoản và
            sử dụng dịch vụ của ShopLienQuan, bạn đồng ý với tất cả các điều khoản sau đây.
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
