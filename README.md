# MODIGI — modigi.jp

Website thương hiệu MODIGI (tiếng Nhật). Static site viết bằng Node.js ([Eleventy](https://www.11ty.dev/)), build ra HTML/CSS thuần nên chạy được trên gói Hostinger Premium/Single (shared hosting).

## Lệnh thường dùng

```bash
npm install          # lần đầu
npm run dev          # xem trước tại http://localhost:8080
npm run build        # build ra thư mục _site/
npm run sync         # cập nhật dữ liệu sản phẩm từ modigi_master.csv
npm run images       # chuyển ảnh gốc sang WebP
```

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `src/_data/site.js` | Tên, email, **link Amazon storefront**, menu |
| `src/_data/lines.js` | 4 dòng sản phẩm (Crocodile / Swift / Epsom / Essential): mô tả, ảnh, thông số |
| `src/_data/faq.js` | Câu hỏi thường gặp |
| `data/products.json` | Sinh tự động từ CSV (giá, size, màu, số mẫu); **không sửa tay** |
| `src/journal/*.md` | Bài blog. Thêm bài = thêm file `.md` mới (copy front matter của bài cũ) |
| `src/assets/css/main.css` | Toàn bộ thiết kế (màu, font ở đầu file `:root`) |
| `src/static/contact.php` | Xử lý form liên hệ → gửi mail tới modigijp@gmail.com |
| `scripts/import-images.mjs` | Danh sách ảnh + vùng crop |

## Cập nhật sản phẩm

1. Sửa `modigi_master.csv` như bình thường.
2. `npm run sync`: giá thấp nhất/cao nhất, số mẫu, màu, size trên web sẽ tự cập nhật.
3. `git commit -am "update products" && git push`: web tự deploy.

Đường dẫn CSV mặc định nằm trong `scripts/sync-products.mjs`. Nếu đổi chỗ để file, chạy `MODIGI_CSV=/đường/dẫn/file.csv npm run sync`.

## Thêm ảnh

Thêm một dòng vào `manifest` trong `scripts/import-images.mjs` (`crop` = vùng giữ lại, tỉ lệ 0–1, dùng để cắt bỏ chữ quảng cáo trên ảnh), rồi `npm run images`. Trong template dùng `{% img "ten-anh", "mô tả ảnh" %}`.

## Deploy tự động lên Hostinger

Mỗi lần `git push` lên nhánh `main`, GitHub Actions sẽ build và upload `_site/` lên Hostinger qua FTP.

**Cài đặt một lần:**

1. hPanel → **Files → FTP Accounts**: ghi lại *FTP IP/hostname*, *username*, đặt *password*.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**, tạo:
   - `FTP_SERVER`: ví dụ `ftp.modigi.jp` hoặc IP
   - `FTP_USERNAME`: ví dụ `u123456789.modigi.jp`
   - `FTP_PASSWORD`
   - *(tuỳ chọn)* `FTP_SERVER_DIR`: mặc định `public_html/`. Nếu sau khi đăng nhập FTP bạn đã ở sẵn trong `public_html`, đặt giá trị này là `./`
3. hPanel → **Emails**: tạo hộp thư `noreply@modigi.jp` để form liên hệ gửi mail không bị rơi vào spam.
4. Vào tab **Actions** trên GitHub để xem tiến trình deploy.

> Nếu bước FTP báo lỗi TLS, đổi `protocol: ftps` thành `protocol: ftp` trong `.github/workflows/deploy.yml`.
