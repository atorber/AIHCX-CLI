import api from './api'

export default {
  // 获取在线服务列表
  async getServices(params) {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'DescribeServices'
        },
        body: params || {}
      })
      return response.data
    } catch (error) {
      throw new Error(`获取在线服务列表失败: ${error.message}`)
    }
  },

  // 获取在线服务详情
  async getService(serviceId) {
    try {
      const response = await api.get('', { 
        params: { 
          action: 'DescribeService', 
          serviceId 
        },
        body: {}
      })
      return response.data
    } catch (error) {
      throw new Error(`获取在线服务详情失败: ${error.message}`)
    }
  }
}