@echo off
chcp 65001 >nul
title Tahsilat Takip - Buluta Veri Aktarimi
cd /d "%~dp0"

echo.
echo  Yerel data\app-data.json dosyasi Turso bulut veritabanina aktarilir.
echo  Once .env dosyasinda TURSO_DATABASE_URL ve TURSO_AUTH_TOKEN tanimli olmali.
echo.

if not exist ".env" (
  echo  UYARI: .env dosyasi bulunamadi. .env.example dosyasini kopyalayip doldurun.
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
  if "%%A"=="TURSO_DATABASE_URL" set TURSO_DATABASE_URL=%%B
  if "%%A"=="TURSO_AUTH_TOKEN" set TURSO_AUTH_TOKEN=%%B
)

call npm run db:migrate
pause
