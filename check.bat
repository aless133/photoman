call npx tsc --noEmit
if errorlevel 1 goto :failed

call npm run lint
if errorlevel 1 goto :failed

call npm run package
if errorlevel 1 goto :failed

call npm start
if errorlevel 1 goto :failed

exit /b 0

:failed
set "exit_code=%errorlevel%"
echo.
echo Проверка завершилась с ошибкой %exit_code%.
exit /b %exit_code%