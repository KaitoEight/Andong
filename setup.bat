@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   KIEM TRA GOI - Nha Khoa An Dong
echo ============================================
echo.

set "READY=1"

if exist "node\node.exe" ( echo [OK] Node 14 kem san trong goi.) else ( echo [!] Khong co Node kem san - se dung Node tren may. )
if exist "dist\index.html" ( echo [OK] Giao dien da build san.) else ( echo [X] Thieu dist. & set "READY=0" )
if exist "server\node_modules" ( echo [OK] Thu vien may chu day du.) else ( echo [X] Thieu server\node_modules. & set "READY=0" )
if exist "server\.env" ( echo [OK] Cau hinh ket noi CSDL.) else ( echo [X] Thieu server\.env. & set "READY=0" )

echo.
if "%READY%"=="1" (
  echo ============================================
  echo   SAN SANG! Bam dup run.bat de chay.
  echo ============================================
) else (
  echo [LOI] Goi thieu thanh phan. Hay giai nen lai dung file zip day du,
  echo hoac chay tren may co Node 18+ roi go: npm run setup
)
pause
