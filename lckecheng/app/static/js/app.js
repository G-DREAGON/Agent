// === Constants ===
const API_BASE = "/api/v1";
const STORAGE_KEY_THREADS = "personal_chief_threads";
const STORAGE_KEY_ACTIVE = "personal_chief_active_thread";

// === State ===
const state = {
  threads: {},
  activeThreadId: null,
  isStreaming: false,
  pendingImage: null,
};

// === DOM refs ===
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  threadList: $("#threadList"),
  btnNewChat: $("#btnNewChat"),
  chatTitle: $("#chatTitle"),
  chatMessages: $("#chatMessages"),
  chatInput: $("#chatInput"),
  btnSend: $("#btnSend"),
  btnUpload: $("#btnUpload"),
  fileInput: $("#fileInput"),
  btnClearChat: $("#btnClearChat"),
  imagePreview: $("#imagePreview"),
  previewImg: $("#previewImg"),
  btnRemoveImage: $("#btnRemoveImage"),
  uploadStatus: $("#uploadStatus"),
  currentImageUrl: $("#currentImageUrl"),
};

// === Init ===
function init() {
  loadThreads();
  if (!state.activeThreadId || !state.threads[state.activeThreadId]) {
    createThread();
  }
  renderThreadList();
  switchThread(state.activeThreadId);
  bindEvents();
}

function loadThreads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THREADS);
    state.threads = raw ? JSON.parse(raw) : {};
  } catch { state.threads = {}; }
  state.activeThreadId = localStorage.getItem(STORAGE_KEY_ACTIVE);
}

function saveThreads() {
  localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(state.threads));
  localStorage.setItem(STORAGE_KEY_ACTIVE, state.activeThreadId || "");
}

function createThread() {
  const id = "thread_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  state.threads[id] = { id, title: "\u65b0\u5bf9\u8bdd", messages: [], createdAt: Date.now() };
  state.activeThreadId = id;
  saveThreads();
}

// === Render ===
function renderThreadList() {
  dom.threadList.innerHTML = "";
  const sorted = Object.values(state.threads).sort((a, b) => b.createdAt - a.createdAt);
  sorted.forEach(t => {
    const el = document.createElement("div");
    el.className = "thread-item" + (t.id === state.activeThreadId ? " active" : "");
    el.textContent = t.title;
    el.addEventListener("click", () => switchThread(t.id));
    dom.threadList.appendChild(el);
  });
}

function switchThread(id) {
  state.activeThreadId = id;
  saveThreads();
  const t = state.threads[id];
  dom.chatTitle.textContent = t ? t.title : "\u65b0\u5bf9\u8bdd";
  renderMessages();
  renderThreadList();
}

function renderWelcome() {
  dom.chatMessages.innerHTML =
    '<div class="welcome">' +
    '  <div class="welcome-icon">' +
    '    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' +
    '  </div>' +
    '  <h2>\u6b22\u8fce\u4f7f\u7528\u79c1\u53a8</h2>' +
    '  <p>\u62cd\u4e00\u5f20\u98df\u6750\u7167\u7247\uff0c\u6216\u8005\u76f4\u63a5\u544a\u8bc9\u6211\u4f60\u6709\u4ec0\u4e48\u98df\u6750\uff0c\u6211\u6765\u5e2e\u4f60\u63a8\u8350\u7f8e\u5473\u98df\u8c31</p>' +
    '  <div class="quick-prompts">' +
    '    <button class="quick-prompt" data-prompt="\u51b0\u7bb1\u91cc\u6709\u9e21\u86cb\u3001\u897f\u7ea2\u67ff\u3001\u9752\u6912\uff0c\u80fd\u505a\u4ec0\u4e48\u83dc\uff1f">\u51b0\u7bb1\u91cc\u6709\u9e21\u86cb\u3001\u897f\u7ea2\u67ff\u3001\u9752\u6912\uff0c\u80fd\u505a\u4ec0\u4e48\u83dc\uff1f</button>' +
    '    <button class="quick-prompt" data-prompt="\u6211\u6709\u9e21\u80f8\u8089\u548c\u897f\u5170\u82b1\uff0c\u63a8\u8350\u4f4e\u8102\u98df\u8c31">\u6211\u6709\u9e21\u80f8\u8089\u548c\u897f\u5170\u82b1\uff0c\u63a8\u8350\u4f4e\u8102\u98df\u8c31</button>' +
    '    <button class="quick-prompt" data-prompt="\u571f\u8c46\u3001\u80e1\u841d\u535c\u3001\u6d0b\u8471\u80fd\u642d\u914d\u4ec0\u4e48\u83dc\uff1f">\u571f\u8c46\u3001\u80e1\u841d\u535c\u3001\u6d0b\u8471\u80fd\u642d\u914d\u4ec0\u4e48\u83dc\uff1f</button>' +
    '  </div>' +
    '</div>';
  dom.chatMessages.querySelectorAll(".quick-prompt").forEach(btn => {
    btn.addEventListener("click", () => {
      dom.chatInput.value = btn.dataset.prompt;
      dom.chatInput.focus();
      sendMessage();
    });
  });
}

