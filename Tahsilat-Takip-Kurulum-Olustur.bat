@echo off
chcp 65001 >nul
title Tahsilat Takip - Kurulum Dosyasi Olustur
cd /d "%~dp0"

echo.
echo  Tahsilat Takip Windows kurulum dosyasi olusturuluyor...
echo  (Bu islem birkaç dakika surebilir.)
echo.

call npm run electron:pack
if errorlevel 1 (
  echo.
  echo  HATA: Kurulum dosyasi olusturulamadi.
  pause
  exit /b 1
)

echo.
echo  Tamamlandi.
echo  Kurulum dosyasi: dist-electron\Tahsilat-Takip-Setup-2.0.0.exe
echo.
pause
