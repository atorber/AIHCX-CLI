# AI训练平台命令行工具

一个用于管理AI训练平台的命令行工具。

## 项目结构

```
cli/
├── README.md           # 本文档
├── requirements.txt    # 依赖包
├── setup.py            # 安装配置
├── aihcx.spec          # PyInstaller 打包配置
├── build.bat           # Windows 打包脚本
├── build.sh            # Linux/macOS 打包脚本
└── aihcx/              # 源代码
    ├── __init__.py     # 包初始化
    ├── cli.py          # CLI 入口
    ├── commands.py     # 命令实现
    └── client.py       # API 客户端
```

## 使用源码安装

```bash
pip install -r requirements.txt
pip install -e .
```

## 打包发布

### 打包和安装

1.	本地打包
    在项目根目录下运行：
    ```
    python setup.py sdist
    ```
    
    打包后的文件会保存在 dist/ 目录中，例如：dist/aihcx-0.1.0.tar.gz。

2.	本地安装
    使用 pip 安装：

    ```
    pip install dist/aihcx-0.1.0.tar.gz
    ```

3.	运行工具
    安装完成后，运行：
    ```
    aihcx
    ```

### 发布新版本

1. 更新版本号
   编辑 setup.py 中的 version 字段

2. 创建新的 tag
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. 构建分发包
   ```bash
   # 安装构建工具
   pip install build wheel
   
   # 构建源码包和wheel包
   python setup.py sdist bdist_wheel
   ```

4. 发布到PyPI（可选）
   ```bash
   # 安装发布工具
   pip install twine
   
   # 检查分发包
   twine check dist/*
   
   # 上传到 PyPI
   twine upload dist/*
   ```

   或者创建 GitHub Release，CI 会自动发布到 PyPI。

5. 安装新版本
   ```bash
   pip install --upgrade aihcx
   ```

6. 使用 --help 查看每个命令的详细用法

### 发布到 PyPI（可选）
	
1.	安装 twine：
    ```
    pip install twine
    ```

2.	上传到 PyPI：
    ```
    twine upload dist/*
    ```

3. 发布后，用户可以通过以下命令直接安装：
    ```
    pip install aihcx
    ```

## 编译为可执行程序

