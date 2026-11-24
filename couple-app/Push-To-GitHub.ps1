param(
    [string]$RepoUrl = "https://github.com/Dennis3337000/coupleapp.git"
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Fuege alle Aenderungen hinzu..." -ForegroundColor Cyan
git add .
$msg = Read-Host "Commit-Nachricht (Enter fuer Standard)"
if ([string]::IsNullOrWhiteSpace($msg)) {
    $msg = "Update Couple Link App: $(Get-Date -Format 'dd.MM.yyyy HH:mm')"
}
git commit -m $msg

Write-Host "Pushe auf GitHub ($RepoUrl)..." -ForegroundColor Cyan
try {
    $cred = ("protocol=https`nhost=github.com" | git credential-manager get)
    $user = ($cred | Select-String "username=(.*)").Matches.Groups[1].Value
    $token = ($cred | Select-String "password=(.*)").Matches.Groups[1].Value
    if ($user -and $token) {
        git push "https://${user}:${token}@github.com/Dennis3337000/coupleapp.git" main:main -u
    } else {
        git push -u origin main
    }
} catch {
    git push -u origin main
} finally {
    git remote set-url origin $RepoUrl
}

Write-Host "Erfolgreich auf GitHub gepusht! ($RepoUrl)" -ForegroundColor Green
