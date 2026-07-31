param(
    [Parameter(Mandatory = $false)]
    [string]$RepositoryPath = "."
)

$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $PSScriptRoot
$destination = (Resolve-Path $RepositoryPath).Path

if (-not (Test-Path (Join-Path $destination ".git"))) {
    throw "The destination is not a Git repository: $destination"
}

Write-Host "Applying TRW-001 v1.0.1 to $destination" -ForegroundColor Cyan

Get-ChildItem -Path $source -Force |
    Where-Object { $_.Name -notin @(".git", "node_modules", ".env") } |
    ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $destination -Recurse -Force
    }

Write-Host "Update applied. Review changes with: git status" -ForegroundColor Green
