import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../views/Welcome.vue'
import Config from '../views/Config.vue'
import Datasets from '../views/Datasets.vue'
import DatasetDetail from '../views/DatasetDetail.vue'
import Models from '../views/Models.vue'
import ResourcePools from '../views/ResourcePools.vue'
import ResourcePoolsTest from '../views/ResourcePoolsTest.vue'
import Jobs from '../views/Jobs.vue'
import JobDetail from '../views/JobDetail.vue'
import Services from '../views/Services.vue'
import ServiceDetail from '../views/ServiceDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome
  },
  {
    path: '/config',
    name: 'Config',
    component: Config
  },
  {
    path: '/datasets',
    name: 'Datasets',
    component: Datasets
  },
  {
    path: '/datasets/:id',
    name: 'DatasetDetail',
    component: DatasetDetail,
    props: true
  },
  {
    path: '/models',
    name: 'Models',
    component: Models
  },
  {
    path: '/resourcepools',
    name: 'ResourcePools',
    component: ResourcePools
  },
  {
    path: '/resourcepools-test',
    name: 'ResourcePoolsTest',
    component: ResourcePoolsTest
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: Jobs
  },
  {
    path: '/jobs/:id',
    name: 'JobDetail',
    component: JobDetail,
    props: true
  },
  {
    path: '/services',
    name: 'Services',
    component: Services
  },
  {
    path: '/services/:id',
    name: 'ServiceDetail',
    component: ServiceDetail,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router