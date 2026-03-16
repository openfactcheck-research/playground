<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useProjects } from '@/composables/useProjects'

const router = useRouter()
const { user } = useAuth()
const { createProject, createWorkspace } = useProjects(
  () => user.value?.userId ?? 'anonymous',
)

const isDark = ref(false)
let themeObserver: MutationObserver | null = null

function checkTheme() {
  isDark.value = document.documentElement.classList.contains('dark')
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
}

function createFirstProject() {
  const project = createProject('My First Project')
  const ws = createWorkspace(project.id, 'Untitled Workspace')
  if (ws)
    router.push({ name: 'dashboard', params: { projectId: project.id } })
}

onMounted(() => {
  checkTheme()
  themeObserver = new MutationObserver(checkTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  themeObserver?.disconnect()
})
</script>

<template>
  <div
    class="welcome-page relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground"
  >
    <!-- Animated gradient orbs -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="welcome-orb welcome-orb-1 absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
      <div class="welcome-orb welcome-orb-2 absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/6 blur-[120px]" />
      <div class="welcome-orb welcome-orb-3 absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/4 blur-[80px]" />
    </div>

    <!-- Dot grid overlay -->
    <div
      class="pointer-events-none absolute inset-0"
      style="background-image: radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px); background-size: 24px 24px;"
    />

    <!-- Theme toggle — top-right corner -->
    <button
      class="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      @click="toggleTheme"
    >
      <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" /><path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" /><path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>

    <div class="relative z-10 flex flex-col items-center gap-8 px-4">
      <!-- Logo icon with glow -->
      <div class="welcome-logo flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-xl shadow-primary/5 ring-1 ring-primary/20 backdrop-blur-sm">
        <img v-if="!isDark" src="/logo_sq_dark.svg" alt="OpenFactCheck" class="h-10 w-10">
        <img v-else src="/logo_sq_light.svg" alt="OpenFactCheck" class="h-10 w-10">
      </div>

      <!-- Heading -->
      <div class="flex flex-col items-center gap-3 text-center">
        <h1 class="text-3xl font-bold tracking-tight">
          Build fact-checking pipelines
        </h1>
        <p class="max-w-lg text-base leading-relaxed text-muted-foreground">
          Connect models, retrievers, and verifiers with a visual block editor.
          <br class="hidden sm:block">
          No code required.
        </p>
      </div>

      <!-- Feature pills -->
      <div class="flex flex-wrap justify-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="m5 12 5 5L20 7" /></svg>
          Visual blocks
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="m5 12 5 5L20 7" /></svg>
          Auto code generation
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="m5 12 5 5L20 7" /></svg>
          Multi-model support
        </span>
      </div>

      <!-- CTA button -->
      <button
        class="welcome-cta group mt-2 flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]"
        @click="createFirstProject"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Create your first project
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-0.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <!-- Link row -->
      <div class="flex items-center gap-6 pt-2">
        <a
          href="https://github.com/hasaniqbal777/OpenFactCheck"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
          </svg>
          GitHub
        </a>
        <span class="text-border">|</span>
        <a
          href="https://openfactcheck.readthedocs.io"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          Docs
        </a>
      </div>
    </div>

    <!-- Bottom hint -->
    <p class="absolute bottom-6 z-10 text-xs text-muted-foreground/50">
      Already have a project? Drag and drop a .json export to import.
    </p>
  </div>
</template>

<style scoped>
.welcome-orb {
  animation: float 20s ease-in-out infinite;
}
.welcome-orb-1 {
  animation-delay: 0s;
}
.welcome-orb-2 {
  animation-delay: -7s;
  animation-duration: 25s;
}
.welcome-orb-3 {
  animation-delay: -14s;
  animation-duration: 18s;
}
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -20px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 15px) scale(0.95);
  }
}

.welcome-page {
  animation: welcome-fadein 0.6s ease-out;
}
.welcome-logo {
  animation: welcome-fadein 0.6s ease-out 0.1s both;
}
.welcome-cta {
  animation: welcome-fadein 0.6s ease-out 0.3s both;
}
@keyframes welcome-fadein {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
