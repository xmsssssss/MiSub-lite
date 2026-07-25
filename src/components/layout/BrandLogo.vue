<script setup>
import { APP_NAME } from '../../constants/branding.js';

defineProps({
  textSizeClass: {
    type: String,
    default: 'text-lg'
  },
  iconSize: {
    type: Number,
    default: 28
  }
});
</script>

<template>
  <router-link to="/dashboard" class="nav-brand-wrap">
    <div class="nav-brand-badge nav-brand-badge-sm" aria-hidden="true">
      <img :width="iconSize" :height="iconSize" src="/logo.png" :alt="APP_NAME" />
    </div>
    <span class="nav-brand-text" :class="textSizeClass">{{ APP_NAME }}</span>
  </router-link>
</template>
