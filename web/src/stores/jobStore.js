import { defineStore } from 'pinia'

export const useJobStore = defineStore('job', {
  state: () => ({
    // 任务列表
    jobs: [],
    // 当前任务详情
    currentJob: null,
    // 加载状态
    loading: false,
    detailLoading: false,
    error: null,
    detailError: null,
    // 分页信息
    pagination: {
      currentPage: 1,
      pageSize: 20,
      total: 0
    },
    // 筛选条件
    filters: {
      resourcePoolId: '',
      resourcePoolType: 'common',
      status: '',
      keyword: ''
    },
    // 缓存状态
    lastFetchTime: null,
    cacheExpiry: 2 * 60 * 1000, // 2分钟缓存
  }),

  getters: {
    // 获取过滤后的任务列表
    filteredJobs: (state) => {
      let filtered = state.jobs

      // 按状态筛选
      if (state.filters.status) {
        filtered = filtered.filter(job => job.status === state.filters.status)
      }

      // 按关键词筛选
      if (state.filters.keyword) {
        const keyword = state.filters.keyword.toLowerCase()
        filtered = filtered.filter(job => 
          (job.name && job.name.toLowerCase().includes(keyword)) ||
          (job.jobId && job.jobId.toLowerCase().includes(keyword))
        )
      }

      return filtered
    },

    // 检查缓存是否有效
    isCacheValid: (state) => {
      if (!state.lastFetchTime) return false
      return Date.now() - state.lastFetchTime < state.cacheExpiry
    },

    // 获取状态统计
    statusStats: (state) => {
      const stats = {}
      state.jobs.forEach(job => {
        const status = job.status || 'Unknown'
        stats[status] = (stats[status] || 0) + 1
      })
      return stats
    }
  },

  actions: {
    // 加载任务列表
    async loadJobs(forceRefresh = false) {
      // 如果缓存有效且不强制刷新，直接返回
      if (this.isCacheValid && !forceRefresh) {
        console.log('使用缓存的任务数据')
        return this.jobs
      }

      this.loading = true
      this.error = null

      try {
        console.log('开始加载任务数据...')
        
        // 确定实际使用的资源池ID
        const actualPoolId = this.filters.resourcePoolType === 'dedicatedV2' 
          ? 'aihc-serverless' 
          : this.filters.resourcePoolId

        if (!actualPoolId) {
          throw new Error('请先选择资源池')
        }

        // 构建查询参数
        const queryParams = new URLSearchParams({
          action: 'DescribeJobs',
          resourcePoolId: actualPoolId,
          pageNumber: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })

        // 添加筛选条件
        if (this.filters.status) {
          queryParams.append('status', this.filters.status)
        }
        if (this.filters.keyword) {
          queryParams.append('keywordType', 'name')
          queryParams.append('keyword', this.filters.keyword)
        }

        const url = `/api?${queryParams.toString()}`
        console.log('任务列表API URL:', url)

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('任务列表API响应:', data)

        // 处理任务数据
        this.jobs = this.processJobsData(data)
        this.pagination.total = data.total || this.jobs.length
        this.lastFetchTime = Date.now()

        console.log('任务加载完成，总数:', this.jobs.length)
        return this.jobs
      } catch (error) {
        console.error('加载任务失败:', error)
        this.error = '加载任务列表失败: ' + error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // 加载任务详情
    async loadJobDetail(jobId, resourcePoolId = 'aihc-serverless') {
      this.detailLoading = true
      this.detailError = null

      try {
        console.log('开始加载任务详情:', jobId)
        
        // 构建查询参数
        const queryParams = new URLSearchParams({
          action: 'DescribeJob',
          resourcePoolId: resourcePoolId
        })

        // 构建请求体
        const requestBody = {
          jobId: jobId,
          needDetail: true
        }

        const url = `/api?${queryParams.toString()}`
        console.log('任务详情API URL:', url)

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('任务详情API响应:', data)

        // 处理任务详情数据
        this.currentJob = this.processJobDetail(data)
        return this.currentJob
      } catch (error) {
        console.error('加载任务详情失败:', error)
        this.detailError = '加载任务详情失败: ' + error.message
        throw error
      } finally {
        this.detailLoading = false
      }
    },

    // 处理任务列表数据
    processJobsData(data) {
      const jobs = data.jobs || data.result?.jobs || []
      return jobs.map(job => ({
        jobId: job.jobId || job.id || job.jobID || '',
        name: job.name || job.jobName || '',
        status: job.status || job.state || job.phase || '',
        jobType: job.jobType || job.type || '',
        priority: job.priority || '',
        queueName: job.queueName || job.queue || '',
        resourcePoolId: job.resourcePoolId || job.resourcePool || '',
        createdAt: job.createdAt || job.createdTime || job.creationTime || '',
        updatedAt: job.updatedAt || job.updatedTime || job.updateTime || '',
        finishedAt: job.finishedAt || job.finishedTime || job.completionTime || ''
      }))
    },

    // 处理任务详情数据
    processJobDetail(data) {
      const job = data?.result || data?.job || data?.Job || data
      
      if (!job) {
        throw new Error('无法解析任务详情数据')
      }
      
      return {
        jobId: job.jobId || job.id || job.jobID || '',
        name: job.name || job.jobName || '',
        status: job.status || job.state || job.phase || '',
        jobType: job.jobType || job.type || '',
        priority: job.priority || '',
        queueName: job.queueName || job.queue || '',
        resourcePoolId: job.resourcePoolId || job.resourcePool || '',
        description: job.description || job.desc || '',
        createdAt: job.createdAt || job.createdTime || job.creationTime || '',
        updatedAt: job.updatedAt || job.updatedTime || job.updateTime || '',
        finishedAt: job.finishedAt || job.finishedTime || job.completionTime || '',
        command: job.command || '',
        jobSpec: job.jobSpec || job.spec || {},
        labels: job.labels || [],
        pods: job.pods || job.Pods || job.podList || []
      }
    },

    // 设置筛选条件
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    // 设置分页
    setPagination(pagination) {
      this.pagination = { ...this.pagination, ...pagination }
    },

    // 清空当前任务
    clearCurrentJob() {
      this.currentJob = null
      this.detailError = null
    },

    // 清空缓存
    clearCache() {
      this.jobs = []
      this.currentJob = null
      this.lastFetchTime = null
      this.error = null
      this.detailError = null
    }
  }
})
