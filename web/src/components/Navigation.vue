<template>
  <div class="nav-group">
    <router-link to="/">🏠 首页</router-link>
    <router-link to="/config">⚙️ 参数配置</router-link>
    <router-link to="/datasets">📊 数据集列表</router-link>
    <router-link to="/models">🤖 模型列表</router-link>
    <router-link to="/resourcepools">🏊 资源池列表</router-link>
    <router-link to="/jobs">📋 任务列表</router-link>
    <router-link to="/services">🌐 在线服务</router-link>
  </div>
</template>

<script>
export default {
  name: 'Navigation'
}
</script>

<style scoped>
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-group a {
  display: block;
  background: transparent;
  color: var(--text);
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 10px;
  transition: all 0.15s ease;
  font-weight: 500;
}

.nav-group a:hover {
  background: #eef4ff;
  color: var(--primary);
}

.nav-group a.router-link-exact-active {
  background: #eef4ff;
  color: var(--primary);
}
</style>