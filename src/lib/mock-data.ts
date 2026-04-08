/**
 * Mock/seed data for ShopLienQuan
 * This file contains static demo data used for development and initial state
 */

import type { Category, Product, SpinReward, BlogPost, RecentActivity } from './types';

// ─── Categories ────────────────────────────────────────────────────────────────

export const categories: Category[] = [
  { id: 0, name: "Tất Cả Sản Phẩm", slug: "all", icon: "🏠" },
  { id: 1, name: "Liên Quân", slug: "lien-quan", icon: "⚔️" },
  { id: 2, name: "Túi Mù", slug: "tui-mu", icon: "🎁" },
  { id: 3, name: "LQ Thập Cẩm", slug: "lq-thap-cam", icon: "🎲" },
  { id: 4, name: "Siêu Sale", slug: "sieu-sale", icon: "🔥" },
  { id: 5, name: "Bestseller", slug: "bestseller", icon: "⭐" },
  { id: 6, name: "Liên Quân Rank Cao", slug: "lq-rank-cao", icon: "🏆" },
  { id: 7, name: "Random VIP Liên Quân", slug: "random-vip-lq", icon: "💎" },
  { id: 8, name: "TFT", slug: "tft", icon: "🃏" },
  { id: 9, name: "ACC 0K", slug: "acc-0k", icon: "🎉" },
  { id: 10, name: "Hàng New", slug: "hang-new", icon: "🆕" },
  { id: 11, name: "Blox Fruits", slug: "blox-fruits", icon: "🍎" },
  { id: 12, name: "FC Online", slug: "fc-online", icon: "⚽" },
  { id: 13, name: "Random Skin SSS", slug: "random-skin-sss", icon: "✨" },
  { id: 14, name: "LQ Chủ Off", slug: "lq-chu-off", icon: "🔒" },
  { id: 15, name: "Nick Reg", slug: "nick-reg", icon: "📝" },
  { id: 16, name: "LQ Authen", slug: "lq-authen", icon: "🔐" },
  { id: 17, name: "Skin Chuyển Giao", slug: "skin-chuyen-giao", icon: "🔄" },
  { id: 18, name: "Liên Quân Chưa Số", slug: "lq-chua-so", icon: "📱" },
  { id: 19, name: "Random Sò - Quân Huy", slug: "random-so-quan-huy", icon: "🐚" },
  { id: 20, name: "Data Thô Liên Quân", slug: "data-tho-lq", icon: "📊" },
  { id: 21, name: "Random Skin Anime Hợp Tác", slug: "random-skin-anime", icon: "🎭" },
  { id: 22, name: "File LQ", slug: "file-lq", icon: "📁" },
  { id: 23, name: "Fc Mobile VN", slug: "fc-mobile-vn", icon: "📲" },
  { id: 24, name: "Zing Speed", slug: "zing-speed", icon: "🏎️" },
  { id: 25, name: "Random Delta Force", slug: "random-delta-force", icon: "🎯" },
  { id: 26, name: "Play Together", slug: "play-together", icon: "🎮" },
  { id: 27, name: "Random Huyền Thoại Hải Tặc", slug: "random-httht", icon: "🏴‍☠️" },
];

// ─── Products ──────────────────────────────────────────────────────────────────

