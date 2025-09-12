import api from './api'

export default {
  // 获取模型列表
  async getModels(params) {
    try {
      const response = await api.get('', { params: { action: 'DescribeModels', ...params } })
      return response.data
    } catch (error) {
      throw new Error(`获取模型列表失败: ${error.message}`)
    }
  },

  // 获取模型详情
  async getModel(modelId) {
    try {
      const response = await api.get('', { params: { action: 'DescribeModel', modelId } })
      return response.data
    } catch (error) {
      throw new Error(`获取模型详情失败: ${error.message}`)
    }
  }
}