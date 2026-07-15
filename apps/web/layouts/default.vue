<template>
  <div class="app">
    <header class="site-header">
      <div class="bar">
        <NuxtLink to="/" class="brand">Dee&nbsp;Travel</NuxtLink>
        <nav class="nav">
          <NuxtLink to="/">หน้าแรก</NuxtLink>
        </nav>
      </div>
    </header>

    <slot />

    <footer class="site-footer">
      <div class="bar">Dee Travel · เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์</div>
    </footer>
  </div>
</template>

<style>
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  line-height: 1.6;
  color: #1a211e;
  background: #faf8f3;
  -webkit-font-smoothing: antialiased;
}
@media (prefers-color-scheme: dark) {
  body { color: #ecefe9; background: #12140f; }
}
a { color: inherit; }
</style>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(250, 248, 243, 0.85);
  backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid #e4dfd3;
}
@media (prefers-color-scheme: dark) {
  .site-header { background: rgba(18, 20, 15, 0.85); border-color: #2a322b; }
}
.bar {
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand {
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
  text-decoration: none;
  color: #0f7a63;
}
.nav a {
  text-decoration: none;
  font-size: 0.9rem;
  color: #57625b;
}
.nav a:hover { color: #0f7a63; }
.site-footer {
  margin-top: 6rem;
  border-top: 1px solid #e4dfd3;
  font-size: 0.85rem;
  color: #8a938b;
}
@media (prefers-color-scheme: dark) {
  .site-footer { border-color: #2a322b; }
}
.site-footer .bar { justify-content: center; padding: 26px 24px; }
</style>
