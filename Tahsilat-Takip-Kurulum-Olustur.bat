@echo off
chcp 65001 >nul
title Tahsilat Takip - Kurulum Dosyasi Olustur
cd /d "%~dp0"

echo.
echo  Tahsilat Takip Windows kurulum dosyasi olusturuluyor...
echo  (Bu islem birkaç dakika surebilir.)
echo.
echo  ONEMLI: Acik Tahsilat Takip penceresini kapatiyorum...
taskkill /F /IM "Tahsilat Takip.exe" /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo.

call npm run electron:pack
if errorlevel 1 (
  echo.
  echo  HATA: Kurulum dosyasi olusturulamadi.
  echo  - Tahsilat Takip aciksa kapatip tekrar deneyin
  echo  - dist-electron klasoru baska programda aciksa kapatin
  echo  - Gerekirse bilgisayari yeniden baslatin
  pause
  exit /b 1
)

echo.
echo  Tamamlandi.
echo  Kurulum dosyasi: dist-electron\Tahsilat-Takip-Setup-2.0.0.exe
echo.
pause