function renderMessages() {
  const t = state.threads[state.activeThreadId];
  dom.chatMessages.innerHTML = "";
  if (!t || t.messages.length === 0) {
    renderWelcome();
    return;
  }
  t.messages.forEach(msg => appendMessageBubble(msg.role, msg.content, msg.imageUrl));
  scrollToBottom();
}

function appendMessageBubble(role, content, imageUrl) {
  const welcomeEl = dom.chatMessages.querySelector(".welcome");
  if (welcomeEl) welcomeEl.remove();

  const wrapper = document.createElement("div");
  wrapper.className = "message " + role;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "\u6211" : "\u53a8";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "\u98df\u6750\u7167\u7247";
    bubble.appendChild(img);
  }
  if (content) {
    const textEl = document.createElement("div");
    textEl.innerHTML = formatContent(content);
    bubble.appendChild(textEl);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  dom.chatMessages.appendChild(wrapper);
  scrollToBottom();
  return bubble;
}

function formatContent(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function scrollToBottom() {
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

// === Chat ===
async function sendMessage() {
  if (state.isStreaming) return;

  const text = dom.chatInput.value.trim();
  const imageUrl = dom.currentImageUrl.value.trim();
  if (!text && !imageUrl) return;

  const t = state.threads[state.activeThreadId];
  if (!t) return;

  if (t.messages.length === 0 && text) {
    t.title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
    dom.chatTitle.textContent = t.title;
    renderThreadList();
  }

  t.messages.push({ role: "user", content: text, imageUrl: imageUrl || undefined });
  appendMessageBubble("user", text, imageUrl || undefined);

  dom.chatInput.value = "";
  dom.chatInput.style.height = "auto";
  clearImage();
  saveThreads();

  t.messages.push({ role: "assistant", content: "", imageUrl: undefined });
  const bubble = appendMessageBubble("assistant", "");
  const typingEl = document.createElement("div");
  typingEl.className = "typing-dots";
  typingEl.innerHTML = "<span></span><span></span><span></span>";
  bubble.appendChild(typingEl);

  scrollToBottom();
  state.isStreaming = true;
  updateSendButton();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let res;
    try {
      res = await fetch(API_BASE + "/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image_url: imageUrl || null,
          thread_id: state.activeThreadId,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) throw new Error("\u670d\u52a1\u5668\u54cd\u5e94\u5f02\u5e38 (" + res.status + ")");

    if (typingEl.parentNode) typingEl.remove();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.content || (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) || "";
            if (delta) {
              fullContent += delta;
              const tc = bubble.querySelector("div:last-child") || bubble;
              tc.innerHTML = formatContent(fullContent);
              tc.classList.add("streaming-cursor");
              scrollToBottom();
            }
          } catch {
            fullContent += data;
            const tc = bubble.querySelector("div:last-child") || bubble;
            tc.innerHTML = formatContent(fullContent);
            scrollToBottom();
          }
        }
      }
    }

    const tc = bubble.querySelector("div:last-child") || bubble;
    tc.classList.remove("streaming-cursor");
    tc.innerHTML = formatContent(fullContent);
    t.messages[t.messages.length - 1].content = fullContent;
    saveThreads();

  } catch (err) {
    if (typingEl.parentNode) typingEl.remove();
    const tc = bubble.querySelector("div:last-child") || bubble;
    tc.innerHTML = '<span style="color:#b91c1c">\u62b1\u6b49\uff0c\u51fa\u4e86\u70b9\u95ee\u9898\uff1a' + escapeHtml(err.message) + "</span>";
    t.messages[t.messages.length - 1].content = "[\u9519\u8bef] " + err.message;
    saveThreads();
  } finally {
    state.isStreaming = false;
    updateSendButton();
    scrollToBottom();
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// === Image Upload ===
async function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showUploadStatus("\u8bf7\u9009\u62e9\u56fe\u7247\u6587\u4ef6", true);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showUploadStatus("\u56fe\u7247\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc7 10MB", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    dom.previewImg.src = reader.result;
    dom.imagePreview.style.display = "inline-block";
  };
  reader.readAsDataURL(file);

  showUploadStatus("\u6b63\u5728\u4e0a\u4f20...");

  try {
    const uploadRes = await fetch(API_BASE + "/oss/upload", {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(errText || "\u4e0a\u4f20\u5931\u8d25");
    }

    const { accessUrl } = await uploadRes.json();
    dom.currentImageUrl.value = accessUrl;
    showUploadStatus("\u4e0a\u4f20\u5b8c\u6210");
    setTimeout(() => { dom.uploadStatus.style.display = "none"; }, 2000);
  } catch (err) {
    showUploadStatus(err.message, true);
    clearImage();
  }
}

function showUploadStatus(msg, isError) {
  dom.uploadStatus.textContent = msg;
  dom.uploadStatus.style.color = isError ? "#b91c1c" : "var(--text-muted)";
  dom.uploadStatus.style.display = "flex";
}

function clearImage() {
  state.pendingImage = null;
  dom.currentImageUrl.value = "";
  dom.imagePreview.style.display = "none";
  dom.previewImg.src = "";
  dom.uploadStatus.style.display = "none";
  dom.fileInput.value = "";
}

// === Actions ===
async function clearChat() {
  const t = state.threads[state.activeThreadId];
  if (!t) return;
  try {
    await fetch(API_BASE + "/chat/messages?thread_id=" + encodeURIComponent(state.activeThreadId), { method: "DELETE" });
  } catch { /* proceed */ }
  t.messages = [];
  t.title = "\u65b0\u5bf9\u8bdd";
  saveThreads();
  renderMessages();
  dom.chatTitle.textContent = "\u65b0\u5bf9\u8bdd";
  renderThreadList();
}

function updateSendButton() {
  dom.btnSend.disabled = state.isStreaming;
}

function autoResize() {
  dom.chatInput.style.height = "auto";
  dom.chatInput.style.height = Math.min(dom.chatInput.scrollHeight, 120) + "px";
}

// === Events ===
function bindEvents() {
  dom.btnSend.addEventListener("click", sendMessage);
  dom.btnUpload.addEventListener("click", () => dom.fileInput.click());
  dom.fileInput.addEventListener("change", handleImageSelect);
  dom.btnRemoveImage.addEventListener("click", clearImage);
  dom.btnClearChat.addEventListener("click", clearChat);
  dom.btnNewChat.addEventListener("click", () => {
    createThread();
    renderThreadList();
    switchThread(state.activeThreadId);
  });
  dom.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  dom.chatInput.addEventListener("input", autoResize);
}

// === Start ===
init();