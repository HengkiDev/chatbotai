// Contoh struktur config tanpa endpoint asli.
// Untuk lokal, salin file ini ke config.js lalu isi URL provider sendiri.
// Untuk deploy GitHub Pages, simpan JSON provider di secret CHATBOT_CONFIG_JSON.
window.CHATBOT_CONFIG = {
  providers: [
    {
      name: "Provider GET",
      url: "https://domain-provider-kamu.example/api/chat?q={query}",
      method: "GET",
      responsePath: "result.response"
    },
    {
      name: "Provider POST",
      url: "https://domain-provider-kamu.example/api/chat",
      method: "POST",
      body: {
        prompt: "{query}"
      },
      responsePath: "answer"
    }
  ]
};