/**
 * app.js
 * Điều khiển giao diện, hội thoại, trạng thái API Key và thao tác người dùng.
 */

import {
  loadApiKey,
  saveApiKey,
  removeApiKey,
  loadConversations,
  saveConversations
} from "./storage.js";
import { generateReply, testConnection } from "./gemini.js";

// Gom các phần tử giao diện thường dùng để tránh truy vấn DOM lặp lại.
const el = {
  sidebar: document.getElementById("sidebar"),
  backdrop: document.getElementById("sidebarBackdrop"),
  openSidebar: document.getElementById("openSidebarBtn"),
  closeSidebar: document.getElementById("closeSidebarBtn"),
  newChat: document.getElementById("newChatBtn"),
  clearChat: document.getElementById("clearChatBtn"),
  conversationList: document.getElementById("conversationList"),
  conversationCount: document.getElementById("conversationCount"),
  historyEmpty: document.getElementById("historyEmpty"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  saveKey: document.getElementById("saveKeyBtn"),
  testKey: document.getElementById("testKeyBtn"),
  removeKey: document.getElementById("removeKeyBtn"),
  keyStatus: document.getElementById("keyStatus"),
  connectionPill: document.getElementById("connectionPill"),
  connectionLabel: document.getElementById("connectionLabel"),
  welcome: document.getElementById("welcomePanel"),
  messageList: document.getElementById("messageList"),
  chatStage: document.getElementById("chatStage"),
  chatForm: document.getElementById("chatForm"),
  userInput: document.getElementById("userInput"),
  sendBtn: document.getElementById("sendBtn"),
  characterCount: document.getElementById("characterCount"),
  toastRegion: document.getElementById("toastRegion")
};

// Dữ liệu được nạp từ localStorage của trình duyệt hiện tại.
let apiKey = loadApiKey();
let conversations = loadConversations();
let activeConversationId = conversations[0]?.id || null;
let isSending = false;
let isCheckingConnection = false;

// Có khóa lưu trước đó không đồng nghĩa khóa đã được kiểm tra kết nối.
let connectionState = apiKey ? "saved" : "none";
let connectedModel = "";

/** Tạo ID riêng cho từng cuộc trò chuyện. */
function createId() {
  return globalThis.crypto?.randomUUID?.() ||
    `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Tạo cuộc trò chuyện rỗng mới. */
function createConversation() {
  return {
    id: createId(),
    title: "Cuộc trò chuyện mới",
    updatedAt: new Date().toISOString(),
    messages: []
  };
}

/** Lấy cuộc trò chuyện đang được chọn. */
function activeConversation() {
  return conversations.find((item) => item.id === activeConversationId) || null;
}

/** Lưu danh sách hội thoại và thông báo nếu trình duyệt từ chối lưu. */
function persistConversations() {
  if (!saveConversations(conversations)) {
    showToast("Không thể lưu lịch sử chat. Bộ nhớ trình duyệt có thể đã đầy.", "error");
  }
}

/** Hiện thông báo ngắn ở góc màn hình. */
function showToast(message, type = "success") {
  const node = document.createElement("div");
  node.className = `toast ${type === "error" ? "error" : ""}`;
  node.textContent = message;
  el.toastRegion.append(node);
  window.setTimeout(() => node.remove(), 3600);
}

/** Đồng bộ trạng thái API Key và trạng thái kiểm tra kết nối lên giao diện. */
function updateConnectionUI() {
  const hasKey = Boolean(apiKey);

  const states = {
    none: {
      key: "Chưa cấu hình API Key",
      pill: "Chưa kết nối",
      className: ""
    },
    saved: {
      key: "API Key đã lưu • Chưa kiểm tra",
      pill: "Chưa kiểm tra",
      className: ""
    },
    unverified: {
      key: "API Key mới • Chưa kiểm tra",
      pill: "Chưa kiểm tra",
      className: ""
    },
    checking: {
      key: "Đang kiểm tra kết nối Gemini...",
      pill: "Đang kiểm tra",
      className: "is-checking"
    },
    connected: {
      key: connectedModel ? `Đã kết nối • ${connectedModel}` : "Đã kiểm tra kết nối",
      pill: "Gemini đã kết nối",
      className: "is-connected"
    },
    error: {
      key: "Đã lưu nhưng kiểm tra kết nối thất bại",
      pill: "Lỗi kết nối",
      className: "is-error"
    },
    warning: {
      key: "Đã lưu • Yêu cầu gần nhất chưa hoàn tất",
      pill: "Cần kiểm tra",
      className: "is-checking"
    }
  };

  const state = states[connectionState] || states.none;
  el.keyStatus.textContent = state.key;
  el.connectionLabel.textContent = state.pill;
  el.connectionPill.classList.remove("is-connected", "is-checking", "is-error");
  if (state.className) {
    el.connectionPill.classList.add(state.className);
  }

  el.apiKeyInput.placeholder = hasKey
    ? "API Key đã được lưu trên thiết bị"
    : "Dán API Key tại đây";

  el.testKey.textContent = isCheckingConnection ? "Đang kiểm tra..." : "Kiểm tra kết nối";
  el.testKey.disabled = isCheckingConnection || isSending ||
    (!hasKey && !el.apiKeyInput.value.trim());
}

/** Tạo danh sách lịch sử hội thoại ở thanh bên. */
function renderConversationList() {
  el.conversationList.replaceChildren();
  el.conversationCount.textContent = String(conversations.length);
  el.historyEmpty.hidden = conversations.length > 0;

  [...conversations]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((conversation) => {
      const item = document.createElement("div");
      item.className = `conversation-item ${conversation.id === activeConversationId ? "active" : ""}`;
      item.dataset.id = conversation.id;
      item.setAttribute("role", "button");
      item.tabIndex = 0;
      item.setAttribute("aria-label", `Mở cuộc trò chuyện: ${conversation.title}`);

      const icon = document.createElement("span");
      icon.className = "conversation-icon";
      icon.textContent = "◌";

      const title = document.createElement("span");
      title.className = "conversation-title";
      title.textContent = conversation.title;

      const remove = document.createElement("button");
      remove.className = "delete-conversation";
      remove.type = "button";
      remove.dataset.deleteId = conversation.id;
      remove.setAttribute("aria-label", `Xóa cuộc trò chuyện ${conversation.title}`);
      remove.textContent = "×";

      item.append(icon, title, remove);
      el.conversationList.append(item);
    });
}

/**
 * Chuyển Markdown thành HTML an toàn.
 * Nếu thư viện CDN không tải được, hiển thị câu trả lời dưới dạng văn bản thuần.
 */
function safeMarkdown(text) {
  if (!window.marked || !window.DOMPurify) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }

  const html = window.marked.parse(text, { breaks: true });
  const safeHtml = window.DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "iframe", "form", "input", "button"],
    FORBID_ATTR: ["style", "onerror", "onclick"]
  });

  const wrapper = document.createElement("div");
  wrapper.innerHTML = safeHtml;
  wrapper.querySelectorAll("a").forEach((link) => {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  return wrapper;
}

/** Định dạng giờ gửi tin nhắn theo tiếng Việt. */
function formatTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

/** Tạo phần tử hiển thị một tin nhắn. */
function createMessageElement(message, index) {
  const row = document.createElement("article");
  row.className = `message-row ${message.role === "user" ? "user" : "assistant"}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = message.role === "user" ? "Bạn" : "✦";
  avatar.setAttribute("aria-hidden", "true");

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (message.pending) {
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.setAttribute("aria-label", "AI đang suy nghĩ");
    typing.append("Đang suy nghĩ ");

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      typing.append(dot);
    }
    bubble.append(typing);
  } else if (message.role === "user") {
    bubble.textContent = message.text;
  } else {
    bubble.append(safeMarkdown(message.text));
  }

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const time = document.createElement("span");
  time.textContent = formatTime(message.createdAt || new Date().toISOString());
  meta.append(time);

  if (message.role === "model" && !message.pending) {
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-button";
    copy.textContent = "Sao chép";
    copy.dataset.copyIndex = String(index);
    meta.append(copy);
  }

  content.append(bubble, meta);
  row.append(avatar, content);
  return row;
}

