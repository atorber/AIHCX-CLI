<template>
  <div class="container">
    <div class="header">
      <h1>🌐 服务详情</h1>
      <p>查看服务详细信息</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <div class="action-bar">
            <router-link to="/services" class="btn-back">← 返回服务列表</router-link>
          </div>

          <!-- 加载状态 -->
          <div v-if="serviceStore.detailLoading" class="loading">
            <i class="fas fa-spinner fa-spin"></i> 服务详情加载中...
          </div>

          <!-- 错误信息 -->
          <div v-if="serviceStore.detailError" class="error">
            <i class="fas fa-exclamation-circle"></i> {{ serviceStore.detailError }}
          </div>

          <!-- 服务详情 -->
          <div v-if="!serviceStore.detailLoading && !serviceStore.detailError && serviceStore.currentService" class="service-content">
            <div class="service-card">
              <div class="service-card-header">
                <h5>{{ serviceStore.currentService.name }}</h5>
              </div>
              <div class="service-card-body">
                <div class="info-grid">
                  <div>
                    <div class="info-item">
                      <div class="info-label">服务ID</div>
                      <div class="info-value">
                        {{ serviceStore.currentService.id }}
                        <button @click="copyServiceId(serviceStore.currentService.id)" class="copy-btn">复制</button>
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">创建时间</div>
                      <div class="info-value">{{ formatDate(serviceStore.currentService.createdAt) }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">更新时间</div>
                      <div class="info-value">{{ formatDate(serviceStore.currentService.updatedAt) }}</div>
                    </div>
                  </div>
                  <div>
                    <div class="info-item">
                      <div class="info-label">网络类型</div>
                      <div class="info-value">{{ serviceStore.currentService.networkType }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">公开访问</div>
                      <div class="info-value">
                        <span :class="['status', serviceStore.currentService.publicAccess ? 'success' : 'warning']">
                          {{ serviceStore.currentService.publicAccess ? '是' : '否' }}
                        </span>
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">创建者</div>
                      <div class="info-value">{{ serviceStore.currentService.creator || '系统' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="service-card">
              <div class="service-card-body">
                <h6>资源配置</h6>
                <div class="info-grid">
                  <div>
                    <div class="info-item">
                      <div class="info-label">CPU</div>
                      <div class="info-value">{{ serviceStore.currentService.resourceSpec.cpus }} 核</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">内存</div>
                      <div class="info-value">{{ serviceStore.currentService.resourceSpec.memory }} GB</div>
                    </div>
                  </div>
                  <div>
                    <div v-if="serviceStore.currentService.resourceSpec.acceleratorCount" class="info-item">
                      <div class="info-label">加速器</div>
                      <div class="info-value">
                        {{ serviceStore.currentService.resourceSpec.acceleratorCount }} x {{ serviceStore.currentService.resourceSpec.acceleratorType }}
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">队列名称</div>
                      <div class="info-value">{{ serviceStore.currentService.queueName }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="service-card">
              <div class="service-card-body">
                <h6>资源池信息</h6>
                <div class="info-grid">
                  <div>
                    <div class="info-item">
                      <div class="info-label">资源池ID</div>
                      <div class="info-value">{{ serviceStore.currentService.resourcePoolId }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">资源池名称</div>
                      <div class="info-value">{{ serviceStore.currentService.resourcePoolName }}</div>
                    </div>
                  </div>
                  <div>
                    <div v-if="serviceStore.currentService.resourcePoolType" class="info-item">
                      <div class="info-label">资源池类型</div>
                      <div class="info-value">{{ serviceStore.currentService.resourcePoolType }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="service-card">
              <div class="service-card-body">
                <h6>自动扩缩容配置</h6>
                <div v-if="serviceStore.currentService.hpa && Object.keys(serviceStore.currentService.hpa).length > 0">
                  <div v-for="(value, key) in serviceStore.currentService.hpa" :key="key" class="info-item">
                    <div class="info-label">{{ key }}</div>
                    <div class="info-value">{{ JSON.stringify(value) }}</div>
                  </div>
                </div>
                <div v-else class="info-item">
                  <div class="info-label">配置状态</div>
                  <div class="info-value">未配置自动扩缩容</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'
import { useServiceStore } from '../stores/serviceStore'

export default {
  name: 'ServiceDetail',
  components: {
    Navigation
  },
  setup() {
    const serviceStore = useServiceStore()
    return {
      serviceStore
    }
  },
  async mounted() {
    await this.loadService()
  },
  methods: {
    async loadService() {
      try {
        const serviceId = this.$route.params.id
        await this.serviceStore.loadServiceDetail(serviceId)
      } catch (err) {
        console.error('加载服务详情失败:', err)
      }
    },
    
    goBack() {
      this.$router.go(-1)
    },
    
    formatDate(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp * 1000)
      return date.toLocaleString('zh-CN')
    },
    
    // 复制服务ID
    copyServiceId(id) {
      if (!id) return
      
      // 使用现代浏览器的Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(id).then(() => {
          this.showCopySuccess()
        }).catch(err => {
          console.error('复制失败:', err)
          this.fallbackCopy(id)
        })
      } else {
        // 降级方案
        this.fallbackCopy(id)
      }
    },
    
    fallbackCopy(text) {
      // 创建临时文本区域
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        this.showCopySuccess()
      } catch (err) {
        console.error('复制失败:', err)
      }
      
      document.body.removeChild(textArea)
    },
    
    showCopySuccess() {
      // 显示复制成功提示
      const toast = document.createElement('div')
      toast.textContent = '服务ID已复制到剪贴板'
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #52c41a;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInToast 0.3s ease;
      `
      
      // 添加动画样式
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideInToast {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(toast)
      
      // 3秒后自动移除
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style)
        }
      }, 3000)
    }
  },
  watch: {
    '$route'(to, from) {
      // 当路由参数变化时重新加载服务详情
      if (to.params.id !== from.params.id) {
        this.loadService()
      }
    }
  }
}
</script>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-back {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
}

.btn-back:hover {
  background: #5a6268;
}

.loading,
.error {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}

.error {
  color: #dc3545;
}

.service-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.service-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.service-card-header {
  background: #f8f9fa;
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
}

.service-card-header h5 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.service-card-body {
  padding: 24px;
}

.service-card-body h6 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  margin-bottom: 16px;
}

.info-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
  font-size: 14px;
}

.info-value {
  font-size: 15px;
  color: #333;
  word-break: break-all;
}

.status {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.status.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status.warning {
  background: #fff2f0;
  color: #dc3545;
  border: 1px solid #ffccc7;
}

.main {
  display: flex;
  flex: 1;
}

.sidebar {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow: hidden auto;
  z-index: 900;
  width: var(--sidebar-w);
  background: var(--panel-bg);
  border-right: 1px solid var(--border);
  padding: 20px 14px;
}

.content {
  flex: 1;
  padding: 2rem;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 复制按钮样式 */
.copy-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #3076c9;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>