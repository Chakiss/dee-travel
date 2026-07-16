<template>
  <div class="app">
    <header class="site-header">
      <div class="bar">
        <NuxtLink to="/" class="brand" aria-label="Dee Travel หน้าแรก">
          <img src="/brand/logo-color.png" alt="Dee Travel" class="brand-logo">
        </NuxtLink>
        <nav class="nav">
          <NuxtLink to="/">หน้าแรก</NuxtLink>
          <NuxtLink to="/">สถานที่</NuxtLink>
          <NuxtLink to="/">บทความ</NuxtLink>
        </nav>
      </div>
    </header>

    <slot />

    <footer class="site-footer">
      <div class="foot">
        <img src="/brand/logo-white.png" alt="Dee Travel" class="foot-logo">
        <p class="tagline">เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์</p>
        <p class="copy">Copyright © DeeTravel Co., Ltd. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--dt-bg) 88%, transparent);
  backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid var(--dt-line);
}
.bar {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand { display: inline-flex; align-items: center; }
.brand-logo { height: 42px; width: auto; display: block; }
.nav { display: flex; gap: 22px; }
.nav a {
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--dt-navy);
}
.nav a:hover { color: var(--dt-cyan); }

.site-header + :deep(main),
.site-header + :deep(*) { min-height: 40vh; }

.site-footer {
  margin-top: 6rem;
  background: var(--dt-black);
  color: #cfd3da;
}
.foot {
  max-width: 1100px;
  margin: 0 auto;
  padding: 44px 24px;
  text-align: center;
}
.foot-logo { height: 54px; width: auto; opacity: 0.95; }
.tagline {
  font-family: var(--font-display);
  color: #fff;
  font-size: 1.25rem;
  margin: 0.6rem 0 0.2rem;
}
.copy { font-size: 0.8rem; color: #8b929e; margin: 0.4rem 0 0; }

@media (max-width: 520px) {
  .nav a:nth-child(n + 2) { display: none; }
}
</style>