export const products: Product[] = [
  { id: 1,  name: "Random 500 - 1000 Kỉ Vật",      description: "Random tài khoản Liên Quân Rank Đồng, Bạc, Vàng với 500-1000 kỉ vật, nhiều tướng", price: 10000,  originalPrice: 20000,  image: "",  categoryId: 1,  totalStock: 500,  soldCount: 2847,  isHot: true,  discount: 50, winRate: 52, totalGold: 450,  totalMatches: 1500, heroes: 87,  skins: 132, gems: 90,  rank: "KC 4" },
  { id: 2,  name: "ACC LQ Chưa Số Premium",          description: "Tài khoản Liên Quân chưa liên kết số, full tướng, Rank Bạch Kim",               price: 15000,  originalPrice: 25000,  image: "",  categoryId: 18, totalStock: 300,  soldCount: 1523,  isHot: true,  discount: 40, winRate: 54, totalGold: 780,  totalMatches: 2200, heroes: 95,  skins: 145, gems: 90,  rank: "KC 5" },
  { id: 3,  name: "ACC LQ Chưa Số Basic",            description: "Random acc Liên Quân chưa liên kết số Rank Kim Cương",                         price: 2500,   originalPrice: 5000,   image: "",  categoryId: 18, totalStock: 1000, soldCount: 5621,  isHot: false, discount: 50, winRate: 49, totalGold: 210,  totalMatches: 900,  heroes: 58,  skins: 72,  gems: 60,  rank: "TA 1" },
  { id: 4,  name: "Super Sale ACC 2xx-8xx Skin",     description: "Siêu sale tài khoản Liên Quân 200-800 skin, Rank Tinh Anh",                  price: 1000,   originalPrice: 5000,   image: "",  categoryId: 4,  totalStock: 200,  soldCount: 8934,  isHot: true,  discount: 80, winRate: 51, totalGold: 590,  totalMatches: 3000, heroes: 106, skins: 248, gems: 90,  rank: "Đại Cao Thủ" },
  { id: 5,  name: "Random 100% trên 100 Skin",       description: "Đảm bảo 100% nhận acc trên 100 skin trải nghiệm, Rank Cao Thủ",               price: 500,    originalPrice: 2000,   image: "",  categoryId: 1,  totalStock: 800,  soldCount: 12450, isHot: true,  discount: 75, winRate: 48, totalGold: 320,  totalMatches: 1800, heroes: 72,  skins: 115, gems: 75,  rank: "Cao Thủ 5*" },
  { id: 6,  name: "Random Skin SSS",                 description: "Random skin SSS siêu hiếm, cực phẩm, Rank Đại Cao Thủ",                      price: 15000,  originalPrice: 30000,  image: "",  categoryId: 13, totalStock: 150,  soldCount: 987,   isHot: false, discount: 50, winRate: 56, totalGold: 960,  totalMatches: 4200, heroes: 117, skins: 288, gems: 90,  rank: "Chiến Tướng" },
  { id: 7,  name: "Random VIP Liên Quân Gold",       description: "Random tài khoản VIP full tướng, bảo kê Rank Chiến Tướng",                   price: 50000,  originalPrice: 100000, image: "",  categoryId: 7,  totalStock: 100,  soldCount: 456,   isHot: true,  discount: 50, winRate: 61, totalGold: 1250, totalMatches: 5800, heroes: 124, skins: 346, gems: 90,  rank: "Chiến Tướng" },
  { id: 8,  name: "Random Liên Quân Rank Cao",       description: "Tài khoản rank Cao Thủ - Đại Cao Thủ - Chiến Tướng, full tướng",              price: 25000,  originalPrice: 50000,  image: "",  categoryId: 6,  totalStock: 80,   soldCount: 342,   isHot: false, discount: 50, winRate: 58, totalGold: 870,  totalMatches: 3900, heroes: 119, skins: 215, gems: 90,  rank: "Đại Cao Thủ" },
  { id: 9,  name: "TFT Random Account",              description: "Random tài khoản Teamfight Tactics nhiều item, skin",                        price: 8000,   originalPrice: 15000,  image: "",  categoryId: 8,  totalStock: 200,  soldCount: 876,   isHot: false, discount: 47 },
  { id: 10, name: "Blox Fruits Random",              description: "Random tài khoản Blox Fruits nhiều trái ác quỷ",                            price: 12000,  originalPrice: 20000,  image: "", categoryId: 11, totalStock: 150,  soldCount: 654,   isHot: false, discount: 40 },
  { id: 11, name: "FC Online VIP",                   description: "Tài khoản FC Online nhiều cầu thủ ICON, TOTY",                             price: 20000,  originalPrice: 40000,  image: "", categoryId: 12, totalStock: 100,  soldCount: 421,   isHot: false, discount: 50, winRate: 50, totalGold: 750,  totalMatches: 2500, heroes: 103, skins: 203, gems: 90,  rank: "Cao Thủ 5*" },
  { id: 12, name: "ACC 0K Tặng Free",                description: "Tài khoản Liên Quân miễn phí 0đ, random may mắn",                          price: 0,      originalPrice: 0,      image: "", categoryId: 9,  totalStock: 50,   soldCount: 15678, isHot: true,  discount: 0,  winRate: 44, totalGold: 120,  totalMatches: 600,  heroes: 43,  skins: 52,  gems: 45,  rank: "TA 2" },
  { id: 13, name: "Túi Mù Liên Quân Basic",          description: "Túi mù random tài khoản Liên Quân, bất ngờ mỗi lần mở",                    price: 5000,   originalPrice: 10000,  image: "", categoryId: 2,  totalStock: 400,  soldCount: 3245,  isHot: false, discount: 50, winRate: 50, totalGold: 280,  totalMatches: 1200, heroes: 68,  skins: 98,  gems: 60,  rank: "Cao Thủ 5*" },
  { id: 14, name: "Túi Mù Liên Quân Premium",        description: "Túi mù VIP random acc Liên Quân 100+ skin",                                price: 20000,  originalPrice: 40000,  image: "", categoryId: 2,  totalStock: 200,  soldCount: 1876,  isHot: true,  discount: 50, winRate: 55, totalGold: 680,  totalMatches: 2800, heroes: 108, skins: 194, gems: 90,  rank: "Đại Cao Thủ" },
  { id: 15, name: "LQ Thập Cẩm Random",              description: "Random đa dạng tài khoản Liên Quân, từ cơ bản đến VIP",                     price: 3000,   originalPrice: 6000,   image: "", categoryId: 3,  totalStock: 600,  soldCount: 4532,  isHot: false, discount: 50, winRate: 47, totalGold: 190,  totalMatches: 850,  heroes: 50,  skins: 65,  gems: 45,  rank: "TA 1" },
  { id: 16, name: "Bestseller - ACC 50+ Skin",        description: "Sản phẩm bán chạy nhất, random acc 50+ skin",                              price: 2000,   originalPrice: 4000,   image: "", categoryId: 5,  totalStock: 350,  soldCount: 9876,  isHot: true,  discount: 50, winRate: 51, totalGold: 240,  totalMatches: 980,  heroes: 61,  skins: 85,  gems: 60,  rank: "KC 5" },
  { id: 17, name: "LQ Chủ Off - Acc Chính Chủ",      description: "Tài khoản chính chủ đã off, full thông tin",                              price: 30000,  originalPrice: 50000,  image: "", categoryId: 14, totalStock: 50,   soldCount: 234,   isHot: false, discount: 40, winRate: 59, totalGold: 1100, totalMatches: 4600, heroes: 121, skins: 341, gems: 90,  rank: "Chiến Tướng" },
  { id: 18, name: "Nick Reg Mới",                    description: "Nick đăng ký mới sẵn, chưa sử dụng",                                      price: 1000,   originalPrice: 2000,   image: "", categoryId: 15, totalStock: 1000, soldCount: 6543,  isHot: false, discount: 50 },
  { id: 19, name: "LQ Authen - Xác Minh",            description: "Tài khoản Liên Quân đã xác minh danh tính",                              price: 35000,  originalPrice: 60000,  image: "", categoryId: 16, totalStock: 30,   soldCount: 189,   isHot: false, discount: 42, winRate: 57, totalGold: 930,  totalMatches: 3800, heroes: 115, skins: 247, gems: 90,  rank: "Đại Cao Thủ" },
  { id: 20, name: "Skin Chuyển Giao VIP",            description: "Skin chuyển giao hiếm, limited edition",                                price: 40000,  originalPrice: 80000,  image: "", categoryId: 17, totalStock: 40,   soldCount: 156,   isHot: true,  discount: 50, winRate: 62, totalGold: 1420, totalMatches: 6200, heroes: 126, skins: 392, gems: 90,  rank: "Chiến Tướng" },
  { id: 21, name: "Random Sò + Quân Huy",            description: "Random tài khoản nhiều sò và quân huy",                                  price: 5000,   originalPrice: 10000,  image: "", categoryId: 19, totalStock: 300,  soldCount: 2341,  isHot: false, discount: 50, winRate: 50, totalGold: 310,  totalMatches: 1350, heroes: 74,  skins: 108, gems: 75,  rank: "KC 4" },
  { id: 22, name: "Data Thô LQ",                     description: "Data thô tài khoản Liên Quân, số lượng lớn",                             price: 500,    originalPrice: 1000,   image: "", categoryId: 20, totalStock: 5000, soldCount: 8765,  isHot: false, discount: 50 },
  { id: 23, name: "Random Skin Anime Collab",         description: "Random skin anime hợp tác giới hạn",                                   price: 18000,  originalPrice: 35000,  image: "", categoryId: 21, totalStock: 60,   soldCount: 432,   isHot: true,  discount: 49, winRate: 53, totalGold: 720,  totalMatches: 2900, heroes: 111, skins: 271, gems: 90,  rank: "Đại Cao Thủ" },
  { id: 24, name: "File LQ Premium",                 description: "File data Liên Quân premium, nhiều tài khoản",                          price: 3000,   originalPrice: 5000,   image: "", categoryId: 22, totalStock: 200,  soldCount: 1234,  isHot: false, discount: 40 },
  { id: 25, name: "Huyền Thoại Hải Tặc Random",      description: "Random tài khoản Huyền Thoại Hải Tặc VIP",                             price: 10000,  originalPrice: 20000,  image: "", categoryId: 27, totalStock: 150,  soldCount: 567,   isHot: true,  discount: 50 },
  { id: 26, name: "Fc Mobile VN Account",            description: "Random tài khoản FC Mobile Vietnam server",                           price: 8000,   originalPrice: 15000,  image: "", categoryId: 23, totalStock: 100,  soldCount: 345,   isHot: false, discount: 47 },
  { id: 27, name: "Zing Speed Premium",              description: "Tài khoản Zing Speed nhiều xe VIP",                                     price: 12000,  originalPrice: 22000,  image: "", categoryId: 24, totalStock: 80,   soldCount: 234,   isHot: false, discount: 45 },
  { id: 28, name: "Delta Force Random",              description: "Random tài khoản Delta Force nhiều skin súng",                         price: 15000,  originalPrice: 28000,  image: "", categoryId: 25, totalStock: 60,   soldCount: 178,   isHot: false, discount: 46 },
  { id: 29, name: "Play Together VIP",               description: "Random tài khoản Play Together full outfit",                           price: 6000,   originalPrice: 12000,  image: "", categoryId: 26, totalStock: 120,  soldCount: 456,   isHot: false, discount: 50 },
  { id: 30, name: "Hàng New - Siêu Phẩm Mới",        description: "Sản phẩm mới nhất, cập nhật hàng tuần",                                price: 10000,  originalPrice: 18000,  image: "", categoryId: 10, totalStock: 100,  soldCount: 123,   isHot: true,  discount: 44, winRate: 53, totalGold: 380,  totalMatches: 1600, heroes: 82,  skins: 120, gems: 75,  rank: "Cao Thủ 5*" },
];

