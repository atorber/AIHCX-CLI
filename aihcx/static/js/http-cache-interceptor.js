/**
 * HTTP缓存拦截器
 * 自动处理API请求的缓存逻辑
 */

(function() {
  'use strict';
  
  // 可缓存的API动作
  const CACHEABLE_ACTIONS = [
    'DescribeResourcePools',
    'DescribeDatasets', 
    'DescribeDatasetVersions',
    'DescribeDataset',
    'DescribeJobs',
    'DescribeJob',
    'DescribeModels',
    'DescribeQueues'
  ];
  
  // 不可缓存的API动作（实时性要求高）
  const NON_CACHEABLE_ACTIONS = [
    'CreateJob',
    'DeleteJob',
    'StopJob',
    'StartJob'
  ];
  
  // 检查是否应该缓存
  function shouldCache(action, method) {
    // 只缓存GET请求
    if (method && method.toLowerCase() !== 'get') {
      return false;
    }
    
    // 检查是否在可缓存列表中
    return CACHEABLE_ACTIONS.includes(action);
  }
  
  // 检查是否应该跳过缓存
  function shouldSkipCache(action, params) {
    // 检查是否有强制刷新参数
    if (params && (params.forceRefresh === true || params._refresh === true)) {
      return true;
    }
    
    // 检查是否在不可缓存列表中
    return NON_CACHEABLE_ACTIONS.includes(action);
  }
  
  // 请求拦截器
  function requestInterceptor(config) {
    // 正确解析URL中的查询参数
    let action = config.params?.action;
    const method = config.method;
    
    // 如果params中没有action，尝试从URL中解析
    if (!action && config.url) {
      try {
        const url = new URL(config.url, window.location.origin);
        action = url.searchParams.get('action');
        // 如果仍然没有action，尝试从完整URL中解析
        if (!action) {
          const urlParams = new URLSearchParams(url.search);
          action = urlParams.get('action');
        }
      } catch (e) {
        console.log('解析URL参数失败:', e);
      }
    }
    
    console.log('请求拦截器:', { action, method, params: config.params, url: config.url });
    
    // 检查是否应该缓存
    if (!shouldCache(action, method)) {
      console.log('不缓存此请求:', action);
      return config;
    }
    
    // 检查是否应该跳过缓存
    if (shouldSkipCache(action, config.params)) {
      console.log('跳过缓存:', action);
      return config;
    }
    
    // 尝试从缓存获取数据
    // 使用完整的URL作为缓存键的一部分，确保缓存命中检测的准确性
    const cacheKeyParams = { ...config.params };
    if (config.url && !cacheKeyParams.action) {
      cacheKeyParams.url = config.url;
    }
    
    const cached = window.cacheManager.get(action, cacheKeyParams);
    
    if (cached) {
      console.log('缓存命中:', action, cached);
      // 返回缓存数据，阻止实际请求
      return Promise.reject({
        isCached: true,
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config
      });
    } else {
      console.log('缓存未命中:', action);
    }
    
    return config;
  }
  
  // 响应拦截器
  function responseInterceptor(response) {
    // 正确解析响应配置中的参数
    let action = response.config.params?.action;
    const method = response.config.method;
    
    // 如果params中没有action，尝试从URL中解析
    if (!action && response.config.url) {
      try {
        const url = new URL(response.config.url, window.location.origin);
        action = url.searchParams.get('action');
        // 如果仍然没有action，尝试从完整URL中解析
        if (!action) {
          const urlParams = new URLSearchParams(url.search);
          action = urlParams.get('action');
        }
      } catch (e) {
        console.log('解析URL参数失败:', e);
      }
    }
    
    console.log('响应拦截器:', { action, method, status: response.status });
    
    // 检查是否应该缓存
    if (!shouldCache(action, method)) {
      console.log('不缓存此响应:', action);
      return response;
    }
    
    // 检查是否应该跳过缓存
    if (shouldSkipCache(action, response.config.params)) {
      console.log('跳过缓存响应:', action);
      return response;
    }
    
    // 只缓存成功的响应
    if (response.status === 200 && response.data && !response.data.error) {
      console.log('缓存响应数据:', action);
      // 使用完整的URL信息进行缓存，确保缓存键的唯一性
      const cacheKeyParams = { ...response.config.params };
      if (response.config.url && !cacheKeyParams.action) {
        cacheKeyParams.url = response.config.url;
      }
      window.cacheManager.set(action, cacheKeyParams, response.data);
    } else {
      console.log('不缓存响应:', action, '状态:', response.status, '错误:', response.data?.error);
    }
    
    return response;
  }
  
  // 错误拦截器
  function errorInterceptor(error) {
    // 处理缓存命中
    if (error.isCached) {
      console.log('返回缓存数据:', error.config?.params?.action);
      return Promise.resolve({
        data: error.data,
        status: error.status || 200,
        statusText: error.statusText || 'OK',
        headers: error.headers || {},
        config: error.config
      });
    }
    
    console.log('请求错误:', error.message);
    return Promise.reject(error);
  }
  
  // 等待axios加载完成后注册拦截器
  function registerInterceptors() {
    if (typeof axios !== 'undefined') {
      // 注册请求拦截器
      axios.interceptors.request.use(requestInterceptor, Promise.reject);
      
      // 注册响应拦截器
      axios.interceptors.response.use(responseInterceptor, errorInterceptor);
      
      console.log('HTTP缓存拦截器已注册');
    } else {
      // 如果axios还未加载，等待一段时间后重试
      setTimeout(registerInterceptors, 100);
    }
  }
  
  // 等待DOM加载完成后注册拦截器
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerInterceptors);
  } else {
    registerInterceptors();
  }
  
  // 暴露缓存控制接口
  window.cacheControl = {
    // 清除特定缓存
    clear: function(action, params) {
      window.cacheManager.clear(action, params);
    },
    
    // 清除所有缓存
    clearAll: function() {
      window.cacheManager.clearAll();
    },
    
    // 获取缓存统计信息
    getStats: function() {
      return window.cacheManager.getStats();
    }
  };
})();