const config = window.CHATBOT_CONFIG || {};
const providers = Array.isArray(config.providers)
  ? config.providers.filter((provider) => provider && provider.url)
  : [];

const form = document.querySelector("#chat-form");
const promptInput = document.querySelector("#prompt");
const messages = document.querySelector("#messages");
const sendButton = document.querySelector("#send-button");
const providerList = document.querySelector("#provider-list");
const providerSelect = document.querySelector("#provider-select");
const providerMenu = document.querySelector("#provider-menu");
const providerSelectedLabel = document.querySelector("#provider-selected-label");
const providerStatusDot = document.querySelector("#provider-status-dot");
const providerCount = document.querySelector("#provider-count");
const systemStatus = document.querySelector("#system-status");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
let selectedProviderValue = "auto";

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (providerCount) {
  providerCount.textContent = String(providers.length).padStart(2, "0");
}

if (providerList) {
  renderProviders();
}

if (providerSelect) {
  renderProviderOptions();
  providerSelect.addEventListener("click", () => {
    const isOpen = providerSelect.getAttribute("aria-expanded") === "true";
    setProviderMenuOpen(!isOpen);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".provider-select-wrap")) {
      setProviderMenuOpen(false);
    }
  });
}

if (messages) {
  messages.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-code-button");
    if (!button) return;

    const originalLabel = button.textContent;
    try {
      await copyTextToClipboard(button.dataset.code || "");
      button.textContent = "Copied";
      button.classList.add("is-copied");
    } catch (error) {
      button.textContent = "Gagal";
    }

    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove("is-copied");
    }, 1400);
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const prompt = promptInput.value.trim();
    if (!prompt) return;

    if (providers.length === 0) {
      addMessage(
        "error",
        "Provider AI belum dikonfigurasi. Tambahkan CHATBOT_CONFIG_JSON di GitHub Actions Secrets agar config.js dibuat saat deploy.",
        "AI Router · config kosong"
      );
      return;
    }

    addMessage("user", prompt, "Anda · prompt");
    promptInput.value = "";
    setLoading(true);
    const typingMessage = addTypingMessage();

    try {
      const selectedProvider = selectedProviderValue || "auto";
      const result = await askWithFallback(prompt, selectedProvider);
      removeMessage(typingMessage);
      addMessage("assistant", result.text, `${result.provider} · ${result.elapsed}ms`);
      updateProviderIndicator("ready");
    } catch (error) {
      removeMessage(typingMessage);
      addMessage("error", error.message, "AI Router · semua provider gagal");
      updateProviderIndicator("error");
    } finally {
      setLoading(false);
    }
  });
}

if (providers.length === 0) {
  if (sendButton) sendButton.disabled = true;
  if (promptInput) promptInput.disabled = true;
  if (systemStatus) systemStatus.textContent = "Config kosong";
  updateProviderIndicator("error");
  if (messages) {
    addMessage(
      "error",
      "Belum ada provider AI. Isi secret CHATBOT_CONFIG_JSON di GitHub, lalu deploy ulang. Untuk lokal, buat config.js sendiri dari config.example.js.",
      "AI Router · menunggu konfigurasi"
    );
  }
}

function renderProviders() {
  providerList.innerHTML = "";

  providers.forEach((provider, index) => {
    const item = document.createElement("div");
    item.className = "provider-item";
    const publicName = getPublicProviderName(provider, index);
    item.innerHTML = `
      <span class="status-dot ${index === 0 ? "green" : index % 2 === 0 ? "blue" : "red"}" aria-hidden="true"></span>
      <strong>${escapeHtml(publicName)}</strong>
      <span class="small-note">Jalur privat · fallback #${String(index + 1).padStart(2, "0")}</span>
    `;
    providerList.appendChild(item);
  });
}

function renderProviderOptions() {
  if (!providerMenu) return;

  providerMenu.innerHTML = "";
  providerMenu.appendChild(createProviderOption("auto", "Auto", "green"));

  providers.forEach((provider, index) => {
    const status = index === 0 ? "green" : index % 2 === 0 ? "blue" : "red";
    providerMenu.appendChild(createProviderOption(String(index), getPublicProviderName(provider, index), status));
  });
}

