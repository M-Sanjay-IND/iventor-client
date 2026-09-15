@echo off
:: ============================================================================
:: iVentor Library Workstation - Task Manager & Ctrl+Alt+Del Shield Toggle
:: ============================================================================
:: Disables or enables Task Manager for the active Windows user.
:: Prevents students from opening Task Manager, killing the browser, or launching
:: unauthorized software on standard Windows accounts.
:: ============================================================================

echo ============================================================================
echo  iVentor Security Utility: Task Manager Lock / Unlock
echo ============================================================================
echo [1] LOCK Terminal (Disable Task Manager to prevent student tampering)
echo [2] UNLOCK Terminal (Re-enable Task Manager for staff maintenance)
echo ============================================================================
set /p choice="Enter option (1 or 2): "

if "%choice%"=="1" (
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f
    echo.
    echo [+] SUCCESS: Task Manager has been DISABLED for this user session.
    echo     Ctrl+Alt+Del -^> "Task Manager" is now blocked and greyed out.
    echo.
    pause
    exit /b
)

if "%choice%"=="2" (
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /t REG_DWORD /d 0 /f
    echo.
    echo [+] SUCCESS: Task Manager has been RE-ENABLED for staff administration.
    echo.
    pause
    exit /b
)

echo Invalid choice. Exiting.
pause
