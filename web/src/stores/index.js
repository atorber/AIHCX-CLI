import { createPinia } from 'pinia'

// 创建pinia实例
const pinia = createPinia()

export default pinia

// 导出所有store
export { useResourcePoolStore } from './resourcePoolStore'
export { useJobStore } from './jobStore'
export { useDatasetStore } from './datasetStore'
