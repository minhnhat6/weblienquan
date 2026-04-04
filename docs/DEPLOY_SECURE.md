# 🔐 Hướng Dẫn Deploy An Toàn - Supabase + Vercel

## Nguyên Tắc Bảo Mật

| ❌ KHÔNG BAO GIỜ | ✅ LUÔN LÀM |
|------------------|-------------|
| Commit file `.env` | Dùng `.env.example` (không có giá trị thật) |
| Hardcode password trong code | Dùng Environment Variables |
| Share secrets qua chat/email | Dùng password manager |
| Dùng cùng password cho dev/prod | Tạo credentials riêng cho mỗi môi trường |

---

## Bước 1: Tạo Supabase Project

### 1.1. Đăng ký Supabase
1. Vào [supabase.com](https://supabase.com)
2. Đăng nhập bằng GitHub
3. Click **"New Project"**

### 1.2. Cấu hình Project
- **Name**: `weblienquan-prod`
- **Database Password**: Click **"Generate"** để tạo password mạnh
- **Region**: `Singapore` (gần Việt Nam nhất)

⚠️ **QUAN TRỌNG**: Copy Database Password ngay lập tức và lưu vào password manager (Bitwarden, 1Password, etc.)

### 1.3. Lấy Connection String
1. Vào **Project Settings** → **Database**
2. Copy **Connection string** (URI format):
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
3. **KHÔNG** paste vào bất kỳ file nào trong project!

---

## Bước 2: Chuẩn Bị Code Trước Khi Push

### 2.1. Kiểm tra .gitignore
Đảm bảo file `.gitignore` có các dòng sau:

```gitignore
# Environment files - NEVER commit these
.env
.env.local
.env.*.local
.env.development
.env.production

# Sensitive files
*.pem
*.key
secrets/
```

### 2.2. Kiểm tra không có secrets trong code
```bash
# Chạy lệnh này để tìm potential secrets
grep -r "password\|secret\|api_key\|token" --include="*.ts" --include="*.tsx" src/ | grep -v "process.env"
```

Nếu thấy hardcoded values → Xóa ngay!

### 2.3. Chỉ commit .env.example
```bash
# File .env.example CHỈ chứa tên biến, KHÔNG có giá trị
DATABASE_URL=
SESSION_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
```

---

## Bước 3: Deploy lên Vercel

### 3.1. Import Project
1. Vào [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Chọn repo `weblienquan`
4. **DỪNG LẠI** - Chưa click Deploy!

### 3.2. Cấu hình Environment Variables
Trong màn hình deploy, click **"Environment Variables"** và thêm:

| Name | Value | Cách lấy |
|------|-------|----------|
| `DATABASE_URL` | `postgresql://postgres...` | Copy từ Supabase Dashboard |
| `SESSION_SECRET` | *(random 32 bytes)* | Generate bên dưới |
| `ADMIN_USERNAME` | `admin` | Tự chọn |
| `ADMIN_PASSWORD_HASH` | `$2a$10$...` | Generate bên dưới |

### 3.3. Generate Secure Values

Mở terminal trên máy local và chạy:

```bash
# 1. SESSION_SECRET (copy output)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 2. ADMIN_PASSWORD_HASH (thay 'YourSecurePassword123!' bằng password bạn muốn)
node -e "require('bcryptjs').hash('YourSecurePassword123!', 10).then(console.log)"
```

⚠️ **Paste trực tiếp vào Vercel Dashboard**, KHÔNG lưu vào file!

### 3.4. Deploy
Click **"Deploy"** và đợi hoàn tất.

---

## Bước 4: Chạy Database Migration

### 4.1. Cài Vercel CLI (nếu chưa có)
```bash
npm i -g vercel
vercel login
```

### 4.2. Link project
```bash
cd weblienquan
vercel link
```

### 4.3. Pull env vars để chạy migration
```bash
# Tạo file .env.local từ Vercel (tự động gitignore)
vercel env pull .env.local

# Chạy Prisma migration
npx prisma migrate deploy
```

### 4.4. Xóa .env.local sau khi xong
```bash
rm .env.local
```

---

## Bước 5: Xác Minh Bảo Mật

### 5.1. Kiểm tra repo không có secrets
```bash
# Scan toàn bộ git history
git log -p | grep -i "password\|secret\|api_key" | head -20
```

### 5.2. Kiểm tra Vercel env vars
1. Vào **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Xác nhận tất cả sensitive vars có icon 🔒 (encrypted)

### 5.3. Test production
```bash
# Kiểm tra app hoạt động
curl https://your-app.vercel.app/api/health

# Kiểm tra admin login (dùng browser)
https://your-app.vercel.app/admin/login
```

---

## 🚨 Nếu Lỡ Commit Secrets

### Bước khẩn cấp:
1. **ROTATE NGAY** tất cả credentials bị lộ
2. **Xóa khỏi git history**:
   ```bash
   # Cài BFG Repo-Cleaner
   brew install bfg  # hoặc download từ https://rtyley.github.io/bfg-repo-cleaner/
   
   # Xóa file chứa secrets
   bfg --delete-files .env
   
   # Force push
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```
3. **Đổi mật khẩu** Supabase database
4. **Generate lại** SESSION_SECRET trên Vercel

---

## Checklist Cuối Cùng

| Item | ✅ |
|------|---|
| `.env` trong `.gitignore` | ☐ |
| Không có secrets trong code | ☐ |
| DATABASE_URL chỉ trên Vercel Dashboard | ☐ |
| SESSION_SECRET là random 32+ bytes | ☐ |
| ADMIN_PASSWORD_HASH dùng bcrypt | ☐ |
| Supabase password trong password manager | ☐ |
| HTTPS tự động (Vercel) | ☐ |
| Repo là Private | ☐ |

---

## Tài Liệu Tham Khảo

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase Database Connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/prisma)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
