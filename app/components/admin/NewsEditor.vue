<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline'
      }
    })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4'
    }
  }
})

watch(() => props.modelValue, (value) => {
  if (editor.value && editor.value.getHTML() !== value) {
    editor.value.commands.setContent(value)
  }
})

const addLink = () => {
  const url = window.prompt('URL ссылки:')
  if (url && editor.value) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

const removeLink = () => {
  editor.value?.chain().focus().unsetLink().run()
}
</script>

<template>
  <div class="news-editor glass-card rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="toolbar flex flex-wrap gap-2 p-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]">
      <button
        @click="editor?.chain().focus().toggleBold().run()"
        :class="{ 'bg-primary/20': editor?.isActive('bold') }"
        class="toolbar-btn"
        type="button"
        title="Полужирный"
      >
        <Icon name="heroicons:bold" class="w-4 h-4" />
      </button>

      <button
        @click="editor?.chain().focus().toggleItalic().run()"
        :class="{ 'bg-primary/20': editor?.isActive('italic') }"
        class="toolbar-btn"
        type="button"
        title="Курсив"
      >
        <span class="italic font-serif">I</span>
      </button>

      <button
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-primary/20': editor?.isActive('heading', { level: 2 }) }"
        class="toolbar-btn"
        type="button"
        title="Заголовок 2"
      >
        H2
      </button>

      <button
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'bg-primary/20': editor?.isActive('heading', { level: 3 }) }"
        class="toolbar-btn"
        type="button"
        title="Заголовок 3"
      >
        H3
      </button>

      <button
        @click="editor?.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-primary/20': editor?.isActive('bulletList') }"
        class="toolbar-btn"
        type="button"
        title="Маркированный список"
      >
        <Icon name="heroicons:list-bullet" class="w-4 h-4" />
      </button>

      <button
        @click="editor?.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-primary/20': editor?.isActive('orderedList') }"
        class="toolbar-btn"
        type="button"
        title="Нумерованный список"
      >
        <span class="text-xs font-bold">1.</span>
      </button>

      <button
        @click="addLink"
        :class="{ 'bg-primary/20': editor?.isActive('link') }"
        class="toolbar-btn"
        type="button"
        title="Добавить ссылку"
      >
        <Icon name="heroicons:link" class="w-4 h-4" />
      </button>

      <button
        v-if="editor?.isActive('link')"
        @click="removeLink"
        class="toolbar-btn"
        type="button"
        title="Удалить ссылку"
      >
        <Icon name="heroicons:link-slash" class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.toolbar-btn {
  @apply px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors;
}

:deep(.ProseMirror) {
  color: var(--text-primary);
}

:deep(.ProseMirror p) {
  margin-bottom: 1rem;
}

:deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  color: var(--text-primary);
}

:deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
  color: var(--text-primary);
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 2rem;
  margin-bottom: 1rem;
}

:deep(.ProseMirror ul) {
  list-style: disc;
}

:deep(.ProseMirror ol) {
  list-style: decimal;
}

:deep(.ProseMirror a) {
  color: var(--primary);
  text-decoration: underline;
}
</style>
