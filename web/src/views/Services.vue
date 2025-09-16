<template>
  <div class="container">
    <div class="header">
      <h1>🌐 在线服务</h1>
      <p>查看和管理在线服务</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <!-- 统计信息 -->
          <div class="stats" v-if="!serviceStore.loading && !serviceStore.error">
            <div class="stat-item">
              <div class="stat-number">{{ serviceStore.services ? serviceStore.services.length : 0 }}</div>
              <div class="stat-label">总服务数</div>
            </div>
          </div>
          
          <!-- 统计信息说明 -->
          <div v-if="!serviceStore.loading && !serviceStore.error && serviceStore.services && serviceStore.services.length > 0" class="stats-note">
            <i class="fas fa-info-circle"></i>
            <span>统计信息基于当前页数据，可能不完整</span>
          </div>

          <!-- 搜索和筛选 -->
          <div class="search-filters">
            <div class="search-box">
              <input 
                type="text" 
                class="search-input" 
                v-model="searchKeyword" 
                @keyup.enter="loadServices"
                @input="onSearchInput"
                placeholder="搜索服务名称..."
              >
              <button 
                class="refresh-btn" 
                @click="refreshServices" 
                :disabled="serviceStore.loading"
              >
                <span v-if="serviceStore.loading">🔄 加载中...</span>
                <span v-else>🔄 刷新列表</span>
              </button>
            </div>
            
            <!-- 排序选项 -->
            <div class="filters-row">
              <div class="filter-group">
                <label class="filter-label">排序字段</label>
                <select v-model="orderBy" @change="loadServices" class="filter-select">
                  <option value="createdAt">创建时间</option>
                  <option value="name">服务名称</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">排序方式</label>
                <select v-model="order" @change="loadServices" class="filter-select">
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">每页显示</label>
                <select v-model="pageSize" @change="onPageSizeChange" class="filter-select">
                  <option value="10">10条</option>
                  <option value="20">20条</option>
                  <option value="50">50条</option>
                  <option value="100">100条</option>
                </select>
              </div>
              
              <button class="clear-filters-btn" @click="clearFilters" :disabled="serviceStore.loading">
                清空筛选
              </button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div class="loading" v-if="serviceStore.loading">
            <p>正在加载服务列表...</p>
          </div>

          <!-- 错误状态 -->
          <div class="error" v-if="serviceStore.error">
            <p>{{ serviceStore.error }}</p>
          </div>

          <!-- 服务表格 -->
          <div v-if="!serviceStore.loading && !serviceStore.error && serviceStore.services && serviceStore.services.length > 0">
            <table class="services-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')">
                    服务名称/ID 
                    <span v-if="orderBy === 'name'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th>资源池</th>
                  <th>资源配置</th>
                  <th>网络类型</th>
                  <th>公开访问</th>
                  <th @click="sortBy('createdAt')">
                    创建时间
                    <span v-if="orderBy === 'createdAt'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in serviceStore.services" :key="service.id">
                  <td>
                    <span class="service-name" @click="viewService(service.id)">{{ service.name || 'N/A' }}</span>
                    <br>
                    <span class="service-id" @click="viewService(service.id)">{{ service.id || 'N/A' }}</span> 
                    <i class="fa-solid fa-copy copy-icon" @click="copyServiceId(service.id)" title="复制服务ID"></i>
                  </td>
                  <td>
                    <span :class="['pool-badge', service.resourcePoolType || 'default']">
                      {{ service.resourcePoolName || service.resourcePoolId }}
                    </span>
                  </td>
                  <td>
                    <div class="resource-spec">
                      <div v-if="service.resourceSpec.acceleratorCount">
                        {{ service.resourceSpec.acceleratorCount }} x {{ service.resourceSpec.acceleratorType }}
                      </div>
                      <div>
                        {{ service.resourceSpec.cpus }} CPU, {{ service.resourceSpec.memory }} GB内存
                      </div>
                    </div>
                  </td>
                  <td>{{ service.networkType }}</td>
                  <td>
                    <span :class="['status', service.publicAccess ? 'success' : 'warning']">
                      {{ service.publicAccess ? '是' : '否' }}
                    </span>
                  </td>
                  <td>{{ formatDate(service.createdAt) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 分页 -->
            <div class="pagination">
              <button 
                @click="goToPage(currentPage - 1)" 
                :disabled="currentPage <= 1"
              >
                ← 上一页
              </button>
              <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
              <button 
                @click="goToPage(currentPage + 1)" 
                :disabled="currentPage >= totalPages"
              >
                下一页 →
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-if="!serviceStore.loading && !serviceStore.error && serviceStore.services && serviceStore.services.length === 0">
            <i class="fas fa-inbox"></i>
            <h3>暂无服务数据</h3>
            <p v-if="searchKeyword">没有找到匹配"{{ searchKeyword }}"的服务</p>
            <p v-else>您还没有创建任何服务</p>
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
  name: 'Services',
  components: {
    Navigation
  },
  setup() {
    const serviceStore = useServiceStore()
    return {
      serviceStore
    }
  },
  data() {
    return {
      searchKeyword: '',
      orderBy: 'createdAt',
      order: 'desc',
      currentPage: 1,
      pageSize: 10,
      searchTimeout: null
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.serviceStore.pagination.total / this.pageSize)
    }
  },
  methods: {
    // 搜索输入处理
    onSearchInput() {
      // 清除之前的定时器
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      // 设置新的定时器
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1
        this.loadServices()
      }, 500) // 500ms防抖
    },

    // 排序
    sortBy(field) {
      if (this.orderBy === field) {
        this.order = this.order === 'asc' ? 'desc' : 'asc'
      } else {
        this.orderBy = field
        this.order = 'desc'
      }
      this.currentPage = 1
      this.loadServices()
    },

    // 分页
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadServices()
      }
    },

    // 分页大小变化
    onPageSizeChange() {
      this.currentPage = 1
      this.loadServices()
    },

    // 清空筛选
    clearFilters() {
      this.searchKeyword = ''
      this.orderBy = 'createdAt'
      this.order = 'desc'
      this.currentPage = 1
      this.pageSize = 10
      this.loadServices()
    },

    // 加载服务列表
    async loadServices() {
      try {
        console.log('Loading services with filters:', {
          keyword: this.searchKeyword,
          orderBy: this.orderBy,
          order: this.order
        })
        
        // 设置筛选条件
        this.serviceStore.setFilters({
          keyword: this.searchKeyword,
          orderBy: this.orderBy,
          order: this.order
        })

        // 设置分页
        this.serviceStore.setPagination({
          currentPage: this.currentPage,
          pageSize: this.pageSize
        })

        // 加载服务
        await this.serviceStore.loadServices()
        console.log('Services loaded:', this.serviceStore.services)
      } catch (error) {
        console.error('加载服务失败:', error)
      }
    },

    // 刷新服务列表（强制刷新，不使用缓存）
    async refreshServices() {
      await this.loadServices(true)
    },

    // 查看服务详情
    viewService(serviceId) {
      this.$router.push(`/services/${serviceId}`)
    },

    formatDate(timestamp) {
      if (!timestamp) return 'N/A'
      try {
        const date = new Date(timestamp * 1000)
        return date.toLocaleString('zh-CN')
      } catch (e) {
        return timestamp
      }
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
  
  async mounted() {
    console.log('Services component mounted')
    
    // 加载服务
    await this.loadServices()
  }
}
</script>

