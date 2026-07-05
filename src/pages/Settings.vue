<script setup lang="ts">
import type { Component } from 'vue'
import type { Secret } from '@/types/secrets'
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LogoImage from '@/components/LogoImage.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useProjects } from '@/composables/useProjects'
import { useSecrets } from '@/composables/useSecrets'
import { formatTimeAgo } from '@/lib/utils'

type SectionId = 'secrets'

const SECTIONS: { id: SectionId, label: string, icon: Component }[] = [
  { id: 'secrets', label: 'Secrets', icon: KeyRound },
]

// Mirrors the API's secret-name rule: env-var style, leading letter or underscore, up to 64 chars.
const NAME_PATTERN = /^[a-z_]\w{0,63}$/i

const route = useRoute()
const { getProject, loadProjects } = useProjects()
const { secrets, loading, loadSecrets, setSecret, removeSecret } = useSecrets()

const activeSection = ref<SectionId>('secrets')

// When opened from a project's dashboard, the breadcrumb links back to it.
const fromProjectId = computed(() => (route.query.project as string | undefined) ?? '')
const fromProjectName = computed(() => (fromProjectId.value ? (getProject(fromProjectId.value)?.name ?? '') : ''))

// Add/edit dialog. editingName is null for a new secret, or the name being edited.
const dialogOpen = ref(false)
const editingName = ref<string | null>(null)
const formName = ref('')
const formValue = ref('')
const submitting = ref(false)

const nameError = computed(() => {
  if (editingName.value !== null)
    return ''
  const name = formName.value.trim()
  if (!name || NAME_PATTERN.test(name))
    return ''
  return 'Use letters, digits and underscores, starting with a letter or underscore.'
})

const canSubmit = computed(() =>
  formValue.value.trim().length > 0
  && (editingName.value !== null || (formName.value.trim().length > 0 && !nameError.value))
  && !submitting.value,
)

function openNew(): void {
  editingName.value = null
  formName.value = ''
  formValue.value = ''
  dialogOpen.value = true
}

function openEdit(secret: Secret): void {
  editingName.value = secret.name
  formName.value = secret.name
  formValue.value = ''
  dialogOpen.value = true
}

async function submit(): Promise<void> {
  if (!canSubmit.value)
    return
  const name = editingName.value ?? formName.value.trim()
  submitting.value = true
  const ok = await setSecret(name, formValue.value.trim())
  submitting.value = false
  if (ok)
    dialogOpen.value = false
}

onMounted(() => {
  loadSecrets()
  if (fromProjectId.value && !fromProjectName.value)
    loadProjects()
})
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
    <!-- Header -->
    <header class="flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
      <div class="flex items-center gap-3">
        <RouterLink to="/projects" class="flex items-center">
          <LogoImage variant="square" class="h-8 w-8" />
        </RouterLink>
        <template v-if="fromProjectName">
          <span class="text-muted-foreground/40">/</span>
          <RouterLink
            :to="`/dashboard/${fromProjectId}`"
            class="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {{ fromProjectName }}
          </RouterLink>
        </template>
        <span class="text-muted-foreground/40">/</span>
        <span class="text-sm font-medium text-foreground">Settings</span>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Settings nav -->
      <aside class="flex w-56 shrink-0 flex-col border-r border-border bg-card p-3">
        <nav class="flex flex-col gap-1">
          <button
            v-for="section in SECTIONS"
            :key="section.id"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="activeSection === section.id
              ? 'bg-secondary font-medium text-foreground'
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'"
            @click="activeSection = section.id"
          >
            <component :is="section.icon" :size="16" class="shrink-0" />
            {{ section.label }}
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto" style="background-color: light-dark(#fafafa, #171717);">
        <section v-if="activeSection === 'secrets'" class="px-8 py-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="text-lg font-semibold">
                Secrets
              </h1>
              <p class="mt-1 max-w-2xl text-sm text-muted-foreground">
                API keys and other credentials, stored encrypted on the server and used to run your pipelines. A value is never shown again after you save it.
              </p>
            </div>
            <Button class="shrink-0" @click="openNew">
              <Plus :size="14" />
              New Secret
            </Button>
          </div>

          <div class="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead class="w-44">
                    Type
                  </TableHead>
                  <TableHead class="w-40">
                    Last updated
                  </TableHead>
                  <TableHead class="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="!secrets.length">
                  <TableCell colspan="4" class="h-24 text-center text-sm text-muted-foreground">
                    {{ loading ? 'Loading…' : 'No secrets yet. Add one with New Secret.' }}
                  </TableCell>
                </TableRow>
                <TableRow v-for="secret in secrets" :key="secret.name">
                  <TableCell class="font-medium">
                    {{ secret.name }}
                  </TableCell>
                  <TableCell class="text-muted-foreground">
                    Environment Variable
                  </TableCell>
                  <TableCell class="text-muted-foreground">
                    {{ formatTimeAgo(secret.updatedAt) }}
                  </TableCell>
                  <TableCell class="whitespace-nowrap text-right">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button size="sm" variant="ghost" aria-label="Edit" @click="openEdit(secret)">
                          <Pencil :size="14" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Edit
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button size="sm" variant="ghost" aria-label="Delete" @click="removeSecret(secret.name)">
                          <Trash2 :size="14" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Delete
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </div>

    <!-- Add / edit dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingName ? 'Edit secret' : 'New secret' }}</DialogTitle>
          <DialogDescription>
            Stored encrypted on the server. The value is never shown again after you save it.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2">
          <div class="grid gap-2">
            <Label>Name</Label>
            <Input
              v-model="formName"
              :disabled="editingName !== null"
              placeholder="OPENAI_API_KEY"
              autocomplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              data-form-type="other"
              :aria-invalid="!!nameError"
              @keydown.enter="submit"
            />
            <p v-if="nameError" class="text-xs text-destructive">
              {{ nameError }}
            </p>
          </div>
          <div class="grid gap-2">
            <Label>Value</Label>
            <!-- Masked with a dot-glyph font (mask-secret), never type="password" or
                 -webkit-text-security: both make Safari / Apple Passwords treat this as a
                 saved password. Applied only when there is a value so the placeholder stays readable. -->
            <Input
              v-model="formValue"
              type="text"
              :placeholder="editingName ? 'Enter a new value' : 'value'"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              data-form-type="other"
              :class="formValue ? 'mask-secret' : ''"
              @keydown.enter="submit"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">
            Cancel
          </Button>
          <Button :disabled="!canSubmit" @click="submit">
            {{ editingName ? 'Save' : 'Add' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
