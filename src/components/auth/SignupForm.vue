<script setup lang="ts">
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import LogoImage from '@/components/LogoImage.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'
import { mapAuthError } from '@/lib/authErrors'

const router = useRouter()
const { signUp } = useAuth()

// Form state
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Only show email error once the user has typed something
const isEmailValid = computed(() => {
  if (!email.value)
    return true
  const atIndex = email.value.indexOf('@')
  if (atIndex < 1)
    return false
  const afterAt = email.value.slice(atIndex + 1)
  return afterAt.includes('.') && !afterAt.startsWith('.') && !afterAt.endsWith('.')
})

// Password requirements must match the Cognito user pool policy
const passwordRequirements = computed(() => [
  { label: 'At least 8 characters', met: password.value.length >= 8 },
  { label: 'One lowercase letter', met: /[a-z]/.test(password.value) },
  { label: 'One uppercase letter', met: /[A-Z]/.test(password.value) },
  { label: 'One number', met: /\d/.test(password.value) },
  { label: 'One special character', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password.value) },
])

const isPasswordValid = computed(() => passwordRequirements.value.every(req => req.met))

// Only show mismatch error once the confirm field has been touched
const doPasswordsMatch = computed(() => !confirmPassword.value || password.value === confirmPassword.value)

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

    // Cognito requires email verification before sign-in is allowed
    if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
      router.push({ name: 'verify', query: { email: email.value } })
    }
    else if (result.isSignUpComplete) {
      router.push('/login')
    }
  }
  catch (error: unknown) {
    errorMessage.value = mapAuthError(error)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <LogoImage class="h-12" />
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
            <p v-if="email && !isEmailValid" class="flex items-center gap-1 text-xs text-destructive">
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
                class="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <ul v-if="password" class="mt-2 space-y-1 text-xs">
              <li
                v-for="req in passwordRequirements"
                :key="req.label"
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
                class="absolute right-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <p v-if="confirmPassword && !doPasswordsMatch" class="flex items-center gap-1 text-xs text-destructive">
              <X class="h-3 w-3" />
              Passwords do not match
            </p>
            <p v-else-if="confirmPassword && doPasswordsMatch" class="flex items-center gap-1 text-xs text-green-600">
              <Check class="h-3 w-3" />
              Passwords match
            </p>
          </div>

          <Button type="submit" size="lg" :disabled="isLoading" class="mt-2 w-full">
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            {{ isLoading ? 'Creating account...' : 'Create account' }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center pb-6">
        <p class="text-sm text-muted-foreground">
          Already have an account?
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
