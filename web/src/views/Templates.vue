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
          
          <!-- 搜索和筛选 -->
          <div class="search-filters">
            <div class="search-box">
              <input class="search-input" v-model="filterText" @input="onSearchInput" placeholder="搜索模板名称..." />
              <button class="refresh-btn" @click="refreshTemplates" :disabled="loading">
                <span v-if="loading">🔄 加载中...</span>
                <span v-else>🔄 刷新列表</span>
              </button>
            </div>

          </div>

          <div class="loading" v-if="loading">正在加载模板列表...</div>
          <div class="error" v-if="error">{{ error }}</div>

          <!-- 模板表格 -->
          <div v-if="!loading && !error && templates && templates.length > 0">
            <table class="templates-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')" class="sortable">
                    模板名称
                    <span v-if="orderBy === 'name'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="time-column sortable" @click="sortBy('createdAt')">
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
                    <span class="template-name">{{ template.name || 'N/A' }}</span>
                    <br>
                    <span class="template-id">{{ template.id || 'N/A' }}</span>
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
            <div class="pagination" v-if="totalPages > 1">
              <button 
                class="pagination-btn"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                上一页
              </button>
              <span class="pagination-info">
                第 {{ currentPage }} 页，共 {{ totalPages }} 页
              </span>
              <button 
                class="pagination-btn"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!loading && !error && (!templates || templates.length === 0)" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>暂无模板</h3>
            <p>还没有任何任务模板，请先在任务列表中保存任务为模板</p>
            <button @click="goToJobs" class="btn btn-primary">
              前往任务列表
            </button>
          </div>

          <!-- 筛选后无结果 -->
          <div v-if="!loading && !error && templates && templates.length > 0 && filteredTemplates.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
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
      deletingTemplate: null
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
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 2rem;
}

.search-box {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.875rem;
}

.refresh-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.refresh-btn:disabled {
  background: var(--muted);
  cursor: not-allowed;
}


/* 表格样式 */
.templates-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.templates-table th {
  background: var(--bg-light);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.templates-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

.templates-table tr:last-child td {
  border-bottom: none;
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.sortable:hover {
  background: var(--bg-hover);
}

.template-name {
  color: var(--primary);
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
}

.template-name:hover {
  color: var(--primary-hover);
}

.template-id {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-family: monospace;
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

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination-btn {
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-light);
  border-color: var(--primary);
  color: var(--primary);
}

.pagination-btn:disabled {
  background: var(--bg-light);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0 0 2rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* 加载和错误状态 */
.loading, .error {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 2rem;
}

.loading {
  color: var(--text-secondary);
}

.error {
  color: #ff4d4f;
  background: #fff2f0;
  border-color: #ffccc7;
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
  
  
  .templates-table {
    font-size: 0.875rem;
  }
  
  .templates-table th,
  .templates-table td {
    padding: 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>