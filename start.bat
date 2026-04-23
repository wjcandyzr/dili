@echo off
REM 启动本地静态服务器并打开浏览器
REM 双击本文件即可启动教学展示网站

cd /d "%~dp0"

REM 优先使用 Python 3
where python >nul 2>nul
if %errorlevel%==0 (
  echo 正在启动本地服务器 http://localhost:8000 ...
  start "" http://localhost:8000/
  python -m http.server 8000
  goto :eof
)

REM 退而求其次用 Node
where node >nul 2>nul
if %errorlevel%==0 (
  echo 正在用 Node 启动本地服务器 http://localhost:8000 ...
  start "" http://localhost:8000/
  npx --yes http-server -p 8000 -c-1
  goto :eof
)

echo.
echo [错误] 未找到 Python 或 Node。
echo 请安装 Python 3（https://www.python.org/）或 Node.js 之一。
echo 或者直接用 Chrome/Edge 打开 index.html 也可以尝试。
echo.
pause