/** Vẽ lại nội dung của cuộc trò chuyện đang chọn. */
function renderMessages() {
  const conversation = activeConversation();
  const messages = conversation?.messages || [];

  el.messageList.replaceChildren();
  el.welcome.hidden = messages.length > 0;
  messages.forEach((message, index) => {
    el.messageList.append(createMessageElement(message, index));
  });

  el.chatStage.scrollTop = el.chatStage.scrollHeight;
}

/** Cập nhật toàn bộ vùng giao diện phụ thuộc dữ liệu. */
function render() {
  renderConversationList();
  renderMessages();
  updateConnectionUI();
}

/** Đóng hoặc mở thanh điều hướng trên màn hình nhỏ. */
function closeSidebar() {
  el.sidebar.classList.remove("is-open");
  el.backdrop.classList.remove("is-visible");
}

function openSidebar() {
  el.sidebar.classList.add("is-open");
  el.backdrop.classList.add("is-visible");
}

/** Tạo cuộc trò chuyện mới và chuyển sang cuộc trò chuyện đó. */
function newConversation() {
  if (isSending) return;

  const conversation = createConversation();
  conversations.unshift(conversation);
  activeConversationId = conversation.id;

  persistConversations();
  render();
  closeSidebar();
  el.userInput.focus();
}

