<template>
  <div>
    <NuxtLink to="/history"></NuxtLink>

    <TheHeader />

    <main class="container" style="padding: 18px 0;">
      <slot />
    </main>

    <TheFooter />
  </div>
</template>
