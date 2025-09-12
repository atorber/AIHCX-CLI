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
          <div class="select-row">
            <select class="select" v-model="selectedPoolType" @change="onPoolTypeChange">
              <option value="common">自运维资源池</option>
              <option value="dedicatedV2">全托管资源池</option>
            </select>
            <select class="select" v-model="selectedPoolId" @change="loadJobs" :disabled="selectedPoolType === 'dedicatedV2'">
              <option value="" disabled>请选择资源池</option>
              <option v-if="poolsLoading" value="" disabled>资源池列表加载中...</option>
              <option v-if="selectedPoolType === 'dedicatedV2'" value="aihc-serverless">全托管资源池 (aihc-serverless)</option>
              <option v-else v-for="pool in filteredPools" :key="pool.id" :value="pool.id">
                {{ pool.name }} ({{ pool.id }})
              </option>
            </select>
            <input class="search-input" v-model="searchQuery" @input="onSearchInput" placeholder="搜索任务名称或ID..." />
            <button class="refresh-btn" @click="loadJobs" :disabled="loading || poolsLoading">{{ loading ? '加载中...' : '刷新' }}</button>
          </div>

          <div class="inline-loading" v-if="poolsLoading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>正在加载资源池列表...</span>
          </div>

          <div class="loading" v-if="loading">正在加载任务列表...</div>
          <div class="error" v-if="error">{{ error }}</div>

          <!-- 任务表格 -->
          <div v-if="!loading && !error && filteredJobs.length > 0">
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
                </tr>
              </thead>
              <tbody>
                <tr v-for="(job, index) in filteredJobs" :key="job.jobId || index">
                  <td>
                    <span class="job-name" @click="showJobDetail(job)">{{ job.name || 'N/A' }}</span>
                    <br>
                    <span class="job-id">{{ job.jobId }}</span> 
                    <i class="fa-solid fa-copy copy-icon" @click="copyJobId(job.jobId)" title="复制任务ID"></i>
                  </td>
                  <td class="status-column">
                    <span class="status" :class="statusClass(job.status)">{{ statusText(job.status) }}</span>
                  </td>
                  <td class="time-column">{{ formatDate(job.createdAt) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 分页 -->
            <div class="pagination">
              <button 
                @click="prevPage" 
                :disabled="currentPage <= 1"
              >
                ← 上一页
              </button>
              <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
              <button 
                @click="nextPage" 
                :disabled="currentPage >= totalPages"
              >
                下一页 →
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-if="!loading && !error && filteredJobs.length === 0">
            <h3>暂无任务</h3>
            <p v-if="searchQuery">没有找到匹配"{{ searchQuery }}"的任务</p>
            <p v-else>您还没有创建任何任务</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 任务详情抽屉 -->
  <div class="drawer-overlay" :class="{ show: showDetailDrawer }" @click="closeDetailDrawer"></div>
  <div class="drawer" :class="{ show: showDetailDrawer }">
    <div class="drawer-header">
      <h2 class="drawer-title">{{ jobDetail?.name || '任务详情' }}</h2>
      <p class="drawer-subtitle">{{ jobDetail?.jobId || '' }}</p>
      <button class="drawer-close" @click="closeDetailDrawer">×</button>
    </div>
    <div class="drawer-content" v-if="jobDetail">
      <div v-if="detailLoading" class="loading">正在加载任务详情...</div>
      <div v-else-if="detailError" class="error">{{ detailError }}</div>
      <div v-else>
        <!-- 基本信息 -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">基本信息</h3>
          <div class="drawer-field">
            <div class="drawer-field-label">任务名称</div>
            <div class="drawer-field-value">{{ jobDetail.name || 'N/A' }}</div>
          </div>
          <div class="drawer-field">
            <div class="drawer-field-label">任务ID</div>
            <div class="drawer-field-value">{{ jobDetail.jobId || 'N/A' }}</div>
          </div>
          <div class="drawer-field">
            <div class="drawer-field-label">状态</div>
            <div class="drawer-field-value status" :class="statusClass(jobDetail.status)">{{ statusText(jobDetail.status) }}</div>
          </div>
          <div class="drawer-field">
            <div class="drawer-field-label">资源池ID</div>
            <div class="drawer-field-value">{{ jobDetail.resourcePoolId || 'N/A' }}</div>
          </div>
          <div class="drawer-field" v-if="jobDetail.queueName">
            <div class="drawer-field-label">队列名称</div>
            <div class="drawer-field-value">{{ jobDetail.queueName }}</div>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">时间信息</h3>
          <div class="drawer-field">
            <div class="drawer-field-label">创建时间</div>
            <div class="drawer-field-value">{{ formatDate(jobDetail.createdAt) }}</div>
          </div>
          <div class="drawer-field" v-if="jobDetail.updatedAt">
            <div class="drawer-field-label">更新时间</div>
            <div class="drawer-field-value">{{ formatDate(jobDetail.updatedAt) }}</div>
          </div>
          <div class="drawer-field" v-if="jobDetail.finishedAt">
            <div class="drawer-field-label">完成时间</div>
            <div class="drawer-field-value">{{ formatDate(jobDetail.finishedAt) }}</div>
          </div>
        </div>

        <!-- 描述信息 -->
        <div class="drawer-section" v-if="jobDetail.description">
          <h3 class="drawer-section-title">描述</h3>
          <div class="drawer-field">
            <div class="drawer-field-value">{{ jobDetail.description }}</div>
          </div>
        </div>

        <!-- Pods信息 -->
        <div class="drawer-section" v-if="jobDetail.pods && jobDetail.pods.length > 0">
          <h3 class="drawer-section-title">Pods</h3>
          <div class="pods-list">
            <div v-for="pod in jobDetail.pods" :key="pod.name" class="pod-item">
              <div class="pod-header">
                <span class="pod-name">{{ pod.name }}</span>
                <span class="status" :class="statusClass(pod.status)">{{ statusText(pod.status) }}</span>
              </div>
              <div class="pod-details" v-if="pod.containers">
                <div v-for="container in pod.containers" :key="container.name" class="container-item">
                  <div class="container-name">{{ container.name }}</div>
                  <div class="container-status" :class="statusClass(container.status)">{{ statusText(container.status) }}</div>
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

export default {
  name: 'Jobs',
  components: {
    Navigation
  },
  data() {
    return {
      pools: [],
      selectedPoolId: '',
      selectedPoolType: 'common', // 资源池类型筛选
      jobs: [],
      loading: false,
      poolsLoading: false,
      error: null,
      searchQuery: '',
      // 任务查询参数
      selectedQueue: '', // 选中的队列
      selectedStatus: '', // 选中的状态
      keywordType: 'name', // 关键字类型
      orderBy: 'createdAt', // 排序字段
      order: 'desc', // 排序方式
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页数量
      totalCount: 0, // 总任务数
      searchTimeout: null, // 搜索防抖定时器
      // 任务详情相关
      showDetailDrawer: false, // 是否显示详情抽屉
      jobDetail: null, // 任务详情数据
      detailLoading: false, // 详情加载状态
      detailError: null // 详情加载错误
    }
  },
  computed: {
    filteredPools() {
      return this.pools.filter(pool => {
        const poolType = pool.resourcePoolType || pool.type || 'common';
        return poolType === this.selectedPoolType;
      });
    },
    filteredJobs() {
      // 由于现在使用服务端分页和搜索，直接返回jobs
      return this.jobs;
    },
    totalPages() {
      return Math.ceil(this.totalCount / this.pageSize);
    }
  },
  methods: {
    copyJobId(jobId) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(jobId).then(() => {
          this.showMessage('任务ID已复制到剪贴板', 'success');
        }).catch(() => {
          this.showMessage('复制失败，请手动复制', 'error');
        });
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = jobId;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          this.showMessage('任务ID已复制到剪贴板', 'success');
        } catch (err) {
          this.showMessage('复制失败，请手动复制', 'error');
        }
        document.body.removeChild(textArea);
      }
    },
    
    showMessage(message, type = 'info') {
      // 创建消息元素
      const messageEl = document.createElement('div');
      messageEl.className = `message message-${type}`;
      messageEl.textContent = message;
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        ${type === 'success' ? 'background: #52c41a;' : ''}
        ${type === 'error' ? 'background: #ff4d4f;' : ''}
        ${type === 'info' ? 'background: #1890ff;' : ''}
      `;
      
      document.body.appendChild(messageEl);
      
      // 显示动画
      setTimeout(() => {
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateX(0)';
      }, 100);
      
      // 自动隐藏
      setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
          }
        }, 300);
      }, 3000);
    },
    
    async loadPools() {
      console.log('loadResourcePools called');
      this.poolsLoading = true;
      try {
        // 并行加载两种类型的资源池
        const [commonRes, dedicatedRes] = await Promise.all([
          // 加载自运维资源池
          fetch('/api?action=DescribeResourcePools&resourcePoolType=common&keywordType=resourcePoolName&keyword=&orderBy=createdAt&order=DESC&pageNumber=1&pageSize=100').then(r => r.json()),
          // 加载全托管资源池
          fetch('/api?action=DescribeResourcePools&resourcePoolType=dedicatedV2&keywordType=resourcePoolName&keyword=&orderBy=createdAt&order=DESC&pageNumber=1&pageSize=100').then(r => r.json())
        ]);
        
        console.log('自运维资源池API响应:', commonRes);
        console.log('全托管资源池API响应:', dedicatedRes);
        
        // 处理资源池数据
        const processPools = (data, type) => {
          if (data?.resourcePools && Array.isArray(data.resourcePools)) {
            return data.resourcePools.map(pool => ({ 
              ...pool, 
              resourcePoolType: type,
              // 确保有正确的ID和名称字段
              id: pool.resourcePoolId || pool.id,
              name: pool.name || pool.resourcePoolName
            }));
          } else if (data?.result?.resourcePools) {
            return data.result.resourcePools.map(pool => ({ 
              ...pool, 
              resourcePoolType: type,
              id: pool.resourcePoolId || pool.id,
              name: pool.name || pool.resourcePoolName
            }));
          } else if (data?.ResourcePools) {
            return data.ResourcePools.map(pool => ({ 
              ...pool, 
              resourcePoolType: type,
              id: pool.resourcePoolId || pool.id,
              name: pool.name || pool.resourcePoolName
            }));
          } else if (data?.result?.ResourcePools) {
            return data.result.ResourcePools.map(pool => ({ 
              ...pool, 
              resourcePoolType: type,
              id: pool.resourcePoolId || pool.id,
              name: pool.name || pool.resourcePoolName
            }));
          } else if (Array.isArray(data)) {
            return data.map(pool => ({ 
              ...pool, 
              resourcePoolType: type,
              id: pool.resourcePoolId || pool.id,
              name: pool.name || pool.resourcePoolName
            }));
          }
          return [];
        };
        
        const commonPools = processPools(commonRes, 'common');
        const dedicatedPools = processPools(dedicatedRes, 'dedicatedV2');
        
        // 合并所有资源池
        this.pools = [...commonPools, ...dedicatedPools];
        
        // 如果当前选中的资源池不在新加载的列表中，重置选择
        if (this.selectedPoolId && !this.filteredPools.find(p => p.id === this.selectedPoolId)) {
          this.selectedPoolId = '';
        }
        
        // 如果没有选中的资源池，根据当前类型选择
        if (!this.selectedPoolId) {
          if (this.selectedPoolType === 'dedicatedV2') {
            // 查找可用的全托管资源池，如果没有则使用固定的 aihc-serverless
            const availableDedicated = this.pools.filter(p => p.resourcePoolType === 'dedicatedV2');
            this.selectedPoolId = availableDedicated.length > 0 ? availableDedicated[0].id : 'aihc-serverless';
          } else if (this.filteredPools.length > 0) {
            this.selectedPoolId = this.filteredPools[0].id;
          }
        }
      } catch (e) {
        console.error('Failed to load pools:', e);
        this.error = '加载资源池失败: ' + (e.message || e);
      } finally {
        this.poolsLoading = false;
      }
    },
    
    // 资源池类型切换处理
    onPoolTypeChange() {
      // 清空任务列表
      this.jobs = [];
      
      if (this.selectedPoolType === 'dedicatedV2') {
        // 全托管资源池固定使用 aihc-serverless
        this.selectedPoolId = 'aihc-serverless';
        // 自动加载任务
        this.loadJobs();
      } else {
        // 自运维资源池需要从列表中选择
        this.selectedPoolId = '';
        // 如果有可用的资源池，选择第一个
        if (this.filteredPools.length > 0) {
          this.selectedPoolId = this.filteredPools[0].id;
          // 自动加载新选择的资源池的任务
          this.loadJobs();
        }
      }
    },
    
    normalizeJobs(rawJobs) {
      if (!Array.isArray(rawJobs)) return [];
      return rawJobs
        .filter(j => j != null && typeof j === 'object') // 过滤掉null、undefined和非对象
        .map(j => {
          const jobId = j.jobId || j.id || j.jobID || j?.metadata?.id || j?.job?.id || '';
          const name = j.name || j.jobName || j?.metadata?.name || j?.job?.name || '';
          const status = j.status || j.state || j.phase || j?.status?.phase || j?.jobStatus?.phase || '';
          const createdAt = j.createdAt || j.createdTime || j.creationTime || j.createTime || j?.metadata?.createdAt || '';
          return { jobId, name, status, createdAt };
        });
    },
    
    extractJobsFromResponse(data) {
      if (!data) return [];
      const candidates = [
        data?.result?.jobs,
        data?.jobs,
        data?.result?.jobList,
        data?.result?.items,
        data?.data?.jobs,
        data?.result?.data?.jobs
      ];
      for (const arr of candidates) {
        if (Array.isArray(arr)) return this.normalizeJobs(arr);
      }
      const maybeObj = data?.result || data?.data || data;
      for (const key in maybeObj) {
        if (Array.isArray(maybeObj[key]) && maybeObj[key].length && (maybeObj[key][0].jobId || maybeObj[key][0].name)) {
          return this.normalizeJobs(maybeObj[key]);
        }
      }
      return [];
    },
    
    async loadJobs() {
      console.log('loadJobs called');
      if (!this.selectedPoolId || this.poolsLoading) return;
      this.loading = true;
      this.error = null;
      try {
        // 确定实际使用的资源池ID
        const actualPoolId = this.selectedPoolType === 'dedicatedV2' ? 'aihc-serverless' : this.selectedPoolId;
        
        // 构建查询参数
        const queryParams = new URLSearchParams({
          action: 'DescribeJobs',
          resourcePoolId: actualPoolId
        });
        
        // 如果是托管资源池且有选中的队列，添加queueID参数
        if (this.selectedPoolType === 'dedicatedV2' && this.selectedQueue) {
          queryParams.append('queueID', this.selectedQueue);
        }
        
        // 构建请求体
        const requestBody = {
          pageNumber: this.currentPage,
          pageSize: this.pageSize,
          orderBy: this.orderBy,
          order: this.order
        };
        
        // 添加队列参数（根据资源池类型决定使用queue还是queueID）
        if (this.selectedQueue) {
          if (this.selectedPoolType === 'common') {
            requestBody.queue = this.selectedQueue; // 通用资源池使用队列名称
          } else {
            requestBody.queue = this.selectedQueue; // 托管资源池使用队列ID
          }
        }
        
        // 添加状态筛选
        if (this.selectedStatus) {
          requestBody.status = this.selectedStatus;
        }
        
        // 添加关键字搜索
        if (this.searchQuery.trim()) {
          requestBody.keywordType = this.keywordType;
          requestBody.keywork = this.searchQuery.trim();
        }
        
        const url = `/api?${queryParams.toString()}`;
        console.log('Making API request with params:', queryParams.toString());
        console.log('Request body:', requestBody);
        
        // 使用fetch发送请求
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        const data = await response.json();
        console.log('API response received:', data);
        
        this.jobs = this.extractJobsFromResponse(data);
        this.totalCount = data.totalCount || data.TotalCount || this.jobs.length;
      } catch (e) {
        this.error = '加载任务失败: ' + (e.message || e);
        this.jobs = [];
        this.totalCount = 0;
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(s) {
      if (!s) return 'N/A';
      try { return new Date(s).toLocaleString('zh-CN'); } catch { return s; }
    },
    
    statusClass(s) {
      if (!s) return 'pending';
      const m = { 
        running:'running', 
        pending:'pending', 
        failed:'failed', 
        succeeded:'succeeded', 
        success:'succeeded',
        created:'pending',
        creating:'pending',
        ManualTermination:'cancelled',
        Scheduled:'pending',
        Cancelled:'cancelled',
        Unknown:'unknown'
      };
      return m[s] || 'pending';
    },
    
    statusText(s) {
      const m = { 
        running:'运行中', 
        pending:'等待中', 
        failed:'失败', 
        succeeded:'成功', 
        success:'成功',
        created:'已创建',
        creating:'创建中',
        ManualTermination:'手动终止',
        Scheduled:'已调度',
        Cancelled:'已取消',
        Unknown:'未知'
      };
      return m[s] || s || '未知';
    },
    
    // 搜索方法
    onSearchInput() {
      // 防抖搜索
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.searchTimeout = setTimeout(() => {
        this.search();
      }, 500);
    },
    
    search() {
      this.currentPage = 1;
      this.loadJobs();
    },
    
    // 分页方法
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadJobs();
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadJobs();
      }
    },
    
    // 排序方法
    sortBy(field) {
      if (this.orderBy === field) {
        this.order = this.order === 'asc' ? 'desc' : 'asc';
      } else {
        this.orderBy = field;
        this.order = 'desc';
      }
      this.currentPage = 1;
      this.loadJobs();
    },
    
    // 任务详情相关方法
    async showJobDetail(job) {
      this.jobDetail = job;
      this.showDetailDrawer = true;
      this.detailLoading = true;
      this.detailError = null;
      
      // 防止body滚动
      document.body.style.overflow = 'hidden';
      
      try {
        // 加载任务详情
        const actualPoolId = this.selectedPoolType === 'dedicatedV2' ? 'aihc-serverless' : this.selectedPoolId;
        const params = new URLSearchParams({
          action: 'DescribeJob',
          resourcePoolId: actualPoolId,
          jobId: job.jobId
        });
        
        // POST请求
        const response = await fetch(`/api?${params.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        const data = await response.json();
        
        if (data.error) {
          this.detailError = data.error;
        } else {
          // 更新任务详情
          this.jobDetail = { ...job, ...data.result || data };
        }
      } catch (e) {
        this.detailError = '加载任务详情失败: ' + (e.message || e);
      } finally {
        this.detailLoading = false;
      }
    },
    
    closeDetailDrawer() {
      this.showDetailDrawer = false;
      this.jobDetail = null;
      this.detailLoading = false;
      this.detailError = null;
      
      // 恢复body滚动
      document.body.style.overflow = '';
    }
  },
  
  async mounted() {
    console.log('Jobs component mounted');
    // 先加载资源池列表
    await this.loadPools();
    // 如果有选中的资源池，加载任务列表
    if (this.selectedPoolId) {
      await this.loadJobs();
    }
  }
}
</script>

