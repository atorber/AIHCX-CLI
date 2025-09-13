import { defineStore } from 'pinia'

export const useResourcePoolStore = defineStore('resourcePool', {
  state: () => ({
    // 资源池列表
    resourcePools: [],
    // 加载状态
    loading: false,
    error: null,
    // 缓存状态
    lastFetchTime: null,
    cacheExpiry: 5 * 60 * 1000, // 5分钟缓存
  }),

  getters: {
    // 获取所有资源池
    allResourcePools: (state) => state.resourcePools,
    
    // 获取自运维资源池
    commonPools: (state) => state.resourcePools.filter(pool => 
      pool.resourcePoolType === 'common' || pool.type === 'common'
    ),
    
    // 获取全托管资源池
    dedicatedPools: (state) => state.resourcePools.filter(pool => 
      pool.resourcePoolType === 'dedicatedV2' || pool.type === 'dedicatedV2'
    ),
    
    // 检查缓存是否有效
    isCacheValid: (state) => {
      if (!state.lastFetchTime) return false
      return Date.now() - state.lastFetchTime < state.cacheExpiry
    },
    
    // 获取资源池选项（用于下拉选择）
    poolOptions: (state) => state.resourcePools.map(pool => ({
      value: pool.resourcePoolId || pool.id,
      label: pool.name || pool.resourcePoolName,
      type: pool.resourcePoolType || pool.type
    }))
  },

  actions: {
    // 加载资源池列表
    async loadResourcePools(forceRefresh = false) {
      // 如果缓存有效且不强制刷新，直接返回
      if (this.isCacheValid && !forceRefresh) {
        console.log('使用缓存的资源池数据')
        return this.resourcePools
      }

      this.loading = true
      this.error = null

      try {
        console.log('开始加载资源池数据...')
        
        // 并行加载两种类型的资源池
        const [commonRes, dedicatedRes] = await Promise.all([
          // 加载自运维资源池
          fetch('/api?action=DescribeResourcePools&resourcePoolType=common&keywordType=resourcePoolName&keyword=&orderBy=createdAt&order=DESC&pageNumber=1&pageSize=100').then(r => r.json()),
          // 加载全托管资源池
          fetch('/api?action=DescribeResourcePools&resourcePoolType=dedicatedV2&keywordType=resourcePoolName&keyword=&orderBy=createdAt&order=DESC&pageNumber=1&pageSize=100').then(r => r.json())
        ])
        
        console.log('自运维资源池API响应:', commonRes)
        console.log('全托管资源池API响应:', dedicatedRes)
        
        // 检查API响应是否有错误
        if (commonRes.error) {
          throw new Error('自运维资源池API错误: ' + commonRes.error)
        }
        if (dedicatedRes.error) {
          throw new Error('全托管资源池API错误: ' + dedicatedRes.error)
        }
        
        // 处理资源池数据
        const processPools = (data, type) => {
          // 检查多种可能的数据结构
          let pools = [];
          
          if (data.resourcePools && Array.isArray(data.resourcePools)) {
            pools = data.resourcePools;
          } else if (data.result?.resourcePools && Array.isArray(data.result?.resourcePools)) {
            pools = data.result.resourcePools;
          } else if (data.result && Array.isArray(data.result)) {
            pools = data.result;
          } else if (Array.isArray(data)) {
            pools = data;
          }
          
          return pools.map(pool => {
            // 确保所有必要的字段都存在
            return {
              ...pool,
              resourcePoolType: type,
              resourcePoolId: pool.resourcePoolId || pool.id || pool.metadata?.id || '',
              id: pool.resourcePoolId || pool.id || pool.metadata?.id || '',
              name: pool.name || pool.resourcePoolName || pool.metadata?.name || '未知资源池',
              type: type
            };
          });
        }

        const commonPools = processPools(commonRes, 'common');
        const dedicatedPools = processPools(dedicatedRes, 'dedicatedV2');
        
        // 合并所有资源池
        this.resourcePools = [...commonPools, ...dedicatedPools];
        this.lastFetchTime = Date.now();
        
        console.log('资源池加载完成，总数:', this.resourcePools.length);
        console.log('自运维资源池数量:', commonPools.length);
        console.log('全托管资源池数量:', dedicatedPools.length);
        
        return this.resourcePools;
      } catch (error) {
        console.error('加载资源池失败:', error);
        this.error = '获取资源池列表失败: ' + error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 根据ID获取资源池
    getResourcePoolById(id) {
      return this.resourcePools.find(pool => 
        (pool.resourcePoolId || pool.id) === id
      )
    },

    // 清空缓存
    clearCache() {
      this.resourcePools = []
      this.lastFetchTime = null
      this.error = null
    },

    // 设置缓存过期时间
    setCacheExpiry(expiry) {
      this.cacheExpiry = expiry
    }
  }
})
