@echo off
chcp 65001 >nul
title Tahsilat Takip - Kurulum Dosyasi Olustur
cd /d "%~dp0"

echo.
echo  Tahsilat Takip Windows kurulum dosyasi olusturuluyor...
echo  (Bu islem birkac dakika surebilir.)
echo.
echo  NOT: Bu islem kurulu programi KALDIRMAZ.
echo  Sadece acik olan Tahsilat Takip penceresini kapatir.
echo.
echo  ONEMLI: dist-electron klasorunu File Explorer'da acmayin.
echo.

taskkill /F /IM "Tahsilat Takip.exe" /T >nul 2>&1
taskkill /F /IM "electron.exe" /T >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3847 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 2 /nobreak >nul
echo.

call npm run electron:pack
if errorlevel 1 (
  echo.
  echo  HATA: Kurulum dosyasi olusturulamadi.
  echo  - dist-electron klasorunu File Explorer'da kapatip tekrar deneyin
  echo  - Tahsilat Takip aciksa kapatip tekrar deneyin
  echo  - Gerekirse bilgisayari yeniden baslatin
  pause
  exit /b 1
)

if not exist "dist-electron\Tahsilat-Takip-Setup-2.0.0.exe" (
  echo.
  echo  HATA: dist-electron\Tahsilat-Takip-Setup-2.0.0.exe olusmadi.
  pause
  exit /b 1
)

echo.
echo  Tamamlandi.
echo  Kurulum dosyasi: dist-electron\Tahsilat-Takip-Setup-2.0.0.exe
echo.
echo  Kurulumda hata alirsaniz Tahsilat-Takip-Temiz-Kurulum.bat calistirin.
echo.
pause