<style scoped>
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

.error {
  background: #fff2f0;
  color: #dc3545;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #ffccc7;
  font-size: 14px;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.services-table th {
  background: #f8f9fa;
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
  font-size: 14px;
}

.services-table th:hover {
  background: #e9ecef;
}

.services-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: top;
  font-size: 14px;
}

.services-table tr:hover {
  background: #f8f9fa;
  transition: background 0.2s ease;
}

.service-name {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s ease;
}

.service-name:hover {
  color: #3076c9;
}

.service-id {
  color: #666;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.copy-icon {
  color: #409eff;
  cursor: pointer;
  margin-left: 8px;
  font-size: 12px;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.copy-icon:hover {
  color: #3076c9;
  opacity: 1;
  transform: scale(1.1);
}

.pool-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pool-badge.serverless {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.pool-badge.default {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #ce93d8;
}

.resource-spec {
  font-size: 12px;
  color: #666;
}

.resource-spec > div {
  margin-bottom: 2px;
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

.refresh-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.refresh-btn:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.refresh-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #666;
}

.empty-state h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 20px;
}

/* 搜索和筛选样式 */
.search-filters {
  margin-bottom: 24px;
}

.search-box {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.filters-row {
  display: flex;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin: 0;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s ease;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.clear-filters-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #666; 
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;
}

.clear-filters-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #ccc;
}

.clear-filters-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.search-input:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  background: #fff;
}

.stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.stats-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
  color: #666;
}

.stats-note i {
  color: #007bff;
  font-size: 16px;
}

.pagination {
  margin-top: 24px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination button {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  min-width: 80px;
}

.pagination button:hover:not(:disabled) {
  background: #3076c9;
  transform: translateY(-1px);
}

.pagination button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.pagination span {
  font-size: 14px;
  color: #666;
  font-weight: 500;
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
  
  .search-box {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box > * {
    margin-bottom: 10px;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .stats {
    flex-direction: column;
    gap: 12px;
  }
}
</style>