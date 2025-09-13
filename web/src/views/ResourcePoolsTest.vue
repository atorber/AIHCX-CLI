<template>
  <div class="container">
    <div class="header">
      <h1>🏊 资源池列表 (测试版)</h1>
      <p>查看和管理您的资源池</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <!-- 测试内容 -->
          <div style="background: #e6f7ff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #91d5ff;">
            <h2>测试页面</h2>
            <p>这个页面应该能正常显示</p>
            <p>当前时间: {{ currentTime }}</p>
            <p>Store状态: {{ storeStatus }}</p>
            <p>资源池数量: {{ resourcePoolsCount }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'
import { useResourcePoolStore } from '../stores/resourcePoolStore'

export default {
  name: 'ResourcePoolsTest',
  components: {
    Navigation
  },
  setup() {
    const resourcePoolStore = useResourcePoolStore()
    return {
      resourcePoolStore
    }
  },
  data() {
    return {
      currentTime: new Date().toLocaleString()
    }
  },
  computed: {
    storeStatus() {
      return this.resourcePoolStore ? 'Store已加载' : 'Store未加载'
    },
    resourcePoolsCount() {
      return this.resourcePoolStore ? this.resourcePoolStore.allResourcePools.length : 0
    }
  },
  async mounted() {
    console.log('ResourcePoolsTest mounted')
    try {
      await this.resourcePoolStore.loadResourcePools()
      console.log('Resource pools loaded:', this.resourcePoolStore.allResourcePools.length)
    } catch (error) {
      console.error('Error loading resource pools:', error)
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #1890ff;
  color: white;
  padding: 2rem;
  text-align: center;
}

.main {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #d9d9d9;
  padding: 1rem 0;
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
