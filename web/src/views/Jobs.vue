<template>
  <div class="container">
    <div class="header">
      <h1>📋 任务列表</h1>
      <p>按资源池查看与筛选训练任务</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <!-- 统计信息 -->
          <div class="stats" v-if="!jobStore.loading && !jobStore.error">
            <div class="stat-item">
              <div class="stat-number">{{ jobStore.jobs ? jobStore.jobs.length : 0 }}</div>
              <div class="stat-label">总任务数</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ runningCount }}</div>
              <div class="stat-label">运行中</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ succeededCount }}</div>
              <div class="stat-label">成功</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ failedCount }}</div>
              <div class="stat-label">失败</div>
            </div>
          </div>
          
          <!-- 搜索和筛选 -->
          <div class="search-filters">
            <div class="search-box">
            <select class="select" v-model="selectedPoolType" @change="onPoolTypeChange">
              <option value="common">自运维资源池</option>
              <option value="dedicatedV2">全托管资源池</option>
            </select>
              <select class="select" v-model="selectedPoolId" @change="loadJobs">
              <option value="" disabled>请选择资源池</option>
                <option v-if="resourcePoolStore.loading" value="" disabled>资源池列表加载中...</option>
              <option v-if="selectedPoolType === 'dedicatedV2'" value="aihc-serverless">全托管资源池 (aihc-serverless)</option>
              <option v-else v-for="pool in filteredPools" :key="pool.id" :value="pool.id">
                {{ pool.name }} ({{ pool.id }})
              </option>
            </select>
            <input class="search-input" v-model="searchQuery" @input="onSearchInput" placeholder="搜索任务名称或ID..." />
              <button class="refresh-btn" @click="refreshJobs" :disabled="jobStore.loading || resourcePoolStore.loading">
                <span v-if="jobStore.loading">🔄 加载中...</span>
                <span v-else>🔄 刷新列表</span>
              </button>
          </div>

            <!-- 筛选条件 -->
            <div class="filters-row">
              <div class="filter-group">
                <label class="filter-label">任务状态</label>
                <select v-model="statusFilter" @change="search" class="filter-select">
                  <option value="">全部状态</option>
                  <option value="Pending">等待中</option>
                  <option value="Running">运行中</option>
                  <option value="Succeeded">成功</option>
                  <option value="Failed">失败</option>
                  <option value="Cancelled">已取消</option>
                </select>
              </div>
              
              <button class="clear-filters-btn" @click="clearFilters" :disabled="jobStore.loading">
                清空筛选
              </button>
            </div>
          </div>

          <div class="inline-loading" v-if="resourcePoolStore.loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>正在加载资源池列表...</span>
          </div>

          <div class="loading" v-if="jobStore.loading">正在加载任务列表...</div>
          <div class="error" v-if="jobStore.error">{{ jobStore.error }}</div>

          <!-- 任务表格 -->
          <div v-if="!jobStore.loading && !jobStore.error && jobStore.jobs && jobStore.jobs.length > 0">
            <table class="jobs-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')" class="sortable">
                    任务名称/ID
                    <span v-if="orderBy === 'name'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="status-column sortable" @click="sortBy('status')">
                    状态
                    <span v-if="orderBy === 'status'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="time-column sortable" @click="sortBy('createdAt')">
                    创建时间
                    <span v-if="orderBy === 'createdAt'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="time-column sortable" @click="sortBy('finishedAt')">
                    完成时间
                    <span v-if="orderBy === 'finishedAt'">{{ order === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in jobStore.jobs" :key="job.jobId">
                  <td>
                    <span class="job-name" @click="showJobDetail(job)">{{ job.name || 'N/A' }}</span>
                    <br>
                    <span class="job-id" @click="copyJobId(job.jobId)" :title="'点击复制: ' + job.jobId">{{ job.jobId || 'N/A' }}</span> 
                    <i class="fa-solid fa-copy copy-icon" @click="copyJobId(job.jobId)" title="复制任务ID"></i>
                  </td>
                  <td class="status-column">
                    <span class="status" :class="statusClass(job.status)">
                      {{ statusText(job.status) }}
                    </span>
                  </td>
                  <td class="time-column">{{ formatDate(job.createdAt) }}</td>
                  <td class="time-column">{{ formatDate(job.finishedAt) }}</td>
                  <td>
                    <button class="btn-primary" @click="showJobDetail(job)">
                      查看详情
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 分页 -->
            <div class="pagination" v-if="totalPages > 1">
              <button 
                class="pagination-btn" 
                @click="goToPage(currentPage - 1)" 
                :disabled="currentPage <= 1"
              >
                上一页
              </button>
              <span class="pagination-info">
                第 {{ currentPage }} 页，共 {{ totalPages }} 页
              </span>
              <button 
                class="pagination-btn" 
                @click="goToPage(currentPage + 1)" 
                :disabled="currentPage >= totalPages"
              >
                下一页
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!jobStore.loading && !jobStore.error && jobStore.jobs && jobStore.jobs.length === 0" class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>暂无任务数据</h3>
            <p v-if="searchQuery || statusFilter">没有找到匹配"{{ searchQuery }}"的任務</p>
            <p v-else>您还没有创建任何任务</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'
import { useJobStore } from '../stores/jobStore'
import { useResourcePoolStore } from '../stores/resourcePoolStore'

export default {
  name: 'Jobs',
  components: {
    Navigation
  },
  setup() {
    const jobStore = useJobStore()
    const resourcePoolStore = useResourcePoolStore()
    return {
      jobStore,
      resourcePoolStore
    }
  },
  data() {
    return {
      // 资源池选择
      selectedPoolType: 'common',
      selectedPoolId: '',
      
      // 搜索和筛选
      searchQuery: '',
      statusFilter: '',
      
      // 排序
      orderBy: 'createdAt',
      order: 'desc',
      
      // 分页
      currentPage: 1,
      pageSize: 20,
      
      // 搜索防抖
      searchTimeout: null,
      
      // 状态映射
      statusMap: {
        'Pending': '等待中',
        'Running': '运行中',
        'Succeeded': '成功',
        'Failed': '失败',
        'Cancelled': '已取消',
        'ManualTermination': '手动终止',
        'Unknown': '未知'
      }
    }
  },
  computed: {
    filteredPools() {
      // 确保resourcePoolStore存在且有数据
      if (!this.resourcePoolStore?.allResourcePools) {
        return [];
      }
      
      return this.resourcePoolStore.allResourcePools.filter(pool => {
        const poolType = pool.resourcePoolType || pool.type || 'common';
        return poolType === this.selectedPoolType;
      });
    },
    totalPages() {
      return Math.ceil(this.jobStore.pagination.total / this.pageSize);
    },
    runningCount() {
      if (!this.jobStore.jobs) return 0;
      return this.jobStore.jobs.filter(job => job.status === 'Running').length;
    },
    succeededCount() {
      if (!this.jobStore.jobs) return 0;
      return this.jobStore.jobs.filter(job => job.status === 'Succeeded').length;
    },
    failedCount() {
      if (!this.jobStore.jobs) return 0;
      return this.jobStore.jobs.filter(job => job.status === 'Failed').length;
    }
  },
  methods: {
    // 复制任务ID
    copyJobId(jobId) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(jobId).then(() => {
          this.showMessage('任务ID已复制到剪贴板', 'success')
        }).catch(err => {
          console.error('复制失败:', err)
          this.showMessage('复制失败', 'error')
        })
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = jobId
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          this.showMessage('任务ID已复制到剪贴板', 'success')
        } catch (err) {
          console.error('复制失败:', err)
          this.showMessage('复制失败', 'error')
        }
        document.body.removeChild(textArea)
      }
    },
    
    // 显示消息提示
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
    },

    // 资源池类型变化
    async onPoolTypeChange() {
      console.log('资源池类型变化:', this.selectedPoolType)
      
      // 重置资源池选择
      this.selectedPoolId = ''
      
      // 根据类型自动选择资源池并加载任务
      if (this.selectedPoolType === 'dedicatedV2') {
        this.selectedPoolId = 'aihc-serverless'
        console.log('设置全托管资源池ID:', this.selectedPoolId)
        // 加载任务
        try {
          await this.loadJobs()
        } catch (error) {
          console.error('加载全托管资源池任务失败:', error)
        }
      } else {
        // 确保资源池已加载
        try {
          await this.loadResourcePools()
          console.log('资源池加载完成，可用资源池数量:', this.filteredPools.length)
          // 检查是否有资源池可用
          if (this.filteredPools.length > 0 && !this.selectedPoolId) {
            this.selectedPoolId = this.filteredPools[0].id
            console.log('设置自运维资源池ID:', this.selectedPoolId)
          }
          
          // 如果已选择资源池，加载任务
          if (this.selectedPoolId) {
            try {
              await this.loadJobs()
            } catch (error) {
              console.error('加载自运维资源池任务失败:', error)
            }
          } else {
            console.log('没有可用的自运维资源池')
            // 清空任务列表
            if (this.jobStore) {
              this.jobStore.jobs = []
            }
          }
        } catch (error) {
          console.error('加载资源池失败:', error)
        }
      }
      
      // 触发视图更新
      this.$forceUpdate()
    },

    // 搜索输入处理
    onSearchInput() {
      // 清除之前的定时器
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      // 设置新的定时器
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1
        this.loadJobs()
      }, 500) // 500ms防抖
    },

    // 搜索
    search() {
      this.currentPage = 1;
        this.loadJobs();
    },

    // 清空筛选
    clearFilters() {
      this.statusFilter = '';
      this.searchQuery = '';
      this.currentPage = 1;
          this.loadJobs();
    },

    // 排序
    sortBy(field) {
      if (this.orderBy === field) {
        this.order = this.order === 'asc' ? 'desc' : 'asc'
      } else {
        this.orderBy = field
        this.order = 'desc'
      }
      this.loadJobs()
    },

    // 分页
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadJobs()
      }
    },

    // 加载资源池
    async loadResourcePools() {
      try {
        console.log('Loading resource pools...');
        
        // 确保resourcePoolStore存在
        if (!this.resourcePoolStore) {
          console.error('Resource pool store not available');
          return;
        }
        
        await this.resourcePoolStore.loadResourcePools();
        console.log('Resource pools loaded:', this.resourcePoolStore.allResourcePools);
        
        // 如果当前选中的资源池不在新加载的列表中，重置选择
        if (this.selectedPoolId && !this.filteredPools.find(p => p.id === this.selectedPoolId)) {
          console.log('Current pool not found in new list, resetting selection');
          this.selectedPoolId = '';
        }
        
        // 如果没有选中的资源池，根据当前类型选择
        if (!this.selectedPoolId) {
          if (this.selectedPoolType === 'dedicatedV2') {
            this.selectedPoolId = 'aihc-serverless';
            console.log('Selected dedicatedV2 pool:', this.selectedPoolId);
          } else if (this.filteredPools.length > 0) {
            this.selectedPoolId = this.filteredPools[0].id;
            console.log('Selected first common pool:', this.selectedPoolId);
          } else {
            console.log('No pools available for selection');
          }
          
          // 如果已选择资源池，加载对应的任务
          if (this.selectedPoolId) {
            await this.loadJobs();
          }
        }
      } catch (error) {
        console.error('加载资源池失败:', error);
        // 设置错误信息
        if (this.resourcePoolStore) {
          this.resourcePoolStore.error = '加载资源池失败: ' + error.message;
        }
      }
    },

    // 加载任务列表
    async loadJobs(forceRefresh = false) {
      try {
        console.log('Loading jobs with filters:', {
          resourcePoolId: this.selectedPoolId,
          resourcePoolType: this.selectedPoolType,
          keyword: this.searchQuery,
          status: this.statusFilter
        })
        
        // 设置筛选条件
        this.jobStore.setFilters({
          resourcePoolId: this.selectedPoolId,
          resourcePoolType: this.selectedPoolType,
          keyword: this.searchQuery,
          status: this.statusFilter
        })

        // 设置分页
        this.jobStore.setPagination({
          currentPage: this.currentPage,
          pageSize: this.pageSize
        })

        // 加载任务
        await this.jobStore.loadJobs(forceRefresh)
        console.log('Jobs loaded:', this.jobStore.jobs)
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    },

    // 刷新任务列表（强制刷新，不使用缓存）
    async refreshJobs() {
      await this.loadJobs(true)
    },

    // 任务详情相关方法
    showJobDetail(job) {
      // 确定实际使用的资源池ID
      const actualPoolId = this.selectedPoolType === 'dedicatedV2' ? 'aihc-serverless' : this.selectedPoolId
      
      // 使用Vue Router跳转到任务详情页面
      this.$router.push({
        name: 'JobDetail',
        params: { id: job.jobId },
        query: {
          resourcePoolId: actualPoolId,
          from: 'jobs'
        }
      })
    },

    // 状态相关方法
    statusText(status) {
      return this.statusMap[status] || status || '未知'
    },

    statusClass(status) {
      const classMap = {
        'Pending': 'pending',
        'Running': 'running',
        'Succeeded': 'succeeded',
        'Failed': 'failed',
        'Cancelled': 'cancelled',
        'ManualTermination': 'cancelled',
        'Unknown': 'unknown'
      }
      return classMap[status] || 'unknown'
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      try {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN')
      } catch (e) {
        return dateStr
      }
    }
  },
  
  async mounted() {
    console.log('Jobs component mounted')
    console.log('Store state check:', {
      jobStore: this.jobStore,
      resourcePoolStore: this.resourcePoolStore,
      jobStoreJobs: this.jobStore.jobs,
      resourcePoolStorePools: this.resourcePoolStore.allResourcePools
    })
    console.log('Initial state:', {
      selectedPoolType: this.selectedPoolType,
      selectedPoolId: this.selectedPoolId
    })
    
    // 加载资源池
    await this.loadResourcePools()
    
    console.log('After loading resource pools:', {
      selectedPoolType: this.selectedPoolType,
      selectedPoolId: this.selectedPoolId,
      filteredPools: this.filteredPools
    })
    
    // 只有在选择了资源池后才加载任务
    if (this.selectedPoolId) {
      console.log('Loading jobs with pool:', this.selectedPoolId)
      await this.loadJobs()
    } else {
      console.log('No resource pool selected, skipping job loading')
    }
  }
}
</script>

