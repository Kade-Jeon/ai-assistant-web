/**
 * ChatCompletionChunk 관련 타입 및 파싱 유틸리티
 */

export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Choice[]
  usage: Usage | null
}

export interface Choice {
  delta: Delta
  index: number
  finish_reason: string | null
}

export interface Delta {
  content: string | null
  toolCalls: Array<Record<string, unknown>> | null
}

export interface Usage {
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
}

/**
 * 연속된 JSON 객체 문자열을 파싱하여 개별 JSON 객체 배열로 반환
 * @param text 연속된 JSON 객체 문자열 (예: '{"a":1}{"b":2}')
 * @returns 파싱된 JSON 객체 배열
 */
export function parseConsecutiveJson(text: string): ChatCompletionChunk[] {
  const chunks: ChatCompletionChunk[] = []
  let currentIndex = 0
  let braceCount = 0
  let inString = false
  let escapeNext = false
  let startIndex = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"' && !escapeNext) {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      if (braceCount === 0) {
        startIndex = i
      }
      braceCount++
    } else if (char === '}') {
      braceCount--
      if (braceCount === 0) {
        // 완전한 JSON 객체 발견
        const jsonStr = text.substring(startIndex, i + 1)
        try {
          const parsed = JSON.parse(jsonStr) as ChatCompletionChunk
          chunks.push(parsed)
        } catch (error) {
          console.warn('[ChatCompletionParser] JSON 파싱 실패:', {
            jsonStr,
            error,
            startIndex,
            endIndex: i + 1,
          })
        }
      }
    }
  }

  return chunks
}

/**
 * 실시간 스트리밍 텍스트에서 이스케이프된 줄바꿈 및 탭 문자를 처리
 * @param text 원본 텍스트
 * @returns 처리된 텍스트
 */
export function processingLineBreaksRealtime(text: string): string {
  return text
    .replace(/\\\n/g, '\n')         // 백슬래시+실제줄바꿈 → 줄바꿈만
    .replace(/\\n/g, '\n')          // 문자열 리터럴 \n을 실제 줄바꿈으로 변환
    .replace(/\\r\\n/g, '\n')       // Windows 스타일 줄바꿈 처리
    .replace(/\\r/g, '\n')          // Mac 스타일 줄바꿈 처리
    .replace(/\\t/g, '    ')        // 탭 문자 처리
    .replace(/\t/g, '    ')         // 탭 문자 처리
  // 실시간에서는 백슬래시 제거 및 trim을 하지 않음
}

/**
 * ChatCompletionChunk에서 실제 텍스트 내용을 추출
 * @param chunk ChatCompletionChunk 객체
 * @returns 추출된 텍스트 내용 (없으면 빈 문자열)
 */
export function extractContent(chunk: ChatCompletionChunk): string {
  if (!chunk.choices || chunk.choices.length === 0) {
    return ''
  }

  const firstChoice = chunk.choices[0]
  if (!firstChoice.delta || !firstChoice.delta.content) {
    return ''
  }

  // 이스케이프된 줄바꿈 및 탭 문자 처리
  return processingLineBreaksRealtime(firstChoice.delta.content)
}

/**
 * 스트림 데이터에서 "connected" 문자열을 제거하고 실제 JSON 데이터만 반환
 * @param data 원본 스트림 데이터
 * @returns "connected" 제거된 데이터
 */
export function removeConnectedPrefix(data: string): string {
  // "connected" 문자열 제거 (대소문자 구분 없이)
  const lowerData = data.toLowerCase()
  if (lowerData.startsWith('connected')) {
    return data.substring('connected'.length)
  }
  return data
}

/**
 * 스트림 청크를 파싱하여 텍스트 내용 배열로 반환
 * @param chunkText 스트림에서 받은 원본 텍스트
 * @returns 추출된 텍스트 내용 배열
 */
export function parseStreamChunk(chunkText: string): string[] {
  // "connected" 제거
  const cleanedText = removeConnectedPrefix(chunkText)
  
  // 연속된 JSON 파싱
  const chunks = parseConsecutiveJson(cleanedText)
  
  // 각 chunk에서 content 추출 (extractContent에서 이미 processingLineBreaksRealtime이 적용됨)
  return chunks.map(extractContent).filter(content => content.length > 0)
}

/**
 * 버퍼에서 완전한 JSON 객체들을 추출하고 파싱
 * @param buffer 현재 버퍼
 * @returns { contents: 추출된 텍스트 배열, remainingBuffer: 남은 버퍼 }
 */
export function extractCompleteJsonFromBuffer(buffer: string): {
  contents: string[]
  remainingBuffer: string
} {
  const contents: string[] = []
  let lastProcessedIndex = 0
  let braceCount = 0
  let inString = false
  let escapeNext = false
  let jsonStartIndex = -1

  for (let i = 0; i < buffer.length; i++) {
    const char = buffer[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"' && !escapeNext) {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      if (braceCount === 0) {
        jsonStartIndex = i
      }
      braceCount++
    } else if (char === '}') {
      braceCount--
      if (braceCount === 0 && jsonStartIndex !== -1) {
        // 완전한 JSON 객체 발견
        const jsonStr = buffer.substring(jsonStartIndex, i + 1)
        try {
          const chunk = JSON.parse(jsonStr) as ChatCompletionChunk
          const content = extractContent(chunk)
          if (content) {
            // extractContent에서 이미 processingLineBreaksRealtime이 적용됨
            contents.push(content)
          }
          lastProcessedIndex = i + 1
        } catch (error) {
          console.warn('[ChatCompletionParser] JSON 파싱 실패:', {
            jsonStr,
            error,
          })
        }
        jsonStartIndex = -1
      }
    }
  }

  const remainingBuffer = lastProcessedIndex > 0 
    ? buffer.substring(lastProcessedIndex) 
    : buffer

  return { contents, remainingBuffer }
}

/**
 * 스트림 청크를 파싱하여 ChatCompletionChunk 배열로 반환
 * @param chunkText 스트림에서 받은 원본 텍스트
 * @returns 파싱된 ChatCompletionChunk 배열
 */
export function parseStreamChunks(chunkText: string): ChatCompletionChunk[] {
  // "connected" 제거
  const cleanedText = removeConnectedPrefix(chunkText)
  
  // 연속된 JSON 파싱
  return parseConsecutiveJson(cleanedText)
}
