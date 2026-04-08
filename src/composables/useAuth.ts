import { ref } from 'vue'
import { isAuthBypassed } from '@/lib/amplify'

const amplify = isAuthBypassed
  ? null
  : await import('aws-amplify/auth')

// User preferences type
export type UserPreferences = {
  tourCompleted?: boolean
}

// Reactive auth state
const isAuthenticated = ref(isAuthBypassed)
const isLoading = ref(!isAuthBypassed)
const user = ref<{ email: string, userId: string, name?: string } | null>(
  isAuthBypassed ? { email: 'dev@localhost', userId: 'dev', name: 'Dev User' } : null,
)
const preferences = ref<UserPreferences>({})

/**
 * Parse preferences from Cognito attribute
 */
function parsePreferences(prefsString: string | undefined): UserPreferences {
  if (!prefsString)
    return {}
  try {
    return JSON.parse(prefsString) as UserPreferences
  }
  catch {
    return {}
  }
}

export function useAuth() {
  /**
   * Check current authentication status on app load
   */
  async function checkAuth() {
    if (isAuthBypassed)
      return

    isLoading.value = true
    try {
      const session = await amplify!.fetchAuthSession()
      if (session.tokens) {
        const currentUser = await amplify!.getCurrentUser()
        const attributes = await amplify!.fetchUserAttributes()
        user.value = {
          email: currentUser.signInDetails?.loginId ?? attributes.email ?? '',
          userId: currentUser.userId,
          name: attributes.name,
        }
        preferences.value = parsePreferences(attributes['custom:preferences'])
        isAuthenticated.value = true
      }
      else {
        isAuthenticated.value = false
        user.value = null
        preferences.value = {}
      }
    }
    catch {
      isAuthenticated.value = false
      user.value = null
      preferences.value = {}
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Sign in with email and password
   */
  async function signIn(email: string, password: string) {
    if (isAuthBypassed)
      return { isSignedIn: true, nextStep: { signInStep: 'DONE' as const } }

    const result = await amplify!.signIn({
      username: email,
      password,
    })

    if (result.isSignedIn) {
      const currentUser = await amplify!.getCurrentUser()
      const attributes = await amplify!.fetchUserAttributes()
      user.value = {
        email: currentUser.signInDetails?.loginId ?? email,
        userId: currentUser.userId,
        name: attributes.name,
      }
      preferences.value = parsePreferences(attributes['custom:preferences'])
      isAuthenticated.value = true
    }

    return result
  }

  /**
   * Sign up with email, password, and name
   * Returns result with nextStep to handle email confirmation
   */
  async function signUp(email: string, password: string, name: string) {
    if (isAuthBypassed)
      return { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' as const } }

    const result = await amplify!.signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    })

    return result
  }

  /**
   * Confirm sign up with verification code sent to email
   */
  async function confirmSignUpCode(email: string, code: string) {
    if (isAuthBypassed)
      return { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' as const } }

    const result = await amplify!.confirmSignUp({
      username: email,
      confirmationCode: code,
    })

    return result
  }

  /**
   * Resend verification code for sign up
   */
  async function resendSignUpCode(email: string) {
    if (isAuthBypassed)
      return {}

    const result = await amplify!.resendSignUpCode({
      username: email,
    })

    return result
  }

  /**
   * Initiate forgot password flow - sends reset code to email
   */
  async function resetPassword(email: string) {
    if (isAuthBypassed)
      return { isPasswordReset: true, nextStep: { resetPasswordStep: 'DONE' as const } }

    const result = await amplify!.resetPassword({
      username: email,
    })

    return result
  }

  /**
   * Confirm password reset with code and new password
   */
  async function confirmResetPassword(email: string, code: string, newPassword: string) {
    if (isAuthBypassed)
      return

    await amplify!.confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    })
  }

  /**
   * Sign out the current user
   */
  async function signOut() {
    if (!isAuthBypassed)
      await amplify!.signOut()

    isAuthenticated.value = false
    user.value = null
    preferences.value = {}
  }

  /**
   * Update user preferences stored in Cognito
   */
  async function updatePreferences(updates: Partial<UserPreferences>) {
    const newPrefs = { ...preferences.value, ...updates }
    if (!isAuthBypassed) {
      await amplify!.updateUserAttributes({
        userAttributes: {
          'custom:preferences': JSON.stringify(newPrefs),
        },
      })
    }
    preferences.value = newPrefs
  }

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    preferences,
    // Methods
    checkAuth,
    signIn,
    signUp,
    confirmSignUpCode,
    resendSignUpCode,
    resetPassword,
    confirmResetPassword,
    signOut,
    updatePreferences,
  }
}
