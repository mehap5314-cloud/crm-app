# ========================================
#  CRM - Package for upload to a server
#  Creates crm-deploy.zip (source only)
# ========================================
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$src = (Resolve-Path "$PSScriptRoot\..").Path
$dest = Join-Path $PSScriptRoot "crm-deploy"
$zipPath = Join-Path $PSScriptRoot "crm-deploy.zip"

$excludeDirs = @('node_modules', '.next', 'data', '.git', '.vercel', 'scripts', 'deploy')

function CopyTree($from, $to) {
  New-Item -ItemType Directory -Force $to | Out-Null
  Get-ChildItem -LiteralPath $from -Force | ForEach-Object {
    if ($excludeDirs -contains $_.Name) { return }
    if ($_.PSIsContainer) {
      CopyTree $_.FullName (Join-Path $to $_.Name)
    } else {
      if ($_.Name -like '*.zip' -or $_.Name -eq 'server.log') { return }
      Copy-Item -LiteralPath $_.FullName -Destination $to -Force
    }
  }
}

Write-Host "Packaging CRM app..." -ForegroundColor Cyan

if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

CopyTree $src $dest
Compress-Archive -Path "$dest\*" -DestinationPath $zipPath
Remove-Item -Recurse -Force $dest

$size = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "OK: $zipPath ($size MB)" -ForegroundColor Green
Write-Host "Next: upload this zip to your server (see ORACLE-GUIDE.md step 5)"
