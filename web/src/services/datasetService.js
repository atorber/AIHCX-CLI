import api from './api'

export default {
  // 获取数据集列表
  async getDatasets(params) {
    try {
      const response = await api.get('', { params: { action: 'DescribeDatasets', ...params } })
      return response.data
    } catch (error) {
      throw new Error(`获取数据集列表失败: ${error.message}`)
    }
  },

  // 获取数据集详情
  async getDataset(datasetId) {
    try {
      const response = await api.get('', { params: { action: 'DescribeDataset', datasetId } })
      return response.data
    } catch (error) {
      throw new Error(`获取数据集详情失败: ${error.message}`)
    }
  },

  // 获取数据集版本列表
  async getDatasetVersions(datasetId, params) {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'DescribeDatasetVersions', 
          datasetId, 
          ...params 
        } 
      })
      return response.data
    } catch (error) {
      throw new Error(`获取数据集版本列表失败: ${error.message}`)
    }
  },

  // 获取数据集导入记录
  async getDatasetImports(datasetId, params) {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'DescribeDatasetImports', 
          datasetId, 
          ...params 
        } 
      })
      return response.data
    } catch (error) {
      throw new Error(`获取导入记录失败: ${error.message}`)
    }
  },

  // 获取数据集可用资源池
  async getDatasetResourcePools(datasetId, params) {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'DescribeDatasetResourcePools', 
          datasetId, 
          ...params 
        } 
      })
      return response.data
    } catch (error) {
      throw new Error(`获取资源池列表失败: ${error.message}`)
    }
  },

  // 获取资源池列表（用于导入表单）
  async getResourcePools(resourcePoolType, params) {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'DescribeResourcePools', 
          resourcePoolType, 
          ...params 
        } 
      })
      return response.data
    } catch (error) {
      throw new Error(`获取资源池列表失败: ${error.message}`)
    }
  },

  // 获取队列列表
  async getQueues(resourcePoolId, params) {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'DescribeQueues', 
          resourcePoolId, 
          ...params 
        } 
      })
      return response.data
    } catch (error) {
      throw new Error(`获取队列列表失败: ${error.message}`)
    }
  },

  // 创建导入任务
  async createImport(importData) {
    try {
      const response = await api.post('', {
        action: 'CreateImport',
        ...importData
      })
      return response.data
    } catch (error) {
      throw new Error(`创建导入任务失败: ${error.message}`)
    }
  }
}