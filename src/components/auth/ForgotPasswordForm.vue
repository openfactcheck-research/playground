<script setup lang="ts">
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { resetPassword, confirmResetPassword } = useAuth()

// Two-step flow: 'request' sends the code, 'confirm' submits code + new password
const step = ref<'request' | 'confirm'>('request')

// Form state
const email = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Password requirements must match the Cognito user pool policy
const passwordRequirements = computed(() => [
  { label: 'At least 8 characters', met: newPassword.value.length >= 8 },
  { label: 'One lowercase letter', met: /[a-z]/.test(newPassword.value) },
  { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword.value) },
  { label: 'One number', met: /\d/.test(newPassword.value) },
  { label: 'One special character', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword.value) },
])

const isPasswordValid = computed(() => passwordRequirements.value.every(req => req.met))

// Only show mismatch error once the confirm field has been touched
const doPasswordsMatch = computed(() => !confirmPassword.value || newPassword.value === confirmPassword.value)

async function handleRequestCode() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Please enter your email address.'
    return
  }

  isLoading.value = true

  try {
    await resetPassword(email.value)
    successMessage.value = 'Verification code sent! Check your email.'
    step.value = 'confirm'
  }
  catch (error: unknown) {
    // Map Cognito error codes to user-friendly messages
    const err = error as { name?: string, message?: string }
    if (err.name === 'UserNotFoundException' || err.message?.includes('Username/client id combination not found')) {
      errorMessage.value = 'No account found with this email.'
    }
    else if (err.name === 'LimitExceededException') {
      errorMessage.value = 'Too many attempts. Please try again later.'
    }
    else {
      errorMessage.value = err.message || 'An error occurred. Please try again.'
    }
  }
  finally {
    isLoading.value = false
  }
}

async function handleResetPassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!code.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields.'
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
    await confirmResetPassword(email.value, code.value, newPassword.value)
    successMessage.value = 'Password reset! Redirecting to login...'
    setTimeout(() => router.push('/login'), 1500)
  }
  catch (error: unknown) {
    // Map Cognito error codes to user-friendly messages
    const err = error as { name?: string, message?: string }
    if (err.name === 'CodeMismatchException') {
      errorMessage.value = 'Invalid verification code. Please try again.'
    }
    else if (err.name === 'ExpiredCodeException') {
      errorMessage.value = 'Verification code has expired. Please request a new one.'
    }
    else if (err.name === 'InvalidPasswordException') {
      errorMessage.value = 'Password does not meet requirements.'
    }
    else {
      errorMessage.value = err.message || 'An error occurred. Please try again.'
    }
  }
  finally {
    isLoading.value = false
  }
}

// Go back to step 1 and clear code/password fields so the user can request a new code
function handleResendCode() {
  step.value = 'request'
  code.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  successMessage.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <img src="/logo_dark.svg" alt="OpenFactCheck" class="h-12 dark:hidden">
    <img src="/logo_light.svg" alt="OpenFactCheck" class="hidden h-12 dark:block">
    <Card class="w-full">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">
          {{ step === 'request' ? 'Reset password' : 'Create new password' }}
        </CardTitle>
        <CardDescription>
          {{ step === 'request'
            ? 'Enter your email to receive a verification code'
            : 'Enter the code and your new password' }}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <!-- Step 1: Request reset code -->
        <form v-if="step === 'request'" class="flex flex-col gap-4" @submit.prevent="handleRequestCode">
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
              :disabled="isLoading"
            />
          </div>

          <Button type="submit" size="lg" :disabled="isLoading" class="mt-2 w-full">
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            {{ isLoading ? 'Sending code...' : 'Send verification code' }}
          </Button>
        </form>

        <!-- Step 2: Enter code and set new password -->
        <form v-else class="flex flex-col gap-4" @submit.prevent="handleResetPassword">
          <div
            v-if="errorMessage"
            class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {{ errorMessage }}
          </div>
          <div
            v-if="successMessage"
            class="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600"
            role="status"
          >
            {{ successMessage }}
          </div>

          <!-- Email shown read-only so the user knows which account they're resetting -->
          <div class="flex flex-col gap-2">
            <Label for="email-display">Email</Label>
            <Input id="email-display" v-model="email" type="email" disabled class="bg-muted" />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="code">Verification code</Label>
            <Input
              id="code"
              v-model="code"
              type="text"
              placeholder="Enter 6-digit code"
              autocomplete="one-time-code"
              :disabled="isLoading"
            />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="new-password">New password</Label>
            <div class="relative">
              <Input
                id="new-password"
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter new password"
                autocomplete="new-password"
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
            <ul v-if="newPassword" class="mt-2 space-y-1 text-xs">
              <li
                v-for="req in passwordRequirements"
                :key="req.label"
                class="flex items-center gap-2"
                :class="req.met ? 'text-green-600' : 'text-muted-foreground'"
              >
                <Check v-if="req.met" class="h-3 w-3" />
                <X v-else class="h-3 w-3" />
                {{ req.label }}
              </li>
            </ul>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="confirm-password">Confirm new password</Label>
            <div class="relative">
              <Input
                id="confirm-password"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm new password"
                autocomplete="new-password"
                :disabled="isLoading"
                class="pr-10"
                :class="{ 'border-destructive focus-visible:ring-destructive': confirmPassword && !doPasswordsMatch }"
              />
              <button
                type="button"
                class="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <p v-if="confirmPassword && !doPasswordsMatch" class="text-xs text-destructive">
              Passwords do not match
            </p>
          </div>

          <Button type="submit" size="lg" :disabled="isLoading" class="mt-2 w-full">
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            {{ isLoading ? 'Resetting password...' : 'Reset password' }}
          </Button>

          <p class="text-center text-sm text-muted-foreground">
            Didn't receive a code?
            <button
              type="button"
              class="text-primary hover:underline disabled:opacity-50"
              :disabled="isLoading"
              @click="handleResendCode"
            >
              Resend code
            </button>
          </p>
        </form>
      </CardContent>

      <CardFooter class="justify-center pb-6">
        <p class="text-sm text-muted-foreground">
          Remember your password?
          <router-link
            to="/login"
            class="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            Sign in
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
