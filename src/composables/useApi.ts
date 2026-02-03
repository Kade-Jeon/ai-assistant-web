import type {
  AssistantRequest,
  ChatThread,
  ChatMessage,
  ChatRole,
  UserConversationItemDto,
  ConversationMessageDto,
} from "@/types/chat";
import { extractCompleteJsonFromBuffer } from "@/lib/chatCompletionParser";
import {
  parseApiErrorFromResponse,
  showApiError,
  showApiSuccess,
} from "@/composables/useApiError";
import { getUserIdCookie } from "@/lib/cookies";

// API base URL - 환경 변수로 관리 가능
// 개발 환경에서 Vite 프록시를 사용하는 경우 빈 문자열 사용
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : "http://localhost:8080");

/**
 * 쿠키에서 사용자 ID를 가져옵니다.
 * 쿠키에 없으면 환경변수 또는 기본값을 사용합니다 (하위 호환성).
 */
const getUserId = (): string => {
  const cookieUserId = getUserIdCookie();
  if (cookieUserId) {
    return cookieUserId;
  }
  // 하위 호환성: 환경변수 또는 기본값
  return import.meta.env.VITE_USER_ID ?? "kade@thekade.com";
};

/**
 * 브라우저 타임존 식별자 (IANA, 예: Asia/Seoul).
 * SSR 등에서 undefined일 수 있으므로 빈 문자열 대체.
 */
const getBrowserTimezone = (): string => {
  if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return "";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
};

/** role 문자열을 ChatRole로 매핑 (system/tool은 assistant로 표시). 대소문자 무시(USER→user). */
const toChatRole = (role: string): ChatRole =>
  String(role).toLowerCase() === "user" ? "user" : "assistant";

/**
 * 서버 시각 → 브라우저 로케일·로컬 시간대로 표시.
 * - 현재 백엔드는 "한국 시간 기준 시각"을 ISO 형식으로 보내고 끝에 Z만 붙여 보냄(실제 UTC 아님).
 *   예: 26일 20:38 KST → "2026-01-26T20:38:33Z". Z를 제거하고 로컬로 파싱해 26일 오후 8:38로 표시.
 * - epoch ms/초 숫자도 지원.
 */
