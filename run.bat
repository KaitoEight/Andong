@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem Uu tien dung Node kem san trong goi (khong can cai gi tren may)
set "NODE_EXE=node"
if exist "%~dp0node\node.exe" set "NODE_EXE=%~dp0node\node.exe"

"%NODE_EXE%" -v >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong chay duoc Node.
  echo Goi nay da kem san Node 14 trong thu muc "node".
  echo Neu van loi, may co the thieu ban va Windows ^(KB2999226 - Universal C Runtime^).
  pause
  exit /b 1
)

if not exist "dist\index.html" (
  echo [LOI] Thieu thu muc "dist". Hay giai nen lai dung goi day du.
  pause
  exit /b 1
)

if not exist "server\node_modules" (
  echo [LOI] Thieu "server\node_modules". Hay giai nen lai dung goi day du.
  pause
  exit /b 1
)

echo Dang mo trinh duyet va khoi dong may chu...
start "" http://localhost:3001
"%NODE_EXE%" server\index.js
pause
