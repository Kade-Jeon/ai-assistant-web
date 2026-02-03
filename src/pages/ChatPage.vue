<script setup lang="ts">
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatInput from "@/components/chat/ChatInput.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import ChatSidebar from "@/components/chat/ChatSidebar.vue";
import Dashboard from "@/components/Dashboard.vue";
import PricingPage from "@/pages/PricingPage.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/composables/useApi";
import { useChatState } from "@/composables/useChatState";
import { useSidebarState } from "@/composables/useSidebarState";
import { useTheme } from "@/composables/useTheme";
import { inject } from "vue";
import { nextTick, ref } from "vue";

const { isDark, toggleTheme } = useTheme();
const { isSidebarOpen, isMobile } = useSidebarState();
// App.vue에서 provide한 auth 사용
const auth =
  inject<ReturnType<typeof import("@/composables/useAuth").useAuth>>("auth")!;
const { logout, userPlan } = auth;
const { getPreference, updatePreference, getAiStat } = useApi();
const {
  canSend,
  messageInput,
  messages,
  threads,
  isLoading,
  isLoadingMore,
  hasMoreMessages,
  sendMessage,
  retryMessage,
  startNewChat,
  selectThread,
  deleteThread,
  renameThread,
  loadMoreMessages,
} = useChatState();

// 현재 뷰 상태 ('chat' | 'dashboard' | 'pricing')
const currentView = ref<"chat" | "dashboard" | "pricing">("chat");

// 제목 변경 플로팅 폼
const renamingConversationId = ref<string | null>(null);
const editingTitle = ref("");

// 개인 맞춤 설정 플로팅 폼
const isCustomizeFormOpen = ref(false);
const isCustomizeFormLoading = ref(false);
const customizeForm = ref({
  nickname: "",
  job: "",
  additionalInfo: "",
});

const openRenameForm = (conversationId: string) => {
  const thread = threads.value.find((t) => t.conversationId === conversationId);
  renamingConversationId.value = conversationId;
  editingTitle.value = thread?.title ?? "";
};

const closeRenameForm = () => {
  renamingConversationId.value = null;
  editingTitle.value = "";
};

const handleRenameConfirm = async () => {
  const id = renamingConversationId.value;
  const title = editingTitle.value.trim();
  if (!id || !title) return;
  try {
    await renameThread(id, title);
    closeRenameForm();
  } catch {
    // 실패 시 토스트는 API 내부에서 표시됨, 폼은 열린 채로 두어 재시도 가능
  }
};

const openCustomizeForm = async () => {
  isCustomizeFormOpen.value = true;
  isCustomizeFormLoading.value = true;
  try {
    const data = await getPreference();
    customizeForm.value = {
      nickname: data.nickname ?? "",
      job: data.occupation ?? "",
      additionalInfo: data.extraInfo ?? "",
    };
  } catch {
    // 에러는 useApi에서 토스트로 표시됨, 폼은 빈 값으로 유지
  } finally {
    isCustomizeFormLoading.value = false;
  }
};

const closeCustomizeForm = () => {
  isCustomizeFormOpen.value = false;
};

const handleCustomizeConfirm = async () => {
  try {
    await updatePreference({
      nickname: customizeForm.value.nickname.trim() || undefined,
      occupation: customizeForm.value.job.trim() || undefined,
      extraInfo: customizeForm.value.additionalInfo.trim() || undefined,
    });
    closeCustomizeForm();
  } catch {
    // 에러는 useApi에서 토스트로 표시됨, 폼은 열린 채로 유지
  }
};

// 공통 뷰 변경 핸들러
const handleViewChange = (
  view: "chat" | "dashboard" | "pricing",
  conversationId?: string
) => {
  console.log(
    `뷰 변경: ${currentView.value} → ${view}`,
    conversationId ? `(대화: ${conversationId})` : ""
  );

  // 대화 선택인 경우 selectThread 호출
  if (conversationId) {
    selectThread(conversationId);
  }

  // 새 채팅 시작인 경우 startNewChat 호출 (conversationId가 undefined일 때)
  if (view === "chat" && !conversationId) {
    startNewChat();
  }

  currentView.value = view;
  console.log("변경 후 view:", currentView.value);

  // 모바일에서는 사이드바 자동 닫힘
  if (isMobile.value) {
    nextTick(() => {
      isSidebarOpen.value = false;
    });
  }

  // 대화 선택인 경우 추가 nextTick
  if (conversationId) {
    nextTick(() => {
      console.log("nextTick completed");
    });
  }
};

const handleDashboard = () => {
  getAiStat().catch(() => {
    /* 에러는 useApi에서 토스트로 표시됨 */
  });
  handleViewChange("dashboard");
};
const handleSelectThread = (conversationId: string) =>
  handleViewChange("chat", conversationId);
const handleNewChat = () => handleViewChange("chat");
const handlePlanUpgrade = () => {
  handleViewChange("pricing");
};
const handlePricingBack = () => {
  currentView.value = "chat";
};

const handleHelp = (_section?: string) => {
  // 도움말 섹션별 처리 (center, release-notes, terms, support, bug) 추후 연결
};
</script>

