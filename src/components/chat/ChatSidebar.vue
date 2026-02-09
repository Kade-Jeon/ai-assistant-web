<script setup lang="ts">
import ChatSidebarHeader from "./sidebar/ChatSidebarHeader.vue";
import ChatSidebarContent from "./sidebar/ChatSidebarContent.vue";
import ChatSidebarFooter from "./sidebar/ChatSidebarFooter.vue";
import type { ChatThread } from "@/types/chat";
import type { ProjectItem } from "@/types/project";

defineProps<{
  threads: ChatThread[];
  projects: ProjectItem[];
  isOpen: boolean;
  currentView: "chat" | "dashboard" | "project" | "pricing";
  selectedProjectId?: string | null;
  userPlan?: string | null;
}>();

const emit = defineEmits<{
  (e: "new-chat"): void;
  (e: "dashboard"): void;
  (e: "new-project"): void;
  (e: "select-thread", conversationId: string): void;
  (e: "select-project", projectId: string): void;
  (e: "rename", conversationId: string): void;
  (e: "rename-project", projectId: string): void;
  (e: "delete", conversationId: string): void;
  (e: "delete-project", projectId: string): void;
  (e: "customize"): void;
  (e: "plan-upgrade"): void;
  (e: "help", section?: string): void;
  (e: "logout"): void;
}>();

const handleSelectThread = (conversationId: string) =>
  emit("select-thread", conversationId);
const handleRename = (conversationId: string) => emit("rename", conversationId);
const handleDelete = (conversationId: string) => emit("delete", conversationId);
</script>

<template>
  <transition
    enter-active-class="transition-transform duration-300 ease-out"
    leave-active-class="transition-transform duration-300 ease-in"
    enter-from-class="transform -translate-x-full"
    enter-to-class="transform translate-x-0"
    leave-from-class="transform translate-x-0"
    leave-to-class="transform -translate-x-full"
  >
    <div v-if="isOpen" class="w-64 bg-sidebar border-r flex flex-col h-full">
      <ChatSidebarHeader @new-chat="emit('new-chat')" />
      <ChatSidebarContent
        :threads="threads"
        :projects="projects"
        :currentView="currentView"
        :selectedProjectId="selectedProjectId"
        @dashboard="emit('dashboard')"
        @new-project="emit('new-project')"
        @select-thread="handleSelectThread"
        @select-project="emit('select-project', $event)"
        @rename="handleRename"
        @rename-project="emit('rename-project', $event)"
        @delete="handleDelete"
        @delete-project="emit('delete-project', $event)"
      />
      <ChatSidebarFooter
        :user-plan="userPlan"
        @customize="emit('customize')"
        @plan-upgrade="emit('plan-upgrade')"
        @help="(section) => emit('help', section)"
        @logout="emit('logout')"
      />
    </div>
  </transition>
</template>
