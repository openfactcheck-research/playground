import {
  confirmResetPassword as amplifyConfirmResetPassword,
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession as amplifyFetchAuthSession,
  fetchUserAttributes as amplifyFetchUserAttributes,
  getCurrentUser as amplifyGetCurrentUser,
  resendSignUpCode as amplifyResendSignUpCode,
  resetPassword as amplifyResetPassword,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  updateUserAttributes as amplifyUpdateUserAttributes,
} from 'aws-amplify/auth'
import { ref } from 'vue'

// User preferences type
export type UserPreferences = {
  tourCompleted?: boolean
}

// Reactive auth state
const isAuthenticated = ref(false)
const isLoading = ref(true)
const user = ref<{ email: string, userId: string, name?: string } | null>(null)
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
    isLoading.value = true
    try {
      const session = await amplifyFetchAuthSession()
      if (session.tokens) {
        const currentUser = await amplifyGetCurrentUser()
        const attributes = await amplifyFetchUserAttributes()
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
    const result = await amplifySignIn({
      username: email,
      password,
    })

    if (result.isSignedIn) {
      const currentUser = await amplifyGetCurrentUser()
      const attributes = await amplifyFetchUserAttributes()
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
    const result = await amplifySignUp({
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
    const result = await amplifyConfirmSignUp({
      username: email,
      confirmationCode: code,
    })

    return result
  }

  /**
   * Resend verification code for sign up
   */
  async function resendSignUpCode(email: string) {
    const result = await amplifyResendSignUpCode({
      username: email,
    })

    return result
  }

  /**
   * Initiate forgot password flow - sends reset code to email
   */
  async function resetPassword(email: string) {
    const result = await amplifyResetPassword({
      username: email,
    })

    return result
  }

  /**
   * Confirm password reset with code and new password
   */
  async function confirmResetPassword(email: string, code: string, newPassword: string) {
    await amplifyConfirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    })
  }

  /**
   * Sign out the current user
   */
  async function signOut() {
    await amplifySignOut()
    isAuthenticated.value = false
    user.value = null
    preferences.value = {}
  }

  /**
   * Update user preferences stored in Cognito
   */
  async function updatePreferences(updates: Partial<UserPreferences>) {
    const newPrefs = { ...preferences.value, ...updates }
    await amplifyUpdateUserAttributes({
      userAttributes: {
        'custom:preferences': JSON.stringify(newPrefs),
      },
    })
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
