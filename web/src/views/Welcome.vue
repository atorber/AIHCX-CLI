<template>
  <div class="container">
    <div class="header">
      <h1>🤖 AIHCX</h1>
      <p>机器学习平台命令行工具</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <h1>欢迎使用 AIHCX</h1>
          <div v-html="readmeContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'

export default {
  name: 'Welcome',
  components: {
    Navigation
  },
  data() {
    return {
      readmeContent: '<p>加载中...</p>'
    }
  },
  mounted() {
    this.loadReadme()
  },
  methods: {
    async loadReadme() {
      try {
        // 这里应该从后端获取README内容
        // 暂时使用静态内容
        this.readmeContent = `
          <h2>AIHCX - AI训练平台命令行工具</h2>
          <p>AIHCX是一个用于管理AI训练平台的命令行工具，旨在简化用户对机器学习任务、资源池、队列等的管理操作。</p>
          <h3>主要功能</h3>
          <ul>
            <li>训练任务管理（创建、查看、删除、更新、日志查看）</li>
            <li>资源池管理（查看列表、获取详情）</li>
            <li>队列管理（查看列表、获取详情）</li>
            <li>节点管理（查看列表）</li>
            <li>Pod管理（查看任务Pod列表）</li>
            <li>命令自动补全支持（bash、zsh、fish）</li>
            <li>环境变量配置支持</li>
            <li>可执行文件打包支持（PyInstaller）</li>
          </ul>
          <h3>使用说明</h3>
          <p>请先访问<a href="/config">参数配置</a>页面配置您的访问凭证。</p>
        `
      } catch (error) {
        this.readmeContent = '<p>无法加载README内容，请检查文件是否存在。</p>'
      }
    }
  }
}
</script>

<style scoped>
/* 可以在这里添加特定的样式 */
</style>