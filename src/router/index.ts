import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import DashboardPage from '@/pages/Dashboard.vue'
import ForgotPasswordPage from '@/pages/ForgotPassword.vue'
import LoginPage from '@/pages/Login.vue'
import SignupPage from '@/pages/Signup.vue'
import VerifyPage from '@/pages/Verify.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
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
      path: '/dashboard',
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

  if ((to.name === 'login' || to.name === 'signup' || to.name === 'forgot-password') && isAuthenticated.value) {
    return { name: 'dashboard' }
  }
})

export default router
