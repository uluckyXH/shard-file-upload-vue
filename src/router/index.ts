import { createRouter, createWebHistory } from 'vue-router'
import FileManagerView from '../views/FileManagerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'fileManager',
      component: FileManagerView,
    },
  ],
})

export default router
