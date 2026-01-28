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

// API base URL - 환경 변수로 관리 가능
// 개발 환경에서 Vite 프록시를 사용하는 경우 빈 문자열 사용
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : "http://localhost:8080");

/** 대화 목록/채팅 요청 시 사용하는 사용자 식별자 (환경변수 우선) */
const USER_ID = import.meta.env.VITE_USER_ID ?? "kade@thekade.com";

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
  timestamp: string | number | null | undefined,
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
      raw,
    );
    if (isoWithZ) {
      date = new Date(raw.slice(0, -1));
    } else {
      const isoNoTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/i.test(
        raw,
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
          "USER-ID": USER_ID,
        },
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "채팅방 목록을 불러오는데 실패했습니다.",
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
          "USER-ID": USER_ID,
        },
      });

      if (response.status === 204) {
        showApiSuccess("대화가 삭제되었습니다.");
        return;
      }

      const message = await parseApiErrorFromResponse(
        response,
        "대화를 삭제하는 데 실패했습니다.",
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
      throw error instanceof Error ? error : new Error("대화를 삭제하는 데 실패했습니다.");
    }
  };

  /**
   * 대화 제목을 변경합니다.
   * PATCH /api/v1/ai/conv/{conversationId}, USER-ID 헤더, body: { subject }.
   * 204 시 성공 토스트, 실패 시 에러 토스트 후 throw.
   */
  const patchConversationSubject = async (
    conversationId: string,
    subject: string,
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv/${encodeURIComponent(conversationId)}`;
    let errorAlreadyShown = false;
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "USER-ID": USER_ID,
        },
        body: JSON.stringify({ subject: subject.trim() }),
      });

      if (response.status === 204) {
        showApiSuccess("제목이 변경되었습니다.");
        return;
      }

      const message = await parseApiErrorFromResponse(
        response,
        "제목 변경에 실패했습니다.",
      );
      showApiError(message);
      errorAlreadyShown = true;
      throw new Error(message);
    } catch (error) {
      if (!errorAlreadyShown) {
        const msg =
          error instanceof Error
            ? error.message
            : "제목 변경에 실패했습니다.";
        showApiError(msg);
      }
      console.error("제목 변경 실패:", error);
      throw error instanceof Error ? error : new Error("제목 변경에 실패했습니다.");
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
    beforeTimestamp?: string | number,
  ): Promise<ChatMessage[]> => {
    // API_BASE_URL이 빈 문자열이면 상대 경로 사용 (프록시 환경)
    const basePath = `/api/v1/ai/conv/${encodeURIComponent(conversationId)}`;
    let url: string;
    
    if (API_BASE_URL) {
      // 절대 URL 사용
      const urlObj = new URL(basePath, API_BASE_URL);
      if (beforeTimestamp !== undefined) {
        urlObj.searchParams.append(
          "beforeTimestamp",
          String(beforeTimestamp),
        );
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
          "USER-ID": USER_ID,
        },
      });

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          "대화 내용을 불러오는데 실패했습니다.",
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
    buffer: string,
  ): { item: UserConversationItemDto | null; remainingBuffer: string } => {
    const segments = buffer.split(/\n\n/);
    const last = segments.pop() ?? "";
    let item: UserConversationItemDto | null = null;
    const kept: string[] = [];

    for (const seg of segments) {
      const match = seg.match(
        /event:\s*conversation_created\s*\ndata:\s*([\s\S]*)/i,
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
    buffer: string,
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

  /**
   * SSE 스트리밍을 통해 채팅 메시지를 전송하고 응답을 받습니다.
   * @param request 채팅 요청 데이터
   * @param onMessage 스트림에서 메시지를 받을 때 호출되는 콜백
   * @param onError 에러 발생 시 호출되는 콜백
   * @param onComplete 스트림 완료 시 호출되는 콜백 (백엔드에서 stream_complete 이벤트를 보내면 자동 호출)
   * @param onConversationCreated conversation_created SSE 이벤트 수신 시 호출 (선택)
   * @param file 첨부 파일 (있을 경우 multipart/form-data로 전송)
   */
  const sendChatMessage = async (
    request: AssistantRequest,
    onMessage: (data: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    onConversationCreated?: (item: UserConversationItemDto) => void,
    file?: File,
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/v1/ai/conv`;

    console.log("[SSE 요청 시작]", {
      url,
      method: "POST",
      body: request,
      hasFile: !!file,
      fileName: file?.name,
      apiBaseUrl: API_BASE_URL,
    });

    try {
      let requestBody: BodyInit;
      let headers: HeadersInit;

      const commonHeaders: HeadersInit = {
        Accept: "text/event-stream",
        "USER-ID": USER_ID,
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

      if (!response.ok) {
        const message = await parseApiErrorFromResponse(
          response,
          `요청 처리에 실패했습니다. (${response.status})`,
        );
        throw new Error(message);
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
              console.log("[SSE 스트림 완료] stream_complete 이벤트 발견, onComplete 호출");
              onComplete();
            }
          }
          // 마지막 버퍼에서 conversation_created 처리
          if (onConversationCreated) {
            let parsed = consumeConversationCreatedEvent(buffer);
            while (parsed.item) {
              onConversationCreated(parsed.item);
              parsed = consumeConversationCreatedEvent(parsed.remainingBuffer);
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
          // stream_complete 이벤트를 받지 못한 경우에만 fallback으로 onComplete 호출
          if (!streamCompleted) {
            console.log("[SSE 스트림 완료] stream_complete 이벤트 없음, fallback으로 onComplete 호출");
            onComplete?.();
          }
          break;
        }

        // 청크를 텍스트로 디코딩
        buffer += decoder.decode(value, { stream: true });

        // SSE "event: stream_complete" 파싱 (스트림 완료 시 서버 전송)
        if (!streamCompleted && onComplete) {
          const streamCompleteParsed = consumeStreamCompleteEvent(buffer);
          if (streamCompleteParsed.found) {
            streamCompleted = true;
            buffer = streamCompleteParsed.remainingBuffer;
            console.log("[SSE 스트림] stream_complete 이벤트 수신, onComplete 호출");
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
      console.error("[SSE 스트리밍 오류]", {
        error: errorMessage,
        message: errorMessage.message,
        stack: errorMessage.stack,
        url,
      });
      showApiError(errorMessage.message);
      onError?.(errorMessage as Error);
      // 에러 발생 시에도 onComplete는 호출하지 않음 (에러 상태이므로)
      throw errorMessage;
    }
  };

  return {
    fetchChatThreads,
    fetchConversation,
    sendChatMessage,
    deleteConversation,
    patchConversationSubject,
  };
};
