<script setup lang="ts">
import { ref } from "vue";
import type { useAuth } from "@/composables/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const props = defineProps<{
  auth: ReturnType<typeof useAuth>;
}>();

const { login, isLoading } = props.auth;

const emailId = ref("");
const password = ref("");
const errorMessage = ref("");

const handleLogin = async () => {
  if (!emailId.value.trim() || !password.value.trim()) {
    errorMessage.value = "이메일과 비밀번호를 입력해주세요.";
    return;
  }

  errorMessage.value = "";
  try {
    await login(emailId.value.trim(), password.value);
  } catch (error) {
    // 에러는 useApi에서 이미 토스트로 표시됨
    errorMessage.value =
      error instanceof Error ? error.message : "로그인에 실패했습니다.";
  }
};
</script>

<template>
  <div class="flex h-screen items-center justify-center bg-background">
    <div class="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
      <h1 class="mb-6 text-center text-2xl font-bold text-foreground">
        로그인
      </h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label
            for="emailId"
            class="mb-2 block text-sm font-medium text-foreground"
          >
            이메일
          </label>
          <Input
            id="emailId"
            v-model="emailId"
            type="email"
            placeholder="이메일을 입력하세요"
            class="w-full"
            :disabled="isLoading"
            autofocus
            required
          />
        </div>

        <div>
          <label
            for="password"
            class="mb-2 block text-sm font-medium text-foreground"
          >
            비밀번호
          </label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            class="w-full"
            :disabled="isLoading"
            required
            @keydown.enter="handleLogin"
          />
        </div>

        <div v-if="errorMessage" class="text-sm text-destructive">
          {{ errorMessage }}
        </div>

        <Button
          type="submit"
          class="w-full"
          :disabled="isLoading || !emailId.trim() || !password.trim()"
        >
          {{ isLoading ? "로그인 중..." : "로그인" }}
        </Button>
      </form>
    </div>
  </div>
</template>
