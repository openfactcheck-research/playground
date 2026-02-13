<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signOut, user } = useAuth()

async function handleLogout() {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <main class="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4">
    <h1 class="text-3xl font-bold text-foreground">
      Hello World
    </h1>
    <p class="text-muted-foreground">
      You are logged in{{ user?.name ? ` as ${user.name}` : '' }}.
    </p>
    <Button variant="outline" @click="handleLogout">
      Log out
    </Button>
  </main>
</template>
