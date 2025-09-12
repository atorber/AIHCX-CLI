import api from './api'

export default {
  // 获取资源池列表
  async getResourcePools(params) {
    try {
      const response = await api.get('', { params: { action: 'DescribeResourcePools', ...params } })
      return response.data
    } catch (error) {
      throw new Error(`获取资源池列表失败: ${error.message}`)
    }
  },

  // 获取资源池详情
  async getResourcePool(poolId) {
    try {
      const response = await api.get('', { params: { action: 'DescribeResourcePool', poolId } })
      return response.data
    } catch (error) {
      throw new Error(`获取资源池详情失败: ${error.message}`)
    }
  }
}