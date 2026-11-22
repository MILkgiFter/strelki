# Сборка Android-приложения (п. 12.5): веб-сборка → копия в android/ → отладочный APK.
# Запуск из корня проекта: .\tools\build-android.ps1
# Готовый файл: android\app\build\outputs\apk\debug\app-debug.apk
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# JDK из Android Studio (системная Java 8 для Gradle слишком старая)
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'

npm run build
if ($LASTEXITCODE -ne 0) { throw 'npm run build упал' }
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw 'cap sync упал' }

Set-Location (Join-Path $root 'android')
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { throw 'gradle упал' }

$apk = Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk'
Write-Host "APK готов: $apk ($([math]::Round((Get-Item $apk).Length / 1MB, 1)) МБ)"
Set-Location $root