<style scoped>
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

.filter-input {
  min-width: 200px;
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

.select {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  background: #fafbfc;
  color: #333;
  min-width: 150px;
  transition: all 0.3s ease;
}

.select:focus {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  background: #fff;
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

.inline-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: 4px;
  margin-bottom: 1rem;
  color: var(--info-text);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: var(--error);
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: 4px;
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.jobs-table th {
  background: var(--table-header-bg);
  color: var(--text);
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid var(--border);
}

.jobs-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.jobs-table th.sortable:hover {
  background: var(--table-header-hover);
}

.jobs-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

.jobs-table tr:hover {
  background: var(--table-row-hover);
}

.job-info {
  display: flex; 
  flex-direction: column;
  gap: 0.25rem;
}

.job-name {
  font-weight: 600;
  color: var(--text);
}

.job-id {
  font-size: 0.875rem;
  color: var(--muted);
  font-family: monospace;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.job-id:hover {
  background: var(--hover-bg);
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

.status.pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.status.running {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status.succeeded {
  background: #e6fffb;
  color: #13c2c2;
  border: 1px solid #87e8de;
}

.status.failed {
  background: #fff2f0;
  color: #dc3545;
  border: 1px solid #ffccc7;
}

.status.cancelled {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.status.unknown {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.status-column {
  width: 120px;
  text-align: center;
}

.time-column {
  width: 180px;
  font-size: 0.875rem;
  color: var(--muted);
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.pagination-btn:disabled {
  background: var(--muted);
  cursor: not-allowed;
}

.pagination-info {
  color: var(--muted);
  font-size: 0.875rem;
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

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
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
  
  .select, .search-input {
    min-width: auto;
  }
  
  .jobs-table {
    font-size: 0.875rem;
  }
  
  .jobs-table th,
  .jobs-table td {
    padding: 0.5rem;
  }
  
  .stats {
  flex-direction: column;
  gap: 16px;
}

  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: auto;
  }
}

/* 添加与数据集列表页一致的样式 */
.job-name {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s ease;
}

.job-name:hover {
  color: #3076c9;
}

.job-id {
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
</style>