/** Xóa một cuộc trò chuyện khỏi lịch sử cục bộ. */
function deleteConversation(id) {
  if (isSending) return;

  conversations = conversations.filter((item) => item.id !== id);
  if (activeConversationId === id) {
    activeConversationId = conversations[0]?.id || null;
  }

  persistConversations();
  render();
}

/** Cập nhật số ký tự và trạng thái nút gửi. */
function updateComposer() {
  const length = el.userInput.value.length;
  el.characterCount.textContent = `${length} / 8000`;
  el.sendBtn.disabled = isSending || !el.userInput.value.trim();
  updateConnectionUI();
}

/** Khóa hoặc mở khung nhập trong lúc đang gửi yêu cầu. */
function setSending(value) {
  isSending = value;
  el.userInput.disabled = value;
  el.sendBtn.disabled = value || !el.userInput.value.trim();
  el.sendBtn.querySelector("span:first-child").textContent =
    value ? "Đang gửi..." : "Gửi tin nhắn";
  updateConnectionUI();
}

/**
 * Gửi một câu hỏi đến Gemini, lưu câu hỏi và câu trả lời vào lịch sử.
 */
async function sendMessage(prefilled = "") {
  if (isSending) return;

  const text = (prefilled || el.userInput.value).trim();
  if (!text) return;

  if (!apiKey) {
    showToast("Bạn hãy nhập và lưu Gemini API Key ở thanh bên trước khi gửi tin nhắn.", "error");
    openSidebar();
    el.apiKeyInput.focus();
    return;
  }

  if (!activeConversationId) {
    const conversation = createConversation();
    conversations.unshift(conversation);
    activeConversationId = conversation.id;
  }

  const conversation = activeConversation();
  if (!conversation) return;

  conversation.messages.push({
    role: "user",
    text,
    createdAt: new Date().toISOString()
  });

  const userMessageCount = conversation.messages.filter(
    (message) => message.role === "user"
  ).length;

  if (userMessageCount === 1) {
    conversation.title = text.length > 42
      ? `${text.slice(0, 42).trim()}…`
      : text;
  }

  conversation.updatedAt = new Date().toISOString();
  el.userInput.value = "";
  updateComposer();

  setSending(true);
  conversation.messages.push({
    role: "model",
    text: "",
    pending: true,
    createdAt: new Date().toISOString()
  });

  persistConversations();
  render();

  try {
    const history = conversation.messages.filter(
      (message) => !message.pending && !message.localError
    );
    const result = await generateReply(apiKey, history);

    conversation.messages.pop();
    conversation.messages.push({
      role: "model",
      text: result.text,
      model: result.model,
      createdAt: new Date().toISOString()
    });

    conversation.updatedAt = new Date().toISOString();
    connectionState = "connected";
    connectedModel = result.model;
    persistConversations();
  } catch (error) {
    conversation.messages.pop();
    conversation.messages.push({
      role: "model",
      text: `**Mình chưa thể trả lời lúc này.**\n\n${error.message}\n\nBạn có thể kiểm tra API Key, kết nối mạng hoặc thử lại sau.`,
      localError: true,
      createdAt: new Date().toISOString()
    });

    connectionState = error.status === 429 ? "warning" : "error";
    persistConversations();
  } finally {
    setSending(false);
    render();
    el.userInput.focus();
  }
}

/** Kiểm tra một API Key bằng yêu cầu ngắn đến Gemini. */
async function runConnectionTest(candidateKey) {
  if (isCheckingConnection || isSending) return;

  isCheckingConnection = true;
  connectionState = "checking";
  updateConnectionUI();

  try {
    const result = await testConnection(candidateKey);

    // Chỉ lưu khóa mới sau khi kiểm tra API thành công.
    if (!saveApiKey(candidateKey)) {
      throw new Error("Gemini đã phản hồi nhưng trình duyệt không cho phép lưu API Key.");
    }

    apiKey = candidateKey;
    connectedModel = result.model;
    connectionState = "connected";
    el.apiKeyInput.value = "";
    showToast(`Kết nối Gemini thành công với ${result.model}.`);
  } catch (error) {
    connectionState = error.status === 429 ? "warning" : "error";
    showToast(error.message, "error");
  } finally {
    isCheckingConnection = false;
    updateConnectionUI();
  }
}

