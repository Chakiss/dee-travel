<script setup lang="ts">
const { user, logout } = useAuth()

const nav = [
  { to: '/', label: 'ภาพรวม', icon: '◧' },
  { to: '/places', label: 'สถานที่', icon: '◎' },
]
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <img src="/brand/logo-color.png" alt="Dee Travel" class="logo">
        <span class="admin-tag">Admin</span>
      </div>
      <nav class="nav">
        <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" class="nav-item">
          <span class="ic" aria-hidden="true">{{ n.icon }}</span>{{ n.label }}
        </NuxtLink>
      </nav>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="spacer" />
        <div class="user">
          <span class="email">{{ user?.email }}</span>
          <span class="role">{{ user?.role }}</span>
          <button class="btn btn-ghost sm" @click="logout">ออกจากระบบ</button>
        </div>
      </header>
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 232px 1fr; min-height: 100vh; }
.sidebar { background: var(--dt-navy); color: #cfd5df; padding: 20px 14px; }
.brand { display: flex; align-items: center; gap: 8px; padding: 6px 8px 20px; }
.logo { height: 34px; background: #fff; border-radius: 8px; padding: 3px; }
.admin-tag { font-family: var(--font-display); color: #fff; font-size: 1.05rem; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px; font-size: 0.95rem; color: #cfd5df;
}
.nav-item:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
.nav-item.router-link-exact-active { background: var(--dt-cyan); color: #fff; }
.ic { width: 18px; text-align: center; opacity: 0.9; }

.main { display: flex; flex-direction: column; min-width: 0; }
.topbar {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 28px; background: var(--dt-surface); border-bottom: 1px solid var(--dt-line);
}
.spacer { flex: 1; }
.user { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; }
.email { color: var(--dt-navy); font-weight: 500; }
.role { color: var(--dt-cyan-d); background: var(--st-scheduled-bg); padding: 1px 8px; border-radius: 100px; font-size: 0.72rem; }
.btn.sm { padding: 6px 12px; font-size: 0.82rem; }
.content { padding: 28px; max-width: 1100px; width: 100%; }

@media (max-width: 720px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
}
</style>