如果希望用户无需安装 Python 环境即可直接使用 CLI 工具，可以将本项目打包为独立的可执行文件。推荐使用 [PyInstaller](https://pyinstaller.org/) 工具。

### 1. 使用 build.sh 脚本一键打包（Linux/macOS）

项目已提供自动识别平台并打包的脚本 `build.sh`，会根据当前系统自动将可执行文件输出到 `dist/版本号/平台` 目录下。

#### 步骤：

```bash
# 赋予脚本执行权限（首次使用）
chmod +x build.sh

# 运行打包脚本
./build.sh
```

打包完成后，目录结构如下：

```
dist/
  └── 0.1.0/           # 版本号（以 setup.py 中 version 字段为准）
      ├── mac-arm/aihcx
      ├── mac-x86/aihcx
      ├── linux-x86/aihcx
      ├── linux-arm/aihcx
      └── win/aihcx.exe
```

你只需将对应平台下的可执行文件分发给用户即可，用户无需安装 Python，直接运行即可。

### 2. Windows 下一键打包

Windows 用户可直接运行 `build.bat` 脚本，自动完成打包并将可执行文件输出到 `dist\版本号\win` 目录下。

#### 步骤：

```bat
build.bat
```

打包完成后，目录结构如下：

```
dist\0.1.0\win\aihcx.exe
```

同样，用户无需安装 Python，直接运行 `aihcx.exe` 即可。

### 3. 手动打包（可选）

如需手动打包，也可参考以下命令：

```bash
pip install pyinstaller
pyinstaller --onefile -n aihcx aihcx/cli.py
```

- `--onefile`：打包成单一可执行文件
- `-n aihcx`：指定生成的可执行文件名为 aihcx

打包完成后，可执行文件会在 `dist/` 目录下生成。

### 4. 注意事项

- 打包平台和目标平台需一致（如在 macOS 打包只能用于 macOS）。
- 如有依赖外部资源（如配置文件、数据文件），可用 `--add-data` 参数指定。
- 若有命令补全等 shell 脚本功能，需额外打包或在文档中说明。
- 如需为 Windows、Linux、macOS 分别打包，建议在对应系统下分别运行 PyInstaller，或使用 CI/CD 自动化打包。

## 配置

### 基本配置

首次使用前需要配置认证信息:

```bash
# 设置配置信息
aihcx config \
    --host aihc.bj.baidubce.com \
    --access-key <your-access-key> \
    --secret-key <your-secret-key> \
    --pool <default-pool-id>

# 查看当前配置
aihcx config --show
```

### 命令补全

安装命令自动补全支持：

```bash
# 对于 zsh
aihcx completion zsh >> ~/.zshrc
source ~/.zshrc

# 对于 bash
aihcx completion bash >> ~/.bashrc
source ~/.bashrc

# 对于 fish
aihcx completion fish > ~/.config/fish/completions/aihcx.fish
```

补全支持：
- 命令补全（Tab键）
- 子命令补全
- 参数名补全
- 资源名补全（部分支持）

## 使用方法

所有命令都支持 `--help` 选项查看详细帮助信息。

### 训练任务管理

```bash
# 创建任务
aihcx job create <job-name> -f job.json  # 从配置文件创建任务

# 查看任务列表
aihcx job list  # 列出所有任务
aihcx job list --pool <pool-id>  # 指定资源池的任务
aihcx job list --page 2 --size 20  # 分页查询
aihcx job list --order desc  # 按时间降序排列

# 获取任务详情
aihcx job get <job-id>  # 获取任务详情
aihcx job status <job-id>  # 获取任务状态

# 任务操作
aihcx job delete <job-id>  # 删除任务
aihcx job update <job-id> --priority high  # 更新任务优先级(high/normal/low)

# 任务日志和终端
aihcx job logs <job-id> --podname <pod-name>  # 查看任务日志
aihcx job exec <job-id> --podname <pod-name> [command]  # 连接到任务实例
aihcx job exec <job-id> --podname <pod-name> -it bash  # 交互式终端

# 导出任务配置
aihcx job export <job-id>  # 导出任务配置到文件
```

### 资源池管理

```bash
# 查看资源池列表
aihcx pool list  # 显示所有资源池

# 获取资源池详情
aihcx pool get [pool-id]  # 不指定ID时使用默认资源池
```

### 队列管理

```bash
# 查看队列列表
aihcx queue list  # 显示所有队列
aihcx queue list --pool <pool-id>  # 指定资源池的队列

# 获取队列详情
aihcx queue get [queue-name]  # 不指定名称时使用default队列
aihcx queue get <queue-name> --pool <pool-id>  # 指定资源池的队列
```

### 节点管理

```bash
# 查看节点列表
aihcx node list  # 显示所有节点
aihcx node list --pool <pool-id>  # 指定资源池的节点
```

### Pod管理

```bash
# 查看Pod列表
aihcx pod list <job-id>  # 显示任务的所有Pod
```

### 命令格式说明

命令遵循以下格式:
```bash
aihcx [TYPE] [COMMAND] [NAME] [FLAGS]
```

- TYPE: 资源类型，如 job、pool、node、queue、pod
- COMMAND: 操作命令，如 create、list、get、delete 等
- NAME: 资源名称（部分命令需要）
- FLAGS: 命令参数

### 版本信息

```bash
aihcx version  # 显示版本信息
```

## 环境变量支持

可以通过环境变量设置常用配置：

```bash
export AIHC_HOST=aihc.bj.baidubce.com
export AIHC_ACCESS_KEY=your-access-key
export AIHC_SECRET_KEY=your-secret-key
export AIHC_DEFAULT_POOL=your-default-pool
```

## 注意事项

1. 请妥善保管AK/SK密钥对
2. 建议设置默认资源池，简化命令使用
3. 使用自动补全提高效率
4. 大型任务配置建议使用配置文件
5. 导出任务配置后可用于快速复制任务
6. 使用 --help 查看每个命令的详细用法
