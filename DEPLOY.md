# Panduan Deploy GitHub Pages

## 1. Push project ke GitHub

```bash
git init
git add .
git commit -m "Initial chatbot website"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA_REPO.git
git push -u origin main
```

Ganti `USERNAME` dan `NAMA_REPO` sesuai repository kamu.

## 2. Tambahkan GitHub Secret

Buka repository GitHub:

```txt
Settings -> Secrets and variables -> Actions -> New repository secret
```

Isi:

```txt
Name: CHATBOT_CONFIG_JSON
```

Untuk value, copy dari file:

```txt
github-secret-value.txt
```

Copy bagian **Secret value** satu baris penuh.

File `github-secret-value.txt` sudah masuk `.gitignore`, jadi jangan `git add -f` file itu. Tujuannya supaya daftar endpoint/API tidak ikut tampil di repository.

## 3. Aktifkan GitHub Pages

Buka:

```txt
Settings -> Pages -> Build and deployment
```

Pilih:

```txt
Source: GitHub Actions
```

## 4. Jalankan deploy

Deploy otomatis berjalan setiap push ke branch `main`.

Kamu juga bisa menjalankan manual:

```txt
Actions -> Deploy static chatbot -> Run workflow
```

## Penting tentang keamanan API

GitHub Secret membuat value tidak terlihat di repository. Tapi karena website ini statis, file `config.js` hasil deploy tetap dikirim ke browser, jadi endpoint API masih bisa dilihat di DevTools.

Kalau kamu punya API key/token rahasia, jangan taruh langsung di frontend. Gunakan proxy/backend:

```txt
Browser -> Backend/Proxy kamu -> API asli
```

Rekomendasi gratis: Cloudflare Workers, Vercel Functions, atau Netlify Functions.