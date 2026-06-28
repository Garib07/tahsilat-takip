@echo off
chcp 65001 >nul
title Tahsilat Takip - GitHub Yukleme
cd /d "%~dp0"

echo.
echo  GitHub'a yukleme adimlari
echo  =========================
echo.
echo  1) Tarayicida acin: https://github.com/new
echo  2) Repository name: tahsilat-takip
echo  3) README / gitignore EKLEMEYIN - bos repo olusturun
echo  4) Create repository deyin
echo.
echo  Sonra GitHub sayfasindaki kullanici adinizi asagiya yazin.
echo  Ornek: Garib07
echo.
set /p GHUSER=GitHub kullanici adiniz: 

if "%GHUSER%"=="" (
  echo Kullanici adi bos olamaz.
  pause
  exit /b 1
)

git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/%GHUSER%/tahsilat-takip.git

echo.
echo  Simdi GitHub'a gonderiliyor...
echo  (Tarayici acilirsa GitHub ile giris yapin)
echo.

git push -u origin main

if errorlevel 1 (
  echo.
  echo  HATA: Push basarisiz.
  echo  - GitHub'da tahsilat-takip reposu olusturdunuz mu?
  echo  - Kullanici adi dogru mu?
  echo  - GitHub giris penceresinde izin verdiniz mi?
  pause
  exit /b 1
)

echo.
echo  TAMAM! Simdi Vercel ekranina donun:
echo  Select repositories - tahsilat-takip secin - Install
echo.
pause
