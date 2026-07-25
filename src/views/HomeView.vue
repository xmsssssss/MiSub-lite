<script setup>
import { defineAsyncComponent, computed, watchEffect } from 'vue';
import { useSessionStore } from '../stores/session';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { isValidCustomLoginPath } from '../utils/login-path.js';

const PublicProfilesView = defineAsyncComponent(() => import('./PublicProfilesView.vue'));
const NotFoundView = defineAsyncComponent(() => import('./NotFound.vue'));

const sessionStore = useSessionStore();
const { sessionState, publicConfig } = storeToRefs(sessionStore);
const route = useRoute();
const router = useRouter();

const isExploreRoute = computed(() => route.path === '/explore');

function resolveLoginPath() {
  const raw = publicConfig.value?.customLoginPath;
  if (isValidCustomLoginPath(raw)) {
    return '/' + String(raw).trim().replace(/^\/+/, '');
  }
  return '/login';
}

// 根路径：已登录 → 仪表盘；未登录 → 登录页（不再展示公开首页）
watchEffect(() => {
  if (sessionState.value === 'loading') return;

  if (isExploreRoute.value) return;

  if (sessionState.value === 'loggedIn') {
    router.replace('/dashboard');
    return;
  }

  if (sessionState.value === 'loggedOut') {
    if (publicConfig.value?.needsSetup) {
      router.replace('/setup');
      return;
    }
    router.replace(resolveLoginPath());
  }
});

const currentView = computed(() => {
  if (isExploreRoute.value) {
    if (publicConfig.value && !publicConfig.value.enablePublicPage) {
      return NotFoundView;
    }
    return PublicProfilesView;
  }

  // 根路径仅作跳转占位
  return { template: '<div></div>' };
});
</script>

<template>
  <component :is="currentView" />
</template>
