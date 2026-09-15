@echo off
:: ============================================================================
:: iVentor Library Workstation - AutoStart Kiosk Shortcut Installer
:: ============================================================================
:: Places a startup shortcut into the Windows Startup folder so that whenever
:: the library counter workstation turns on, it launches straight into the
:: fullscreen library kiosk interface.
:: ============================================================================

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_SCRIPT=%~dp0launch-kiosk-edge.bat"
set "SHORTCUT_VBS=%TEMP%\CreateKioskShortcut.vbs"

echo Setting up AutoStart Kiosk for iVentor Library...
echo Target Script: %TARGET_SCRIPT%
echo Startup Directory: %STARTUP_FOLDER%

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_VBS%"
echo sLinkFile = "%STARTUP_FOLDER%\iVentor-Library-Kiosk.lnk" >> "%SHORTCUT_VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_VBS%"
echo oLink.TargetPath = "%TARGET_SCRIPT%" >> "%SHORTCUT_VBS%"
echo oLink.WorkingDirectory = "%~dp0" >> "%SHORTCUT_VBS%"
echo oLink.Description = "iVentor Dedicated Library Kiosk Terminal" >> "%SHORTCUT_VBS%"
echo oLink.Save >> "%SHORTCUT_VBS%"

cscript //nologo "%SHORTCUT_VBS%"
del "%SHORTCUT_VBS%"

echo.
echo [+] SUCCESS: iVentor Library Kiosk shortcut installed in Windows Startup.
echo     The computer will automatically boot directly into the counter on startup.
echo.
pause
