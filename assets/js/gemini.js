/**
 * gemini.js
 * Chịu trách nhiệm giao tiếp với Google Gemini Developer API.
 *
 * Lưu ý: API Key được truyền từ giao diện và không được ghi cứng trong mã nguồn.
 * Ứng dụng đang dùng Generate Content API để giữ tương thích với phiên bản hiện tại.
 */

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL_FALLBACKS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
const REQUEST_TIMEOUT_MS = 30_000;

const SYSTEM_INSTRUCTION = [
  "Bạn là Personal AI Assistant, một trợ lý AI cá nhân thân thiện.",
  "Luôn ưu tiên trả lời bằng tiếng Việt, trừ khi người dùng yêu cầu ngôn ngữ khác.",
  "Xưng hô tự nhiên, lịch sự; giải thích rõ ràng và phù hợp với trình độ người hỏi.",
  "Khi hướng dẫn kỹ thuật, hãy chia thành các bước dễ thực hiện và cảnh báo nếu có rủi ro.",
  "Không bịa đặt dữ kiện. Nếu không chắc chắn, hãy nói rõ giới hạn của mình."
].join(" ");

/**
 * Chuyển mã HTTP của Gemini thành thông báo dễ hiểu hơn.
 * Giữ nguyên thông báo máy chủ cho lỗi 400 để tiện chẩn đoán cấu hình.
 */
function createApiError(data, status) {
  const serverMessage = data?.error?.message;

  if (status === 400) {
    return new Error(serverMessage || "Yêu cầu không hợp lệ. Hãy kiểm tra API Key và cấu hình gửi đi.");
  }

  if (status === 401 || status === 403) {
    return new Error(
      "API Key không hợp lệ, chưa được cấp quyền hoặc bị giới hạn. Hãy kiểm tra khóa và quyền Gemini API trong Google AI Studio."
    );
  }

  if (status === 404) {
    return new Error("Model hiện không khả dụng. Hệ thống sẽ thử model dự phòng.");
  }

  if (status === 429) {
    return new Error("Gemini đang giới hạn số lượt yêu cầu hoặc đã hết hạn mức tạm thời. Hãy chờ rồi thử lại.");
  }

  if (status >= 500) {
    return new Error("Máy chủ Gemini đang gặp sự cố. Vui lòng thử lại sau.");
  }

  return new Error(serverMessage || `Yêu cầu Gemini thất bại (HTTP ${status}).`);
}

/**
 * Gọi một model cụ thể. Hàm này chỉ trả dữ liệu khi HTTP thành công.
 */
async function requestModel(apiKey, model, contents, maxOutputTokens) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${API_BASE_URL}${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents,
        // Gemini 3.x được khuyến nghị dùng cấu hình lấy mẫu mặc định.
        generationConfig: { maxOutputTokens }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = createApiError(data, response.status);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Yêu cầu mất quá nhiều thời gian. Hãy kiểm tra mạng và thử lại.");
    }

    if (error instanceof TypeError) {
      throw new Error("Không thể kết nối đến Gemini API. Hãy kiểm tra Internet hoặc cấu hình mạng.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Thử lần lượt model chính và model dự phòng.
 * Không thử model khác khi lỗi xác thực hoặc yêu cầu không hợp lệ.
 */
async function requestWithFallback(apiKey, contents, maxOutputTokens) {
  if (!apiKey) {
    throw new Error("Bạn chưa nhập Gemini API Key.");
  }

  let lastError = null;

  for (const model of MODEL_FALLBACKS) {
    try {
      const data = await requestModel(apiKey, model, contents, maxOutputTokens);
      return { data, model };
    } catch (error) {
      lastError = error;

      if ([400, 401, 403].includes(error.status)) {
        throw error;
      }

      // Chỉ chuyển model khi có khả năng model kế tiếp xử lý được yêu cầu.
      if (!(error.status === 404 || error.status === 429 || error.status >= 500)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Không thể kết nối với Google Gemini. Vui lòng thử lại.");
}

/** Lấy phần văn bản từ cấu trúc phản hồi Generate Content. */
function extractAnswer(data) {
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  const answer = parts
    .filter((part) => typeof part.text === "string" && !part.thought)
    .map((part) => part.text)
    .join("\n")
    .trim();

  if (answer) {
    return answer;
  }

  if (candidate?.finishReason === "SAFETY") {
    throw new Error("Gemini không thể trả lời yêu cầu này do bộ lọc an toàn.");
  }

  throw new Error("Gemini đã phản hồi nhưng không có nội dung văn bản. Hãy thử gửi lại.");
}

/**
 * Kiểm tra API Key bằng một yêu cầu ngắn.
 * Trả về model đã phản hồi; không lưu API Key tại đây.
 */
export async function testConnection(apiKey) {
  if (!apiKey) {
    throw new Error("Bạn chưa nhập Gemini API Key.");
  }

  const { data, model } = await requestWithFallback(
    apiKey,
    [{ role: "user", parts: [{ text: "Reply with exactly: OK" }] }],
    16
  );

  extractAnswer(data);
  return { model };
}

/**
 * Gửi lịch sử hội thoại đến Gemini và trả về câu trả lời cùng tên model.
 */
export async function generateReply(apiKey, messages) {
  if (!apiKey) {
    throw new Error("Bạn chưa nhập Gemini API Key.");
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Chưa có nội dung để gửi đến Gemini.");
  }

  const contents = messages
    .filter((message) =>
      ["user", "model"].includes(message.role) &&
      typeof message.text === "string" &&
      message.text.trim()
    )
    .slice(-20)
    .map((message) => ({
      role: message.role,
      parts: [{ text: message.text }]
    }));

  if (contents.length === 0) {
    throw new Error("Không tìm thấy nội dung hợp lệ để gửi đến Gemini.");
  }

  const { data, model } = await requestWithFallback(apiKey, contents, 2048);
  return {
    text: extractAnswer(data),
    model
  };
}
