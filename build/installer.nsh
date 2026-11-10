!macro preInit
  nsExec::ExecToLog 'taskkill /F /IM "Tahsilat Takip.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "electron.exe" /T'
  Sleep 2000
!macroend

!macro customCheckAppRunning
  DetailPrint "Arka plan surecleri kapatiliyor..."
  nsExec::ExecToLog 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  nsExec::ExecToLog 'taskkill /F /IM "electron.exe" /T'
  Sleep 2000
  nsExec::ExecToLog 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
  Sleep 1000
!macroend
