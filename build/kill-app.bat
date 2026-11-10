@echo off
taskkill /F /IM "Tahsilat Takip.exe" /T >nul 2>&1
taskkill /F /IM "electron.exe" /T >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3847" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a /T >nul 2>&1
)
exit /b 0
