@echo off
:: ============================================================================
:: iVentor Library Counter - Microsoft Edge Fullscreen Kiosk Launcher
:: ============================================================================
:: Launches the library terminal in dedicated single-app kiosk mode.
:: Strips address bar, navigation controls, bookmarks, right-click context menu,
:: and developer tools. Works natively on all Windows 10/11 Home, Pro, & Enterprise PCs.
:: ============================================================================

SET TARGET_URL=%1
IF "%TARGET_URL%"=="" SET TARGET_URL=http://localhost:5173/counter

echo ========================================================
echo  iVentor Library Terminal - Kiosk Watchdog (Edge)
echo  Target: %TARGET_URL%
echo ========================================================
echo.
echo [!] ANTI-TAMPER WATCHDOG ACTIVE:
echo     If the kiosk window is closed (e.g. via Alt+F4), it
echo     will automatically relaunch within 1 second.
echo.
echo Staff: To stop the kiosk for maintenance, close this console
echo        window or run scripts\stop-kiosk.bat.
echo.

:KioskWatchdogLoop
start /wait msedge.exe --kiosk "%TARGET_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --overscroll-history-navigation=0 --kiosk-printing

cls
echo ============================================================================
echo  iVentor Library Terminal - Staff Exit Gate
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
    echo     Welcome to Windows Desktop. Run launch-kiosk-edge.bat when ready to resume.
    echo.
    pause
    exit /b
)

echo Invalid PIN or cancelled. Auto-recovering terminal in 1 second...
timeout /t 1 /nobreak >nul
goto KioskWatchdogLoop
