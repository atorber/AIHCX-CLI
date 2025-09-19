<template>
  <div class="container">
    <div class="header">
      <h1>📝 任务模板</h1>
      <p>管理所有导入任务模板，支持查看、删除和导入导出</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <!-- 统计信息 -->
          <div class="stats" v-if="!loading && !error">
            <div class="stat-item">
              <div class="stat-number">{{ templates ? templates.length : 0 }}</div>
              <div class="stat-label">总模板数</div>
            </div>
          </div>
          
          <!-- 统计信息说明 -->
          <div v-if="!loading && !error && templates && templates.length > 0" class="stats-note">
            <i class="fas fa-info-circle"></i>
            <span>统计信息基于当前页数据，可能不完整</span>
          </div>
          
          <!-- 搜索和筛选 -->
          <div class="search-filters">
            <div class="search-box">
              <input 
                type="text" 
                class="search-input" 
                v-model="filterText" 
                @input="onSearchInput" 
                placeholder="搜索模板名称..."
              >
              <button 
                class="refresh-btn" 
                @click="refreshTemplates" 
                :disabled="loading"
              >
                <span v-if="loading">🔄 加载中...</span>
                <span v-else>🔄 刷新列表</span>
              </button>
            </div>
            
            <!-- 排序选项 -->
            <div class="filters-row">
              <div class="filter-group">
                <label class="filter-label">排序字段</label>
                <select v-model="orderBy" @change="onSearchInput" class="filter-select">
                  <option value="createdAt">创建时间</option>
                  <option value="name">模板名称</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">排序方式</label>
                <select v-model="order" @change="onSearchInput" class="filter-select">
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
              
              <button class="clear-filters-btn" @click="clearFilters" :disabled="loading">
                清空筛选
              </button>
            </div>
          </div>

          <div class="loading" v-if="loading">正在加载模板列表...</div>
          <div class="error" v-if="error">{{ error }}</div>

          <!-- 模板表格 -->
          <div v-if="!loading && !error && templates && templates.length > 0">
            <table class="services-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')">
                    模板名称
                    <span v-if="orderBy === 'name'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="time-column" @click="sortBy('createdAt')">
                    创建时间
                    <span v-if="orderBy === 'createdAt'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="command-column">启动命令预览</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="template in filteredTemplates" :key="template.id">
                  <td>
                    <span class="service-name" @click="viewTemplate(template.id)">{{ template.name || 'N/A' }}</span>
                    <br>
                    <span class="service-id" @click="viewTemplate(template.id)">{{ template.id || 'N/A' }}</span> 
                    <i class="fa-solid fa-copy copy-icon" @click="copyTemplateId(template.id)" title="复制模板ID"></i>
                  </td>
                  <td class="time-column">{{ formatDate(template.createdAt) }}</td>
                  <td class="command-column">
                    <div class="command-preview" :title="getCommandPreview(template)">
                      {{ getCommandPreview(template) }}
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-secondary" @click="deleteTemplate(template)" :disabled="deletingTemplate === template.id">
                        {{ deletingTemplate === template.id ? '删除中...' : '删除' }}
                      </button>
                    </div>
                  </td>
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
          <div v-if="!loading && !error && (!templates || templates.length === 0)" class="empty-state">
            <i class="fas fa-file-alt"></i>
            <h3>暂无模板</h3>
            <p>还没有任何任务模板，请先在任务列表中保存任务为模板</p>
            <button @click="goToJobs" class="btn btn-primary">
              前往任务列表
            </button>
          </div>

          <!-- 筛选后无结果 -->
          <div v-if="!loading && !error && templates && templates.length > 0 && filteredTemplates.length === 0" class="empty-state">
            <i class="fas fa-search"></i>
            <h3>未找到匹配的模板</h3>
            <p>请尝试调整搜索条件或清空筛选</p>
            <button @click="clearFilters" class="btn btn-primary">
              清空筛选
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 模板详情抽屉 -->
  <div class="drawer-overlay" :class="{ show: showDrawer }" @click="closeDrawer"></div>
  <div class="drawer" :class="{ show: showDrawer }">
    <div class="drawer-header">
      <h2 class="drawer-title">{{ selectedTemplate?.name || '模板详情' }}</h2>
      <p class="drawer-subtitle">{{ selectedTemplate?.id || '' }}</p>
      <button class="drawer-close" @click="closeDrawer">×</button>
    </div>
    <div class="drawer-content" v-if="selectedTemplate">
      <!-- 基本信息 -->
      <div class="drawer-section">
        <h3 class="drawer-section-title">基本信息</h3>
        <div class="drawer-field">
          <div class="drawer-field-label">模板名称</div>
          <div class="drawer-field-value">{{ selectedTemplate?.name || 'N/A' }}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">模板ID</div>
          <div class="drawer-field-value">{{ selectedTemplate?.id || 'N/A' }}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">创建时间</div>
          <div class="drawer-field-value">{{ formatDate(selectedTemplate?.createdAt) }}</div>
        </div>
      </div>

      <!-- 启动命令 -->
      <div class="drawer-section">
        <h3 class="drawer-section-title">启动命令</h3>
        <div class="drawer-field">
          <div class="drawer-field-label">完整命令</div>
          <div class="drawer-field-value command-full">
            <pre>{{ getCommandPreview(selectedTemplate) }}</pre>
          </div>
        </div>
      </div>

      <!-- 模板数据 -->
      <div class="drawer-section">
        <h3 class="drawer-section-title">模板数据</h3>
        <div class="drawer-field">
          <div class="drawer-field-label">配置信息</div>
          <div class="drawer-field-value">
            <pre class="json-preview">{{ JSON.stringify(selectedTemplate?.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'
import templateService from '../services/templateService'

export default {
  name: 'Templates',
  components: {
    Navigation
  },
  data() {
    return {
      templates: [],
      loading: false,
      error: null,
      filterText: '',
      orderBy: 'createdAt',
      order: 'desc',
      currentPage: 1,
      pageSize: 20,
      deletingTemplate: null,
      showDrawer: false,
      selectedTemplate: null
    }
  },
  computed: {
    filteredTemplates() {
      let filtered = this.templates || []

      // 按关键词筛选
      if (this.filterText) {
        const keyword = this.filterText.toLowerCase()
        filtered = filtered.filter(template => 
          (template.name && template.name.toLowerCase().includes(keyword)) ||
          (template.id && template.id.toLowerCase().includes(keyword))
        )
      }

      // 排序
      filtered.sort((a, b) => {
        let aVal = a[this.orderBy]
        let bVal = b[this.orderBy]

        if (this.orderBy === 'createdAt') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }

        if (this.order === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      return filtered
    },
    totalPages() {
      return Math.ceil(this.filteredTemplates.length / this.pageSize)
    },
  },
  methods: {
    async loadTemplates() {
      this.loading = true
      this.error = null
      try {
        this.templates = await templateService.getTemplates()
      } catch (err) {
        console.error('获取模板列表失败:', err)
        this.error = '获取模板列表失败: ' + err.message
        this.templates = []
      } finally {
        this.loading = false
      }
    },

    async refreshTemplates() {
      await this.loadTemplates()
    },

    async deleteTemplate(template) {
      if (!confirm(`确定要删除模板"${template.name}"吗？此操作不可撤销。`)) {
        return
      }

      this.deletingTemplate = template.id
      try {
        await templateService.deleteTemplate(template.id)
        this.showMessage('模板删除成功', 'success')
        await this.loadTemplates()
      } catch (err) {
        console.error('删除模板失败:', err)
        this.showMessage('删除模板失败: ' + err.message, 'error')
      } finally {
        this.deletingTemplate = null
      }
    },


    goToJobs() {
      this.$router.push({ name: 'Jobs' })
    },

    // 查看模板详情
    viewTemplate(templateId) {
      const template = this.templates.find(t => t.id === templateId)
      if (template) {
        this.selectedTemplate = template
        this.showDrawer = true
        // 防止body滚动
        document.body.style.overflow = 'hidden'
      }
    },

    // 关闭抽屉
    closeDrawer() {
      this.showDrawer = false
      this.selectedTemplate = null
      // 恢复body滚动
      document.body.style.overflow = ''
    },

    // 复制模板ID
    copyTemplateId(id) {
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
      toast.textContent = '模板ID已复制到剪贴板'
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
    },

    sortBy(field) {
      if (this.orderBy === field) {
        this.order = this.order === 'asc' ? 'desc' : 'asc'
      } else {
        this.orderBy = field
        this.order = 'asc'
      }
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    onSearchInput() {
      this.currentPage = 1
    },

    clearFilters() {
      this.filterText = ''
      this.orderBy = 'createdAt'
      this.order = 'desc'
      this.currentPage = 1
      this.pageSize = 20
    },

    onPageSizeChange() {
      this.currentPage = 1
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      try {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN')
      } catch (e) {
        return dateStr
      }
    },


    getCommandPreview(template) {
      const command = template.data.customDownloadStartCommand || template.data.command || ''
      if (!command) return '无启动命令'
      
      // 截取前50个字符作为预览
      return command.length > 50 ? command.substring(0, 50) + '...' : command
    },

    showMessage(message, type = 'info') {
      const messageEl = document.createElement('div')
      messageEl.className = `message message-${type}`
      messageEl.textContent = message
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff'};
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      `
      
      document.body.appendChild(messageEl)
      
      // 显示动画
      setTimeout(() => {
        messageEl.style.opacity = '1'
        messageEl.style.transform = 'translateX(0)'
      }, 100)
      
      // 自动隐藏
      setTimeout(() => {
        messageEl.style.opacity = '0'
        messageEl.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl)
          }
        }, 300)
      }, 3000)
    }
  },

  async mounted() {
    console.log('Templates component mounted')
    await this.loadTemplates()
  }
}
</script>

<style scoped>
/* 使用与其他列表页一致的样式 */
.container {
  min-height: 100vh;
  background: var(--bg-color);
}

.header {
  background: white;
  padding: 2rem;
  border-bottom: 1px solid var(--border);
}

.header h1 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.main {
  display: flex;
  min-height: calc(100vh - 120px);
}

.sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid var(--border);
  padding: 1rem 0;
}

.content {
  flex: 1;
  padding: 2rem;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}


/* 搜索和筛选 */
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

.refresh-btn:hover:not(:disabled) {
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


/* 表格样式 */
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

.services-table tr:last-child td {
  border-bottom: none;
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


.command-preview {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-light);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}


.btn {
  display: inline-block;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
  min-width: 80px;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #3076c9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  background: #adb5bd;
  cursor: not-allowed;
  transform: none;
}

/* 统计信息样式 */
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

/* 分页 */
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

/* 空状态 */
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

.empty-state p {
  margin: 0 0 2rem 0;
  color: #666;
  font-size: 14px;
}

/* 加载和错误状态 */
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
  
  .services-table {
    font-size: 0.875rem;
  }
  
  .services-table th,
  .services-table td {
    padding: 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* 抽屉样式 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.drawer-overlay.show {
  opacity: 1;
  visibility: visible;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 50vw;
  max-width: 800px;
  min-width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  display: none;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.drawer.show {
  display: flex;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 10;
}

.drawer-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.drawer-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.drawer-close {
  position: absolute;
  top: 20px;
  right: 24px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.drawer-close:hover {
  background: #e9ecef;
  color: #333;
}

.drawer-content {
  padding: 24px;
  overflow-y: auto;
}

.drawer-section {
  margin-bottom: 24px;
}

.drawer-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.drawer-field {
  margin-bottom: 16px;
}

.drawer-field-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.drawer-field-value {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}

.command-full pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-preview {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
</style>