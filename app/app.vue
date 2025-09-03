<script setup lang="ts">
import { ModalsContainer } from 'vue-final-modal';

</script>

<template>
  <div>
    <!-- <NuxtRouteAnnouncer /> -->
    <!-- <NuxtWelcome /> -->
    <ClientOnly><SphereViewer /></ClientOnly>
    <ModalsContainer />
  </div>
</template>