function formatTimestamp(
  timestamp: string | number | null | undefined
): string {
  if (timestamp === null || timestamp === undefined || timestamp === "")
    return "";
  const raw = String(timestamp).trim();
  if (!raw) return "";

  let date: Date;
  const asNum = Number(timestamp);
  if (
    typeof timestamp === "number" ||
    (/^-?\d+$/.test(raw) && !Number.isNaN(asNum))
  ) {
    const ms = asNum < 1e12 ? asNum * 1000 : asNum;
    date = new Date(ms);
  } else {
    const isoWithZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/i.test(
      raw
    );
    if (isoWithZ) {
      date = new Date(raw.slice(0, -1));
    } else {
      const isoNoTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/i.test(
        raw
      );
      date = new Date(isoNoTz ? `${raw}Z` : raw);
    }
  }

  if (Number.isNaN(date.getTime())) return "";
  const locale =
    typeof navigator !== "undefined" ? navigator.language : undefined;
  const dateStr = date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeStr = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr} ${timeStr}`;
}

export const useApi = () => {
  /**
   * 로그인 요청을 보냅니다.
   * POST /api/v1/auth/login
   * @param emailId 이메일
   * @param password 비밀번호
   * @returns 로그인 응답 (userId, emailId, plan)
   */
  const login = async (
    emailId: string,
    password: string
  ): Promise<{ userId: string; emailId: string; plan: string }> => {
    const url = `${API_BASE_URL}/api/v1/auth/login`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailId, password }),
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "로그인에 실패했습니다."
        );
        throw new Error(message);
      }

      const data = (await response.json()) as {
        userId: string;
        emailId: string;
        plan: string;
      };

      return data;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "로그인에 실패했습니다.";
      showApiError(msg);
      console.error("로그인 실패:", error);
      throw error instanceof Error ? error : new Error(msg);
    }
  };

  /** 개인 맞춤 설정 응답 타입 */
  type PreferenceResponse = {
    nickname: string | null;
    occupation: string | null;
    extraInfo: string | null;
  };

  /** 개인 맞춤 설정 요청 타입 */
  type PreferenceRequest = {
    nickname?: string;
    occupation?: string;
    extraInfo?: string;
  };

  /**
   * 개인 맞춤 설정을 조회합니다.
   * GET /api/v1/ai/pref, USER-ID 헤더 필요.
   */
  const getPreference = async (): Promise<PreferenceResponse> => {
    const url = `${API_BASE_URL}/api/v1/ai/pref`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "USER-ID": getUserId(),
        },
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "개인 맞춤 설정을 불러오는데 실패했습니다."
        );
        throw new Error(message);
      }

      const data = (await response.json()) as PreferenceResponse;
      return data;
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "개인 맞춤 설정을 불러오는데 실패했습니다.";
      showApiError(msg);
      console.error("개인 맞춤 설정 조회 실패:", error);
      throw error instanceof Error ? error : new Error(msg);
    }
  };

  /**
   * 개인 맞춤 설정을 저장합니다.
   * POST /api/v1/ai/pref, USER-ID 헤더, body: PreferenceRequest.
   */
  const updatePreference = async (
    request: PreferenceRequest
  ): Promise<PreferenceResponse> => {
    const url = `${API_BASE_URL}/api/v1/ai/pref`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "USER-ID": getUserId(),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "개인 맞춤 설정 저장에 실패했습니다."
        );
        throw new Error(message);
      }

      const data = (await response.json()) as PreferenceResponse;
      showApiSuccess("개인 맞춤 설정이 저장되었습니다.");
      return data;
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "개인 맞춤 설정 저장에 실패했습니다.";
      showApiError(msg);
      console.error("개인 맞춤 설정 저장 실패:", error);
      throw error instanceof Error ? error : new Error(msg);
    }
  };

  /**
   * AI 통계를 조회합니다. 대시보드 Observation 데이터도 이 엔드포인트로 조회합니다.
   * GET /api/v1/ai/stat, USER-ID, X-USER-TIMEZONE 헤더 필요.
   */
  const getAiStat = async (): Promise<unknown> => {
    const url = `${API_BASE_URL}/api/v1/ai/stat`;
    const timezone = getBrowserTimezone();
    const headers: Record<string, string> = {
      "USER-ID": getUserId(),
    };
    if (timezone) {
      headers["X-USER-TIMEZONE"] = timezone;
    }
    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "AI 통계를 불러오는데 실패했습니다."
        );
        throw new Error(message);
      }

      const data = (await response.json()) as unknown;
      return data;
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "AI 통계를 불러오는데 실패했습니다.";
      showApiError(msg);
      console.error("AI 통계 조회 실패:", error);
      throw error instanceof Error ? error : new Error(msg);
    }
  };

  /**
   * 대화 목록을 조회합니다.
   * GET /api/v1/ai/conv, USER-ID 헤더 필요.
   * 응답을 ChatThread 형태(id, title, active, conversationId)로 변환해 반환합니다.
   */
  const fetchChatThreads = async (): Promise<ChatThread[]> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "USER-ID": getUserId(),
        },
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "채팅방 목록을 불러오는데 실패했습니다."
        );
        throw new Error(message);
      }

      const data = (await response.json()) as UserConversationItemDto[];
      return (Array.isArray(data) ? data : []).map((item) => ({
        id: item.conversationId,
        title: item.subject,
        active: false,
        conversationId: item.conversationId,
      }));
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "채팅방 목록을 불러오는데 실패했습니다.";
      showApiError(msg);
      console.error("채팅방 목록 조회 실패:", error);
      throw error instanceof Error ? error : new Error(msg);
    }
  };

  /**
   * 대화를 삭제합니다.
   * DELETE /api/v1/ai/conv/{conversationId}, USER-ID 헤더 필요.
   * 204 시 성공 토스트, 실패 시 에러 토스트 후 throw.
   */
  const deleteConversation = async (conversationId: string): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv/${encodeURIComponent(conversationId)}`;
    let errorAlreadyShown = false;
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "USER-ID": getUserId(),
        },
      });

      if (response.status === 204) {
        showApiSuccess("대화가 삭제되었습니다.");
        return;
      }

      const message = await parseApiErrorFromResponse(
        response,
        "대화를 삭제하는 데 실패했습니다."
      );
      showApiError(message);
      errorAlreadyShown = true;
      throw new Error(message);
    } catch (error) {
      if (!errorAlreadyShown) {
        const msg =
          error instanceof Error
            ? error.message
            : "대화를 삭제하는 데 실패했습니다.";
        showApiError(msg);
      }
      console.error("대화 삭제 실패:", error);
      throw error instanceof Error
        ? error
        : new Error("대화를 삭제하는 데 실패했습니다.");
    }
  };

  /**
   * 대화 제목을 변경합니다.
   * PATCH /api/v1/ai/conv/{conversationId}, USER-ID 헤더, body: { subject }.
   * 204 시 성공 토스트, 실패 시 에러 토스트 후 throw.
   */
  const patchConversationSubject = async (
    conversationId: string,
    subject: string
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv/${encodeURIComponent(conversationId)}`;
    let errorAlreadyShown = false;
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "USER-ID": getUserId(),
        },
        body: JSON.stringify({ subject: subject.trim() }),
      });

      if (response.status === 204) {
        showApiSuccess("제목이 변경되었습니다.");
        return;
      }

      const message = await parseApiErrorFromResponse(
        response,
        "제목 변경에 실패했습니다."
      );
      showApiError(message);
      errorAlreadyShown = true;
      throw new Error(message);
    } catch (error) {
      if (!errorAlreadyShown) {
        const msg =
          error instanceof Error ? error.message : "제목 변경에 실패했습니다.";
        showApiError(msg);
      }
      console.error("제목 변경 실패:", error);
      throw error instanceof Error
        ? error
        : new Error("제목 변경에 실패했습니다.");
    }
  };

  /**
   * 특정 대화방의 메시지 목록을 조회합니다.
   * GET /api/v1/ai/conv/{conversationId}, USER-ID 헤더 필요.
   * @param conversationId 대화방 ID
   * @param beforeTimestamp 이 timestamp 이전의 메시지를 가져옵니다 (선택). 없으면 최근 메시지부터 가져옵니다.
   * @returns ChatMessage 배열 (최신순으로 정렬됨)
   */
  const fetchConversation = async (
    conversationId: string,
    beforeTimestamp?: string | number
  ): Promise<ChatMessage[]> => {
    // API_BASE_URL이 빈 문자열이면 상대 경로 사용 (프록시 환경)
    const basePath = `/api/v1/ai/conv/${encodeURIComponent(conversationId)}`;
    let url: string;

    if (API_BASE_URL) {
      // 절대 URL 사용
      const urlObj = new URL(basePath, API_BASE_URL);
      if (beforeTimestamp !== undefined) {
        urlObj.searchParams.append("beforeTimestamp", String(beforeTimestamp));
      }
      url = urlObj.toString();
    } else {
      // 상대 경로 사용 (프록시 환경)
      const params = new URLSearchParams();
      if (beforeTimestamp !== undefined) {
        params.append("beforeTimestamp", String(beforeTimestamp));
      }
      const queryString = params.toString();
      url = queryString ? `${basePath}?${queryString}` : basePath;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "USER-ID": getUserId(),
        },
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "대화 내용을 불러오는데 실패했습니다."
        );
        throw new Error(message);
      }

      const data = (await response.json()) as ConversationMessageDto[];
      const list = Array.isArray(data) ? data : [];
      return list.map((msg, i) => ({
        id: `msg-${conversationId}-${msg.timestamp}-${i}`,
        role: toChatRole(msg.role),
        content: msg.content ?? "",
        time: formatTimestamp(msg.timestamp),
        attachments:
          msg.attachments && msg.attachments.length > 0
            ? msg.attachments
            : undefined,
        // 페이지네이션을 위해 원본 timestamp 저장
        rawTimestamp: msg.timestamp,
      }));
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "대화 내용을 불러오는데 실패했습니다.";
      showApiError(msg);
      console.error(`대화 내용 조회 실패 (${conversationId}):`, error);
      throw error instanceof Error ? error : new Error(msg);
    }
  };

  /**
   * SSE 스트림 버퍼에서 conversation_created 이벤트를 찾아 파싱합니다.
   * 형식: event: conversation_created\ndata: {"conversationId":"...","subject":"..."}
   */
  const consumeConversationCreatedEvent = (
    buffer: string
  ): { item: UserConversationItemDto | null; remainingBuffer: string } => {
    const segments = buffer.split(/\n\n/);
    const last = segments.pop() ?? "";
    let item: UserConversationItemDto | null = null;
    const kept: string[] = [];

    for (const seg of segments) {
      const match = seg.match(
        /event:\s*conversation_created\s*\ndata:\s*([\s\S]*)/i
      );
      const dataPart = match?.[1];
      if (dataPart !== undefined) {
        try {
          const raw = dataPart.trim();
          const parsed = JSON.parse(raw) as UserConversationItemDto;
          if (
            typeof parsed?.conversationId === "string" &&
            typeof parsed?.subject === "string"
          ) {
            item = parsed;
          } else {
            kept.push(seg);
          }
        } catch {
          kept.push(seg);
        }
      } else {
        kept.push(seg);
      }
    }

    const remainingBuffer = kept.length
      ? kept.join("\n\n") + "\n\n" + last
      : last;
    return { item, remainingBuffer };
  };

  /**
   * SSE 스트림에서 stream_complete 이벤트를 파싱합니다.
   * @param buffer 현재 버퍼
   * @returns { found: 이벤트 발견 여부, remainingBuffer: 남은 버퍼 }
   */
  const consumeStreamCompleteEvent = (
    buffer: string
  ): { found: boolean; remainingBuffer: string } => {
    const segments = buffer.split(/\n\n/);
    const last = segments.pop() ?? "";
    let found = false;
    const kept: string[] = [];

    for (const seg of segments) {
      const match = seg.match(/event:\s*stream_complete\s*\n?/i);
      if (match) {
        found = true;
        // stream_complete 이벤트는 data가 없을 수 있으므로 세그먼트를 제거
      } else {
        kept.push(seg);
      }
    }

    const remainingBuffer = kept.length
      ? kept.join("\n\n") + "\n\n" + last
      : last;
    return { found, remainingBuffer };
  };

  /** SSE event: error 시 data JSON 구조 */
  type StreamErrorPayload = {
    code?: string;
    message?: string;
    retryable?: boolean;
  };

  /**
   * SSE 스트림에서 error 이벤트를 파싱합니다.
   * data는 JSON 문자열 (code, message, retryable).
   */
  const consumeErrorEvent = (
    buffer: string
  ): {
    found: boolean;
    code?: string;
    message?: string;
    retryable: boolean;
    remainingBuffer: string;
  } => {
    const segments = buffer.split(/\n\n/);
    const last = segments.pop() ?? "";
    let result: {
      found: boolean;
      code?: string;
      message?: string;
      retryable: boolean;
      remainingBuffer: string;
    } = {
      found: false,
      retryable: false,
      remainingBuffer: buffer,
    };
    const kept: string[] = [];

    for (const seg of segments) {
      const match = seg.match(/event:\s*error\s*\ndata:\s*([\s\S]*)/i);
      const dataPart = match?.[1];
      if (dataPart !== undefined) {
        try {
          const raw = dataPart.trim();
          const parsed = JSON.parse(raw) as StreamErrorPayload;
          result = {
            found: true,
            code: typeof parsed?.code === "string" ? parsed.code : undefined,
            message:
              typeof parsed?.message === "string" ? parsed.message : undefined,
            retryable: parsed?.retryable !== false,
            remainingBuffer: "",
          };
          break;
        } catch {
          kept.push(seg);
        }
      } else {
        kept.push(seg);
      }
    }

    if (!result.found) {
      result.remainingBuffer =
        kept.length > 0 ? kept.join("\n\n") + "\n\n" + last : last;
    }
    return result;
  };

  /**
   * SSE 스트림에서 already_completed 이벤트를 파싱합니다.
   * data: { "conversationId": "..." }
   */
  const consumeAlreadyCompletedEvent = (
    buffer: string
  ): { found: boolean; conversationId?: string; remainingBuffer: string } => {
    const segments = buffer.split(/\n\n/);
    const last = segments.pop() ?? "";
    let found = false;
    let conversationId: string | undefined;
    const kept: string[] = [];

    for (const seg of segments) {
      const match = seg.match(
        /event:\s*already_completed\s*\ndata:\s*([\s\S]*)/i
      );
      const dataPart = match?.[1];
      if (dataPart !== undefined) {
        try {
          const raw = dataPart.trim();
          const parsed = JSON.parse(raw) as { conversationId?: string };
          if (typeof parsed?.conversationId === "string") {
            found = true;
            conversationId = parsed.conversationId;
          }
          break;
        } catch {
          kept.push(seg);
        }
      } else {
        kept.push(seg);
      }
    }

    const remainingBuffer =
      kept.length > 0 ? kept.join("\n\n") + "\n\n" + last : last;
    return { found, conversationId, remainingBuffer };
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAYS_MS = [0, 1000, 2000];

  /**
   * SSE 스트리밍을 통해 채팅 메시지를 전송하고 응답을 받습니다.
   * 재시도 시 동일한 idempotencyKey를 사용하면 백엔드가 중복 저장을 방지합니다.
   * @param request 채팅 요청 데이터
   * @param onMessage 스트림에서 메시지를 받을 때 호출되는 콜백
   * @param onError 에러 발생 시 호출되는 콜백
   * @param onComplete 스트림 완료 시 호출되는 콜백 (백엔드에서 stream_complete 이벤트를 보내면 자동 호출)
   * @param onConversationCreated conversation_created SSE 이벤트 수신 시 호출 (선택)
   * @param onAlreadyCompleted already_completed 수신 시 호출 (같은 Idempotency-Key로 이미 완료된 요청)
   * @param file 첨부 파일 (있을 경우 multipart/form-data로 전송)
   * @param idempotencyKey 재시도 시 중복 방지용 키 (메시지 전송 시 1회 생성, 재시도 시 동일 키 사용)
   */
  const sendChatMessage = async (
    request: AssistantRequest,
    onMessage: (data: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    onConversationCreated?: (item: UserConversationItemDto) => void,
    onAlreadyCompleted?: (conversationId: string) => void,
    file?: File,
    idempotencyKey?: string
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const delayMs = RETRY_DELAYS_MS[attempt] ?? 2000;
      if (attempt > 0) {
        console.log("[SSE 재시도]", { attempt, delayMs, idempotencyKey });
        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        let requestBody: BodyInit;
        let headers: HeadersInit;

        const commonHeaders: HeadersInit = {
          Accept: "text/event-stream",
          "USER-ID": getUserId(),
          ...(idempotencyKey && {
            "X-Idempotency-Key": idempotencyKey,
          }),
        };

        if (file) {
          // 파일이 있는 경우: multipart/form-data로 전송
          const formData = new FormData();
          formData.append("file", file);
          formData.append("request", JSON.stringify(request));

          requestBody = formData;
          // multipart/form-data의 경우 브라우저가 자동으로 Content-Type과 boundary를 설정하므로 명시하지 않음
          headers = commonHeaders;
        } else {
          // 파일이 없는 경우: application/json으로 전송
          requestBody = JSON.stringify(request);
          headers = {
            ...commonHeaders,
            "Content-Type": "application/json",
          };
        }

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: requestBody,
        });

        console.log("[SSE 응답 받음]", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (response.status === 409) {
          const message = await parseApiErrorFromResponse(
            response,
            "동일한 Idempotency-Key로 요청이 이미 처리 중입니다."
          );
          const conflictError = new Error(message) as Error & {
            is409?: boolean;
          };
          conflictError.is409 = true;
          throw conflictError;
        }

        if (!response.ok) {
          const message = await parseApiErrorFromResponse(
            response,
            `요청 처리에 실패했습니다. (${response.status})`
          );
          const err = new Error(message) as Error & { retryable?: boolean };
          err.retryable = response.status >= 500;
          throw err;
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let connectedProcessed = false;
        let streamCompleted = false;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("[SSE 스트림 완료] done=true, 버퍼 처리 시작", {
              bufferLength: buffer.length,
              hasOnComplete: !!onComplete,
              streamCompleted,
            });
            // 마지막 버퍼에서 stream_complete 처리
            if (!streamCompleted && onComplete) {
              const streamCompleteParsed = consumeStreamCompleteEvent(buffer);
              if (streamCompleteParsed.found) {
                streamCompleted = true;
                buffer = streamCompleteParsed.remainingBuffer;
                console.log(
                  "[SSE 스트림 완료] stream_complete 이벤트 발견, onComplete 호출"
                );
                onComplete();
              }
            }
            // 마지막 버퍼에서 conversation_created 처리
            if (onConversationCreated) {
              let parsed = consumeConversationCreatedEvent(buffer);
              while (parsed.item) {
                onConversationCreated(parsed.item);
                parsed = consumeConversationCreatedEvent(
                  parsed.remainingBuffer
                );
              }
              buffer = parsed.remainingBuffer;
            }
            // 마지막 버퍼에 남은 콘텐츠 처리
            if (buffer.trim()) {
              const { contents } = extractCompleteJsonFromBuffer(buffer);
              contents.forEach((content) => {
                if (content) {
                  onMessage(content);
                }
              });
            }
            // stream_complete 전에 연결이 끊기면 실패로 간주하고 재시도 대상
            if (!streamCompleted) {
              console.warn(
                "[SSE 스트림] stream_complete 없이 연결 종료, 재시도 대상"
              );
              const dropErr = new Error(
                "스트림이 완료되지 않고 연결이 끊겼습니다."
              ) as Error & { retryable?: boolean };
              dropErr.retryable = true;
              throw dropErr;
            }
            break;
          }

          // 청크를 텍스트로 디코딩
          buffer += decoder.decode(value, { stream: true });

          // SSE "event: already_completed" (같은 Idempotency-Key로 이미 완료된 요청)
          if (onAlreadyCompleted) {
            const ac = consumeAlreadyCompletedEvent(buffer);
            if (ac.found && ac.conversationId) {
              console.log("[SSE] already_completed 수신", ac.conversationId);
              onAlreadyCompleted(ac.conversationId);
              return;
            }
          }

          // SSE "event: error" (구조화된 에러, data는 JSON 문자열)
          const errParsed = consumeErrorEvent(buffer);
          if (errParsed.found) {
            const msg =
              errParsed.message ?? "AI 응답 생성 중 오류가 발생했습니다.";
            const streamErr = new Error(msg) as Error & { retryable?: boolean };
            streamErr.retryable = errParsed.retryable;
            console.error("[SSE] error 이벤트 수신", {
              code: errParsed.code,
              message: msg,
              retryable: errParsed.retryable,
            });
            showApiError(msg);
            onError?.(streamErr);
            throw streamErr;
          }

          // SSE "event: stream_complete" 파싱 (스트림 완료 시 서버 전송)
          if (!streamCompleted && onComplete) {
            const streamCompleteParsed = consumeStreamCompleteEvent(buffer);
            if (streamCompleteParsed.found) {
              streamCompleted = true;
              buffer = streamCompleteParsed.remainingBuffer;
              console.log(
                "[SSE 스트림] stream_complete 이벤트 수신, onComplete 호출"
              );
              onComplete();
            }
          }

          // SSE "event: conversation_created" + "data: {...}" 파싱 (대화방 생성 시 서버 전송)
          if (onConversationCreated) {
            let parsed = consumeConversationCreatedEvent(buffer);
            while (parsed.item) {
              onConversationCreated(parsed.item);
              parsed = consumeConversationCreatedEvent(parsed.remainingBuffer);
            }
            buffer = parsed.remainingBuffer;
          }

          // "connected" 문자열 처리 (최초 1회만)
          if (
            !connectedProcessed &&
            buffer.toLowerCase().startsWith("connected")
          ) {
            buffer = buffer.substring("connected".length);
            connectedProcessed = true;
          }

          // 완전한 JSON 객체들을 추출 및 파싱
          const { contents, remainingBuffer } =
            extractCompleteJsonFromBuffer(buffer);

          // 파싱된 내용들을 onMessage로 전달
          contents.forEach((content) => {
            if (content) {
              onMessage(content);
            }
          });

          // 버퍼 업데이트 (불완전한 JSON은 남김)
          buffer = remainingBuffer;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error
            : new Error("알 수 없는 오류가 발생했습니다.");
        const errWithMeta = errorMessage as Error & {
          retryable?: boolean;
          is409?: boolean;
        };
        const is409 = errWithMeta.is409 === true;
        const retryable = errWithMeta.retryable !== false;
        const canRetry = attempt < MAX_RETRIES - 1 && retryable && !is409;

        console.error("[SSE 스트리밍 오류]", {
          error: errorMessage,
          message: errorMessage.message,
          attempt: attempt + 1,
          canRetry,
          is409,
        });

        if (!canRetry) {
          showApiError(errorMessage.message);
          onError?.(errorMessage as Error);
          throw errorMessage;
        }
        // canRetry면 다음 attempt로 진행 (onError 호출하지 않음)
      }
    }

    const finalError = new Error(
      "요청이 실패했으며 재시도 횟수를 초과했습니다."
    );
    showApiError(finalError.message);
    onError?.(finalError);
    throw finalError;
  };

  return {
    login,
    getPreference,
    updatePreference,
    getAiStat,
    fetchChatThreads,
    fetchConversation,
    sendChatMessage,
    deleteConversation,
    patchConversationSubject,
  };
};
