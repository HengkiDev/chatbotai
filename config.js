// File ini sengaja tidak berisi endpoint API agar tidak terlihat di repository.
// Saat deploy via GitHub Actions, file ini akan dibuat otomatis dari secret CHATBOT_CONFIG_JSON.
// Untuk testing lokal, salin config.example.js ke config.local.js atau isi sementara di file ini,
// tapi jangan commit endpoint/key rahasia ke repository publik.
window.CHATBOT_CONFIG = {
  providers: []
};