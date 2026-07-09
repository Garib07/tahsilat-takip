@echo off
chcp 65001 >nul
title Tahsilat Takip - Haftalik Yedek
cd /d "%~dp0"

set "BACKUP_ROOT=%USERPROFILE%\Documents\Tahsilat-Takip-Yedek"
set "DATE_STAMP=%date:~-4%%date:~3,2%%date:~0,2%"
set "TIME_STAMP=%time:~0,2%%time:~3,2%"
set "TIME_STAMP=%TIME_STAMP: =0%"
set "DEST=%BACKUP_ROOT%\%DATE_STAMP%_%TIME_STAMP%"

echo.
echo  ============================================
echo   Tahsilat Takip - Haftalik Yedek
echo  ============================================
echo.
echo  Yedek klasoru: %BACKUP_ROOT%
echo.

set "COPIED=0"

REM Kurulu masaustu programi (varsayilan)
set "EXE_DATA=%APPDATA%\Tahsilat Takip\data\app-data.json"
if exist "%EXE_DATA%" (
  call :CopyData "%EXE_DATA%" "%DEST%\app-data.json"
  if exist "%APPDATA%\Tahsilat Takip\sync.json" (
    copy /Y "%APPDATA%\Tahsilat Takip\sync.json" "%DEST%\sync.json" >nul
  )
)

REM Gelistirme / proje klasoru
if exist "%~dp0data\app-data.json" (
  call :CopyData "%~dp0data\app-data.json" "%DEST%\proje-app-data.json"
)

if "%COPIED%"=="0" (
  echo  UYARI: app-data.json bulunamadi.
  echo  - Tahsilat Takip acik mi kontrol edin
  echo  - Kurulum: %%APPDATA%%\Tahsilat Takip\data\
  echo.
  pause
  exit /b 1
)

echo.
echo  TAMAM - Yedek alindi:
echo  %DEST%
echo.
echo  Eski yedekler (8 haftadan fazlasi) temizleniyor...
powershell -NoProfile -Command ^
  "$root = '%BACKUP_ROOT%';" ^
  "if (Test-Path $root) {" ^
  "  Get-ChildItem $root -Directory | Sort-Object Name -Descending | Select-Object -Skip 8 | Remove-Item -Recurse -Force" ^
  "}"
echo.
echo  --- Haftalik kontrol listesi ---
echo  [ ] Bu yedek USB veya buluta da kopyalandi mi?
echo  [ ] Web aciliyor mu? (istege bagli kontrol)
echo  [ ] Firma Yonetimi - Bulut Senkron acik mi?
echo.
pause
exit /b 0

:CopyData
if not exist "%DEST%" mkdir "%DEST%" >nul 2>&1
copy /Y "%~1" "%~2" >nul
if errorlevel 1 (
  echo  HATA: Kopyalanamadi - %~1
  exit /b 1
)
echo  [OK] %~1
set "COPIED=1"
exit /b 0
