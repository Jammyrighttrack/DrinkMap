@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===========================================
echo       Khoi dong DrinkMap AI (Ca Phe Map)
echo ===========================================
echo.
echo [1/2] Dang bat May chu (Backend)...
start "DrinkMap - Backend (Khong duoc tat)" cmd /k "cd server\src && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Dang bat Giao dien (Frontend)...
start "DrinkMap - Frontend (Khong duoc tat)" cmd /k "cd client && npm run dev"

echo.
echo ===========================================
echo Dang cho he thong khoi dong (Vui long doi 10 giay)...
timeout /T 10 /NOBREAK >nul

echo Tu dong mo trinh duyet...
start http://localhost:5173/

echo Xong! Ban co the thu nho cua so nay xuong.
pause
