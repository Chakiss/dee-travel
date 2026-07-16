<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()
const email = ref('admin@deetravel.local')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await login(email.value, password.value)
    await navigateTo('/')
  } catch (e) {
    error.value = 'เข้าสู่ระบบไม่สำเร็จ — ตรวจสอบอีเมลและรหัสผ่าน'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="login">
    <form class="card" @submit.prevent="submit">
      <img src="/brand/logo-color.png" alt="Dee Travel" class="logo">
      <h1>เข้าสู่ระบบผู้ดูแล</h1>
      <p class="sub">Dee Travel Content Management</p>

      <label class="f">
        <span>อีเมล</span>
        <input v-model="email" type="email" autocomplete="username" required>
      </label>
      <label class="f">
        <span>รหัสผ่าน</span>
        <input v-model="password" type="password" autocomplete="current-password" required>
      </label>

      <p v-if="error" class="err">{{ error }}</p>

      <button class="btn btn-primary full" type="submit" :disabled="busy">
        {{ busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ' }}
      </button>
      <p class="hint">dev: admin@deetravel.local / dee12345</p>
    </form>
  </main>
</template>

<style scoped>
.login { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--dt-navy); }
.card {
  width: 100%; max-width: 360px; background: var(--dt-surface);
  border-radius: 16px; padding: 34px 30px; text-align: center;
  box-shadow: 0 30px 60px -30px rgba(0, 0, 0, 0.5);
}
.logo { height: 52px; margin-bottom: 12px; }
h1 { font-size: 1.3rem; color: var(--dt-navy); margin: 0 0 2px; font-weight: 600; }
.sub { color: var(--dt-muted); font-size: 0.85rem; margin: 0 0 22px; }
.f { display: block; text-align: left; margin-bottom: 14px; }
.f span { display: block; font-size: 0.8rem; color: var(--dt-muted); margin-bottom: 4px; }
.f input {
  width: 100%; padding: 10px 12px; border: 1px solid var(--dt-line);
  border-radius: 8px; font-size: 0.95rem; color: var(--dt-navy); outline: none;
}
.f input:focus { border-color: var(--dt-cyan); }
.err { color: #c0392b; font-size: 0.85rem; margin: 0 0 12px; }
.full { width: 100%; justify-content: center; }
.hint { margin: 16px 0 0; font-size: 0.75rem; color: var(--dt-muted); }
</style>
