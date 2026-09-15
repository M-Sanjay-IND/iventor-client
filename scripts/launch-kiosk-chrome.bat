@echo off
:: ============================================================================
:: iVentor Library Counter - Google Chrome Fullscreen Kiosk Launcher
:: ============================================================================
:: Launches Google Chrome in kiosk app mode without address bar or devtools.
:: ============================================================================

SET TARGET_URL=%1
IF "%TARGET_URL%"=="" SET TARGET_URL=http://localhost:5173/counter

echo ========================================================
echo  iVentor Library Terminal - Kiosk Watchdog (Chrome)
echo  Target: %TARGET_URL%
echo ========================================================
echo.
echo [!] ANTI-TAMPER WATCHDOG ACTIVE:
echo     If the kiosk window is closed (e.g. via Alt+F4), it
echo     will automatically relaunch within 1 second.
echo.

:KioskWatchdogLoop
start /wait chrome.exe --kiosk --app="%TARGET_URL%" --no-first-run --disable-pinch --overscroll-history-navigation=0 --kiosk-printing

cls
echo ============================================================================
echo  iVentor Library Terminal - Staff Exit Gate (Chrome)
echo ============================================================================
echo.
echo  [!] The kiosk was closed.
echo      Staff: Enter Staff PIN to exit to Windows Desktop.
echo      Students: Terminal will automatically relaunch if PIN is not entered.
echo.
set "STAFF_INPUT="
set /p STAFF_INPUT="Enter 4-Digit Staff PIN (default: 8821): "

if "%STAFF_INPUT%"=="8821" (
    echo.
    echo [+] Staff PIN verified. Kiosk terminated.
    echo.
    pause
    exit /b
)

echo Invalid PIN or cancelled. Auto-recovering terminal in 1 second...
timeout /t 1 /nobreak >nul
goto KioskWatchdogLoop