// ─── Spin Wheel Rewards ────────────────────────────────────────────────────────

export const spinRewards: SpinReward[] = [
  { id: 1, name: "500đ", amount: 500, color: "#ef4444" },
  { id: 2, name: "1.000đ", amount: 1000, color: "#f59e0b" },
  { id: 3, name: "2.000đ", amount: 2000, color: "#10b981" },
  { id: 4, name: "Chúc bạn may mắn", amount: 0, color: "#6366f1" },
  { id: 5, name: "500đ", amount: 500, color: "#ec4899" },
  { id: 6, name: "5.000đ", amount: 5000, color: "#06b6d4" },
  { id: 7, name: "Mất lượt", amount: 0, color: "#8b5cf6" },
  { id: 8, name: "10.000đ", amount: 10000, color: "#f97316" },
];

// ─── Blog Posts ────────────────────────────────────────────────────────────────

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Hướng dẫn mua nick Liên Quân giá rẻ tại ShopLienQuan",
    slug: "huong-dan-mua-nick",
    excerpt: "Bài viết hướng dẫn chi tiết cách mua nick Liên Quân giá rẻ, uy tín nhất tại shop...",
    content: "Bước 1: Đăng ký tài khoản tại website.\nBước 2: Nạp tiền vào ví.\nBước 3: Chọn sản phẩm và bấm Mua Ngay.\nBước 4: Nhận thông tin tài khoản ngay lập tức.",
    image: "",
    date: "2026-03-25"
  },
  {
    id: 2,
    title: "Top 10 tướng mạnh nhất Liên Quân mùa 30",
    slug: "top-10-tuong-manh-nhat",
    excerpt: "Tổng hợp 10 tướng có tỷ lệ thắng cao nhất trong mùa giải mới nhất...",
    content: "1. Florentino\n2. Yorn\n3. Tulen\n4. Nakroth\n5. Murad\n6. Lauriel\n7. Allain\n8. Keera\n9. Airi\n10. Butterfly",
    image: "",
    date: "2026-03-20"
  },
  {
    id: 3,
    title: "Cách nạp tiền vào shop nhanh nhất",
    slug: "cach-nap-tien",
    excerpt: "Hướng dẫn các phương thức nạp tiền nhanh chóng và an toàn nhất...",
    content: "Hỗ trợ các phương thức:\n- Chuyển khoản ngân hàng\n- Nạp thẻ cào điện thoại\n- Ví điện tử (MoMo, ZaloPay)",
    image: "",
    date: "2026-03-15"
  },
];

// ─── Recent Activity (Demo) ────────────────────────────────────────────────────

export const recentActivities: RecentActivity[] = [
  { user: "Ng***an", product: "Random 500 - 1000 Kỉ Vật", price: 10000, time: "2 phút trước" },
  { user: "Tr***ng", product: "ACC LQ Chưa Số Basic", price: 2500, time: "5 phút trước" },
  { user: "Ho***g", product: "Super Sale ACC 2xx-8xx Skin", price: 1000, time: "8 phút trước" },
  { user: "Ph***c", product: "Random VIP Liên Quân Gold", price: 50000, time: "12 phút trước" },
  { user: "Mi***h", product: "ACC 0K Tặng Free", price: 0, time: "15 phút trước" },
  { user: "Du***g", product: "Túi Mù Liên Quân Premium", price: 20000, time: "18 phút trước" },
  { user: "An***h", product: "Bestseller - ACC 50+ Skin", price: 2000, time: "22 phút trước" },
  { user: "Th***o", product: "Random Skin SSS", price: 15000, time: "25 phút trước" },
];
