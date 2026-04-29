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

# Start uvicorn in background
$uvicornProcess = Start-Process -FilePath $venvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", $Port -PassThru -NoNewWindow

# Wait for server to be ready
Write-Host "[AI] Waiting for server to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retries = 0
$serverReady = $false

while ($retries -lt $maxRetries -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "[AI] Server is ready!" -ForegroundColor Green
        }
    } catch {
        $retries++
        Start-Sleep -Seconds 1
    }
}

if ($serverReady) {
    Write-Host "[AI] Running reindex..." -ForegroundColor Cyan
    try {
        $reindexResponse = Invoke-RestMethod -Uri "http://localhost:$Port/reindex" -Method Post -ErrorAction SilentlyContinue
        Write-Host "[AI] Reindex completed: $($reindexResponse.indexed_products) products indexed" -ForegroundColor Green
    } catch {
        Write-Host "[AI] Reindex failed (non-critical): $_" -ForegroundColor Yellow
    }
}

Write-Host "[AI] Server running on http://localhost:$Port" -ForegroundColor Green
Write-Host "[AI] Press Ctrl+C to stop" -ForegroundColor Yellow

# Keep the script running and handle Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
        if ($uvicornProcess.HasExited) {
            Write-Host "[AI] Server process ended unexpectedly" -ForegroundColor Red
            exit 1
        }
    }
} finally {
    $uvicornProcess.Kill()
}
