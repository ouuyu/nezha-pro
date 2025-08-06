# Nezha Update Tool
# PowerShell script to download and install the latest version

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Nezha Update Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set variables
$GITHUB_REPO = "ouuyu/nezha-pro"
$DOWNLOAD_DIR = "$env:TEMP\nezha_update"
$EXE_NAME = "nezha-setup.exe"

# Create temporary download directory
if (!(Test-Path $DOWNLOAD_DIR)) {
    New-Item -ItemType Directory -Path $DOWNLOAD_DIR -Force | Out-Null
}

Write-Host "[INFO] Checking for latest version..." -ForegroundColor Green

try {
    # Get latest version information
    $apiUrl = "https://api.github.com/repos/$GITHUB_REPO/releases/latest"
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    
    # Find the .exe download URL
    $downloadUrl = $null
    foreach ($asset in $response.assets) {
        if ($asset.name -like "*.exe") {
            $downloadUrl = $asset.browser_download_url
            break
        }
    }
    
    if ($null -eq $downloadUrl) {
        Write-Host "[ERROR] No downloadable exe file found" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "[INFO] Download URL: $downloadUrl" -ForegroundColor Green
    Write-Host "[INFO] Starting download of the latest version..." -ForegroundColor Green
    
    # Download file
    $downloadPath = Join-Path $DOWNLOAD_DIR $EXE_NAME
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    
    Write-Host "[SUCCESS] Download complete!" -ForegroundColor Green
    Write-Host "[INFO] Starting installer..." -ForegroundColor Green
    
    # Start installer
    Start-Process -FilePath $downloadPath -ArgumentList "/S"
    
    Write-Host "[INFO] Installer has been started" -ForegroundColor Green
    Write-Host "[PROMPT] Please follow the installation wizard to complete the update" -ForegroundColor Yellow
    Write-Host ""
    
    # Clean up temporary files
    Start-Sleep -Seconds 3
    if (Test-Path "$DOWNLOAD_DIR\latest.json") {
        Remove-Item "$DOWNLOAD_DIR\latest.json" -Force
    }
    
    Write-Host "[INFO] The update tool will now exit..." -ForegroundColor Green
    Start-Sleep -Seconds 2
    
} catch {
    Write-Host "[ERROR] Failed to download or install update: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
