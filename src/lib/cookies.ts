/**
 * 쿠키 유틸리티 함수
 */

const USER_ID_COOKIE_NAME = "ai-assistant-user-id";
const USER_PLAN_COOKIE_NAME = "ai-assistant-user-plan";

/**
 * 쿠키를 설정합니다.
 * @param name 쿠키 이름
 * @param value 쿠키 값
 * @param maxAge 만료 시간 (초 단위)
 */
export const setCookie = (
  name: string,
  value: string,
  maxAge: number,
): void => {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
};

/**
 * 쿠키를 읽습니다.
 * @param name 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

/**
 * 쿠키를 삭제합니다.
 * @param name 쿠키 이름
 */
export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; path=/; max-age=0`;
};

/**
 * 사용자 ID 쿠키를 설정합니다 (2시간 만료).
 * @param userId 사용자 ID
 */
export const setUserIdCookie = (userId: string): void => {
  const twoHoursInSeconds = 2 * 60 * 60; // 2시간 = 7200초
  setCookie(USER_ID_COOKIE_NAME, userId, twoHoursInSeconds);
};

/**
 * 사용자 ID 쿠키를 읽습니다.
 * @returns 사용자 ID 또는 null
 */
export const getUserIdCookie = (): string | null => {
  return getCookie(USER_ID_COOKIE_NAME);
};

/**
 * 사용자 ID 쿠키를 삭제합니다.
 */
export const deleteUserIdCookie = (): void => {
  deleteCookie(USER_ID_COOKIE_NAME);
};

/**
 * 사용자 플랜 쿠키를 설정합니다 (2시간 만료).
 * @param plan 사용자 플랜
 */
export const setUserPlanCookie = (plan: string): void => {
  const twoHoursInSeconds = 2 * 60 * 60; // 2시간 = 7200초
  setCookie(USER_PLAN_COOKIE_NAME, plan, twoHoursInSeconds);
};

/**
 * 사용자 플랜 쿠키를 읽습니다.
 * @returns 사용자 플랜 또는 null
 */
export const getUserPlanCookie = (): string | null => {
  return getCookie(USER_PLAN_COOKIE_NAME);
};

/**
 * 사용자 플랜 쿠키를 삭제합니다.
 */
export const deleteUserPlanCookie = (): void => {
  deleteCookie(USER_PLAN_COOKIE_NAME);
};
