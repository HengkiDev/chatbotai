# Hengki Chatbot AI

Website chatbot AI statis menggunakan HTML, CSS, dan JavaScript. Desain mengikuti brief `desain.md`: industrial, presisi, minimalis, grid teknik, warna biru industri, silver, putih, dan tipografi Roboto/JetBrains Mono.

## Fitur

- UI chatbot responsif tanpa framework.
- Konfigurasi banyak API provider.
- Fallback otomatis: jika provider pertama gagal, lanjut ke provider berikutnya.
- Deteksi beberapa format respons umum seperti `result.response`, `response`, `message`, `answer`, dan `text`.
- GitHub Actions workflow untuk membuat `config.js` dari repository secret saat deploy ke GitHub Pages.

## Menjalankan Lokal

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Menambah API Provider

Edit `config.js` untuk lokal atau buat dari `config.example.js`:

```js
window.CHATBOT_CONFIG = {
  providers: [
    {
      name: "Provider GET",
      url: "https://domain-provider-kamu.example/api/chat?q={query}",
      method: "GET",
      responsePath: "result.response"
    },
    {
      name: "OpenAI Chat",
      url: "https://domain-provider-lain.example/api/chat?q={query}",
      method: "GET",
      responsePath: "result.response"
    },
    {
      name: "Provider Lain",
      url: "https://domain-provider-ketiga.example/api/chat?q={query}",
      method: "GET",
      responsePath: "result.text"
    }
  ]
};
```

Untuk provider `POST`, contoh:

```js
{
  name: "POST Provider",
  url: "https://domain-provider-kamu.example/api/chat",
  method: "POST",
  body: {
    prompt: "{query}"
  },
  responsePath: "answer"
}
```

## Setup GitHub Actions Secrets

1. Buka repository GitHub.
2. Masuk ke **Settings → Secrets and variables → Actions**.
3. Klik **New repository secret**.
4. Nama secret: `CHATBOT_CONFIG_JSON`.
5. Isi value dengan JSON valid. Saya sudah siapkan contoh lengkap di file `github-secret-value.txt`.

Contoh ringkas tanpa endpoint asli:

```json
{"providers":[{"name":"Provider GET","url":"https://domain-provider-kamu.example/api/chat?q={query}","method":"GET","responsePath":"result.response"}]}
```

6. Push ke branch `main`, lalu workflow `.github/workflows/deploy.yml` akan membuat `config.js` saat deploy.

Panduan deploy lengkap ada di `DEPLOY.md`.

## Catatan Keamanan Penting

GitHub Actions secret mencegah nilai sensitif terlihat di repository. Namun jika secret dipakai untuk menghasilkan JavaScript frontend, hasil akhirnya tetap dikirim ke browser dan bisa dilihat lewat DevTools.

Untuk menyembunyikan API key secara benar:

- gunakan backend/proxy server;
- simpan API key hanya di server;
- frontend hanya memanggil endpoint milik backend Anda.

Website ini cocok untuk endpoint publik tanpa key atau demo multi-provider. Untuk key pribadi, lanjutkan dengan backend proxy.