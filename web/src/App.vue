<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
:root {
  --bg: #f5f7fb;
  --panel-bg: #ffffff;
  --text: #1f2937;
  --muted: #6b7280;
  --primary: #2b6def;
  --primary-600: #1f5bd8;
  --border: #e5e7eb;
  --shadow: 0 6px 24px rgba(0,0,0,0.06);
  --radius: 12px;
  --content-max: 1200px;
  --sidebar-w: 240px;
  --header-h: 96px; /* 头部大致高度，用于侧栏吸顶偏移 */
}

* { 
  box-sizing: border-box; 
}

body { 
  font-family: 'Segoe UI', 'PingFang SC', Arial, sans-serif; 
  background: var(--bg);
  color: var(--text);
  margin: 0; 
  min-height: 100vh;
}

.container { 
  max-width: 1600px; 
  margin: 0 auto; 
  background: var(--panel-bg); 
  border-radius: var(--radius); 
  box-shadow: var(--shadow);
  overflow: visible;
}

.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--panel-bg);
  color: var(--text);
  padding: 28px 32px;
  text-align: center;
  border-bottom: 1px solid var(--border);
}

.header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.header p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--muted);
}

/* 左侧布局 */
.main {
  display: flex;
  min-height: 640px;
  align-items: flex-start;
}

.sidebar {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow: hidden auto;
  z-index: 900;
  width: var(--sidebar-w);
  background: var(--panel-bg);
  border-right: 1px solid var(--border);
  padding: 20px 14px;
}

.sidebar .nav-group { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}

.sidebar a {
  display: block;
  background: transparent;
  color: var(--text);
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 10px;
  transition: all 0.15s ease;
  font-weight: 500;
}

.sidebar a:hover {
  background: #eef4ff;
  color: var(--primary);
}

.sidebar a.action-btn { 
  background: var(--primary); 
  color: #fff;
  text-align: center;
}

.sidebar a.action-btn:hover {
  background: var(--primary-600);
  box-shadow: 0 4px 12px rgba(43, 109, 239, 0.25);
}

.content {
  padding: 28px;
  line-height: 1.7;
  font-size: 15px;
  flex: 1;
  background: var(--panel-bg);
}

/* 统一内容宽度与居中 */
.content > .page-container { 
  max-width: var(--content-max); 
  margin: 0 auto; 
}

.content h1 {
  color: #111827;
  border-bottom: 2px solid var(--border);
  padding-bottom: 12px;
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 22px;
  font-weight: 600;
}

.content h2 {
  color: #111827;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
  margin-top: 28px;
  margin-bottom: 18px;
  font-size: 18px;
  font-weight: 600;
}

.content h3 { 
  color: #374151; 
  margin: 20px 0 12px 0; 
  font-size: 16px; 
}

.content h4 { 
  color: #4b5563; 
  margin: 16px 0 10px 0; 
  font-size: 14px; 
}

.content p  { 
  margin-bottom: 14px; 
  color: #374151; 
}

/* 通用输入与按钮 */
.search-input, .select, input[type="text"], select {
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.search-input:focus, .select:focus, input[type="text"]:focus, select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(43,109,239,0.12);
}

.btn, .refresh-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.btn:hover, .refresh-btn:hover { 
  background: var(--primary-600); 
}

.btn:disabled, .refresh-btn:disabled { 
  background: #9ca3af; 
  cursor: not-allowed; 
}

/* 通用表格 */
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.table th {
  background: #f9fafb;
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #374151;
}

.table tr:hover { 
  background: #fafbff; 
}

/* 卡片与统计 */
.card { 
  background: #fff; 
  border: 1px solid var(--border); 
  border-radius: 12px; 
  box-shadow: var(--shadow); 
}

.stats { 
  display: grid; 
  grid-template-columns: repeat(4, 1fr); 
  gap: 16px; 
  margin-bottom: 20px; 
}

.stat-number { 
  font-size: 26px; 
  font-weight: 700; 
  color: var(--primary); 
}

.stat-label { 
  font-size: 12px; 
  color: var(--muted); 
  font-weight: 600; 
}

/* 响应式 */
@media (max-width: 1200px) {
  :root { --content-max: 1040px; }
}

@media (max-width: 992px) {
  .main { flex-direction: column; }
  .sidebar {
    position: sticky;
    top: var(--header-h);
    height: auto;
    max-height: calc(100vh - var(--header-h));
    width: auto; 
    border-right: none; 
    border-bottom: 1px solid var(--border); 
    display: flex; 
    gap: 8px; 
    flex-wrap: wrap; 
  }
  .sidebar .nav-group { 
    flex-direction: row; 
    flex-wrap: wrap; 
  }
  .content { 
    padding: 20px; 
  }
}

@media (max-width: 640px) {
  :root { --content-max: 90vw; }
  .stats { 
    grid-template-columns: repeat(2, 1fr); 
  }
}
</style>