// Lưu API Key: thao tác lưu không tự nhận là đã kết nối.
el.saveKey.addEventListener("click", () => {
  const value = el.apiKeyInput.value.trim();

  if (!value) {
    showToast("Bạn chưa nhập API Key.", "error");
    el.apiKeyInput.focus();
    return;
  }

  if (!saveApiKey(value)) {
    showToast("Trình duyệt không cho phép lưu API Key. Hãy kiểm tra cài đặt quyền riêng tư.", "error");
    return;
  }

  apiKey = value;
  connectionState = "saved";
  connectedModel = "";
  el.apiKeyInput.value = "";
  updateConnectionUI();
  showToast("Đã lưu API Key. Hãy chọn “Kiểm tra kết nối” để xác nhận Gemini hoạt động.");
});

// Kiểm tra khóa đang nhập; nếu ô trống thì dùng khóa đã lưu.
el.testKey.addEventListener("click", () => {
  const candidateKey = el.apiKeyInput.value.trim() || apiKey;

  if (!candidateKey) {
    showToast("Bạn hãy nhập API Key trước khi kiểm tra.", "error");
    el.apiKeyInput.focus();
    return;
  }

  runConnectionTest(candidateKey);
});

// Xóa khóa khỏi localStorage của trình duyệt hiện tại.
el.removeKey.addEventListener("click", () => {
  if (!apiKey) {
    showToast("Hiện chưa có API Key được lưu.", "error");
    return;
  }

  if (!removeApiKey()) {
    showToast("Không thể xóa API Key khỏi localStorage của trình duyệt.", "error");
    return;
  }

  apiKey = "";
  connectionState = "none";
  connectedModel = "";
  el.apiKeyInput.value = "";
  updateConnectionUI();
  showToast("Đã xóa API Key khỏi trình duyệt.");
});

// Sự kiện điều hướng và quản lý hội thoại.
el.newChat.addEventListener("click", newConversation);
el.clearChat.addEventListener("click", newConversation);
el.openSidebar.addEventListener("click", openSidebar);
el.closeSidebar.addEventListener("click", closeSidebar);
el.backdrop.addEventListener("click", closeSidebar);

// Chọn hoặc xóa hội thoại bằng event delegation.
el.conversationList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-delete-id]");
  if (removeButton) {
    event.stopPropagation();
    deleteConversation(removeButton.dataset.deleteId);
    return;
  }

  const item = event.target.closest("[data-id]");
  if (item && !isSending) {
    activeConversationId = item.dataset.id;
    render();
    closeSidebar();
  }
});

// Cho phép mở hội thoại bằng Enter hoặc Space.
el.conversationList.addEventListener("keydown", (event) => {
  const isActivationKey = event.key === "Enter" || event.key === " ";
  if (isActivationKey && event.target.matches(".conversation-item")) {
    event.preventDefault();

    if (!isSending) {
      activeConversationId = event.target.dataset.id;
      render();
      closeSidebar();
    }
  }
});

// Sao chép câu trả lời vào clipboard.
el.messageList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-index]");
  if (!button) return;

  const message = activeConversation()?.messages[Number(button.dataset.copyIndex)];
  if (!message?.text) return;

  try {
    await navigator.clipboard.writeText(message.text);
    button.textContent = "Đã sao chép";
    window.setTimeout(() => {
      button.textContent = "Sao chép";
    }, 1400);
  } catch {
    showToast("Không thể sao chép tự động trên trình duyệt này.", "error");
  }
});

// Các thẻ gợi ý dùng chung luồng gửi câu hỏi.
el.welcome.addEventListener("click", (event) => {
  const card = event.target.closest("[data-prompt]");
  if (card) sendMessage(card.dataset.prompt);
});

// Gửi tin nhắn bằng nút hoặc Enter; Shift + Enter dùng để xuống dòng.
el.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

el.apiKeyInput.addEventListener("input", () => {
  const typedKey = el.apiKeyInput.value.trim();

  if (typedKey && typedKey !== apiKey) {
    connectionState = "unverified";
    connectedModel = "";
  } else if (!typedKey) {
    connectionState = apiKey ? "saved" : "none";
  }

  updateConnectionUI();
});
el.userInput.addEventListener("input", updateComposer);
el.userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    el.chatForm.requestSubmit();
  }
});

// Khởi tạo giao diện khi module được tải.
render();
updateComposer();
