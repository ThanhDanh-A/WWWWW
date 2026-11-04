/**
 * storage.js
 * Quản lý dữ liệu cục bộ trong trình duyệt.
 *
 * API Key và lịch sử chỉ tồn tại trong localStorage của trình duyệt hiện tại.
 * Không đồng bộ dữ liệu này lên GitHub.
 */

const API_KEY_STORAGE_KEY = "personal_ai_gemini_api_key";
const LEGACY_API_KEY_STORAGE_KEY = "gemini_api_key";
const CONVERSATIONS_STORAGE_KEY = "personal_ai_conversations";

/**
 * Đọc API Key mới. Nếu chưa có, thử di chuyển khóa từ phiên bản cũ.
 * Trả về chuỗi rỗng nếu trình duyệt chặn localStorage hoặc chưa có khóa.
 */
export function loadApiKey() {
  try {
    const currentKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (currentKey) return currentKey;

    // Giữ tương thích với khóa đã lưu từ bản chatbot gốc.
    const legacyKey = localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY) || "";
    if (legacyKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, legacyKey);
    }
    return legacyKey;
  } catch {
    return "";
  }
}

/** Lưu API Key và xóa tên khóa cũ sau khi di chuyển thành công. */
export function saveApiKey(apiKey) {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Xóa các khóa API Key do ứng dụng quản lý trên trình duyệt hiện tại. */
export function removeApiKey() {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Đọc lịch sử hội thoại và lọc những bản ghi không đúng cấu trúc cơ bản.
 * Hàm không thể bảo đảm dữ liệu localStorage luôn đáng tin cậy.
 */
export function loadConversations() {
  try {
    const value = JSON.parse(
      localStorage.getItem(CONVERSATIONS_STORAGE_KEY) || "[]"
    );

    return Array.isArray(value)
      ? value.filter((item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          Array.isArray(item.messages)
        )
      : [];
  } catch {
    return [];
  }
}

/** Ghi toàn bộ lịch sử hội thoại dưới dạng JSON. */
export function saveConversations(conversations) {
  try {
    localStorage.setItem(
      CONVERSATIONS_STORAGE_KEY,
      JSON.stringify(conversations)
    );
    return true;
  } catch {
    return false;
  }
}
