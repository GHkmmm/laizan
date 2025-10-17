import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@renderer/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@renderer/pages/home/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/unauth',
    name: 'unauth',
    component: () => import('@renderer/pages/unauth/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (authStore.hasAuth === null) {
    await authStore.checkAuth()
  }
  const isAuthed = !!authStore.hasAuth
  if (to.meta.requiresAuth && !isAuthed) {
    return { name: 'unauth' }
  }
  if (to.name === 'unauth' && isAuthed) {
    return { name: 'home' }
  }
  return true
})
