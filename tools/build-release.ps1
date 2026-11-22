# Подписанная сборка для Google Play (п. 12.7): веб-сборка → android → app-release.aab.
# Пароль ключа спрашивается скрытым вводом и живёт только в этом окне, на диск не пишется.
# Запуск из корня проекта: .\tools\build-release.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Test-Path 'android\upload-key.jks')) { throw 'Нет ключа: сначала .\tools\make-upload-key.ps1' }

$sec = Read-Host 'Пароль ключа подписи' -AsSecureString
$env:STRELKI_KEY_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'npm run build упал' }
  npx cap sync android
  if ($LASTEXITCODE -ne 0) { throw 'cap sync упал' }
  Set-Location (Join-Path $root 'android')
  .\gradlew.bat bundleRelease
  if ($LASTEXITCODE -ne 0) { throw 'gradle упал (неверный пароль?)' }
} finally {
  Remove-Item Env:STRELKI_KEY_PASS -ErrorAction SilentlyContinue
  Set-Location $root
}
$aab = Join-Path $root 'android\app\build\outputs\bundle\release\app-release.aab'
Write-Host "AAB готов: $aab ($([math]::Round((Get-Item $aab).Length / 1MB, 1)) МБ)"
