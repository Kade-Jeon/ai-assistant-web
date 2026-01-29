import { computed, onMounted, ref } from "vue";
import { useApi } from "./useApi";
import {
  getUserIdCookie,
  setUserIdCookie,
  deleteUserIdCookie,
  getUserPlanCookie,
  setUserPlanCookie,
  deleteUserPlanCookie,
} from "@/lib/cookies";

/**
 * 인증 상태를 관리하는 composable
 */
export const useAuth = () => {
  const { login: loginApi } = useApi();
  // 초기 상태를 즉시 확인 (쿠키가 있으면 true로 시작)
  const isAuthenticated = ref(!!getUserIdCookie());
  const isLoading = ref(false);
  const userPlan = ref<string | null>(getUserPlanCookie());

  /**
   * 쿠키에서 사용자 ID를 확인하여 인증 상태를 업데이트합니다.
   */
  const checkAuth = () => {
    const userId = getUserIdCookie();
    isAuthenticated.value = !!userId;
    return !!userId;
  };

  /**
   * 로그인을 수행합니다.
   * @param emailId 이메일
   * @param password 비밀번호
   */
  const login = async (emailId: string, password: string): Promise<void> => {
    isLoading.value = true;
    try {
      const response = await loginApi(emailId, password);
      // userId를 쿠키에 저장 (2시간 만료) - UUID를 문자열로 변환
      setUserIdCookie(String(response.userId));
      // plan을 쿠키에 저장 (2시간 만료)
      setUserPlanCookie(response.plan);
      userPlan.value = response.plan;
      isAuthenticated.value = true;
    } catch (error) {
      isAuthenticated.value = false;
      userPlan.value = null;
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 로그아웃을 수행합니다.
   * 쿠키를 삭제하고 인증 상태를 초기화합니다.
   */
  const logout = () => {
    deleteUserIdCookie();
    deleteUserPlanCookie();
    isAuthenticated.value = false;
    userPlan.value = null;
    // 인증 상태 업데이트를 보장하기 위해 checkAuth 호출
    checkAuth();
  };

  // 주의: onMounted는 각 컴포넌트에서 필요시 호출하므로 여기서는 제거
  // App.vue에서 onMounted로 checkAuth()를 호출함

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    isLoading: computed(() => isLoading.value),
    userPlan: computed(() => userPlan.value),
    login,
    logout,
    checkAuth,
  };
};