<style scoped>
.select-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.select {
  padding: 10px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  background: #fafbfc;
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.jobs-table th {
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

.jobs-table th.status-column {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
}

.jobs-table th.time-column {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.jobs-table th:hover {
  background: #e9ecef;
}

.jobs-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: top;
  font-size: 14px;
}

.jobs-table td.status-column {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  text-align: center;
}

.jobs-table td.time-column {
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.jobs-table tr:hover {
  background: #f8f9fa;
  transition: background 0.2s ease;
}

.status {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  text-align: center;
  min-width: 60px;
}

.status.running { 
  background: #f6ffed; 
  color: #52c41a; 
  border: 1px solid #b7eb8f; 
}

.status.pending { 
  background: #fff7e6; 
  color: #fa8c16; 
  border: 1px solid #ffd591; 
}

.status.failed { 
  background: #fff2f0; 
  color: #dc3545; 
  border: 1px solid #ffccc7; 
}

.status.succeeded { 
  background: #e6fffb; 
  color: #13c2c2; 
  border: 1px solid #87e8de; 
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

/* 排序样式 */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background: #f0f0f0;
}

.sortable i {
  margin-left: 8px;
  font-size: 12px;
  color: #666;
}

/* 分页样式 */
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

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-state h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 20px;
}

.inline-loading { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  color: #6b7280; 
  font-size: 13px; 
  margin-bottom: 12px; 
}

/* 任务信息样式 */
.job-name {
  color: #409eff;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.4;
}

.job-name:hover {
  text-decoration: underline;
  color: #337ecc;
}

.job-id {
  color: #666;
  font-size: 12px;
  font-weight: 500;
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

/* 抽屉样式 */
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

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
  border-radius: 4px;
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

.drawer-field-value.status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.pods-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pod-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.pod-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pod-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.pod-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.container-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.container-name {
  font-size: 14px;
  color: #333;
}

.container-status {
  font-size: 12px;
}
</style>