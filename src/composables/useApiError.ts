import { ref, computed } from "vue";

/** 백엔드 공통 에러 응답 형태 (예: USER-ID 헤더 누락 시 400) */
interface ApiErrorBody {
  message?: string;
  errorCode?: string;
  status?: number;
  path?: string;
  timestamp?: string;
}

export type ApiToastType = "error" | "success";

const apiToast = ref<{ type: ApiToastType; message: string } | null>(null);

/**
 * API 응답에서 사용자에게 보여줄 메시지를 파싱합니다.
 * 백엔드가 { message, errorCode, ... } 형태로 내려주는 경우 message를 사용합니다.
 */
export async function parseApiErrorFromResponse(
  response: Response,
  fallback: string,
): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return fallback;
  }
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body && typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // ignore
  }
  return fallback;
}

/** 화면에 에러 메시지를 띄웁니다. 토스트로 표시됩니다. */
export function showApiError(message: string): void {
  apiToast.value = { type: "error", message };
}

/** 화면에 성공 메시지를 띄웁니다. 토스트로 표시됩니다. */
export function showApiSuccess(message: string): void {
  apiToast.value = { type: "success", message };
}

/** 토스트를 닫습니다. */
export function clearApiError(): void {
  apiToast.value = null;
}

/** 공통 API 토스트 composable. 에러/성공 토스트 UI가 이 상태를 구독해 표시합니다. */
export function useApiError() {
  const currentToast = computed(() => apiToast.value);
  return {
    currentToast,
    showApiError,
    showApiSuccess,
    clearApiError,
    parseApiErrorFromResponse,
  };
}
