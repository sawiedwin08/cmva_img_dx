@echo off
echo ============================================
echo   CMVA - Imagenes Diagnosticas - Rayos X
echo ============================================
echo.
echo Iniciando servidor web...
echo.
cd /d "%~dp0"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
