<template>
  <div class="container">
    <div class="header">
      <h1>🤖 AIHCX</h1>
      <p>机器学习平台命令行工具</p>
    </div>
    <div class="main">
      <aside class="sidebar">
        <Navigation />
      </aside>
      <div class="content">
        <div class="page-container">
          <div class="md" v-html="readmeContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from '../components/Navigation.vue'

export default {
  name: 'Welcome',
  components: {
    Navigation
  },
  data() {
    return {
      readmeContent: '<p>加载中...</p>'
    }
  },
  mounted() {
    this.loadReadme()
  },
  methods: {
    async loadReadme() {
      try {
        // 从public文件夹读取README.md文件
        const response = await fetch('/README.md')
        if (!response.ok) {
          throw new Error('无法加载README文件')
        }
        const markdownContent = await response.text()
        
        // 将Markdown转换为HTML（与HTML模板版本保持一致）
        this.readmeContent = this.convertMarkdownToHtml(markdownContent)
      } catch (error) {
        console.error('读取README文件失败:', error)
        this.readmeContent = '<p>无法加载README内容，请检查文件是否存在。</p>'
      }
    },
    
    convertMarkdownToHtml(markdown) {
      // 转换标题
      let html = markdown.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
      
      // 转换代码块
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="$1">$2</code></pre>')
      
      // 转换行内代码
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // 转换列表
      html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>')
      html = html.replace(/^- (.*?)$/gm, '<li>$1</li>')
      html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
      
      // 包装列表项
      html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
        if (!match.includes('<ul>') && !match.includes('<ol>')) {
          return `<ul>${match}</ul>`
        }
        return match
      })
      
      // 转换粗体和斜体
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // 转换链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      
      // 转换段落
      html = html.replace(/\n\n/g, '</p><p>')
      html = '<p>' + html + '</p>'
      
      // 清理多余的换行
      html = html.replace(/\n{3,}/g, '\n\n')
      
      return html
    }
  }
}
</script>

<style scoped>
/* README内容样式 - 与HTML模板版本保持一致 */
.md { 
  background: #ffffff; 
  border: 1px solid var(--border); 
  border-radius: 12px; 
  box-shadow: var(--shadow); 
  padding: 24px; 
}

.md h1 { 
  font-size: 28px; 
  margin: 12px 0 16px; 
  border-bottom: 1px solid var(--border); 
  padding-bottom: 8px; 
}

.md h2 { 
  font-size: 22px; 
  margin: 24px 0 12px; 
  border-bottom: 1px solid var(--border); 
  padding-bottom: 6px; 
}

.md h3 { 
  font-size: 18px; 
  margin: 18px 0 10px; 
}

.md p { 
  color: #374151; 
  line-height: 1.8; 
  margin: 12px 0; 
}

.md a { 
  color: var(--primary); 
  text-decoration: none; 
}

.md a:hover { 
  text-decoration: underline; 
}

.md ul, .md ol { 
  padding-left: 22px; 
}

.md li { 
  margin: 6px 0; 
}

.md code { 
  background: #f3f4f6; 
  padding: 2px 6px; 
  border-radius: 6px; 
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; 
  font-size: 13px; 
  color: #111827; 
}

.md pre { 
  background: #0b1020; 
  color: #e5e7eb; 
  border-radius: 10px; 
  padding: 16px; 
  overflow-x: auto; 
  border: 1px solid #11182733; 
}

.md pre code { 
  background: transparent; 
  color: inherit; 
  padding: 0; 
}

.md blockquote { 
  background: #f8fafc; 
  border-left: 4px solid var(--primary); 
  padding: 10px 14px; 
  color: #475569; 
  margin: 12px 0; 
  border-radius: 0 8px 8px 0; 
}

.md table { 
  width: 100%; 
  border-collapse: collapse; 
  margin: 14px 0; 
}

.md th, .md td { 
  border: 1px solid #e5e7eb; 
  padding: 8px 10px; 
  text-align: left; 
}

.md th { 
  background: #f9fafb; 
}
</style>