@echo off
setlocal

set "PROJECT_DIR=D:\proje"
set "APP_PORT=3000"
set "APP_URL=http://localhost:%APP_PORT%"

echo Tahsilat Takip baslatiliyor...

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri '%APP_URL%' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

if %ERRORLEVEL% EQU 0 (
  echo Uygulama zaten calisiyor.
  goto :show_urls
)

echo Sunucu baslatiliyor...
start "Tahsilat Takip Sunucu" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"

echo Sunucu hazirlaniyor...
timeout /t 5 /nobreak >nul

:show_urls
echo.
echo Bilgisayar: %APP_URL%
echo Telefon icin ayni Wi-Fi aginda su adreslerden birini kullanin:
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = %APP_PORT%; Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } ^| ForEach-Object { Write-Host ('  http://' + $_.IPAddress + ':' + $port) }"
echo.
echo Tarayici aciliyor...
start "" "%APP_URL%"

endlocal
