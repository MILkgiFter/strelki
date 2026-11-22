# Ключ подписи для Google Play (п. 12.7): создаётся один раз, android\upload-key.jks.
# Пароль вводишь ты сам (keytool спросит дважды) — придумай надёжный и сохрани в менеджере паролей.
# Ключ и пароль нужны для каждого обновления игры; файл ключа сделай копию (облако/флешка). В git он не попадает.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$key = Join-Path $root 'android\upload-key.jks'
if (Test-Path $key) { throw "Ключ уже есть: $key — второй не нужен" }
& 'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe' -genkeypair -v `
  -keystore $key -storetype PKCS12 -alias upload -keyalg RSA -keysize 2048 -validity 10000 `
  -dname 'CN=Strelki, O=Strelki, C=RU'
if ($LASTEXITCODE -ne 0) { throw 'keytool упал' }
Write-Host "Ключ создан: $key — сделай резервную копию файла и сохрани пароль."
