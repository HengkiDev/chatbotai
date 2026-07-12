// File fallback untuk lokal. Website produksi memuat config.generated.js
// yang dibuat otomatis oleh GitHub Actions dari secret CHATBOT_CONFIG_JSON.
// Jangan commit endpoint/key rahasia ke repository publik.
window.CHATBOT_CONFIG = {
  providers: []
};