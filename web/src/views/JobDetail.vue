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
          <!-- 操作栏 -->
          <div class="action-bar">
            <button @click="goBack" class="btn-back">
              {{ backText }}
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="jobStore.detailLoading" class="loading">
            <i class="fas fa-spinner fa-spin"></i> 任务详情加载中...
          </div>

          <!-- 错误信息 -->
          <div v-if="jobStore.detailError" class="error">
            <i class="fas fa-exclamation-circle"></i> {{ jobStore.detailError }}
          </div>

          <!-- 任务详情 -->
          <div v-if="jobStore.currentJob && !jobStore.detailLoading && !jobStore.detailError">
            <!-- 基本信息 -->
            <div class="job-card">
              <div class="job-card-header">
                <h5>基本信息</h5>
              </div>
              <div class="job-card-body">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">任务名称</div>
                    <div class="info-value">{{ jobStore.currentJob.name }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">任务ID</div>
                    <div class="info-value">{{ jobStore.currentJob.jobId }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">状态</div>
                    <div class="info-value">
                      <span class="status" :class="statusClass(jobStore.currentJob.status)">
                        {{ statusText(jobStore.currentJob.status) }}
                      </span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">任务类型</div>
                    <div class="info-value">{{ jobStore.currentJob.jobType }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">优先级</div>
                    <div class="info-value">{{ jobStore.currentJob.priority }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">队列</div>
                    <div class="info-value">{{ jobStore.currentJob.queueName }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">资源池ID</div>
                    <div class="info-value">{{ jobStore.currentJob.resourcePoolId }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">创建时间</div>
                    <div class="info-value">{{ formatDate(jobStore.currentJob.createdAt) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">完成时间</div>
                    <div class="info-value">{{ formatDate(jobStore.currentJob.finishedAt) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 任务规格 -->
            <div class="job-card" v-if="jobStore.currentJob.jobSpec">
              <div class="job-card-header">
                <h5>任务规格</h5>
              </div>
              <div class="job-card-body">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">镜像</div>
                    <div class="info-value">{{ jobStore.currentJob.jobSpec.image }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">副本数</div>
                    <div class="info-value">{{ jobStore.currentJob.jobSpec.replicas }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">启用RDMA</div>
                    <div class="info-value">{{ jobStore.currentJob.jobSpec.enableRDMA ? '是' : '否' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 执行命令 -->
            <div class="job-card" v-if="jobStore.currentJob.command">
              <div class="job-card-header">
                <h5>执行命令</h5>
              </div>
              <div class="job-card-body">
                <div class="command-container">{{ jobStore.currentJob.command }}</div>
              </div>
            </div>

            <!-- 环境变量 -->
            <div class="job-card" v-if="jobStore.currentJob.jobSpec && jobStore.currentJob.jobSpec.envs && jobStore.currentJob.jobSpec.envs.length > 0">
              <div class="job-card-header">
                <h5>环境变量</h5>
              </div>
              <div class="job-card-body">
                <div class="env-container">
                  <div class="env-item" v-for="env in jobStore.currentJob.jobSpec.envs" :key="env.name">
                    <span class="env-name">{{ env.name }}</span>
                    <span class="env-value">{{ env.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 标签 -->
            <div class="job-card" v-if="jobStore.currentJob.labels && jobStore.currentJob.labels.length > 0">
              <div class="job-card-header">
                <h5>标签</h5>
              </div>
              <div class="job-card-body">
                <div class="labels-container">
                  <span class="label-tag" v-for="label in jobStore.currentJob.labels" :key="label.key">
                    {{ label.key }}: {{ label.value }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Pod信息 -->
            <div class="job-card" v-if="jobStore.currentJob.pods && jobStore.currentJob.pods.length > 0">
              <div class="job-card-header">
                <h5>Pod信息</h5>
              </div>
              <div class="job-card-body">
                <div v-for="pod in jobStore.currentJob.pods" :key="pod.name" style="margin-bottom: 16px;">
                  <div class="info-item">
                    <div class="info-label">Pod名称</div>
                    <div class="info-value">{{ pod.name }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">状态</div>
                    <div class="info-value">
                      <span class="status" :class="statusClass(pod.status)">
                        {{ statusText(pod.status) }}
                      </span>
                    </div>
                  </div>
                  <div class="info-item" v-if="pod.nodeName">
                    <div class="info-label">节点</div>
                    <div class="info-value">{{ pod.nodeName }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!jobStore.detailLoading && !jobStore.detailError && !jobStore.currentJob" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>未找到任务详情</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'
import { useJobStore } from '../stores/jobStore'

export default {
  name: 'JobDetail',
  components: {
    Navigation
  },
  setup() {
    const jobStore = useJobStore()
    return {
      jobStore
    }
  },
  data() {
    return {
      jobId: null,
      fromPage: null,
      datasetId: null,
      backText: '← 返回任务列表'
    }
  },
  methods: {
    // 检测来源页面并设置返回链接
    detectSourcePage() {
      const urlParams = new URLSearchParams(window.location.search)
      this.fromPage = urlParams.get('from')
      this.datasetId = urlParams.get('datasetId')
      
      if (this.fromPage === 'imports' && this.datasetId) {
        this.backText = '← 返回导入记录'
      } else if (this.fromPage === 'jobs') {
        this.backText = '← 返回任务列表'
      } else {
        // 默认返回任务列表
        this.backText = '← 返回任务列表'
      }
    },
    
    // 返回上一页
    goBack() {
      if (this.fromPage === 'imports' && this.datasetId) {
        this.$router.push({
          name: 'DatasetDetail',
          params: { id: this.datasetId },
          query: { tab: 'imports' }
        })
      } else {
        this.$router.push({ name: 'Jobs' })
      }
    },
    
    async loadJobDetail() {
      try {
        // 从URL参数获取jobId和resourcePoolId
        const urlParams = new URLSearchParams(window.location.search)
        // 从URL路径中提取jobId: /jobs/job-xxx -> job-xxx
        const pathParts = window.location.pathname.split('/')
        this.jobId = urlParams.get('jobId') || pathParts[pathParts.length - 1]
        
        if (!this.jobId) {
          throw new Error('缺少任务ID参数')
        }
        
        // 获取资源池ID（从URL参数或默认值）
        const resourcePoolId = urlParams.get('resourcePoolId') || 'aihc-serverless'
        
        // 使用store加载任务详情
        await this.jobStore.loadJobDetail(this.jobId, resourcePoolId)
      } catch (e) {
        console.error('Failed to load job detail:', e)
      }
    },
    
    statusText(status) {
      const statusMap = {
        'Pending': '等待中',
        'Running': '运行中',
        'Succeeded': '成功',
        'Failed': '失败',
        'Cancelled': '已取消',
        'ManualTermination': '手动终止',
        'Unknown': '未知'
      }
      return statusMap[status] || status || '未知'
    },
    
    statusClass(status) {
      const classMap = {
        'Pending': 'status-pending',
        'Running': 'status-running',
        'Succeeded': 'status-success',
        'Failed': 'status-error',
        'Cancelled': 'status-cancelled',
        'ManualTermination': 'status-cancelled',
        'Unknown': 'status-unknown'
      }
      return classMap[status] || 'status-unknown'
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
    // 检测来源页面
    this.detectSourcePage()
    
    // 加载任务详情
    await this.loadJobDetail()
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

.job-card {
  background: var(--panel-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  margin-bottom: 24px;
  overflow: hidden;
}

.job-card-header {
  background: #f8f9fa;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

.job-card-header h5 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.job-card-body {
  padding: 24px;
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
  color: var(--text);
  word-break: break-all;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-running {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-cancelled {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.status-unknown {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--muted);
}

.error {
  text-align: center;
  padding: 40px;
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin: 20px 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--muted);
}

.empty-state i {
  font-size: 48px;
  color: #adb5bd;
  margin-bottom: 16px;
}

.command-container {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.labels-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.label-tag {
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.env-container {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
}

.env-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.env-item:last-child {
  border-bottom: none;
}

.env-name {
  font-weight: 600;
  color: #495057;
  font-family: monospace;
  font-size: 13px;
}

.env-value {
  color: var(--text);
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
  max-width: 60%;
}
</style>
