const API_KEY_STORAGE_KEY = "personal_ai_gemini_api_key";
const CONVERSATIONS_STORAGE_KEY = "personal_ai_conversations";
export function loadApiKey(){try{return localStorage.getItem(API_KEY_STORAGE_KEY)||"";}catch{return "";}}
export function saveApiKey(apiKey){try{localStorage.setItem(API_KEY_STORAGE_KEY,apiKey);return true;}catch{return false;}}
export function removeApiKey(){try{localStorage.removeItem(API_KEY_STORAGE_KEY);return true;}catch{return false;}}
export function loadConversations(){try{const value=JSON.parse(localStorage.getItem(CONVERSATIONS_STORAGE_KEY)||"[]");return Array.isArray(value)?value.filter(item=>item&&typeof item.id==="string"&&typeof item.title==="string"&&Array.isArray(item.messages)):[];}catch{return [];}}
export function saveConversations(conversations){try{localStorage.setItem(CONVERSATIONS_STORAGE_KEY,JSON.stringify(conversations));return true;}catch{return false;}}