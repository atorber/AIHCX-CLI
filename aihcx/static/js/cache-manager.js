/**
 * AIHCX CLI 缓存管理器
 * 提供智能缓存功能，减少API请求，提高页面性能
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.config = {
      // 资源池列表 - 长期缓存
      DescribeResourcePools: {
        ttl: 30 * 60 * 1000, // 30分钟
        maxSize: 100,
        strategy: 'lru'
      },
      
      // 数据集列表 - 中期缓存
      DescribeDatasets: {
        ttl: 10 * 60 * 1000, // 10分钟
        maxSize: 500,
        strategy: 'lru'
      },
      
      // 数据集版本 - 短期缓存
      DescribeDatasetVersions: {
        ttl: 5 * 60 * 1000, // 5分钟
        maxSize: 1000,
        strategy: 'lru'
      },
      
      // 数据集详情 - 中期缓存
      DescribeDataset: {
        ttl: 10 * 60 * 1000, // 10分钟
        maxSize: 200,
        strategy: 'lru'
      },
      
      // 任务列表 - 短期缓存
      DescribeJobs: {
        ttl: 2 * 60 * 1000, // 2分钟
        maxSize: 200,
        strategy: 'lru'
      },
      
      // 任务详情 - 中期缓存
      DescribeJob: {
        ttl: 5 * 60 * 1000, // 5分钟
        maxSize: 50,
        strategy: 'lru'
      },
      
      // 模型列表 - 长期缓存
      DescribeModels: {
        ttl: 30 * 60 * 1000, // 30分钟
        maxSize: 100,
        strategy: 'lru'
      },
      
      // 队列列表 - 中期缓存
      DescribeQueues: {
        ttl: 10 * 60 * 1000, // 10分钟
        maxSize: 100,
        strategy: 'lru'
      }
    };
    
    this.watchers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // 从localStorage加载持久化缓存
    this.loadFromStorage();
    
    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
      // 定期保存到localStorage
      this.saveToStorage();
    }, 5 * 60 * 1000); // 每5分钟清理和保存一次
    
    // 页面关闭前保存缓存
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }
  
  /**
   * 生成缓存键
   * @param {string} action - API动作
   * @param {Object} params - 请求参数
   * @returns {string} 缓存键
   */
  generateKey(action, params = {}) {
    // 过滤掉不重要的参数
    const filteredParams = { ...params };
    delete filteredParams.timestamp;
    delete filteredParams._t;
    
    // 如果有URL参数，从中提取查询参数并合并到filteredParams中
    if (filteredParams.url) {
      try {
        const url = new URL(filteredParams.url, window.location.origin);
        const urlParams = new URLSearchParams(url.search);
        
        // 将URL查询参数合并到filteredParams中
        for (const [key, value] of urlParams.entries()) {
          if (key !== 'action') { // action已经作为键的一部分
            filteredParams[key] = value;
          }
        }
        
        // 删除URL参数，避免影响缓存键的生成
        delete filteredParams.url;
      } catch (e) {
        console.log('解析URL参数失败:', e);
      }
    }
    
    // 排序参数确保键的一致性
    const sortedParams = Object.keys(filteredParams)
      .sort()
      .reduce((result, key) => {
        if (filteredParams[key] !== undefined && filteredParams[key] !== null) {
          result[key] = filteredParams[key];
        }
        return result;
      }, {});
    
    return `${action}:${JSON.stringify(sortedParams)}`;
  }
  
  /**
   * 获取缓存数据
   * @param {string} action - API动作
   * @param {Object} params - 请求参数
   * @returns {*} 缓存数据或null
   */
  get(action, params = {}) {
    const key = this.generateKey(action, params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }
    
    this.stats.hits++;
    return cached.data;
  }
  
  /**
   * 设置缓存数据
   * @param {string} action - API动作
   * @param {Object} params - 请求参数
   * @param {*} data - 要缓存的数据
   */
  set(action, params = {}, data) {
    const key = this.generateKey(action, params);
    const config = this.config[action] || { ttl: 5 * 60 * 1000, maxSize: 100 };
    
    // 检查缓存大小限制
    if (this.cache.size >= config.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      accessCount: 0
    });
    
    this.stats.sets++;
    
    // 通知监听器
    this.notifyChange(action, params);
  }
  
  /**
   * 清除特定缓存
   * @param {string} action - API动作
   * @param {Object} params - 请求参数
   */
  clear(action, params = {}) {
    if (action) {
      const key = this.generateKey(action, params);
      const existed = this.cache.has(key);
      this.cache.delete(key);
      if (existed) {
        this.stats.deletes++;
      }
    } else {
      const size = this.cache.size;
      this.cache.clear();
      this.stats.deletes += size;
    }
  }
  
  /**
   * 清除所有缓存
   */
  clearAll() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    // 同时清除localStorage中的缓存
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cacheManager:')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
  
  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`缓存清理完成，清理了 ${cleaned} 个过期项`);
    }
  }
  
  /**
   * LRU淘汰策略
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      sets: this.stats.sets,
      deletes: this.stats.deletes
    };
  }
  
  /**
   * 从localStorage加载缓存
   */
  loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cacheManager:')) {
          const cacheKey = key.substring('cacheManager:'.length);
          const cached = JSON.parse(localStorage.getItem(key));
          
          // 检查是否过期
          if (Date.now() - cached.timestamp < cached.ttl) {
            this.cache.set(cacheKey, cached);
          } else {
            // 删除过期的缓存项
            localStorage.removeItem(key);
          }
        }
      });
      console.log('缓存管理器: 从localStorage加载了', this.cache.size, '个缓存项');
    } catch (e) {
      console.log('缓存管理器: 从localStorage加载缓存失败', e);
    }
  }
  
  /**
   * 保存缓存到localStorage
   */
  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      // 清理过期缓存
      this.cleanup();
      
      // 保存缓存到localStorage
      for (const [key, value] of this.cache.entries()) {
        // 只保存有ttl配置的缓存项
        const action = key.split(':')[0];
        if (this.config[action]) {
          localStorage.setItem(`cacheManager:${key}`, JSON.stringify(value));
        }
      }
      console.log('缓存管理器: 已保存', this.cache.size, '个缓存项到localStorage');
    } catch (e) {
      console.log('缓存管理器: 保存缓存到localStorage失败', e);
    }
  }
  
  /**
   * 通知监听器
   * @param {string} action - API动作
   * @param {Object} params - 请求参数
   */
  notifyChange(action, params) {
    const key = this.generateKey(action, params);
    const watchers = this.watchers.get(key) || [];
    watchers.forEach(callback => {
      try {
        callback(action, params);
      } catch (e) {
        console.error('缓存监听器回调执行失败:', e);
      }
    });
  }
  
  /**
   * 添加监听器
   * @param {string} action - API动作
   * @param {Object} params - 请求参数
   * @param {Function} callback - 回调函数
   */
  addWatcher(action, params, callback) {
    const key = this.generateKey(action, params);
    if (!this.watchers.has(key)) {
      this.watchers.set(key, []);
    }
    this.watchers.get(key).push(callback);
  }
  
  /**
   * 移除监听器
   * @param {string} action - API动作
   * @param {Object} params - 请求参数
   * @param {Function} callback - 回调函数
   */
  removeWatcher(action, params, callback) {
    const key = this.generateKey(action, params);
    const watchers = this.watchers.get(key) || [];
    const index = watchers.indexOf(callback);
    if (index > -1) {
      watchers.splice(index, 1);
    }
  }
}

// 初始化全局缓存管理器
if (typeof window !== 'undefined' && !window.cacheManager) {
  window.cacheManager = new CacheManager();
  console.log('缓存管理器已初始化');
}