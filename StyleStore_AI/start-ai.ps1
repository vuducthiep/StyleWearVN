param(
    [int]$Port = 8001,
    [switch]$Install
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = ".\.venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "[AI] Python venv not found. Creating .venv with Python 3.11..." -ForegroundColor Yellow
    py -3.11 -m venv .venv
}

if (-not (Test-Path $venvPython)) {
    throw "[AI] Could not create .venv. Make sure Python 3.11 is installed and available via 'py -3.11'."
}

if ($Install) {
    Write-Host "[AI] Installing dependencies from requirements.txt..." -ForegroundColor Cyan
    & $venvPython -m pip install --upgrade pip setuptools wheel
    & $venvPython -m pip install -r requirements.txt
}

Write-Host "[AI] Starting API on port $Port..." -ForegroundColor Green
& $venvPython -m uvicorn app.main:app --reload --port $Port
