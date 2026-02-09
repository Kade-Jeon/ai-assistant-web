<script setup lang="ts">
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatInput from "@/components/chat/ChatInput.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import ChatSidebar from "@/components/chat/ChatSidebar.vue";
import ProjectDocumentPanel from "@/components/chat/ProjectDocumentPanel.vue";
import Dashboard from "@/components/Dashboard.vue";
import PricingPage from "@/pages/PricingPage.vue";
import { ACCEPT_ATTACHMENT_EXTENSIONS } from "@/lib/fileAccept";
import type { ProjectDocumentItem } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, X } from "lucide-vue-next";
import { showApiError } from "@/composables/useApiError";
import { useApi } from "@/composables/useApi";
import { useChatState } from "@/composables/useChatState";
import { useSidebarState } from "@/composables/useSidebarState";
import { useTheme } from "@/composables/useTheme";
import { inject, watch } from "vue";
import { computed, nextTick, ref } from "vue";

const { isDark, toggleTheme } = useTheme();
const { isSidebarOpen, isMobile } = useSidebarState();
// App.vue에서 provide한 auth 사용
const auth =
  inject<ReturnType<typeof import("@/composables/useAuth").useAuth>>("auth")!;
const { logout, userPlan } = auth;
const {
  getPreference,
  updatePreference,
  getAiStat,
  createProject,
  addProjectDocument,
  getDocumentList,
  deleteProjectDocument,
} = useApi();
const {
  canSend,
  messageInput,
  messages,
  threads,
  projects,
  refreshProjects,
  isLoading,
  isLoadingMore,
  hasMoreMessages,
  sendMessage,
  retryMessage,
  startNewChat,
  selectThread,
  clearThreadSelection,
  deleteThread,
  renameThread,
  loadMoreMessages,
} = useChatState();

// 현재 뷰 상태 ('chat' | 'dashboard' | 'project' | 'pricing')
const currentView = ref<"chat" | "dashboard" | "project" | "pricing">("chat");

// 일반 대화·프로젝트 대화 모두 동일한 채팅 화면 사용
const isChatAreaVisible = computed(
  () => currentView.value === "chat" || currentView.value === "project",
);

// 프로젝트 대화 시 전송용 (conversationId, subject)
const selectedProject = computed(() =>
  projects.value.find((p) => p.conversationId === selectedProjectId.value),
);

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

// 프로젝트 만들기 플로팅 폼
const isProjectFormOpen = ref(false);
const isProjectFormLoading = ref(false);
const projectName = ref("");

const selectedProjectId = ref<string | null>(null);

// 프로젝트 문서 패널 (RAG): 패널 열림 상태, 문서 목록, 업로드 중/조회 중 여부
const isDocumentPanelOpen = ref(false);
const projectDocuments = ref<ProjectDocumentItem[]>([]);
const isAddingDocument = ref(false);
const isDocumentsLoading = ref(false);

// 문서 삭제 확인 다이얼로그
const deletingDocumentId = ref<string | null>(null);
const deletingDocumentName = ref<string>("");

const openProjectForm = () => {
  isProjectFormOpen.value = true;
  projectName.value = "";
};

const closeProjectForm = () => {
  isProjectFormOpen.value = false;
  projectName.value = "";
};

const handleProjectCreate = async (event?: KeyboardEvent) => {
  if (event?.isComposing) return;
  const name = projectName.value.trim();
  if (!name) return;
  if (isProjectFormLoading.value) return;
  isProjectFormLoading.value = true;
  try {
    await createProject(name);
    await refreshProjects();
    closeProjectForm();
  } catch {
    // 에러는 useApi에서 토스트로 표시됨
  } finally {
    isProjectFormLoading.value = false;
  }
};

const canCreateProject = computed(() => projectName.value.trim().length > 0);

const fetchProjectDocuments = async (conversationId: string) => {
  isDocumentsLoading.value = true;
  try {
    projectDocuments.value = await getDocumentList(conversationId);
  } catch {
    projectDocuments.value = [];
  } finally {
    isDocumentsLoading.value = false;
  }
};

watch(selectedProjectId, (id) => {
  if (id == null) {
    projectDocuments.value = [];
    return;
  }
  fetchProjectDocuments(id);
});

