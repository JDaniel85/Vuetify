<template>
  <v-app>
    <router-view />
    <!-- Componente PWA: banner de instalación + indicadores offline/online -->
    <InstallPWA />
  </v-app>
</template>

<script lang="ts" setup>
  import InstallPWA from '@/components/InstallPWA.vue'
</script>
