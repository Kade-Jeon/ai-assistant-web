/** 프로젝트 생성 요청 (POST /api/v1/ai/proj/create) */
export interface CreateProjectRequest {
  subject: string;
}

/** 프로젝트 목록/생성 응답 한 건 (GET /api/v1/ai/proj, CreateProjectResponse) */
export interface CreateProjectResponseDto {
  subject: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
}

/** 프로젝트 목록 항목 (UI용, 목록 조회·생성 응답 매핑) */
export interface ProjectItem {
  conversationId: string;
  subject: string;
}

/** RAG용 프로젝트 문서 한 건 (UI용) */
export interface ProjectDocumentItem {
  id: string;
  name: string;
  size?: number;
}

/** GET /api/v1/ai/proj/{conversationId}/doc 응답 한 건 */
export interface ProjectDocumentResponse {
  documentId: number;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

/** API 응답을 UI용 ProjectDocumentItem으로 변환 */
export function toProjectDocumentItem(res: ProjectDocumentResponse): ProjectDocumentItem {
  // documentId가 필수이므로 반드시 있어야 함
  if (res.documentId == null) {
    console.error("documentId가 없습니다. 응답:", res);
    throw new Error(`documentId가 응답에 없습니다: ${JSON.stringify(res)}`);
  }
  return {
    id: String(res.documentId),
    name: res.filename,
    size: res.size,
  };
}
