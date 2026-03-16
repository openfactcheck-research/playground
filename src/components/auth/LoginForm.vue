<script setup lang="ts">
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'
import { POST_LOGIN_ROUTE } from '@/router'

const router = useRouter()
const { signIn } = useAuth()

// Form state
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  isLoading.value = true

  try {
    const result = await signIn(email.value, password.value)

    // Cognito requires email verification before the first sign-in
    if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
      router.push({ name: 'verify', query: { email: email.value } })
      return
    }

    router.push(POST_LOGIN_ROUTE)
  }
  catch (error: unknown) {
    // Map Cognito error codes to user-friendly messages
    const err = error as { name?: string, message?: string }
    if (err.name === 'UserNotFoundException') {
      errorMessage.value = 'No account found with this email. Please sign up first.'
    }
    else if (err.name === 'NotAuthorizedException') {
      errorMessage.value = 'Incorrect password. Please try again.'
    }
    else if (err.name === 'UserNotConfirmedException') {
      // Account exists but email was never verified — redirect to verify page
      errorMessage.value = 'Please verify your email first.'
      router.push({ name: 'verify', query: { email: email.value } })
    }
    else {
      errorMessage.value = err.message || 'An error occurred. Please try again.'
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <div>
      <img src="/logo_dark.svg" alt="OpenFactCheck" class="h-12 dark:hidden">
      <img src="/logo_light.svg" alt="OpenFactCheck" class="hidden h-12 dark:block">
    </div>
    <Card class="w-full">
      <CardHeader class="text-center">
        <CardTitle class="text-xl">
          Welcome back
        </CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div
            v-if="errorMessage"
            class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {{ errorMessage }}
          </div>

          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="name@example.com"
              autocomplete="email"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <Label for="password">Password</Label>
              <router-link
                to="/forgot-password"
                class="text-xs text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                Forgot password?
              </router-link>
            </div>
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                :disabled="isLoading"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" :disabled="isLoading" class="mt-2 w-full">
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center pb-6">
        <p class="text-sm text-muted-foreground">
          Don't have an account?
          <router-link
            to="/signup"
            class="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            Sign up
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
