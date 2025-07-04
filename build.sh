#!/bin/bash

set -e

# 读取版本号
VERSION=$(python3 -c "import re;f=open('setup.py');s=f.read();f.close();print(re.search(r'version *= *[\'\"]([\d\.]+)[\'\"]', s).group(1))")

# 自动识别平台
PLATFORM=""
ARCH=$(uname -m)
OS=$(uname -s)

if [[ "$OS" == "Darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        PLATFORM="mac-apple"
    else
        PLATFORM="mac-intel"
    fi
elif [[ "$OS" == "Linux" ]]; then
    if [[ "$ARCH" == "aarch64" ]]; then
        PLATFORM="linux-arm64"
    else
        PLATFORM="linux-amd64"
    fi
elif [[ "$OS" == MINGW* || "$OS" == MSYS* || "$OS" == CYGWIN* ]]; then
    PLATFORM="win"
else
    echo "未知平台: $OS $ARCH"
    exit 1
fi

# 打包
pyinstaller --onefile -n aihcx aihcx/cli.py

# 创建目标目录
OUTDIR=dist/$VERSION/$PLATFORM
mkdir -p "$OUTDIR"

# 移动可执行文件
if [[ "$PLATFORM" == "win" ]]; then
    mv dist/aihcx.exe "$OUTDIR/"
else
    mv dist/aihcx "$OUTDIR/"
fi

echo "可执行文件已生成：$OUTDIR/aihcx" 