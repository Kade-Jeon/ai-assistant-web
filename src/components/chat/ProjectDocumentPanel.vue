<script setup lang="ts">
import { Teleport, Transition } from "vue";
import { Button } from "@/components/ui/button";
import { FilePlus, Loader2 } from "lucide-vue-next";
import FileBadgeList from "./FileBadgeList.vue";
import type { ProjectDocumentItem } from "@/types/project";

const INPUT_ID = "project-document-file-input";

defineProps<{
  documents: ProjectDocumentItem[];
  isLoading?: boolean;
  /** input accept (확장자 제한), 예: .doc,.docx,.pdf,... */
  accept?: string;
  /** 패널이 열려 있는지 여부 */
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: "files-selected", files: File[]): void;
  (e: "delete-document", id: string): void;
  (e: "close"): void;
}>();

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  input.value = "";
  if (files.length > 0) emit("files-selected", files);
};
</script>

<template>
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
        v-if="isOpen"
        class="fixed inset-0 z-40 bg-black/20"
        @click="emit('close')"
      />
    </Transition>
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="fixed top-12 right-4 z-50 w-full max-w-sm bg-card border rounded-lg shadow-lg"
        @click.stop
      >
        <div class="flex items-center justify-between gap-2 px-4 py-2 border-b">
          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            프로젝트 문서
          </span>
          <input
            :id="INPUT_ID"
            type="file"
            class="hidden"
            multiple
            :accept="accept"
            :disabled="isLoading"
            @change="handleFileChange"
          />
          <label :for="INPUT_ID" class="cursor-pointer" :class="{ 'pointer-events-none': isLoading }">
            <Button
              variant="outline"
              size="sm"
              class="h-7 gap-2 shrink-0"
              :disabled="isLoading"
              as="span"
            >
              <Loader2 v-if="isLoading" class="h-4 w-4 shrink-0 animate-spin" />
              <FilePlus v-else class="h-4 w-4 shrink-0" />
              {{ isLoading ? "업로드 중..." : "문서 추가" }}
            </Button>
          </label>
        </div>
        <div class="px-4 pb-3 pt-3 space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div v-if="documents.length > 0" class="max-h-40 overflow-y-auto">
            <FileBadgeList
              :items="documents"
              :removable="true"
              @remove="(i) => { const doc = documents[i]; if (doc) emit('delete-document', doc.id); }"
            />
          </div>
          <div v-else-if="isLoading" class="flex items-center gap-2 py-2">
            <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
            <span class="text-xs text-muted-foreground">
              {{ documents.length > 0 ? "문서 업로드 중..." : "문서 목록 불러오는 중..." }}
            </span>
          </div>
          <p
            v-else
            class="text-xs text-muted-foreground py-2"
          >
            추가된 문서가 없습니다.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
