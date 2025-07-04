@echo off
setlocal enabledelayedexpansion

REM 读取版本号
for /f "delims=" %%i in ('python -c "import re;f=open('setup.py');s=f.read();f.close();import sys;m=re.search(r'version *= *[\'\"]([\d\.]+)[\'\"]', s);print(m.group(1) if m else 'unknown')"') do set VERSION=%%i

REM 检查 pyinstaller 是否已安装
where pyinstaller >nul 2>nul
if errorlevel 1 (
    echo 请先安装 pyinstaller: pip install pyinstaller
    exit /b 1
)

REM 识别平台（仅支持 Windows）
set PLATFORM=win

REM 打包
pyinstaller --onefile -n aihcx aihcx/cli.py
if errorlevel 1 (
    echo 打包失败
    exit /b 1
)

REM 创建目标目录
set OUTDIR=dist\%VERSION%\%PLATFORM%
if not exist %OUTDIR% mkdir %OUTDIR%

REM 移动可执行文件
move /Y dist\aihcx.exe %OUTDIR%\aihcx.exe >nul

if exist %OUTDIR%\aihcx.exe (
    echo 可执行文件已生成：%OUTDIR%\aihcx.exe
) else (
    echo 未找到生成的可执行文件
    exit /b 1
) 