<script setup lang="ts">
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signUp } = useAuth()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Email validation
const isEmailValid = computed(() => {
  if (!email.value)
    return true // Don't show error when empty
  // Simple email validation - checks for @ and at least one dot after @
  const atIndex = email.value.indexOf('@')
  if (atIndex < 1)
    return false
  const afterAt = email.value.slice(atIndex + 1)
  return afterAt.includes('.') && !afterAt.startsWith('.') && !afterAt.endsWith('.')
})

// Password validation requirements (matching Cognito config)
const passwordRequirements = computed(() => [
  { label: 'At least 8 characters', met: password.value.length >= 8 },
  { label: 'One lowercase letter', met: /[a-z]/.test(password.value) },
  { label: 'One uppercase letter', met: /[A-Z]/.test(password.value) },
  { label: 'One number', met: /\d/.test(password.value) },
  { label: 'One special character', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password.value) },
])

const isPasswordValid = computed(() => passwordRequirements.value.every(req => req.met))

// Password confirmation match
const doPasswordsMatch = computed(() => {
  if (!confirmPassword.value)
    return true // Don't show error when empty
  return password.value === confirmPassword.value
})

function togglePassword() {
  showPassword.value = !showPassword.value
}

function toggleConfirmPassword() {
  showConfirmPassword.value = !showConfirmPassword.value
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  if (!isEmailValid.value) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  if (!isPasswordValid.value) {
    errorMessage.value = 'Password does not meet all requirements.'
    return
  }

  if (!doPasswordsMatch.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    const result = await signUp(email.value, password.value, fullName.value)

    if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
      // Redirect to email verification page
      router.push({ name: 'verify', query: { email: email.value } })
    }
    else if (result.isSignUpComplete) {
      router.push('/login')
    }
  }
  catch (error: unknown) {
    const err = error as { name?: string, message?: string }
    if (err.name === 'UsernameExistsException') {
      errorMessage.value = 'An account with this email already exists.'
    }
    else if (err.name === 'InvalidPasswordException') {
      errorMessage.value = 'Password does not meet requirements. Must include uppercase, lowercase, number, and symbol.'
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
          Create an account
        </CardTitle>
        <CardDescription>Get started with your new account</CardDescription>
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
            <Label for="fullName">Full name</Label>
            <Input
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="John Doe"
              autocomplete="name"
              required
              :disabled="isLoading"
            />
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
              :class="{ 'border-destructive': email && !isEmailValid }"
            />
            <p v-if="email && !isEmailValid" class="text-xs text-destructive flex items-center gap-1">
              <X class="h-3 w-3" />
              Please enter a valid email address
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="password">Password</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create a strong password"
                autocomplete="new-password"
                required
                :disabled="isLoading"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="togglePassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <!-- Password requirements checklist -->
            <ul v-if="password" class="mt-2 space-y-1 text-xs">
              <li
                v-for="(req, index) in passwordRequirements"
                :key="index"
                class="flex items-center gap-1.5"
                :class="req.met ? 'text-green-600' : 'text-muted-foreground'"
              >
                <Check v-if="req.met" class="h-3 w-3" />
                <X v-else class="h-3 w-3" />
                {{ req.label }}
              </li>
            </ul>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="confirmPassword">Confirm password</Label>
            <div class="relative">
              <Input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Repeat your password"
                autocomplete="new-password"
                required
                :disabled="isLoading"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="toggleConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <p v-if="confirmPassword && !doPasswordsMatch" class="text-xs text-destructive flex items-center gap-1">
              <X class="h-3 w-3" />
              Passwords do not match
            </p>
            <p v-else-if="confirmPassword && doPasswordsMatch" class="text-xs text-green-600 flex items-center gap-1">
              <Check class="h-3 w-3" />
              Passwords match
            </p>
          </div>

          <Button type="submit" size="lg" :disabled="isLoading" class="mt-2 w-full">
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <span v-if="isLoading">Creating account...</span>
            <span v-else>Create account</span>
          </Button>
        </form>

      <!-- TODO: Implement social auth with Cognito identity providers
      <div class="relative my-6">
        <Separator />
        <span
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground"
        >
          or continue with
        </span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <Button variant="outline" :disabled="isLoading" class="h-10">
          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
        <Button variant="outline" :disabled="isLoading" class="h-10">
          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          GitHub
        </Button>
      </div>
      -->
      </CardContent>

      <CardFooter class="justify-center pb-6">
        <p class="text-sm text-muted-foreground">
          Already have an account?
          <router-link
            to="/login"
            class="font-medium text-primary hover:text-primary/80 transition-colors hover:underline"
          >
            Sign in
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
