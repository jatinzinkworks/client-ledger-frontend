# Copies this repo to a short folder (default D:\cl) so the Android build stays under Windows'
# 260-character path limit. Generated folders are left out: `pnpm install` and the build
# recreate them, and pnpm's links in node_modules would still point at the old location.
#
#   powershell -ExecutionPolicy Bypass -File .\copy-repo.ps1 [-Destination D:\cl]
#
# Then: cd <destination>; pnpm install; pnpm build:apk
param(
  [string]$Destination = "D:\cl"
)

$ErrorActionPreference = "Stop"
$source = $PSScriptRoot
$mobile = Join-Path $source "apps\mobile"

if ($source.TrimEnd('\') -ieq $Destination.TrimEnd('\')) {
  Write-Error "Destination is the repo itself: $Destination"
}

# Directory names excluded anywhere, and folders excluded only under apps\mobile (a bare
# "android" would also skip any android folder elsewhere).
$excludeDirs = @(
  "node_modules",
  ".turbo",
  (Join-Path $mobile "android"),
  (Join-Path $mobile ".cxx"),
  (Join-Path $mobile ".expo"),
  (Join-Path $mobile "dist")
)

Write-Host "Copying $source -> $Destination"
robocopy $source $Destination /E /XD @excludeDirs /NFL /NDL /NP /R:2 /W:2

# robocopy: 0-7 = success (1 = files copied), 8+ = failure.
if ($LASTEXITCODE -ge 8) {
  Write-Error "robocopy failed with exit code $LASTEXITCODE"
}

$count = (Get-ChildItem $Destination -Recurse -File -Force | Measure-Object).Count
Write-Host ""
Write-Host "Done: $count files in $Destination"
Write-Host "Next:"
Write-Host "  cd $Destination"
Write-Host "  pnpm install"
Write-Host "  pnpm build:apk"
exit 0
