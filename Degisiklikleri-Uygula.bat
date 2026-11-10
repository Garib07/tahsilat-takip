@echo off
chcp 65001 >nul
title Tahsilat Takip - Degisiklikleri Uygula
cd /d "%~dp0"

set "GIT_NAME=Garib07"
set "GIT_EMAIL=garib07@users.noreply.github.com"
set "SITE=https://tahsilat-takip.aaydin07.workers.dev"

echo.
echo  ============================================
echo   Tahsilat Takip - Degisiklikleri Uygula
echo  ============================================
echo.
echo  Bu dosya kod degisikliklerini otomatik uygular:
echo    - Bulut (web/telefon) : Cloudflare Workers
echo    - Masaustu (.exe)     : istege bagli yeniden paketleme
echo.

REM --- Degisiklik var mi? ---
git status --porcelain 2>nul | findstr /r "." >nul
if errorlevel 1 (
  echo  Kaydedilecek kod degisikligi bulunamadi.
  goto ask_cloud
)

echo  [1/3] GitHub'a kaydediliyor...
echo.

set /p COMMIT_MSG=Kisa aciklama ^(Enter = Guncelleme^): 
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Guncelleme"

git add .
git -c user.name=%GIT_NAME% -c user.email=%GIT_EMAIL% commit -m "%COMMIT_MSG%"
if errorlevel 1 (
  echo.
  echo  HATA: Commit yapilamadi.
  pause
  exit /b 1
)

git push origin main
if errorlevel 1 (
  echo.
  echo  HATA: GitHub'a gonderilemedi.
  echo  - Internet baglantinizi kontrol edin
  echo  - GitHub'a giris yapilmis olmali
  pause
  exit /b 1
)

echo.
echo  TAMAM - Kod GitHub'a gonderildi.
echo.

:ask_cloud
set "DEPLOY_CF=E"
set /p DEPLOY_CF=Cloudflare'e deploy edilsin mi? (E/H) [E]: 
if /i "%DEPLOY_CF%"=="H" goto ask_exe
if /i "%DEPLOY_CF%"=="HAYIR" goto ask_exe

echo.
echo  [2/3] Cloudflare Workers'a yayinlaniyor...
echo.

call npm.cmd run deploy
if errorlevel 1 (
  echo.
  echo  HATA: Cloudflare deploy basarisiz.
  echo  Once: npx wrangler login
  pause
  exit /b 1
)

echo.
echo  TAMAM - Site: %SITE%
echo.

:ask_exe
set "BUILD_EXE=N"
set /p BUILD_EXE=Masaustu .exe de yenilensin mi? (E/H) [H]: 
if /i "%BUILD_EXE%"=="E" goto build_exe
if /i "%BUILD_EXE%"=="EVET" goto build_exe

echo.
echo  Islem bitti.
echo  - Web/telefon: %SITE%
echo  - Masaustu: mevcut .exe ayni kalir
echo    (Firma Yonetimi - Web adresi: %SITE%)
echo.
pause
exit /b 0

:build_exe
echo.
echo  [3/3] Masaustu kurulum dosyasi olusturuluyor...
echo  (3-5 dakika surebilir)
echo.

call npm.cmd run electron:pack
if errorlevel 1 (
  echo.
  echo  HATA: .exe olusturulamadi. CMD penceresindeki hatayi kontrol edin.
  pause
  exit /b 1
)

echo.
echo  TAMAM - Kurulum dosyasi hazir:
echo  dist-electron\Tahsilat-Takip-Setup-2.0.0.exe
echo.
echo  Kurarken "Sadece benim icin" secin.
echo  Kurulumdan sonra Firma Yonetimi - Web adresi: %SITE%
echo.
pause
exit /b 0