function getPublicProviderName(provider, index) {
  const rawName = String(provider?.name || `AI ${index + 1}`).trim();
  const cleanedName = rawName
    .replace(/^(Snowping|Siputzx)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleanedName || `AI ${index + 1}`;
}

function createProviderOption(value, label, status) {
  const option = document.createElement("button");
  option.type = "button";
  option.className = "provider-option";
  option.setAttribute("role", "option");
  option.setAttribute("aria-selected", value === selectedProviderValue ? "true" : "false");
  option.dataset.value = value;
  option.dataset.status = status;
  option.innerHTML = `
    <span class="status-dot ${status}" aria-hidden="true"></span>
    <span>${escapeHtml(label)}</span>
  `;
  option.addEventListener("click", () => selectProviderOption(value, label, status));
  return option;
}

function selectProviderOption(value, label, status = "green") {
  selectedProviderValue = value;
  if (providerSelectedLabel) providerSelectedLabel.textContent = label;
  updateProviderIndicator(status === "red" ? "error" : status === "blue" ? "loading" : "ready");
  providerMenu?.querySelectorAll(".provider-option").forEach((option) => {
    option.setAttribute("aria-selected", option.dataset.value === value ? "true" : "false");
  });
  setProviderMenuOpen(false);
}

function setProviderMenuOpen(isOpen) {
  if (!providerSelect || !providerMenu) return;
  providerSelect.setAttribute("aria-expanded", String(isOpen));
  providerMenu.classList.toggle("is-open", isOpen);
}

async function askWithFallback(prompt, selectedProvider = "auto") {
  if (providers.length === 0) {
    throw new Error("Provider AI belum dikonfigurasi.");
  }

  const failures = [];
  const selectedIndex = Number(selectedProvider);
  const selectedProviders = selectedProvider === "auto" || Number.isNaN(selectedIndex)
    ? providers.map((provider, index) => ({ provider, index }))
    : providers
      .map((provider, index) => ({ provider, index }))
      .filter((entry) => entry.index === selectedIndex);

  for (const { provider, index } of selectedProviders) {
    const startedAt = performance.now();
    const publicName = getPublicProviderName(provider, index);

    try {
      if (systemStatus) {
        systemStatus.textContent = publicName;
      }
      updateProviderIndicator("loading");
      const data = await callProvider(provider, prompt);
      const text = extractResponse(data, provider.responsePath);

      if (!text) {
        throw new Error("Respons provider kosong atau format tidak dikenali.");
      }

      return {
        provider: publicName,
        text,
        elapsed: Math.round(performance.now() - startedAt)
      };
    } catch (error) {
      failures.push(`${publicName}: ${error.message}`);
      updateProviderIndicator("error");
    }
  }

  console.warn("Semua provider chatbot gagal:", failures);
  throw new Error(
    selectedProvider === "auto"
      ? "Maaf, semua jalur AI sedang tidak bisa dihubungi. Coba lagi beberapa saat lagi atau tambahkan model lain di config.js."
      : "Maaf, model AI yang dipilih sedang tidak bisa dihubungi. Coba pilih Auto atau model AI lain."
  );
}

async function callProvider(provider, prompt) {
  if (!provider?.url) {
    throw new Error("URL provider belum dikonfigurasi.");
  }

  const method = (provider.method || "GET").toUpperCase();
  const url = provider.url.replace("{query}", encodeURIComponent(prompt));

  const options = {
    method,
    headers: provider.headers || {}
  };

  if (method !== "GET") {
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    options.body = JSON.stringify(buildBody(provider.body, prompt));
  }

  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { text: await response.text() };

  if (!response.ok) {
    throw new Error(extractResponse(data) || `HTTP ${response.status}`);
  }

  const apiError = extractApiError(data);
  if (apiError) {
    throw new Error(apiError);
  }

  return data;
}

function buildBody(template, prompt) {
  if (!template) return { q: prompt, prompt, message: prompt };

  return JSON.parse(JSON.stringify(template).replaceAll("{query}", prompt));
}

function extractResponse(data, preferredPath) {
  if (!data) return "";

  if (preferredPath) {
    const preferred = getByPath(data, preferredPath);
    if (typeof preferred === "string") return preferred;
  }

  const candidates = [
    "result.response",
    "result.answer",
    "result.message",
    "result.text",
    "data.response",
    "data.answer",
    "data.message",
    "data.text",
    "data",
    "response",
    "message",
    "answer",
    "text"
  ];

  for (const path of candidates) {
    const value = getByPath(data, path);
    if (typeof value === "string" && value.trim()) return value;
  }

  return typeof data === "string" ? data : "";
}

function extractApiError(data) {
  const possibleErrors = [
    "error.message",
    "result.error.message",
    "result.error.error.message",
    "message"
  ];

  for (const path of possibleErrors) {
    const value = getByPath(data, path);
    if (typeof value === "string" && value.trim()) return value;
  }

  if (data?.result?.success === false) {
    return "Provider mengembalikan status gagal.";
  }

  return "";
}

function getByPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function addMessage(type, text, meta) {
  const article = document.createElement("article");
  article.className = `message ${type}`;
  const body = type === "assistant"
    ? renderMarkdown(text)
    : `<p>${escapeHtml(text)}</p>`;

  article.innerHTML = `
    <div class="message-meta">${escapeHtml(meta)}</div>
    <div class="message-body">${body}</div>
  `;
  messages.appendChild(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
}

function renderMarkdown(value) {
  const source = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!source) return "<p>Respons kosong.</p>";

  const codeBlocks = [];
  let text = source.replace(/```([\s\S]*?)```/g, (_, code) => {
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    codeBlocks.push(renderCodeBlock(code.trim()));
    return `\n${token}\n`;
  });

  text = normalizeMarkdownTables(text);
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const html = blocks.map((block) => renderMarkdownBlock(block, codeBlocks)).join("");
  return html || `<p>${escapeHtml(source)}</p>`;
}

function normalizeMarkdownTables(text) {
  return text.replace(/(\|[^\n]+\|\s*){2,}/g, (match) => `\n\n${match.trim()}\n\n`);
}

function renderMarkdownBlock(block, codeBlocks) {
  const codeToken = block.match(/^@@CODE_BLOCK_(\d+)@@$/);
  if (codeToken) return codeBlocks[Number(codeToken[1])] || "";

  if (/^#{1,4}\s+/.test(block)) {
    const level = Math.min(block.match(/^#+/)[0].length, 4);
    return `<h${level}>${formatInline(block.replace(/^#{1,4}\s+/, ""))}</h${level}>`;
  }

  if (isMarkdownTable(block)) return renderMarkdownTable(block);

  if (/^(?:[-*]\s+|\d+\.\s+)/m.test(block)) return renderMarkdownList(block);

  return `<p>${formatInline(block).replace(/\n/g, "<br>")}</p>`;
}

function isMarkdownTable(block) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length >= 2 && lines.every((line) => line.startsWith("|") && line.endsWith("|"));
}

function renderMarkdownTable(block) {
  const rows = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const cleanRows = rows.filter((row) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(row));
  if (!cleanRows.length) return "";

  const cells = cleanRows.map((row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => formatInline(cell.trim())));
  const header = cells.shift();
  const bodyRows = cells.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");

  return `
    <div class="table-scroll">
      <table>
        <thead><tr>${header.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

function renderMarkdownList(block) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const ordered = lines.every((line) => /^\d+\.\s+/.test(line));
  const tag = ordered ? "ol" : "ul";
  const items = lines.map((line) => line.replace(/^(?:[-*]|\d+\.)\s+/, "")).map((line) => `<li>${formatInline(line)}</li>`).join("");
  return `<${tag}>${items}</${tag}>`;
}

function formatInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
function renderCodeBlock(code) {
  const escapedCode = escapeHtml(code);
  return `
    <div class="code-block">
      <div class="code-toolbar">
        <span>CODE</span>
        <button class="copy-code-button" type="button" data-code="${escapeHtmlAttribute(code)}" aria-label="Copy code">Copy</button>
      </div>
      <pre><code>${escapedCode}</code></pre>
    </div>
  `;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
function addTypingMessage() {
  if (!messages) return null;

  const article = document.createElement("article");
  article.className = "message assistant typing-message";
  article.innerHTML = `
    <div class="message-meta">Hengki Chatbot AI · mengetik</div>
    <div class="typing-dots" aria-label="AI sedang mengetik">
      <span></span><span></span><span></span>
    </div>
  `;
  messages.appendChild(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
}

function removeMessage(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

function updateProviderIndicator(state = "ready") {
  if (!providerStatusDot) return;

  providerStatusDot.classList.remove("green", "red", "blue");
  if (state === "error") {
    providerStatusDot.classList.add("red");
    providerStatusDot.title = "Model terakhir gagal";
  } else if (state === "loading") {
    providerStatusDot.classList.add("blue");
    providerStatusDot.title = "Model sedang memproses";
  } else {
    providerStatusDot.classList.add("green");
    providerStatusDot.title = "Model siap digunakan";
  }
}

function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  const sendLabel = sendButton.querySelector(".send-label");
  if (sendLabel) {
    sendLabel.textContent = isLoading ? "Memproses" : "Kirim";
  }
  sendButton.setAttribute("aria-label", isLoading ? "Sedang memproses pesan" : "Kirim pesan");
  if (systemStatus) {
    systemStatus.textContent = isLoading ? "Routing" : "Ready";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}





