<script setup>
    import { defineAsyncComponent, computed, watchEffect, h } from 'vue';
    import { useSessionStore } from '../stores/session';
    import { storeToRefs } from 'pinia';
    import { useRoute, useRouter } from 'vue-router';
    import { isValidCustomLoginPath } from '../utils/login-path.js';

    // Lazy load components
    const PublicProfilesView = defineAsyncComponent(() => import('./PublicProfilesView.vue'));
    const NotFoundView = defineAsyncComponent(() => import('./NotFound.vue'));

    // 已登录等待重定向时的占位组件。
    // 必须使用 render 函数而不是运行时模板字符串（{ template: '<div></div>' }）：
    // 项目在懒加载 vuedraggable（UMD 内含 Vue 完整版）后会注册 runtime compiler，
    // 运行时模板将经 new Function("Vue", code) 编译，在启用严格 CSP 的部署上
    // 会被拦截并抛 EvalError: call to Function() blocked by CSP，
    // 最终以「操作失败，请稍后重试」的错误提示弹出。
    // 见 tests/unit/runtime-compiler-csp.test.js
    const RedirectPlaceholder = { render: () => h('div') };

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
            // 导航被中断/失败时不应冒泡为未处理的 Promise 拒绝（会触发全局错误提示）
            router.replace('/dashboard').catch(() => {});
            return;
        }

        if (sessionState.value === 'loggedOut') {
            if (publicConfig.value?.needsSetup) {
                router.replace('/setup').catch(() => {});
                return;
            }
            router.replace(resolveLoginPath()).catch(() => {});
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
        return RedirectPlaceholder;
    });
</script>

<template>
    <component :is="currentView" />
</template>
