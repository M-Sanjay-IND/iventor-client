@echo off
:: ============================================================================
:: iVentor Library Workstation - Stop Kiosk Watchdog
:: ============================================================================
:: Cleanly terminates any running kiosk browser and watchdog script
:: so staff can access the Windows desktop for maintenance.
:: ============================================================================

echo Terminating iVentor Kiosk Terminal processes...
taskkill /F /IM msedge.exe /FI "WINDOWTITLE eq *iVentor*" 2>nul
taskkill /F /IM msedge.exe 2>nul
taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq *iVentor*" 2>nul

echo.
echo [+] Kiosk stopped. Windows Desktop is now accessible for staff maintenance.
echo     Run scripts\launch-kiosk-edge.bat when ready to resume student circulation.
echo.
pause
