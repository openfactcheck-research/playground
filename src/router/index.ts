import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { isAuthBypassed } from '@/lib/amplify'
import DashboardPage from '@/pages/Dashboard.vue'
import ForgotPasswordPage from '@/pages/ForgotPassword.vue'
import LoginPage from '@/pages/Login.vue'
import ProjectsPage from '@/pages/Projects.vue'
import SignupPage from '@/pages/Signup.vue'
import VerifyPage from '@/pages/Verify.vue'
import WelcomePage from '@/pages/Welcome.vue'

export const POST_LOGIN_ROUTE = { name: 'projects' } as const

const AUTH_PAGE_NAMES = new Set(['login', 'signup', 'verify', 'forgot-password'])

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: isAuthBypassed ? '/projects' : '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupPage,
    },
    {
      path: '/verify',
      name: 'verify',
      component: VerifyPage,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordPage,
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard/:projectId',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
  ],
})

// Track if initial auth check is done
let authChecked = false

router.beforeEach(async (to) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth()

  // When auth is bypassed, redirect auth pages to projects
  if (isAuthBypassed) {
    if (AUTH_PAGE_NAMES.has(to.name as string))
      return POST_LOGIN_ROUTE
    return
  }

  // Check auth status on first navigation
  if (!authChecked) {
    await checkAuth()
    authChecked = true
  }

  // Wait for any ongoing auth check
  if (isLoading.value) {
    await checkAuth()
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login' }
  }

  if (AUTH_PAGE_NAMES.has(to.name as string) && isAuthenticated.value) {
    return POST_LOGIN_ROUTE
  }
})

export default router
