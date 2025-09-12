# AIHCX Web 前端

这是一个使用 Node.js + Vue 3 重写的 AIHCX 前端界面，保持与原有交互和页面逻辑完全一致。

## 项目结构

```
web/
├── public/                 # 静态资源文件
├── src/
│   ├── assets/             # 静态资源
│   ├── components/         # Vue 组件
│   ├── views/              # 页面组件
│   ├── router/             # 路由配置
│   ├── services/           # API 服务
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── server/                 # Node.js 后端服务
│   └── index.js            # 服务入口
├── package.json
└── vite.config.js
```

## 技术栈

- 前端: Vue 3 + Axios
- 后端: Node.js + Express
- 构建工具: Vite
- 路由: Vue Router

## 开发环境搭建

1. 安装依赖:
   ```bash
   npm install
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

   这将同时启动:
   - Vue 前端开发服务器 (端口 3000)
   - Node.js 后端服务器 (端口 3001)

3. 访问应用:
   打开浏览器访问 http://localhost:3000

## 构建部署

构建生产版本:
```bash
npm run build
```

预览生产构建:
```bash
npm run preview
```

## API 代理配置

Vite 配置了 API 代理，将 `/api` 请求代理到后端服务器:
- 前端开发服务器: http://localhost:3000
- 后端服务器: http://localhost:3001
- API代理: /api -> http://localhost:38765 (AIHCX后端)

## 页面功能

- [x] 首页 (Welcome)
- [x] 参数配置 (Config)
- [x] 数据集列表 (Datasets)
- [x] 数据集详情 (Dataset Detail)
- [ ] 模型列表 (Models)
- [ ] 资源池列表 (Resource Pools)
- [ ] 任务列表 (Jobs)

## 开发说明

1. 所有页面组件位于 `src/views/` 目录下
2. 可复用组件位于 `src/components/` 目录下
3. API 服务封装在 `src/services/` 目录下
4. 路由配置在 `src/router/index.js` 文件中

## 注意事项

1. 保持与原有页面的视觉风格一致
2. 保持与原有交互逻辑一致
3. API 请求通过后端代理处理
4. 使用 Vue 3 Composition API 或 Options API