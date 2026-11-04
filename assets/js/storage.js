const API_KEY_STORAGE_KEY = "personal_ai_gemini_api_key";
const LEGACY_API_KEY_STORAGE_KEY = "gemini_api_key";
const CONVERSATIONS_STORAGE_KEY = "personal_ai_conversations";

export function loadApiKey() {
  try {
    const currentKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (currentKey) return currentKey;

    // Migrate the key saved by the original version of the project.
    const legacyKey = localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY) || "";
    if (legacyKey) localStorage.setItem(API_KEY_STORAGE_KEY, legacyKey);
    return legacyKey;
  } catch {
    return "";
  }
}

export function saveApiKey(apiKey) {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function removeApiKey() {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadConversations() {
  try {
    const value = JSON.parse(localStorage.getItem(CONVERSATIONS_STORAGE_KEY) || "[]");
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

export function saveConversations(conversations) {
  try {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    return true;
  } catch {
    return false;
  }
}