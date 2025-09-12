import api from './api'

export default {
  // 获取任务列表
  async getJobs(params) {
    try {
      const response = await api.post('', { params: { action: 'DescribeJobs'}, body: params })
      return response.data
    } catch (error) {
      throw new Error(`获取任务列表失败: ${error.message}`)
    }
  },

  // 获取任务详情
  async getJob(jobId) {
    try {
      const response = await api.post('', { params: { action: 'DescribeJob', jobId }, body: params })
      return response.data
    } catch (error) {
      throw new Error(`获取任务详情失败: ${error.message}`)
    }
  }
}