const handleSelectProject = async (projectId: string) => {
  try {
    await selectThread(projectId);
  } catch {
    /* 에러는 useChatState에서 error 상태 및 토스트로 처리 */
  }
  selectedProjectId.value = projectId;
  currentView.value = "project";
  isDocumentPanelOpen.value = false;
  clearThreadSelection();
  if (isMobile.value) {
    nextTick(() => {
      isSidebarOpen.value = false;
    });
  }
};

const handleRenameProject = (_projectId: string) => {
  // TODO: 프로젝트 이름 변경 API 연동 시 구현
};

const handleDeleteProject = (_projectId: string) => {
  // TODO: 프로젝트 삭제 API 연동 시 구현
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
  view: "chat" | "dashboard" | "project" | "pricing",
  conversationId?: string,
) => {
  console.log(
    `뷰 변경: ${currentView.value} → ${view}`,
    conversationId ? `(대화: ${conversationId})` : "",
  );

  // 대화 선택인 경우 selectThread 호출
  if (conversationId) {
    selectThread(conversationId);
  }

  // 새 채팅 시작인 경우 startNewChat 호출 (conversationId가 undefined일 때)
  if (view === "chat" && !conversationId) {
    startNewChat();
  }

  // 대시보드/프로젝트/프라이싱 등 채팅이 아닌 뷰로 이동 시 최근 대화 선택 하이라이트 해제
  if (view === "dashboard" || view === "project" || view === "pricing") {
    clearThreadSelection();
  }

  // 프로젝트 뷰가 아닌 다른 뷰로 이동 시 프로젝트 선택 해제 및 문서 패널 닫기
  if (view !== "project") {
    selectedProjectId.value = null;
    isDocumentPanelOpen.value = false;
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

const handleToggleDocuments = () => {
  isDocumentPanelOpen.value = !isDocumentPanelOpen.value;
};

const handleDocumentPanelClose = () => {
  isDocumentPanelOpen.value = false;
};

const handleDocumentFilesSelected = async (files: File[]) => {
  if (!files.length) return;
  if (!selectedProject.value?.conversationId) {
    showApiError("프로젝트가 선택되지 않았습니다.");
    return;
  }

  isAddingDocument.value = true;
  try {
    for (const file of files) {
      await addProjectDocument(selectedProject.value.conversationId, file);
    }
    await fetchProjectDocuments(selectedProject.value.conversationId);
  } catch {
    /* 에러는 useApi에서 토스트로 표시 */
  } finally {
    isAddingDocument.value = false;
  }
};

const openDeleteDocumentDialog = (id: string) => {
  const doc = projectDocuments.value.find((d) => d.id === id);
  if (!doc) return;
  deletingDocumentId.value = id;
  deletingDocumentName.value = doc.name;
};

const closeDeleteDocumentDialog = () => {
  deletingDocumentId.value = null;
  deletingDocumentName.value = "";
};

const handleDeleteDocument = async () => {
  const id = deletingDocumentId.value;
  if (!id || id === "undefined") {
    showApiError("문서 ID가 유효하지 않습니다.");
    closeDeleteDocumentDialog();
    return;
  }
  if (!selectedProject.value?.conversationId) {
    showApiError("프로젝트가 선택되지 않았습니다.");
    return;
  }

  try {
    await deleteProjectDocument(selectedProject.value.conversationId, id);
    projectDocuments.value = projectDocuments.value.filter((d) => d.id !== id);
    closeDeleteDocumentDialog();
  } catch {
    // 에러는 useApi에서 토스트로 표시됨
  }
};
</script>

<template>
  <div class="flex h-screen">
    <ChatSidebar
      :threads="threads"
      :projects="projects"
      :is-open="isSidebarOpen"
      :currentView="currentView"
      :selectedProjectId="selectedProjectId"
      :user-plan="userPlan"
      @new-chat="handleNewChat"
      @dashboard="handleDashboard"
      @new-project="openProjectForm"
      @select-thread="handleSelectThread"
      @select-project="handleSelectProject"
      @rename="openRenameForm"
      @rename-project="handleRenameProject"
      @delete="deleteThread"
      @delete-project="handleDeleteProject"
      @customize="openCustomizeForm"
      @plan-upgrade="handlePlanUpgrade"
      @help="handleHelp"
      @logout="logout"
    />
    <div class="flex-1 flex flex-col overflow-hidden">
      <ChatHeader
        :is-dark="isDark"
        :is-sidebar-open="isSidebarOpen"
        :center-title="
          currentView === 'project' && selectedProject
            ? `프로젝트 ${selectedProject.subject}`
            : undefined
        "
        :show-document-button="currentView === 'project' && !!selectedProject"
        :is-document-panel-open="isDocumentPanelOpen"
        :document-count="projectDocuments.length"
        @toggle-theme="toggleTheme"
        @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
        @toggle-documents="handleToggleDocuments"
      />
      <div class="flex-1 flex flex-col min-h-0">
        <!-- 채팅 뷰 (일반 대화 + 프로젝트 대화 동일 화면, 전송 시에만 projectId 여부로 구분) -->
        <div
          v-if="isChatAreaVisible"
          class="flex-1 flex flex-col min-h-0 w-full"
        >
          <ProjectDocumentPanel
            v-if="currentView === 'project'"
            :is-open="isDocumentPanelOpen"
            :documents="projectDocuments"
            :is-loading="isAddingDocument || isDocumentsLoading"
            :accept="ACCEPT_ATTACHMENT_EXTENSIONS"
            @files-selected="handleDocumentFilesSelected"
            @delete-document="openDeleteDocumentDialog"
            @close="handleDocumentPanelClose"
          />
          <div class="flex-1 min-h-0 relative flex flex-col">
            <ChatMessageList
              :messages="messages"
              :is-sidebar-open="isSidebarOpen"
              :is-loading="isLoading"
              :is-loading-more="isLoadingMore"
              :has-more-messages="hasMoreMessages"
              @retry="(msg) => retryMessage(msg, selectedProject?.conversationId, selectedProject?.subject)"
              @load-more="loadMoreMessages"
            />
          </div>
          <ChatInput
            v-model="messageInput"
            :can-send="canSend"
            @send="(value, attachments) => sendMessage(value, attachments, selectedProject?.conversationId, selectedProject?.subject)"
          />
        </div>

        <!-- 대시보드 뷰 -->
        <div
          v-if="currentView === 'dashboard'"
          class="flex-1 overflow-y-auto"
        >
          <Dashboard
            :is-visible="currentView === 'dashboard'"
            @back-to-chat="currentView = 'chat'"
          />
        </div>

        <!-- 가격(플랜 업그레이드) 뷰 -->
        <div
          v-if="currentView === 'pricing'"
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

    <!-- 프로젝트 만들기 플로팅 폼 -->
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
          v-if="isProjectFormOpen"
          class="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-form-title"
          @click.self="closeProjectForm"
        >
          <div
            class="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            @click.stop
          >
            <div class="mb-4 flex items-start justify-between gap-4">
              <h3
                id="project-form-title"
                class="text-lg font-semibold text-foreground"
              >
                프로젝트 만들기
              </h3>
              <button
                type="button"
                class="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="닫기"
                @click="closeProjectForm"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <Input
                  v-model="projectName"
                  placeholder="프로젝트 이름을 입력해주세요."
                  class="w-full"
                  @keydown.enter.prevent="handleProjectCreate($event)"
                />
              </div>
              <div
                class="flex gap-3 rounded-md border border-transparent bg-muted/50 px-3 py-3 text-sm text-muted-foreground"
              >
                <Lightbulb class="h-5 w-5 shrink-0 text-amber-500" />
                <p>
                  프로젝트에서는 한 곳에 파일, 맞춤형 지침을 보관합니다.
                  지속적으로 진행되는 작업에, 또는 작업을 깔끔히 정리하기에
                  좋죠.
                </p>
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <Button
                size="sm"
                :disabled="!canCreateProject || isProjectFormLoading"
                @click="handleProjectCreate"
              >
                {{ isProjectFormLoading ? "생성 중..." : "프로젝트 만들기" }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 문서 삭제 확인 다이얼로그 -->
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
          v-if="deletingDocumentId"
          class="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-document-title"
          @click.self="closeDeleteDocumentDialog"
        >
          <div
            class="w-full max-w-sm rounded-lg border bg-card p-4 shadow-lg"
            @click.stop
          >
            <h3
              id="delete-document-title"
              class="mb-3 text-sm font-medium text-foreground"
            >
              문서 삭제
            </h3>
            <p class="mb-4 text-sm text-muted-foreground">
              {{ deletingDocumentName }} 를 삭제하시겠습니까? 삭제하면 복구가 불가능합니다.
            </p>
            <div class="flex justify-end gap-2">
              <Button variant="outline" size="sm" @click="closeDeleteDocumentDialog">
                취소
              </Button>
              <Button
                size="sm"
                variant="destructive"
                @click="handleDeleteDocument"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
