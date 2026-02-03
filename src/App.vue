<script setup lang="ts">
import { computed, onMounted, provide } from "vue";
import ApiErrorToast from "@/components/ApiErrorToast.vue";
import ChatPage from "@/pages/ChatPage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/composables/useAuth";

const auth = useAuth();

// auth를 provide하여 하위 컴포넌트에서 사용할 수 있도록 함
provide("auth", auth);

// 마운트 시 인증 상태 확인
onMounted(() => {
  auth.checkAuth();
});

const showLogin = computed(() => !auth.isAuthenticated.value);
</script>

<template>
  <TooltipProvider>
    <LoginPage v-if="showLogin" :auth="auth" />
    <template v-else>
      <ChatPage />
    </template>
    <ApiErrorToast />
  </TooltipProvider>
</template>