<template>
  <div class="flex h-screen">
    <ChatSidebar
      :threads="threads"
      :is-open="isSidebarOpen"
      :currentView="currentView"
      :user-plan="userPlan"
      @new-chat="handleNewChat"
      @dashboard="handleDashboard"
      @select-thread="handleSelectThread"
      @rename="openRenameForm"
      @delete="deleteThread"
      @customize="openCustomizeForm"
      @plan-upgrade="handlePlanUpgrade"
      @help="handleHelp"
      @logout="logout"
    />
    <div class="flex-1 flex flex-col overflow-hidden">
      <ChatHeader
        :is-dark="isDark"
        :is-sidebar-open="isSidebarOpen"
        @toggle-theme="toggleTheme"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      />
      <div class="flex-1 flex flex-col min-h-0">
        <!-- 채팅 뷰: 버블 영역 기준 토스트용 컨테이너 -->
        <div
          v-show="currentView === 'chat'"
          class="flex-1 flex flex-col min-h-0"
        >
          <div class="flex-1 min-h-0 relative flex flex-col">
            <ChatMessageList
              :messages="messages"
              :is-sidebar-open="isSidebarOpen"
              :is-loading="isLoading"
              :is-loading-more="isLoadingMore"
              :has-more-messages="hasMoreMessages"
              @retry="retryMessage"
              @load-more="loadMoreMessages"
            />
            <div
              id="chat-toast-container"
              class="absolute inset-0 pointer-events-none flex items-start justify-center pt-20 z-[100]"
              aria-hidden="true"
            />
          </div>
          <ChatInput
            v-model="messageInput"
            :can-send="canSend"
            @send="(value, attachments) => sendMessage(value, attachments)"
          />
        </div>

        <!-- 대시보드 뷰 -->
        <div
          v-show="currentView === 'dashboard'"
          class="flex-1 overflow-y-auto"
        >
          <Dashboard
            :is-visible="currentView === 'dashboard'"
            @back-to-chat="currentView = 'chat'"
          />
        </div>

        <!-- 가격(플랜 업그레이드) 뷰 -->
        <div
          v-show="currentView === 'pricing'"
          class="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <PricingPage :user-plan="userPlan" @back="handlePricingBack" />
        </div>
      </div>
    </div>

    <!-- 제목 변경 플로팅 폼 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        leave-active-class="transition duration-150 ease-in"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="renamingConversationId"
          class="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-title"
          @click.self="closeRenameForm"
        >
          <div
            class="w-full max-w-sm rounded-lg border bg-card p-4 shadow-lg"
            @click.stop
          >
            <h3
              id="rename-title"
              class="mb-3 text-sm font-medium text-foreground"
            >
              제목 변경
            </h3>
            <Input
              v-model="editingTitle"
              class="mb-1"
              placeholder="대화 제목"
              maxlength="36"
              autofocus
              @keydown.enter="handleRenameConfirm"
              @keydown.escape="closeRenameForm"
            />
            <p class="mb-4 text-right text-xs text-muted-foreground">
              {{ editingTitle.length }}/36자
            </p>
            <div class="flex justify-end gap-2">
              <Button variant="outline" size="sm" @click="closeRenameForm">
                취소
              </Button>
              <Button
                size="sm"
                :disabled="!editingTitle.trim()"
                @click="handleRenameConfirm"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 개인 맞춤 설정 플로팅 폼 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        leave-active-class="transition duration-150 ease-in"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isCustomizeFormOpen"
          class="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customize-title"
          @click.self="closeCustomizeForm"
        >
          <div
            class="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            @click.stop
          >
            <h3
              id="customize-title"
              class="mb-4 text-lg font-semibold text-foreground"
            >
              개인 맞춤 설정
            </h3>
            <p
              v-if="isCustomizeFormLoading"
              class="mb-4 text-sm text-muted-foreground"
            >
              불러오는 중...
            </p>
            <div class="space-y-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-foreground">
                  내 닉네임
                </label>
                <Input
                  v-model="customizeForm.nickname"
                  placeholder="닉네임을 입력하세요"
                  maxlength="30"
                  class="w-full"
                  :disabled="isCustomizeFormLoading"
                />
                <p class="mt-1 text-right text-xs text-muted-foreground">
                  {{ customizeForm.nickname.length }}/30자
                </p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-foreground">
                  내 직업
                </label>
                <Input
                  v-model="customizeForm.job"
                  placeholder="직업을 입력하세요"
                  maxlength="30"
                  class="w-full"
                  :disabled="isCustomizeFormLoading"
                />
                <p class="mt-1 text-right text-xs text-muted-foreground">
                  {{ customizeForm.job.length }}/30자
                </p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-foreground">
                  추가 정보
                </label>
                <textarea
                  v-model="customizeForm.additionalInfo"
                  placeholder="추가 정보를 입력하세요"
                  maxlength="300"
                  rows="4"
                  :disabled="isCustomizeFormLoading"
                  class="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                <p class="mt-1 text-right text-xs text-muted-foreground">
                  {{ customizeForm.additionalInfo.length }}/300자
                </p>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" @click="closeCustomizeForm">
                취소
              </Button>
              <Button size="sm" @click="handleCustomizeConfirm"> 확인 </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
