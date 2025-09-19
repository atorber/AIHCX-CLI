// 模板服务 - 处理模板的文件存储
class TemplateService {
  constructor() {
    this.baseUrl = '/api'
  }

  // 获取配置路径
  async getConfigPath() {
    try {
      const response = await fetch(`${this.baseUrl}/config-json`)
      if (response.ok) {
        const config = await response.json()
        return config.path || ''
      }
      return ''
    } catch (error) {
      console.error('获取配置路径失败:', error)
      return ''
    }
  }

  // 获取模板列表
  async getTemplates() {
    try {
      const response = await fetch(`${this.baseUrl}/templates`)
      if (response.ok) {
        const data = await response.json()
        return data.templates || []
      }
      throw new Error('获取模板列表失败')
    } catch (error) {
      console.error('获取模板列表失败:', error)
      // 降级到localStorage
      return this.getTemplatesFromLocalStorage()
    }
  }

  // 获取单个模板详情
  async getTemplate(templateId) {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        return data.template
      }
      throw new Error('获取模板详情失败')
    } catch (error) {
      console.error('获取模板详情失败:', error)
      // 降级到localStorage
      return this.getTemplateFromLocalStorage(templateId)
    }
  }

  // 保存模板
  async saveTemplate(template) {
    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.template
      }
      throw new Error('保存模板失败')
    } catch (error) {
      console.error('保存模板失败:', error)
      // 降级到localStorage
      return this.saveTemplateToLocalStorage(template)
    }
  }

  // 更新模板
  async updateTemplate(templateId, template) {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.template
      }
      throw new Error('更新模板失败')
    } catch (error) {
      console.error('更新模板失败:', error)
      // 降级到localStorage
      return this.updateTemplateInLocalStorage(templateId, template)
    }
  }

  // 删除模板
  async deleteTemplate(templateId) {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        return true
      }
      throw new Error('删除模板失败')
    } catch (error) {
      console.error('删除模板失败:', error)
      // 降级到localStorage
      return this.deleteTemplateFromLocalStorage(templateId)
    }
  }

  // 导出模板
  async exportTemplates() {
    try {
      const templates = await this.getTemplates()
      const dataStr = JSON.stringify(templates, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `templates-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('导出模板失败:', error)
      throw error
    }
  }

  // 导入模板
  async importTemplates(file) {
    try {
      const text = await file.text()
      const importedTemplates = JSON.parse(text)
      
      if (!Array.isArray(importedTemplates)) {
        throw new Error('无效的模板文件格式')
      }

      const results = []
      for (const template of importedTemplates) {
        const newTemplate = {
          ...template,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toLocaleString('zh-CN')
        }
        const savedTemplate = await this.saveTemplate(newTemplate)
        results.push(savedTemplate)
      }
      
      return results
    } catch (error) {
      console.error('导入模板失败:', error)
      throw error
    }
  }

  // localStorage 降级方法
  getTemplatesFromLocalStorage() {
    try {
      const templates = JSON.parse(localStorage.getItem('importTemplates') || '[]')
      return templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (error) {
      console.error('从localStorage获取模板失败:', error)
      return []
    }
  }

  getTemplateFromLocalStorage(templateId) {
    try {
      const templates = this.getTemplatesFromLocalStorage()
      return templates.find(t => t.id === templateId) || null
    } catch (error) {
      console.error('从localStorage获取模板详情失败:', error)
      return null
    }
  }

  saveTemplateToLocalStorage(template) {
    try {
      const templates = this.getTemplatesFromLocalStorage()
      const newTemplate = {
        id: template.id || Date.now().toString(),
        name: template.name,
        createdAt: template.createdAt || new Date().toLocaleString('zh-CN'),
        data: template.data
      }
      
      templates.unshift(newTemplate)
      localStorage.setItem('importTemplates', JSON.stringify(templates))
      return newTemplate
    } catch (error) {
      console.error('保存模板到localStorage失败:', error)
      throw error
    }
  }

  updateTemplateInLocalStorage(templateId, template) {
    try {
      const templates = this.getTemplatesFromLocalStorage()
      const index = templates.findIndex(t => t.id === templateId)
      
      if (index !== -1) {
        templates[index] = {
          ...templates[index],
          ...template,
          id: templateId
        }
        localStorage.setItem('importTemplates', JSON.stringify(templates))
        return templates[index]
      }
      throw new Error('模板不存在')
    } catch (error) {
      console.error('更新localStorage中的模板失败:', error)
      throw error
    }
  }

  deleteTemplateFromLocalStorage(templateId) {
    try {
      const templates = this.getTemplatesFromLocalStorage()
      const filteredTemplates = templates.filter(t => t.id !== templateId)
      localStorage.setItem('importTemplates', JSON.stringify(filteredTemplates))
      return true
    } catch (error) {
      console.error('从localStorage删除模板失败:', error)
      throw error
    }
  }
}

export default new TemplateService()
