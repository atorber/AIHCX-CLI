<template>
  <div class="container">
    <div class="header">
      <h1>📊 数据集详情</h1>
      <p>查看数据集详细信息</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <div class="action-bar">
            <router-link to="/datasets" class="btn-back">← 返回数据集列表</router-link>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i> 数据加载中...
          </div>

          <!-- 错误信息 -->
          <div v-if="error" class="error">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
          </div>
          
          <!-- 数据集基本信息 -->
          <div v-if="dataset && !loading" class="dataset-card">
            <div class="dataset-card-header">
              <h5>{{ dataset.name }}</h5>
            </div>
            <div class="dataset-card-body">
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <div class="info-label">数据集ID</div>
                    <div class="info-value">
                      {{ dataset.id }}
                      <button @click="copyDatasetId(dataset.id)" class="copy-btn">复制</button>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">创建时间</div>
                    <div class="info-value">{{ formatDate(dataset.createdAt) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">更新时间</div>
                    <div class="info-value">{{ formatDate(dataset.updatedAt) }}</div>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <div class="info-label">存储类型</div>
                    <div class="info-value">{{ dataset.storageType }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">可见范围</div>
                    <div class="info-value">{{ formatVisibility(dataset.visibilityScope) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">最新版本</div>
                    <div class="info-value">{{ dataset.latestVersion }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tab导航 -->
          <div class="nav-tabs" v-if="dataset && !loading">
            <div class="nav-tab" :class="{active: activeTab === 'basic'}" @click="switchTab('basic')">
              基本信息
            </div>
            <div class="nav-tab" :class="{active: activeTab === 'versions'}" @click="switchTab('versions')">
              版本列表
            </div>
            <div class="nav-tab" :class="{active: activeTab === 'imports'}" @click="switchTab('imports')">
              导入记录
            </div>
            <div class="nav-tab" :class="{active: activeTab === 'resourcePools'}" @click="switchTab('resourcePools')" v-if="isPfsDataset">
              可用资源池
            </div>
          </div>
          
          <!-- Tab内容 -->
          <div class="tab-content">
            <!-- 基本信息Tab -->
            <div v-show="activeTab === 'basic'" v-if="dataset && !loading">
              <!-- 资源池载入状态提示 -->
              <div v-if="!resourcePoolCacheLoaded" class="resource-pool-loading-info">
                <i class="fas fa-spinner fa-spin"></i>
                <span>{{ resourcePoolLoadingStatus }}</span>
              </div>

              <div class="dataset-card">
                <div class="dataset-card-body">
                  <h6>详细信息</h6>
                  <div class="info-grid">
                    <div>
                      <div class="info-item">
                        <div class="info-label">所有者</div>
                        <div class="info-value">{{ dataset.ownerName }} ({{ dataset.owner }})</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">导入格式</div>
                        <div class="info-value">{{ dataset.importFormat }}</div>
                      </div>
                    </div>
                    <div>
                      <div class="info-item">
                        <div class="info-label">存储实例</div>
                        <div class="info-value">{{ dataset.storageInstance }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 版本列表Tab -->
            <div v-show="activeTab === 'versions'">
              <div class="mt-3">
                <!-- 资源池载入状态提示 -->
                <div v-if="!resourcePoolCacheLoaded" class="resource-pool-loading-info">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>{{ resourcePoolLoadingStatus }}</span>
                </div>

                <!-- 版本列表加载状态 -->
                <div v-if="versionsLoading" class="loading">
                  <i class="fas fa-spinner fa-spin"></i> 版本列表加载中...
                </div>

                <!-- 版本列表错误信息 -->
                <div v-if="versionsError" class="error">
                  <i class="fas fa-exclamation-circle"></i> {{ versionsError }}
                </div>

                <!-- 版本列表 -->
                <div v-if="!versionsLoading && !versionsError && versions.length > 0">
                  <div class="table-container">
                    <table class="versions-table">
                      <thead>
                        <tr>
                          <th>版本</th>
                          <th>创建时间</th>
                          <th>创建者</th>
                          <th>存储路径</th>
                          <th>挂载路径</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="version in versions" :key="version.id">
                          <td>{{ version.version }}</td>
                          <td>{{ formatDate(version.createdAt) }}</td>
                          <td>{{ version.createUserName }}</td>
                          <td>{{ version.storagePath }}</td>
                          <td>{{ version.mountPath }}</td>
                          <td>
                            <button @click="showImportDrawer(version)" class="btn-primary"
                              :disabled="!resourcePoolCacheLoaded"
                              :title="resourcePoolCacheLoaded ? '导入数据' : '资源池缓存加载中，请稍候...'">
                              导入数据
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 分页 -->
                  <div class="pagination">
                    <button @click="prevPage" :disabled="currentPage === 1">
                      <i class="fas fa-chevron-left"></i> 上一页
                    </button>
                    <span class="pagination-info">
                      第 {{ currentPage }} 页，共 {{ totalPages }} 页
                    </span>
                    <button @click="nextPage" :disabled="currentPage === totalPages">
                      下一页 <i class="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>

                <!-- 无版本数据 -->
                <div v-if="!versionsLoading && !versionsError && versions.length === 0" class="loading">
                  暂无版本数据
                </div>
              </div>
            </div>
            
            <!-- 导入记录Tab -->
            <div v-show="activeTab === 'imports'">
              <div class="mt-3">
                <!-- 资源池载入状态提示 -->
                <div v-if="!resourcePoolCacheLoaded" class="resource-pool-loading-info">
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>{{ resourcePoolLoadingStatus }}</span>
                </div>

                <!-- 导入记录加载状态 -->
                <div v-if="importsLoading" class="loading">
                  <i class="fas fa-spinner fa-spin"></i> 导入记录加载中...
                </div>

                <!-- 导入记录错误信息 -->
                <div v-if="importsError" class="error">
                  <i class="fas fa-exclamation-circle"></i> {{ importsError }}
                </div>

                <!-- 导入记录列表 -->
                <div v-if="resourcePoolCacheLoaded && !importsLoading && !importsError && imports.length > 0">
                  <div class="table-container">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>任务名称</th>
                          <th>状态</th>
                          <th>创建时间</th>
                          <th>完成时间</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="importJob in imports" :key="importJob.jobId">
                          <td>
                            <span class="job-name">{{ importJob.name }}</span>
                            <br>
                            <span class="job-id">{{ importJob.jobId }}</span>
                          </td>
                          <td>
                            <span class="status" :class="statusClass(importJob.status)">
                              {{ statusText(importJob.status) }}
                            </span>
                          </td>
                          <td>{{ formatDate(importJob.createdAt) }}</td>
                          <td>{{ formatDate(importJob.finishedAt) }}</td>
                          <td>
                            <button class="btn-primary" @click="viewImportJob(importJob)">
                              查看详情
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 空状态 -->
                <div v-if="resourcePoolCacheLoaded && !importsLoading && !importsError && imports.length === 0" class="empty-state">
                  <i class="fas fa-inbox"></i>
                  <p>暂无导入记录</p>
                </div>
              </div>
            </div>
            
            <!-- 可用资源池Tab -->
            <div v-show="activeTab === 'resourcePools'" v-if="isPfsDataset">
              <div class="mt-3">
                <!-- 资源池错误信息 -->
                <div v-if="resourcePoolError" class="error">
                  <i class="fas fa-exclamation-circle"></i> {{ resourcePoolError }}
                </div>

                <!-- 可用资源池列表 -->
                <div v-if="!resourcePoolError">
                  <div class="resource-pool-section">
                    <h4 class="section-title">
                      <i class="fas fa-server"></i> 可用资源池
                      <span class="count-badge">{{ availableResourcePools.length }}</span>
                    </h4>
                    <div v-if="availableResourcePools.length > 0" class="resource-pool-grid">
                      <div v-for="pool in availableResourcePools" :key="pool.resourcePoolId" class="resource-pool-card">
                        <div class="resource-pool-header">
                          <h5 class="resource-pool-name">{{ pool.name || pool.metadata?.name || pool.resourcePoolId }}</h5>
                          <span class="resource-pool-type" :class="pool.resourcePoolType === 'dedicatedV2' ? 'dedicated' : ''">
                            {{ pool.resourcePoolType === 'dedicatedV2' ? '全托管' : '自运维' }}
                          </span>
                        </div>
                        <div class="resource-pool-info">
                          <div class="info-item">
                            <span class="label">资源池ID:</span>
                            <span class="value">{{ pool.resourcePoolId }}</span>
                          </div>
                          <div class="info-item" v-if="pool.description">
                            <span class="label">描述:</span>
                            <span class="value">{{ pool.description }}</span>
                          </div>
                          <div class="info-item" v-if="pool.bindingStorages && pool.bindingStorages.length > 0">
                            <span class="label">绑定存储:</span>
                            <span class="value">
                              <span v-for="storage in pool.bindingStorages" :key="storage.id" class="storage-tag">
                                {{ storage.id }}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="empty-state">
                      <i class="fas fa-info-circle"></i>
                      <span>暂无可用资源池</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 导入数据抽屉遮罩 -->
  <div class="drawer-overlay" :class="{ show: showImportDrawerFlag }" @click="closeImportDrawer"></div>
  
  <!-- 导入数据抽屉 -->
  <div class="drawer" :class="{ show: showImportDrawerFlag }">
    <div class="drawer-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h4>导入数据</h4>
          <p class="drawer-description">将数据导入到当前数据集,后续可以在百舸负载中挂载使用</p>
        </div>
        <button class="drawer-close" @click="closeImportDrawer" style="margin-left: 20px; flex-shrink: 0;">&times;</button>
      </div>
    </div>

    <div class="drawer-content">
      <!-- 目标数据集信息 -->
      <div class="target-dataset-summary">
        <div class="summary-item">
          <span class="summary-label">目标数据集:</span>
          <span class="summary-value">{{ dataset ? dataset.name : '加载中...' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">版本:</span>
          <span class="summary-value">{{ getTargetDatasetVersion() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">存储:</span>
          <span class="summary-value">{{ getTargetStorageInfo() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">存储路径:</span>
          <span class="summary-value">{{ getTargetStoragePath() }}</span>
        </div>
      </div>

      <form @submit.prevent="submitImportForm">
        <!-- 导入方式选择 -->
        <div class="form-group">
          <label class="form-label">导入方式</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="importMethod" value="existing" name="importMethod">
              <span class="radio-label">已有数据集</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="importMethod" value="object" name="importMethod">
              <span class="radio-label">对象存储</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="importMethod" value="huggingface" name="importMethod">
              <span class="radio-label">HuggingFace</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="importMethod" value="modelscope" name="importMethod">
              <span class="radio-label">ModelScope</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="importMethod" value="custom" name="importMethod">
              <span class="radio-label">自定义下载</span>
            </label>
            <label class="radio-item" v-if="canShowToolUpload">
              <input type="radio" v-model="importMethod" value="tool" name="importMethod">
              <span class="radio-label">工具上传</span>
            </label>
          </div>
        </div>

        <!-- 对象存储配置 -->
        <div v-if="importMethod === 'object'" class="form-group">
          <label class="form-label required">接入点</label>
          <input type="text" v-model="formData.objectStorageEndpoint" class="form-control" placeholder="请输入对象存储接入点">
        </div>

        <div v-if="importMethod === 'object'" class="form-group">
          <label class="form-label required">Access Key</label>
          <input type="text" v-model="formData.objectStorageAccessKey" class="form-control" placeholder="请输入Access Key">
        </div>

        <div v-if="importMethod === 'object'" class="form-group">
          <label class="form-label required">Secret Key</label>
          <input type="password" v-model="formData.objectStorageSecretKey" class="form-control" placeholder="请输入Secret Key">
        </div>

        <div v-if="importMethod === 'object'" class="form-group">
          <label class="form-label required">存储桶</label>
          <input type="text" v-model="formData.objectStorageBucket" class="form-control" placeholder="请输入存储桶名称">
        </div>

        <div v-if="importMethod === 'object'" class="form-group">
          <label class="form-label">路径</label>
          <input type="text" v-model="formData.objectStoragePath" class="form-control" placeholder="请输入存储路径（可选），如：data/datasets/">
          <p class="form-hint">指定要下载的存储桶内路径，留空则下载整个存储桶</p>
        </div>

        <!-- HuggingFace配置 -->
        <div v-if="importMethod === 'huggingface'" class="form-group">
          <label class="form-label required">数据类型</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="formData.huggingfaceDataType" value="dataset" name="huggingfaceDataType">
              <span class="radio-label">数据集</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="formData.huggingfaceDataType" value="model" name="huggingfaceDataType">
              <span class="radio-label">模型</span>
            </label>
          </div>
        </div>

        <div v-if="importMethod === 'huggingface'" class="form-group">
          <label class="form-label required">名称</label>
          <input type="text" v-model="formData.huggingfaceName" class="form-control" placeholder="请输入HuggingFace数据集/模型名称，如：microsoft/DialoGPT-medium">
          <p class="form-hint">请输入完整的HuggingFace数据集或模型名称，格式通常为：组织名/模型名</p>
        </div>

        <div v-if="importMethod === 'huggingface'" class="form-group">
          <label class="form-label">Access Token</label>
          <input type="password" v-model="formData.huggingfaceAccessToken" class="form-control" placeholder="请输入HuggingFace Access Token（可选）">
          <p class="form-hint">Access Token用于访问私有数据集，公开数据集可不填写</p>
        </div>

        <!-- ModelScope配置 -->
        <div v-if="importMethod === 'modelscope'" class="form-group">
          <label class="form-label required">数据类型</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model="formData.modelscopeDataType" value="dataset" name="modelscopeDataType">
              <span class="radio-label">数据集</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="formData.modelscopeDataType" value="model" name="modelscopeDataType">
              <span class="radio-label">模型</span>
            </label>
          </div>
        </div>

        <div v-if="importMethod === 'modelscope'" class="form-group">
          <label class="form-label required">名称</label>
          <input type="text" v-model="formData.modelscopeName" class="form-control" placeholder="请输入ModelScope数据集/模型名称，如：damo/nlp_structbert_sentiment-classification_chinese-base">
          <p class="form-hint">请输入完整的ModelScope数据集或模型名称，格式通常为：组织名/模型名</p>
        </div>

        <div v-if="importMethod === 'modelscope'" class="form-group">
          <label class="form-label">Access Token</label>
          <input type="password" v-model="formData.modelscopeAccessToken" class="form-control" placeholder="请输入ModelScope Access Token（可选）">
          <p class="form-hint">Access Token用于访问私有数据集或模型，公开资源可不填写</p>
        </div>

        <!-- 自定义下载配置 -->
        <div v-if="importMethod === 'custom'" class="form-group">
          <label class="form-label required">镜像地址</label>
          <input type="text" v-model="formData.customDownloadImageUrl" class="form-control" placeholder="请输入Docker镜像地址，如：registry.baidubce.com/public/pytorch:1.12.0-cuda11.3-cudnn8-devel">
        </div>

        <div v-if="importMethod === 'custom'" class="form-group">
          <label class="form-label required">启动命令</label>
          <textarea v-model="formData.customDownloadStartCommand" class="form-control" rows="4" placeholder="请输入启动命令，如：pip install datasets && python download_data.py"></textarea>
          <p class="form-hint">支持多行命令，每行一个命令；目标数据集挂载路径为/mnt/target，也可以使用环境变量$TARGET_PATH</p>
        </div>

        <!-- 工具上传配置 -->
        <div v-if="importMethod === 'tool'" class="form-group">
          <label class="form-label">命令行工具上传</label>
          <div class="single-command-container">
            <div class="command-header">
              <span class="command-label">上传命令</span>
              <button type="button" @click="copyStepCommand(commandSteps[0].command)" class="btn-copy-simple" title="复制命令">
                复制
              </button>
            </div>
            <div class="command-body">
              <code class="single-command">{{ commandSteps[0] && commandSteps[0].command }}</code>
            </div>
          </div>
          <div class="command-hint">
            <div class="install-guide">
              <h4>📋 使用前准备</h4>
              <p>1. 安装和配置bcecmd工具，详见 <a href="https://cloud.baidu.com/doc/BOS/s/qjwvyqegc" target="_blank" class="doc-link">安装BOSCMD工具官方文档</a></p>
              <p>2. 确保已完成bcecmd的认证配置（运行 <code>bcecmd -c</code> 进行配置）</p>
            </div>
            <div class="upload-guide">
              <h4>🚀 数据上传</h4>
              <p>请将上方命令中的 <code>&lt;local_dir&gt;</code> 替换为您的本地数据目录路径，然后执行命令进行数据同步。</p>
            </div>
          </div>
        </div>

        <!-- 工具上传时显示提示信息 -->
        <div v-if="importMethod === 'tool'" class="form-group">
          <div class="info-box">
            <div class="info-icon">ℹ️</div>
            <div class="info-content">
              <h4>工具上传说明</h4>
              <p>工具上传方式使用本地命令行工具进行数据上传，无需选择资源池和队列等配置项。</p>
              <p>请使用下方生成的命令行在本地执行数据上传操作。</p>
            </div>
          </div>
        </div>

        <!-- 源数据集配置 -->
        <div v-if="importMethod === 'existing'" class="form-group">
          <label class="form-label required">
            源数据集
            <span class="count-badge" :class="{ 'zero-count': filteredDatasets.length === 0 }">
              ({{ filteredDatasets.length }})
            </span>
          </label>
          <div class="dataset-selection-row">
            <div class="dataset-filter-group">
              <select v-model="datasetTypeFilter" @change="onDatasetTypeFilterChange" class="form-control filter-select">
                <option value="all">全部</option>
                <option value="BOS">BOS类型</option>
                <option value="PFS">PFS类型</option>
              </select>
            </div>
            <div class="dataset-group">
              <select v-model="formData.sourceDataset" @change="onSourceDatasetChange" class="form-control">
                <option value="">请选择源数据集</option>
                <option v-for="dataset in filteredDatasets" :key="dataset.id" :value="dataset.id">
                  {{ getDatasetDisplayText(dataset) }}
                </option>
              </select>
              <button type="button" @click="refreshDatasets" class="btn-refresh" title="刷新数据集列表" :disabled="loading">
                <span>🔄</span>
              </button>
            </div>
            <!-- 数据集列表错误信息 -->
            <div v-if="availableDatasetsError" class="error">
              <i class="fas fa-exclamation-circle"></i> {{ availableDatasetsError }}
            </div>
          </div>
        </div>

        <!-- 数据版本选择 -->
        <div v-if="importMethod === 'existing'" class="form-group">
          <label class="form-label required">
            数据版本
            <span class="count-badge" :class="{ 'zero-count': datasetVersions.length === 0 }">
              {{ datasetVersions.length }}
            </span>
          </label>
          <div class="version-group">
            <select v-model="formData.datasetVersion" @change="onDatasetVersionChange" class="form-control">
              <option value="">请选择数据版本</option>
              <option v-for="version in filteredVersions" :key="version.id" :value="version.id">
                {{ getVersionDisplayText(version) }}
              </option>
            </select>
            <button type="button" @click="refreshDatasetVersions" class="btn-refresh" title="刷新数据版本列表" :disabled="!formData.sourceDataset">
              <span>🔄</span>
            </button>
          </div>
        </div>

        <!-- 其他配置项 -->
        <div v-if="importMethod !== 'tool'">
          <!-- 清空数据选项 -->
          <div v-if="importMethod !== 'custom'" class="form-group">
            <div class="toggle-group">
              <label class="toggle-label">
                <input type="checkbox" v-model="formData.cleanData" @change="onCleanDataChange" class="toggle-input">
                <span class="toggle-slider"></span>
                清空数据
              </label>
              <p class="toggle-description">开启清空数据会在导入开始时先删除当前数据集目录下所有文件</p>
            </div>
          </div>

          <!-- 同名保留策略 -->
          <div v-if="importMethod !== 'custom'" class="form-group" :class="{ 'disabled-group': formData.cleanData }">
            <label class="form-label" :class="{ 'required': !formData.cleanData }">同名保留策略</label>
            <div class="radio-group" :class="{ 'disabled': formData.cleanData }">
              <label class="radio-item">
                <input type="radio" value="target" v-model="formData.nameStrategy" name="nameStrategy" :disabled="formData.cleanData">
                <span class="radio-label">保留目的文件</span>
              </label>
              <label class="radio-item">
                <input type="radio" value="source" v-model="formData.nameStrategy" name="nameStrategy" :disabled="formData.cleanData">
                <span class="radio-label">保留源文件</span>
              </label>
            </div>
            <p v-if="formData.cleanData" class="disabled-hint">清空数据时无需选择同名保留策略</p>
          </div>

          <!-- 资源池配置 -->
          <div class="form-group">
            <label class="form-label required">
              资源池
              <span class="count-badge" :class="{ 'zero-count': filteredResourcePools.length === 0 }">
                ({{ filteredResourcePools.length }})
              </span>
            </label>
            <div class="resource-pool-selection-row">
              <div class="resource-pool-type-group">
                <select v-model="formData.resourcePoolType" @change="onResourcePoolTypeChange" class="form-control filter-select">
                  <option value="">请选择类型</option>
                  <option value="common">自运维</option>
                  <option value="dedicatedV2">全托管</option>
                </select>
              </div>
              <div class="resource-pool-group">
                <select v-model="formData.resourcePool" @change="onResourcePoolChange" class="form-control" :disabled="!formData.resourcePoolType">
                  <option value="">请选择资源池</option>
                  <option v-for="pool in filteredResourcePools" :key="pool.resourcePoolId || pool.metadata?.id" :value="pool.resourcePoolId || pool.metadata?.id">
                    {{ pool.name || pool.metadata?.name }}
                  </option>
                </select>
                <button type="button" @click="refreshResourcePools" class="btn-refresh" title="刷新资源池列表" :disabled="!formData.resourcePoolType">
                  <span>🔄</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 队列 -->
          <div class="form-group">
            <label class="form-label required">
              队列
              <span class="count-badge" :class="{ 'zero-count': filteredQueues.length === 0 }">
                {{ filteredQueues.length }}
              </span>
            </label>
            <div class="queue-group">
              <select v-model="formData.queue" class="form-control" :disabled="!formData.resourcePool">
                <option value="">请选择队列</option>
                <option v-for="queue in filteredQueues" :key="queue.queueId" :value="queue.queueName">
                  {{ getQueueDisplayText(queue) }}
                </option>
              </select>
              <button type="button" @click="refreshQueues" class="btn-refresh" title="刷新队列列表" :disabled="!formData.resourcePool">
                <span>🔄</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- 表单操作区域 -->
    <div class="form-actions">
      <div class="transfer-summary">
        <span v-if="checkSourceTargetSame()" class="warning-message">
          ⚠️ 源数据集版本和目标数据集版本的存储实例和路径不能完全相同
        </span>
        <span v-else-if="getSourcePath()">
          从 <span class="source-path">{{ getSourcePath() }}</span> 转储到 <span class="target-path">{{ getTargetPath() }}</span>
        </span>
        <span v-else-if="importMethod === 'existing'" class="empty-hint">
          请选择源数据集和版本
        </span>
      </div>
      <div class="action-buttons">
        <button type="button" class="btn btn-secondary" @click="closeImportDrawer">取消</button>
        <button type="button" class="btn btn-primary" @click="submitImportForm" :disabled="!canSubmitImport" :title="getImportButtonDisabledReason || '确定导入数据'">
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'
import datasetService from '../services/datasetService'

export default {
  name: 'DatasetDetail',
  components: {
    Navigation
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      dataset: {},
      loading: false,
      error: null,
      activeTab: 'basic',
      
      // 版本列表相关
      versions: [],
      versionsLoading: false,
      versionsError: null,
      versionPage: 1,
      versionPageSize: 10,
      versionTotalCount: 0,
      
      // 导入记录相关
      imports: [],
      importsLoading: false,
      importsError: null,
      
      // 资源池相关
      resourcePools: [],
      resourcePoolsLoading: false,
      resourcePoolsError: null,
      
      // 导入数据相关
      importMethod: 'existing',
      showImportDrawerFlag: false,
      availableDatasets: [],
      availableDatasetsError: null, // 数据集列表加载错误
      datasetVersions: [],
      resourcePools: [],
      queues: [],
      datasetTypeFilter: 'all', // 数据集类型筛选
      
      // 表单数据
      formData: {
        sourceDataset: '',
        datasetVersion: '',
        cleanData: false,
        nameStrategy: 'target',
        resourcePoolType: '',
        resourcePool: '',
        queue: '',
        // 对象存储配置
        objectStorageEndpoint: '',
        objectStorageAccessKey: '',
        objectStorageSecretKey: '',
        objectStorageBucket: '',
        objectStoragePath: '',
        // HuggingFace配置
        huggingfaceDataType: 'dataset',
        huggingfaceName: '',
        huggingfaceAccessToken: '',
        // ModelScope配置
        modelscopeDataType: 'dataset',
        modelscopeName: '',
        modelscopeAccessToken: '',
        // 自定义下载配置
        customDownloadImageUrl: '',
        customDownloadStartCommand: ''
      },
      // 命令行步骤（用于工具上传）
      commandSteps: [
        {
          command: 'bcecmd sync <local_dir> bos://your-bucket/dataset-path/ --recursive'
        }
      ]
    }
  },
  computed: {
    // 是否为PFS数据集
    isPfsDataset() {
      return this.dataset && this.dataset.storageType === 'PFS'
    },
    
    // 资源池缓存是否已加载
    resourcePoolCacheLoaded() {
      return true // 简化处理，实际项目中应该有真实的缓存状态
    },
    
    // 资源池加载状态文本
    resourcePoolLoadingStatus() {
      return '资源池缓存加载中...'
    },
    
    // 可用资源池列表
    availableResourcePools() {
      return this.resourcePools || []
    },
    
    // 资源池错误
    resourcePoolError() {
      return this.resourcePoolsError
    },
    
    // 当前页码（用于版本分页）
    currentPage() {
      return this.versionPage
    },
    
    // 总页数（用于版本分页）
    totalPages() {
      return Math.ceil(this.versionTotalCount / this.versionPageSize)
    },
    
    // 是否可以显示工具上传选项
    canShowToolUpload() {
      return true // 简化处理
    },
    
    versionTotalPages() {
      return Math.ceil(this.versionTotalCount / this.versionPageSize)
    },
    filteredDatasets() {
      if (!this.availableDatasets || this.availableDatasets.length === 0) {
        return []
      }

      // 根据类型筛选数据集
      if (this.datasetTypeFilter === 'all') {
        return this.availableDatasets
      }

      return this.availableDatasets.filter(dataset => {
        const storageType = dataset.storageType || dataset.storage_type
        return storageType === this.datasetTypeFilter
      })
    },
    filteredVersions() {
      return this.datasetVersions || []
    },
    filteredResourcePools() {
      return this.resourcePools || []
    },
    filteredQueues() {
      return this.queues || []
    },
    canSubmitImport() {
      if (this.importMethod === 'existing') {
        return this.formData.sourceDataset && this.formData.datasetVersion && 
               this.formData.resourcePoolType && this.formData.resourcePool && this.formData.queue
      }
      return this.formData.resourcePoolType && this.formData.resourcePool && this.formData.queue
    },
    getImportButtonDisabledReason() {
      if (this.importMethod === 'existing') {
        if (!this.formData.sourceDataset) return '请选择源数据集'
        if (!this.formData.datasetVersion) return '请选择数据版本'
      }
      if (!this.formData.resourcePoolType) return '请选择资源池类型'
      if (!this.formData.resourcePool) return '请选择资源池'
      if (!this.formData.queue) return '请选择队列'
      return null
    }
  },
  methods: {
    async loadDataset() {
      this.loading = true
      this.error = null
      
      try {
        const data = await datasetService.getDataset(this.id)
        
        if (data.error) {
          this.error = data.error
          return
        }
        
        // 数据可能在不同的层级，按优先级尝试获取
        this.dataset = data.dataset || data.Dataset || data || {}
      } catch (err) {
        console.error('获取数据集详情失败:', err)
        this.error = '获取数据集详情失败: ' + err.message
      } finally {
        this.loading = false
      }
    },
    
    async loadVersions() {
      this.versionsLoading = true
      this.versionsError = null
      
      try {
        const params = {
          pageNumber: this.versionPage,
          pageSize: this.versionPageSize
        }
        
        const data = await datasetService.getDatasetVersions(this.id, params)
        
        if (data.error) {
          this.versionsError = data.error
          return
        }
        
        this.versions = data.versions || data.Versions || []
        this.versionTotalCount = data.totalCount || data.TotalCount || this.versions.length
      } catch (err) {
        console.error('获取版本列表失败:', err)
        this.versionsError = '获取版本列表失败: ' + err.message
      } finally {
        this.versionsLoading = false
      }
    },
    
    switchTab(tab) {
      this.activeTab = tab
      if (tab === 'versions' && this.versions.length === 0) {
        this.loadVersions()
      } else if (tab === 'imports' && this.imports.length === 0) {
        this.loadImports()
      } else if (tab === 'resourcepools' && this.resourcePools.length === 0) {
        this.loadResourcePools()
      }
    },
    
    prevVersionPage() {
      if (this.versionPage > 1) {
        this.versionPage--
        this.loadVersions()
      }
    },
    
    nextVersionPage() {
      if (this.versionPage < this.versionTotalPages) {
        this.versionPage++
        this.loadVersions()
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      try {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN')
      } catch (e) {
        return dateStr
      }
    },
    
    formatVisibility(visibilityScope) {
      if (!visibilityScope) return 'N/A'
      const visibilityMap = {
        'ALL_PEOPLE': '所有人可见',
        'USER_GROUP': '用户组可见',
        'ONLY_OWNER': '仅所有者可见'
      }
      return visibilityMap[visibilityScope] || visibilityScope
    },
    
    // 导入记录相关方法
    async loadImports() {
      this.importsLoading = true
      this.importsError = null
      
      try {
        const data = await datasetService.getDatasetImports(this.id)
        
        if (data.error) {
          this.importsError = data.error
          return
        }
        
        this.imports = data.imports || data.Imports || []
      } catch (err) {
        console.error('获取导入记录失败:', err)
        this.importsError = '获取导入记录失败: ' + err.message
      } finally {
        this.importsLoading = false
      }
    },
    
    // 资源池相关方法
    async loadResourcePools() {
      this.resourcePoolsLoading = true
      this.resourcePoolsError = null
      
      try {
        const data = await datasetService.getDatasetResourcePools(this.id)
        
        if (data.error) {
          this.resourcePoolsError = data.error
          return
        }
        
        this.resourcePools = data.resourcePools || data.ResourcePools || []
      } catch (err) {
        console.error('获取资源池列表失败:', err)
        this.resourcePoolsError = '获取资源池列表失败: ' + err.message
      } finally {
        this.resourcePoolsLoading = false
      }
    },
    
    // 分页方法
    prevPage() {
      if (this.versionPage > 1) {
        this.versionPage--
        this.loadVersions()
      }
    },
    
    nextPage() {
      if (this.versionPage < this.totalPages) {
        this.versionPage++
        this.loadVersions()
      }
    },
    
    // 状态处理方法
    statusClass(status) {
      const statusMap = {
        'Running': 'running',
        'Succeeded': 'success',
        'Failed': 'failed',
        'Pending': 'pending'
      }
      return statusMap[status] || 'unknown'
    },
    
    statusText(status) {
      const statusMap = {
        'Running': '运行中',
        'Succeeded': '成功',
        'Failed': '失败',
        'Pending': '等待中'
      }
      return statusMap[status] || status
    },
    
    // 查看导入任务详情
    viewImportJob(importJob) {
      if (importJob.jobId) {
        const resourcePoolId = importJob.resourcePoolId || 'aihc-serverless'
        window.location.href = `/jobs/${importJob.jobId}?resourcePoolId=${resourcePoolId}&from=imports&datasetId=${this.id}`
      }
    },
    
    // 目标数据集信息方法
    getTargetDatasetVersion() {
      return this.dataset ? this.dataset.latestVersion || '1' : '加载中...'
    },
    
    getTargetStorageInfo() {
      if (!this.dataset) return '加载中...'
      return `${this.dataset.storageType || 'N/A'} (${this.dataset.storageInstance || 'N/A'})`
    },
    
    getTargetStoragePath() {
      return this.dataset ? (this.dataset.storagePath || '/') : '加载中...'
    },
    
    // 复制命令方法
    copyStepCommand(command) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(command).then(() => {
          this.showCopySuccess()
        })
      } else {
        this.fallbackCopy(command)
      }
    },
    
    // 资源池过滤提示
    getResourcePoolFilterHint() {
      if (!this.formData.sourceDataset) return null
      return '部分资源池可能不支持当前选择的数据集类型'
    },
    
    // 显示资源池详情
    showResourcePoolDetails() {
      console.log('显示资源池详情')
    },
    
    // 导入数据相关方法
    showImportDrawer() {
      this.showImportDrawerFlag = true
      document.body.style.overflow = 'hidden'
      this.loadAvailableDatasets()
    },
    
    closeImportDrawer() {
      this.showImportDrawerFlag = false
      document.body.style.overflow = ''
      this.resetImportForm()
    },
    
    resetImportForm() {
      this.formData = {
        sourceDataset: '',
        datasetVersion: '',
        cleanData: false,
        nameStrategy: 'target',
        resourcePoolType: 'common',
        resourcePool: '',
        queue: ''
      }
    },
    
    async loadAvailableDatasets() {
      try {
        this.availableDatasetsError = null
        console.log('开始加载数据集列表...')
        const data = await datasetService.getDatasets()
        console.log('数据集列表API响应:', data)
        this.availableDatasets = data.datasets || data.Datasets || []
        console.log('解析后的数据集列表:', this.availableDatasets)
      } catch (err) {
        console.error('获取数据集列表失败:', err)
        this.availableDatasetsError = '获取数据集列表失败: ' + err.message
        this.availableDatasets = []
      }
    },
    
    async loadDatasetVersions(datasetId) {
      if (!datasetId) {
        this.datasetVersions = []
        return
      }
      
      try {
        const data = await datasetService.getDatasetVersions(datasetId)
        this.datasetVersions = data.versions || data.Versions || []
      } catch (err) {
        console.error('获取数据集版本失败:', err)
        this.datasetVersions = []
      }
    },
    
    async loadResourcePoolsForImport() {
      if (!this.formData.resourcePoolType) {
        this.resourcePools = []
        return
      }
      
      try {
        const data = await datasetService.getResourcePools(this.formData.resourcePoolType)
        this.resourcePools = data.resourcePools || data.ResourcePools || []
      } catch (err) {
        console.error('获取资源池列表失败:', err)
        this.resourcePools = []
      }
    },
    
    async loadQueues() {
      if (!this.formData.resourcePool) {
        this.queues = []
        return
      }
      
      try {
        const data = await datasetService.getQueues(this.formData.resourcePool)
        this.queues = data.queues || data.Queues || []
      } catch (err) {
        console.error('获取队列列表失败:', err)
        this.queues = []
      }
    },
    
    // 事件处理方法
    onDatasetTypeFilterChange() {
      // 当筛选类型改变时，清空已选择的数据集和版本
      this.formData.sourceDataset = ''
      this.formData.datasetVersion = ''
      this.datasetVersions = []
      console.log('数据集类型筛选已更改为:', this.datasetTypeFilter)
    },
    
    onSourceDatasetChange() {
      this.formData.datasetVersion = ''
      this.datasetVersions = []
      if (this.formData.sourceDataset) {
        this.loadDatasetVersions(this.formData.sourceDataset)
      }
    },
    
    onDatasetVersionChange() {
      // 版本变化时的处理逻辑
    },
    
    onCleanDataChange() {
      if (this.formData.cleanData) {
        this.formData.nameStrategy = 'target'
      }
    },
    
    onResourcePoolTypeChange() {
      this.formData.resourcePool = ''
      this.formData.queue = ''
      this.resourcePools = []
      this.queues = []
      this.loadResourcePoolsForImport()
    },
    
    onResourcePoolChange() {
      this.formData.queue = ''
      this.queues = []
      this.loadQueues()
    },
    
    // 刷新方法
    async refreshDatasets() {
      await this.loadAvailableDatasets()
    },
    
    async refreshDatasetVersions() {
      if (this.formData.sourceDataset) {
        await this.loadDatasetVersions(this.formData.sourceDataset)
      }
    },
    
    async refreshResourcePools() {
      await this.loadResourcePoolsForImport()
    },
    
    async refreshQueues() {
      await this.loadQueues()
    },
    
    // 显示文本方法
    getDatasetDisplayText(dataset) {
      if (!dataset) return '';

      let displayText = `${dataset.name}`;

      // 添加存储类型信息
      const storageTypeText = dataset.storageType;
      displayText += ` [ ${dataset.id} / ${storageTypeText}:`;

      // 添加存储实例ID信息
      const storageInstanceId = dataset.storageInstanceId || dataset.storage_instance_id || dataset.storageInstance;
      if (storageInstanceId) {
        displayText += `${storageInstanceId}]`;
      }

      return displayText;
    },
    
    getVersionDisplayText(version) {
      if (!version) return '';

      let displayText = '';

      // 添加版本号
      if (version.version) {
        displayText += `v${version.version} [${version.id} | `;
      }

      // 添加存储路径信息
      // 如果路径太长，只显示最后一部分
      const path = version.storagePath;
      const shortPath = path && path.length > 25 ? '...' + path.slice(-22) : path;
      displayText += `${shortPath} -> `;

      const mountPath = version.mountPath;
      const shortMountPath = mountPath && mountPath.length > 25 ? '...' + mountPath.slice(-22) : mountPath;
      displayText += ` ${shortMountPath}]`;

      // 添加描述信息
      if (version.description) {
        displayText += ` - ${version.description}`;
      }

      return displayText;
    },
    
    getQueueDisplayText(queue) {
      if (!queue) return '';
      let displayText = queue.queueName + ' | ' + queue.queueId;

      // 添加队列类型信息
      displayText += ` (${queue.queueType})`;

      // 添加资源信息
      if (queue.capability) {
        const memoryGi = queue.capability.memoryGi;
        const cpuCores = queue.capability.milliCPUcores;
        if (memoryGi && cpuCores) {
          const memoryGB = Math.round(parseInt(memoryGi) / (1024 * 1024 * 1024));
          const cpuCoresNum = Math.round(parseInt(cpuCores) / 1000);
          displayText += ` - ${cpuCoresNum}核/${memoryGB}GB`;
        }
      }

      // 添加加速卡信息
      if (queue.capability?.acceleratorCardList?.length > 0) {
        const accelerator = queue.capability.acceleratorCardList[0];
        if (accelerator.acceleratorType && accelerator.acceleratorCount) {
          displayText += ` - ${accelerator.acceleratorCount}x${accelerator.acceleratorType}`;
        }
      }

      return displayText;
    },
    
    // 状态相关方法
    getStatusClass(status) {
      const statusMap = {
        'pending': 'status-pending',
        'running': 'status-running',
        'success': 'status-success',
        'error': 'status-error',
        'cancelled': 'status-cancelled',
        'unknown': 'status-unknown'
      }
      return statusMap[status] || 'status-unknown'
    },
    
    getStatusText(status) {
      const statusMap = {
        'pending': '等待中',
        'running': '运行中',
        'success': '成功',
        'error': '失败',
        'cancelled': '已取消',
        'unknown': '未知'
      }
      return statusMap[status] || status || '未知'
    },
    
    // 路径相关方法
    getSourcePath() {
      if (this.formData.sourceDataset && this.formData.datasetVersion) {
        const dataset = this.availableDatasets.find(d => d.id === this.formData.sourceDataset)
        const version = this.datasetVersions.find(v => v.id === this.formData.datasetVersion)
        if (dataset && version) {
          return `${dataset.storageInstance || 'N/A'}:${version.storagePath || 'N/A'}`
        }
      }
      return ''
    },
    
    getTargetPath() {
      return `${this.dataset.storageInstance || 'N/A'}:${this.dataset.storagePath || 'N/A'}`
    },
    
    checkSourceTargetSame() {
      const sourcePath = this.getSourcePath()
      const targetPath = this.getTargetPath()
      return sourcePath && targetPath && sourcePath === targetPath
    },
    
    // 导入表单提交
    async submitImportForm() {
      if (!this.canSubmitImport) return
      
      try {
        const importData = {
          datasetId: this.id,
          ...this.formData
        }
        
        const result = await datasetService.createImport(importData)
        
        if (result.error) {
          alert('导入失败: ' + result.error)
          return
        }
        
        alert('导入任务已创建成功！')
        this.closeImportDrawer()
        this.loadImports() // 刷新导入记录
      } catch (err) {
        console.error('提交导入表单失败:', err)
        alert('导入失败: ' + err.message)
      }
    },
    
    // 查看导入详情
    viewImportDetail(importRecord) {
      if (importRecord.jobId) {
        // 从任务数据中获取资源池ID
        const resourcePoolId = importRecord.resourcePoolId || 'aihc-serverless'
        
        // 跳转到任务详情页面，传递资源池ID和来源页面参数
        window.location.href = `/jobs/${importRecord.jobId}?resourcePoolId=${resourcePoolId}&from=imports&datasetId=${this.id}`
      } else {
        console.log('查看导入详情:', importRecord)
      }
    },
    
    // 复制数据集ID
    copyDatasetId(id) {
      if (!id) return
      
      // 使用现代浏览器的Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(id).then(() => {
          this.showCopySuccess()
        }).catch(err => {
          console.error('复制失败:', err)
          this.fallbackCopy(id)
        })
      } else {
        // 降级方案
        this.fallbackCopy(id)
      }
    },
    
    fallbackCopy(text) {
      // 创建临时文本区域
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        this.showCopySuccess()
      } catch (err) {
        console.error('复制失败:', err)
      }
      
      document.body.removeChild(textArea)
    },
    
    showCopySuccess() {
      // 显示复制成功提示
      const toast = document.createElement('div')
      toast.textContent = '数据集ID已复制到剪贴板'
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #52c41a;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInToast 0.3s ease;
      `
      
      // 添加动画样式
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideInToast {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(toast)
      
      // 3秒后自动移除
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style)
        }
      }, 3000)
    }
  },
  mounted() {
    this.loadDataset()
  }
}
</script>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-back {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
}

.btn-back:hover {
  background: #5a6268;
}

.dataset-card {
  background: var(--panel-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  margin-bottom: 24px;
  overflow: hidden;
}

.dataset-card-header {
  background: #f8f9fa;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

.dataset-card-header h5 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.dataset-card-body {
  padding: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  margin-bottom: 16px;
}

.info-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
  font-size: 14px;
}

.info-value {
  font-size: 15px;
  color: var(--text);
  word-break: break-all;
}

.nav-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.nav-tab {
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  color: var(--muted);
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.nav-tab:hover:not(.active) {
  color: var(--text);
  background: #f8f9fa;
}

.tab-content {
  min-height: 300px;
}

.loading,
.error {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}

.error {
  color: #dc3545;
}

.table-container {
  overflow-x: auto;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.versions-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel-bg);
}

.versions-table th {
  background: #f8f9fa;
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.versions-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.versions-table tr:hover {
  background: #f8f9fa;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-600);
}

.btn-primary:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary:disabled:hover {
  background: #6c757d;
  border-color: #6c757d;
  transform: none;
}

.pagination {
  margin-top: 24px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination button {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  min-width: 80px;
}

.pagination button:hover:not(:disabled) {
  background: #3076c9;
  transform: translateY(-1px);
}

.pagination button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.pagination span {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-state h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 20px;
}

.status {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.status.active {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status.inactive {
  background: #fff2f0;
  color: #dc3545;
  border: 1px solid #ffccc7;
}

.storage-type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.storage-type-badge.pfs {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.storage-type-badge.bos {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #ce93d8;
}

/* 导入记录表格样式 */
.imports-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel-bg);
}

.imports-table th {
  background: #f8f9fa;
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.imports-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.imports-table tr:hover {
  background: #f8f9fa;
}

/* 资源池相关样式 */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.section-title i {
  color: #007bff;
}

.count-badge {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.count-badge.zero-count {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.resource-pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.resource-pool-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.resource-pool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.resource-pool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.resource-pool-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  word-break: break-word;
}

.resource-pool-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid #bbdefb;
}

.resource-pool-type.dedicated {
  background: #f3e5f5;
  color: #7b1fa2;
  border-color: #ce93d8;
}

.resource-pool-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-pool-info .info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.resource-pool-info .info-item .label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
  font-size: 14px;
}

.resource-pool-info .info-item .value {
  color: #333;
  font-size: 14px;
  word-break: break-word;
  flex: 1;
}

.storage-tag {
  display: inline-block;
  background: #f8f9fa;
  color: #495057;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid #e9ecef;
  margin-right: 4px;
  margin-bottom: 4px;
}

/* 状态样式 */
.status-pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-running {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-cancelled {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.status-unknown {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

/* 抽屉样式 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.drawer-overlay.show {
  opacity: 1;
  visibility: visible;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 50vw;
  max-width: 800px;
  min-width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  display: none;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.drawer.show {
  display: flex;
}

.drawer-header {
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.drawer-header h4 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.drawer-description {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.4;
}

.drawer-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--muted);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.drawer-close:hover {
  background: #f1f3f4;
  color: var(--text);
}

.drawer-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.radio-group {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.radio-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.radio-item:hover {
  background: #f8f9fa;
}

.radio-item input[type="radio"] {
  margin-right: 8px;
}

.radio-label {
  font-size: 14px;
  color: #333;
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.toggle-input {
  margin-right: 8px;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 20px;
  position: relative;
  transition: background 0.3s;
  margin-right: 8px;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-input:checked + .toggle-slider {
  background: #409eff;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-description {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.disabled-group {
  opacity: 0.6;
  pointer-events: none;
}

.disabled-hint {
  font-size: 12px;
  color: #666;
  margin: 0;
  font-style: italic;
}

.dataset-filter-group {
  margin-bottom: 8px;
}

.filter-select {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  background: #fafbfc;
  color: #333;
}

.dataset-group,
.version-group,
.resource-pool-group,
.queue-group {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.dataset-group .form-control,
.version-group .form-control,
.resource-pool-group .form-control,
.queue-group .form-control {
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 48px);
}

.btn-refresh {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 38px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-refresh:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh span {
  font-size: 14px;
  line-height: 1;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 32px;
  padding: 20px 0;
  border-top: 1px solid #e9ecef;
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 10;
}

.transfer-summary {
  flex: 1;
  margin-right: 16px;
}

.warning-message {
  color: #856404;
  font-size: 14px;
  font-weight: 500;
}

.source-path,
.target-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}

.empty-hint {
  color: #666;
  font-size: 14px;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 100px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: #409eff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover:not(:disabled) {
  background: #3076c9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: white;
  color: #333;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* 复制按钮样式 */
.copy-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #3076c9;
  transform: translateY(-1px);
}

/* 加载和错误状态样式 */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

.loading i {
  margin-right: 8px;
  color: #409eff;
}

.error {
  background: #fff2f0;
  color: #dc3545;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #ffccc7;
  font-size: 14px;
}

.error i {
  margin-right: 8px;
}

/* 目标数据集摘要样式 */
.target-dataset-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  font-size: 14px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-weight: 500;
  color: #6c757d;
  white-space: nowrap;
}

.summary-value {
  color: #495057;
  font-family: monospace;
  font-size: 13px;
}

/* 资源池加载信息样式 */
.resource-pool-loading-info {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 14px;
}

.resource-pool-loading-info i {
  margin-right: 8px;
  color: #f39c12;
}

/* mt-3 辅助类 */
.mt-3 {
  margin-top: 1rem;
}

/* 表单提示文本 */
.form-hint {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
  line-height: 1.4;
}

/* 切换开关样式 */
.toggle-group {
  margin-bottom: 16px;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 8px;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 20px;
  margin-right: 12px;
  transition: background 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-input:checked + .toggle-slider {
  background: #409eff;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-description {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
}

/* 禁用状态 */
.disabled-group {
  opacity: 0.6;
}

.disabled-hint {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

/* 命令行样式 */
.single-command-container {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #e9ecef;
  border-bottom: 1px solid #dee2e6;
}

.command-label {
  font-weight: 600;
  color: #495057;
}

.btn-copy-simple {
  background: #409eff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.command-body {
  padding: 16px;
}

.single-command {
  display: block;
  background: #2d3748;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.command-hint {
  margin-top: 16px;
}

.install-guide, .upload-guide {
  margin-bottom: 16px;
}

.install-guide h4, .upload-guide h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #495057;
}

.install-guide p, .upload-guide p {
  margin: 4px 0;
  font-size: 13px;
  color: #6c757d;
}

.doc-link {
  color: #409eff;
  text-decoration: none;
}

.doc-link:hover {
  text-decoration: underline;
}

/* 信息框样式 */
.info-box {
  display: flex;
  align-items: flex-start;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-icon {
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.info-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #0369a1;
}

.info-content p {
  margin: 4px 0;
  font-size: 13px;
  color: #075985;
}

/* 筛选提示样式 */
.filter-hint {
  margin-top: 8px;
}

.filter-hint-content {
  display: flex;
  align-items: flex-start;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 12px;
}

.filter-hint-icon {
  font-size: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.filter-hint-text {
  flex: 1;
}

.filter-hint-title {
  font-weight: 600;
  font-size: 13px;
  color: #856404;
  margin-bottom: 4px;
}

.filter-hint-message {
  font-size: 12px;
  color: #856404;
  margin-bottom: 8px;
}

.btn-details {
  background: none;
  border: 1px solid #856404;
  color: #856404;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.btn-details:hover {
  background: #856404;
  color: white;
}

/* 底部操作区域样式 */
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px;
  border-top: 1px solid var(--border);
  background: white;
  flex-shrink: 0;
  margin-top: auto;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.transfer-summary {
  flex: 1;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
  word-break: break-all;
  margin-right: 16px;
}

.transfer-summary .source-path {
  background: #e3f2fd;
  color: #1976d2;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-weight: 500;
  font-size: 12px;
}

.transfer-summary .target-path {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-weight: 500;
  font-size: 12px;
}

.transfer-summary .empty-hint {
  color: #dc3545;
  font-style: italic;
}

.transfer-summary .warning-message {
  color: #dc3545;
  font-weight: 500;
  background: #f8d7da;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}

/* 数据集选择行样式 */
.dataset-selection-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.dataset-filter-group {
  flex: 0 0 140px;
}

.dataset-filter-group .filter-select {
  width: 100%;
}

.dataset-group {
  flex: 1;
  display: flex;
  gap: 8px;
}

.dataset-group .form-control {
  flex: 1;
}

/* 资源池选择行样式 */
.resource-pool-selection-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.resource-pool-type-group {
  flex: 0 0 120px;
}

.resource-pool-type-group .form-control {
  width: 100%;
}

.resource-pool-group {
  flex: 1;
  display: flex;
  gap: 8px;
}

.resource-pool-group .form-control {
  flex: 1;
}
</style>