import { defineStore } from 'pinia'

export const useDatasetStore = defineStore('dataset', {
  state: () => ({
    // 数据集列表
    datasets: [],
    // 当前数据集详情
    currentDataset: null,
    // 导入记录
    imports: [],
    // 加载状态
    loading: false,
    detailLoading: false,
    importsLoading: false,
    error: null,
    detailError: null,
    importsError: null,
    // 分页信息
    pagination: {
      currentPage: 1,
      pageSize: 20,
      total: 0
    },
    // 筛选条件
    filters: {
      keyword: '',
      status: ''
    },
    // 缓存状态
    lastFetchTime: null,
    cacheExpiry: 5 * 60 * 1000, // 5分钟缓存
  }),

  getters: {
    // 获取过滤后的数据集列表
    filteredDatasets: (state) => {
      let filtered = state.datasets

      // 按状态筛选
      if (state.filters.status) {
        filtered = filtered.filter(dataset => dataset.status === state.filters.status)
      }

      // 按关键词筛选
      if (state.filters.keyword) {
        const keyword = state.filters.keyword.toLowerCase()
        filtered = filtered.filter(dataset => 
          (dataset.name && dataset.name.toLowerCase().includes(keyword)) ||
          (dataset.datasetId && dataset.datasetId.toLowerCase().includes(keyword))
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
      state.datasets.forEach(dataset => {
        const status = dataset.status || 'Unknown'
        stats[status] = (stats[status] || 0) + 1
      })
      return stats
    }
  },

  actions: {
    // 加载数据集列表
    async loadDatasets(forceRefresh = false) {
      // 如果缓存有效且不强制刷新，直接返回
      if (this.isCacheValid && !forceRefresh) {
        console.log('使用缓存的数据集数据')
        return this.datasets
      }

      this.loading = true
      this.error = null

      try {
        console.log('开始加载数据集数据...')
        
        // 构建查询参数
        const queryParams = new URLSearchParams({
          action: 'DescribeDatasets',
          pageNumber: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })

        // 添加筛选条件
        if (this.filters.keyword) {
          queryParams.append('keywordType', 'name')
          queryParams.append('keyword', this.filters.keyword)
        }

        const url = `/api?${queryParams.toString()}`
        console.log('数据集列表API URL:', url)

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
        console.log('数据集列表API响应:', data)

        // 处理数据集数据
        this.datasets = this.processDatasetsData(data)
        this.pagination.total = data.total || this.datasets.length
        this.lastFetchTime = Date.now()

        console.log('数据集加载完成，总数:', this.datasets.length)
        return this.datasets
      } catch (error) {
        console.error('加载数据集失败:', error)
        this.error = '加载数据集列表失败: ' + error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // 加载数据集详情
    async loadDatasetDetail(datasetId) {
      this.detailLoading = true
      this.detailError = null

      try {
        console.log('开始加载数据集详情:', datasetId)
        
        // 构建查询参数
        const queryParams = new URLSearchParams({
          action: 'DescribeDataset',
          datasetId: datasetId
        })

        const url = `/api?${queryParams.toString()}`
        console.log('数据集详情API URL:', url)

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
        console.log('数据集详情API响应:', data)

        // 处理数据集详情数据
        this.currentDataset = this.processDatasetDetail(data)
        return this.currentDataset
      } catch (error) {
        console.error('加载数据集详情失败:', error)
        this.detailError = '加载数据集详情失败: ' + error.message
        throw error
      } finally {
        this.detailLoading = false
      }
    },

    // 加载导入记录
    async loadImports(datasetId, resourcePools) {
      this.importsLoading = true
      this.importsError = null

      try {
        console.log('开始加载导入记录:', datasetId)
        
        if (!resourcePools || resourcePools.length === 0) {
          throw new Error('无法获取资源池列表，请稍后重试')
        }

        // 构建搜索前缀
        const sanitizedDatasetId = datasetId.toLowerCase().replace(/[^a-z0-9.-]/g, '-')
        const searchPrefix = `${sanitizedDatasetId}-`

        let allImports = []

        // 并行查询所有资源池
        const promises = resourcePools.map(async (pool) => {
          try {
            const poolId = pool.resourcePoolId || pool.id
            const poolType = pool.resourcePoolType || pool.type
            const actualPoolId = poolType === 'dedicatedV2' ? 'aihc-serverless' : poolId

            const requestBody = {
              keywordType: 'name',
              keyword: searchPrefix
            }

            const response = await fetch(`/api?action=DescribeJobs&resourcePoolId=${actualPoolId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            })

            const data = await response.json()
            if (data.error) {
              console.warn(`Failed to query jobs in pool ${poolId}:`, data.error)
              return []
            }

            return data.jobs || data.result?.jobs || []
          } catch (err) {
            console.warn(`Error querying pool ${pool.resourcePoolId || pool.id}:`, err)
            return []
          }
        })

        // 等待所有查询完成
        const results = await Promise.all(promises)

        // 合并所有结果及去重
        results.forEach(jobs => {
          allImports.push(...jobs)
        })

        // 去重
        allImports = allImports.filter((job, index, self) =>
          index === self.findIndex((t) => t.jobId === job.jobId)
        )

        this.imports = allImports
        console.log('导入记录加载完成，总数:', this.imports.length)
        return this.imports
      } catch (error) {
        console.error('加载导入记录失败:', error)
        this.importsError = '加载导入记录失败: ' + error.message
        throw error
      } finally {
        this.importsLoading = false
      }
    },

    // 处理数据集列表数据
    processDatasetsData(data) {
      const datasets = data.datasets || data.result?.datasets || []
      return datasets.map(dataset => ({
        datasetId: dataset.datasetId || dataset.id || '',
        name: dataset.name || dataset.datasetName || '',
        status: dataset.status || '',
        description: dataset.description || '',
        createdAt: dataset.createdAt || dataset.createdTime || '',
        updatedAt: dataset.updatedAt || dataset.updatedTime || '',
        latestVersion: dataset.latestVersion || '1'
      }))
    },

    // 处理数据集详情数据
    processDatasetDetail(data) {
      const dataset = data?.result || data?.dataset || data
      
      if (!dataset) {
        throw new Error('无法解析数据集详情数据')
      }
      
      return {
        datasetId: dataset.datasetId || dataset.id || '',
        name: dataset.name || dataset.datasetName || '',
        status: dataset.status || '',
        description: dataset.description || '',
        createdAt: dataset.createdAt || dataset.createdTime || '',
        updatedAt: dataset.updatedAt || dataset.updatedTime || '',
        latestVersion: dataset.latestVersion || '1',
        versions: dataset.versions || []
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

    // 清空当前数据集
    clearCurrentDataset() {
      this.currentDataset = null
      this.detailError = null
    },

    // 清空导入记录
    clearImports() {
      this.imports = []
      this.importsError = null
    },

    // 清空缓存
    clearCache() {
      this.datasets = []
      this.currentDataset = null
      this.imports = []
      this.lastFetchTime = null
      this.error = null
      this.detailError = null
      this.importsError = null
    }
  }
})
