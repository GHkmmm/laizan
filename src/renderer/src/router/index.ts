import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@renderer/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    component: () => import('@renderer/pages/index/index.vue'),
    meta: { requiresAuth: true },
    redirect: '/feed-ac-tasks',
    children: [
      {
        path: 'feed-ac-tasks',
        name: 'feedAcTasks',
        component: () => import('@renderer/pages/feed-ac-tasks/index.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@renderer/pages/settings/index.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@renderer/pages/login/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
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
    return { name: 'login' }
  }
  if (to.name === 'login' && isAuthed) {
    return { name: 'index' }
  }
  return true
})
