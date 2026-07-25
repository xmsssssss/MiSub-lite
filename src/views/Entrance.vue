<template>
  <div class="entrance-container">
     <component
       :is="activeComponent"
       v-bind="componentProps"
       @success="handleSetupSuccess"
     />
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent, watch, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';
import { storeToRefs } from 'pinia';
import { isValidCustomLoginPath } from '../utils/login-path.js';

const Login = defineAsyncComponent(() => import('../components/modals/Login.vue'));
const SetupWizard = defineAsyncComponent(() => import('../components/modals/SetupWizard.vue'));
const NotFound = defineAsyncComponent(() => import('./NotFound.vue'));

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const { publicConfig } = storeToRefs(sessionStore);

const activeComponent = ref(null);
const componentProps = ref({});

onMounted(async () => {
    checkPath();
});

watch(() => route.path, () => {
    checkPath();
});

watch(publicConfig, () => {
    checkPath();
});

watch(() => sessionStore.sessionState, () => {
    checkPath();
});

async function handleSetupSuccess(payload = {}) {
    if (publicConfig.value) {
        publicConfig.value = { ...publicConfig.value, needsSetup: false };
    }
    if (payload.password) {
        try {
            await sessionStore.login(payload.password);
            return;
        } catch {
            // fall through to login page
        }
    }
    activeComponent.value = markRaw(Login);
    componentProps.value = { login: sessionStore.login };
    if (route.path !== '/login') {
        router.replace('/login');
    }
}

function checkPath() {
    if (sessionStore.sessionState === 'loading') {
        activeComponent.value = null;
        return;
    }

    const config = publicConfig.value || {};
    const currentPath = route.path;
    const needsSetup = config.needsSetup === true;

    // 首次未配置：登录/初始化相关路径显示引导
    if (needsSetup && sessionStore.sessionState !== 'loggedIn') {
        if (currentPath === '/setup' || currentPath === '/login' || currentPath.startsWith('/dashboard')) {
            activeComponent.value = markRaw(SetupWizard);
            componentProps.value = {};
            return;
        }
    }

    const hasCustomPath = isValidCustomLoginPath(config.customLoginPath);
    const configuredPath = hasCustomPath
        ? '/' + config.customLoginPath.trim().replace(/^\/+/, '')
        : '/login';

    if (currentPath === configuredPath) {
        activeComponent.value = markRaw(Login);
        componentProps.value = { login: sessionStore.login };
    } else if (currentPath === '/login' && !hasCustomPath) {
        activeComponent.value = markRaw(Login);
        componentProps.value = { login: sessionStore.login };
    } else {
        activeComponent.value = markRaw(NotFound);
    }
}

</script>

<style scoped>
.entrance-container {
    width: 100%;
    min-height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
