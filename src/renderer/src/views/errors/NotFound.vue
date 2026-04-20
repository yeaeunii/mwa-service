<template>
  <div class="flex h-screen w-full flex-col items-center justify-center bg-base-200">
    <div class="text-center">
      <h1 class="text-8xl font-extrabold text-base-content/20">404</h1>
      <p class="mt-4 text-xl font-semibold text-base-content">페이지를 찾을 수 없습니다</p>
      <p class="mt-2 text-sm text-base-content/60">
        {{ $route.fullPath }}
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <button class="btn btn-primary mt-8" @click="$router.back()">
        <i-lucide-home class="h-4 w-4" />
        홈으로 돌아가기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
