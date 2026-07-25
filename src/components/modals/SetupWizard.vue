<script setup>
import { ref, computed } from 'vue';
import Button from '../ui/Button.vue';

const emit = defineEmits(['success']);

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showAdvanced = ref(false);
const isLoading = ref(false);
const error = ref('');

const siteName = ref('MiSub-lite');
const publicUrl = ref('');
const subscriptionToken = ref('auto');
const profileToken = ref('profiles');
const customLoginPath = ref('login');
const enablePublicPage = ref(true);

const canSubmit = computed(() => {
  return password.value.length >= 6
    && password.value !== 'admin'
    && password.value === confirmPassword.value
    && !isLoading.value;
});

const submitSetup = async () => {
  error.value = '';
  if (password.value.length < 6) {
    error.value = '密码至少 6 位';
    return;
  }
  if (password.value === 'admin') {
    error.value = '请不要继续使用默认密码 admin';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }

  isLoading.value = true;
  try {
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: password.value,
        confirmPassword: confirmPassword.value,
        siteName: siteName.value,
        publicUrl: publicUrl.value,
        subscriptionToken: subscriptionToken.value,
        profileToken: profileToken.value,
        customLoginPath: customLoginPath.value,
        enablePublicPage: enablePublicPage.value
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || `初始化失败 (${res.status})`);
    }
    emit('success', { password: password.value });
  } catch (err) {
    error.value = err.message || '初始化失败';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="w-full max-w-[480px] md:max-w-[540px] relative z-10 px-6">
    <div class="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden">
      <div class="flex flex-col items-center relative z-10 mb-6">
        <div class="w-16 h-16 mb-4 flex items-center justify-center">
          <img width="64" height="64" src="/logo.png" alt="MiSub-lite" class="drop-shadow-2xl" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight text-center">
          欢迎使用 MiSub-lite
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
          首次启动：设置管理员密码（必填）。<br />
          也可编辑 <code class="text-xs px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10">config.yaml</code> 后重启。
        </p>
      </div>

      <form @submit.prevent="submitSetup" class="space-y-4 relative z-10">
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">管理员密码 *</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 6 位，勿用 admin"
              :disabled="isLoading"
              class="w-full bg-transparent border misub-radius-lg py-3 px-4 pr-12 outline-none transition-all border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 disabled:opacity-50"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-4 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">确认密码 *</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="再输入一次"
            :disabled="isLoading"
            class="w-full bg-transparent border misub-radius-lg py-3 px-4 outline-none transition-all border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          class="w-full text-left text-xs font-medium text-primary-600 dark:text-primary-300 py-1"
          @click="showAdvanced = !showAdvanced"
        >
          {{ showAdvanced ? '收起可选配置' : '展开可选配置（站点名 / 公开 URL / Token…）' }}
        </button>

        <div v-if="showAdvanced" class="space-y-3 pt-1 border-t border-gray-100 dark:border-white/10">
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">站点名称</label>
            <input v-model="siteName" type="text" :disabled="isLoading" class="w-full bg-transparent border misub-radius-lg py-2.5 px-3 outline-none border-gray-200 dark:border-white/20 text-sm text-gray-900 dark:text-white focus:border-primary-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">对外公开 URL</label>
            <input v-model="publicUrl" type="url" placeholder="https://sub.example.com" :disabled="isLoading" class="w-full bg-transparent border misub-radius-lg py-2.5 px-3 outline-none border-gray-200 dark:border-white/20 text-sm text-gray-900 dark:text-white focus:border-primary-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">订阅 Token</label>
              <input v-model="subscriptionToken" type="text" :disabled="isLoading" class="w-full bg-transparent border misub-radius-lg py-2.5 px-3 outline-none border-gray-200 dark:border-white/20 text-sm text-gray-900 dark:text-white focus:border-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">分组 Token</label>
              <input v-model="profileToken" type="text" :disabled="isLoading" class="w-full bg-transparent border misub-radius-lg py-2.5 px-3 outline-none border-gray-200 dark:border-white/20 text-sm text-gray-900 dark:text-white focus:border-primary-500" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">登录路径</label>
            <input v-model="customLoginPath" type="text" placeholder="login" :disabled="isLoading" class="w-full bg-transparent border misub-radius-lg py-2.5 px-3 outline-none border-gray-200 dark:border-white/20 text-sm text-gray-900 dark:text-white focus:border-primary-500" />
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input v-model="enablePublicPage" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" :disabled="isLoading" />
            启用公开 Explore 页
          </label>
        </div>

        <p v-if="error" class="text-center text-xs text-red-500 font-medium">{{ error }}</p>

        <Button
          type="submit"
          class="w-full"
          variant="primary"
          size="lg"
          :loading="isLoading"
          :disabled="!canSubmit && !isLoading"
        >
          {{ isLoading ? '保存中...' : '完成初始化' }}
        </Button>
      </form>

      <div class="mt-5 text-xs text-gray-400 dark:text-gray-500 leading-relaxed space-y-1">
        <p>· 密码写入 SQLite，并同步到 config.yaml</p>
        <p>· Telegram / Cron 等可在后台「设置」或 config.yaml 配置</p>
      </div>
    </div>
  </div>
</template>
