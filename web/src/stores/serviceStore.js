import { defineStore } from 'pinia'

export const useServiceStore = defineStore('service', {
  state: () => ({
    // 服务列表
    services: [],
    // 当前服务详情
    currentService: null,
    // 加载状态
    loading: false,
    detailLoading: false,
    error: null,
    detailError: null,
    // 分页信息
    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0
    },
    // 筛选条件
    filters: {
      keyword: '',
      orderBy: 'createdAt',
      order: 'desc'
    },
    // 缓存状态
    lastFetchTime: null,
    cacheExpiry: 2 * 60 * 1000, // 2分钟缓存
  }),

  getters: {
    // 检查缓存是否有效
    isCacheValid: (state) => {
      if (!state.lastFetchTime) return false
      return Date.now() - state.lastFetchTime < state.cacheExpiry
    }
  },

  actions: {
    // 加载服务列表
    async loadServices(forceRefresh = false) {
      // 如果缓存有效且不强制刷新，直接返回
      if (this.isCacheValid && !forceRefresh) {
        console.log('使用缓存的服务数据')
        return this.services
      }

      this.loading = true
      this.error = null

      try {
        console.log('开始加载服务数据...')
        
        // 构建查询参数
        const queryParams = new URLSearchParams({
          action: 'DescribeServices',
          pageNumber: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })

        // 添加筛选条件
        if (this.filters.keyword) {
          queryParams.append('keyword', this.filters.keyword)
        }
        
        // 添加排序条件
        if (this.filters.orderBy && this.filters.order) {
          queryParams.append('orderBy', this.filters.orderBy)
          queryParams.append('order', this.filters.order)
        }

        const url = `/api?${queryParams.toString()}`
        console.log('服务列表API URL:', url)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('服务列表API响应:', data)

        // 处理服务数据
        this.services = this.processServicesData(data)
        this.pagination.total = data.totalCount || data.total || this.services.length
        this.lastFetchTime = Date.now()

        console.log('服务加载完成，总数:', this.services.length)
        return this.services
      } catch (error) {
        console.error('加载服务失败:', error)
        this.error = '加载服务列表失败: ' + error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // 加载服务详情
    async loadServiceDetail(serviceId) {
      this.detailLoading = true
      this.detailError = null

      try {
        console.log('开始加载服务详情:', serviceId)
        
        // 构建查询参数
        const queryParams = new URLSearchParams({
          action: 'DescribeService',
          serviceId: serviceId
        })

        const url = `/api?${queryParams.toString()}`
        console.log('服务详情API URL:', url)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('服务详情API响应:', data)

        // 处理服务详情数据
        this.currentService = this.processServiceDetail(data)
        return this.currentService
      } catch (error) {
        console.error('加载服务详情失败:', error)
        this.detailError = '加载服务详情失败: ' + error.message
        throw error
      } finally {
        this.detailLoading = false
      }
    },

    // 处理服务列表数据
    processServicesData(data) {
      const services = data.services || data.result?.services || []
      return services.map(service => ({
        id: service.id || service.serviceId || '',
        name: service.name || service.serviceName || '',
        createdAt: service.createdAt || service.createdTime || service.creationTime || '',
        updatedAt: service.updatedAt || service.updatedTime || service.updateTime || '',
        resourcePoolId: service.resourcePoolId || '',
        resourcePoolName: service.resourcePoolName || '',
        resourcePoolType: service.resourcePoolType || '',
        resourceSpec: service.resourceSpec || {},
        networkType: service.networkType || '',
        publicAccess: service.publicAccess || false,
        queueName: service.queueName || '',
        creator: service.creator || ''
      }))
    },

    // 处理服务详情数据
    processServiceDetail(data) {
      const service = data?.result || data?.service || data
      
      if (!service) {
        throw new Error('无法解析服务详情数据')
      }
      
      return {
        id: service.id || service.serviceId || '',
        name: service.name || service.serviceName || '',
        createdAt: service.createdAt || service.createdTime || service.creationTime || '',
        updatedAt: service.updatedAt || service.updatedTime || service.updateTime || '',
        resourcePoolId: service.resourcePoolId || '',
        resourcePoolName: service.resourcePoolName || '',
        resourcePoolType: service.resourcePoolType || '',
        resourceSpec: service.resourceSpec || {},
        networkType: service.networkType || '',
        publicAccess: service.publicAccess || false,
        queueName: service.queueName || '',
        creator: service.creator || '',
        hpa: service.hpa || {}
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

    // 清空当前服务
    clearCurrentService() {
      this.currentService = null
      this.detailError = null
    },

    // 清空缓存
    clearCache() {
      this.services = []
      this.currentService = null
      this.lastFetchTime = null
      this.error = null
      this.detailError = null
    }
  }
})