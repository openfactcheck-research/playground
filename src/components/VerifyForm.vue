<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { confirmSignUpCode, resendSignUpCode } = useAuth()

const email = ref('')
const emailFromQuery = ref(false)
const code = ref('')
const isLoading = ref(false)
const isResending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(() => {
  const queryEmail = route.query.email
  if (typeof queryEmail === 'string') {
    email.value = queryEmail
    emailFromQuery.value = true
  }
})

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value || !code.value) {
    errorMessage.value = 'Please enter your email and verification code.'
    return
  }

  isLoading.value = true

  try {
    await confirmSignUpCode(email.value, code.value)
    successMessage.value = 'Email verified! Redirecting to login...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  }
  catch (error: unknown) {
    const err = error as { name?: string, message?: string }
    if (err.name === 'CodeMismatchException') {
      errorMessage.value = 'Invalid verification code. Please try again.'
    }
    else if (err.name === 'ExpiredCodeException') {
      errorMessage.value = 'Verification code has expired. Please request a new one.'
    }
    else {
      errorMessage.value = err.message || 'An error occurred. Please try again.'
    }
  }
  finally {
    isLoading.value = false
  }
}

async function handleResendCode() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Please enter your email address.'
    return
  }

  isResending.value = true

  try {
    await resendSignUpCode(email.value)
    successMessage.value = 'Verification code sent! Check your email.'
  }
  catch (error: unknown) {
    const err = error as { name?: string, message?: string }
    if (err.name === 'LimitExceededException') {
      errorMessage.value = 'Too many attempts. Please try again later.'
    }
    else {
      errorMessage.value = err.message || 'Failed to resend code. Please try again.'
    }
  }
  finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <img src="/logo_dark.svg" alt="OpenFactCheck" class="h-12 dark:hidden">
    <img src="/logo_light.svg" alt="OpenFactCheck" class="hidden h-12 dark:block">
    <Card class="w-full">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">
          Verify your email
        </CardTitle>
        <CardDescription>
          Enter the verification code sent to your email
        </CardDescription>
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

          <div
            v-if="successMessage"
            class="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600"
            role="status"
          >
            {{ successMessage }}
          </div>

          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="name@example.com"
              :disabled="isLoading || emailFromQuery"
              :class="{ 'bg-muted': emailFromQuery }"
            />
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

          <Button type="submit" size="lg" :disabled="isLoading || isResending" class="mt-2 w-full">
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <span v-if="isLoading">Verifying...</span>
            <span v-else>Verify email</span>
          </Button>

          <p class="text-center text-sm text-muted-foreground">
            Didn't receive a code?
            <button
              type="button"
              class="text-primary hover:underline disabled:opacity-50"
              :disabled="isResending || isLoading"
              @click="handleResendCode"
            >
              <Loader2 v-if="isResending" class="mr-1 inline h-3 w-3 animate-spin" />
              {{ isResending ? 'Sending...' : 'Resend code' }}
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
