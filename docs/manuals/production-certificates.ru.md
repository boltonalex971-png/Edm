# Установка сертификатов EDM в production — руководство администратора

В этом документе описана выдача X.509-сертификатов, которые EDM использует для взаимной TLS-аутентификации между узлами. Выполняйте инструкцию перед первым развёртыванием на новом объекте и повторно при приближении срока действия сертификата любого узла.

Архитектурные обоснования (зачем mTLS, какие схемы аутентификации обрабатывают какой трафик, как работает список доверенных служб) — см. `docs/specs/auth-implementation-spec.md`.

---

## 1. Модель доверия — кратко

Каждый узел EDM на объекте предъявляет серверный сертификат на `GrpcSecure` (по умолчанию `:16334`) и тот же сертификат используется как клиентский при обращении к другим узлам (подписка на головной IntercomHub, gRPC-вызовы к соседям). Серверный обработчик схемы `Certificate` принимает соединение только если CN (или полный Subject DN) предъявленного сертификата находится в списке `Edm:Auth:RemoteServices` принимающего узла, либо совпадает с именем хоста из `Edm:Intercom:Principal` (доверяется автоматически).

Каждому узлу нужны:

| Хранилище                    | Сертификат                                | Назначение                              |
|------------------------------|-------------------------------------------|-----------------------------------------|
| `LocalMachine\Root`          | Публичный сертификат CA объекта           | Якорь доверия для построения цепочки    |
| `LocalMachine\My`            | Конечный сертификат узла (`CN=<имя>`)     | Серверный сертификат + исходящий клиентский |

Закрытый ключ CA объекта хранится **только на рабочей станции администратора**, на узлах EDM его не должно быть. Узлам нужен только публичный сертификат CA.

Соглашение: CN сертификата каждого узла равен его DNS-имени. URL `Principal` строится из этого имени. Поэтому для каждого периферийного узла достаточно прописать `Principal` один раз — CN администраторского узла будет добавлен в список доверенных автоматически.

---

## 2. Предварительные требования

- Рабочая станция администратора с PowerShell 5.1 или выше. На ней генерируется CA и выпускаются конечные сертификаты.
- Локальные права администратора на каждом узле EDM (установка сертификата, ACL ключа, перезапуск службы).
- Зафиксированные DNS-имена для всех узлов EDM объекта, разрешимые с любого другого узла.
- Учётная запись Windows, под которой запускается служба `edm` на каждом узле. По умолчанию после установки MSI — `LocalSystem`. Если используется доменная сервисная учётная запись — её точное имя в формате `ДОМЕН\пользователь`.

---

## 3. Однократная подготовка объекта — выпуск CA

Выполняется **один раз на объект**, на рабочей станции администратора, в PowerShell с правами администратора. Закрытый ключ CA остаётся на этой станции; сделайте резервную копию во внешнее защищённое хранилище.

```powershell
$ca = New-SelfSignedCertificate `
    -Subject "CN=EDM Site CA" `
    -KeyUsage CertSign, CRLSign, DigitalSignature `
    -KeyAlgorithm RSA -KeyLength 4096 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(20)

# Экспорт закрытого ключа CA (PFX) для резервного копирования. Пароль положите в хранилище секретов.
$pwd = Read-Host -AsSecureString "Пароль PFX для CA"
Export-PfxCertificate -Cert $ca -FilePath "C:\edm-pki\edm-site-ca.pfx" -Password $pwd | Out-Null

# Экспорт публичного сертификата CA (CER) для распространения по узлам.
Export-Certificate -Cert $ca -FilePath "C:\edm-pki\edm-site-ca.cer" | Out-Null

"Отпечаток CA: $($ca.Thumbprint)"
```

Результаты:
- `edm-site-ca.pfx` — поместить в защищённое внешнее резервное хранилище.
- `edm-site-ca.cer` — скопировать на каждый узел EDM.

---

## 4. Настройка узла

Повторите для **каждого** узла EDM объекта (и администраторского, и периферийных).

### 4.1 Установка публичного сертификата CA в Root узла

На узле EDM с правами администратора:

```powershell
Import-Certificate -FilePath "\\share\edm-pki\edm-site-ca.cer" -CertStoreLocation Cert:\LocalMachine\Root
```

Проверка:

```powershell
Get-ChildItem Cert:\LocalMachine\Root | Where-Object Subject -eq 'CN=EDM Site CA'
```

### 4.2 Выпуск конечного сертификата узла

Выберите один из двух вариантов.

**Вариант A — выпуск на рабочей станции администратора, доставка PFX-ом.** Рекомендуется при централизованном хранении закрытого ключа CA.

На рабочей станции администратора (с правами администратора):

```powershell
$ca = Get-ChildItem Cert:\LocalMachine\My | Where-Object Subject -eq 'CN=EDM Site CA'

# Замените на DNS-имя целевого узла
$hostName = 'edm-host-01.contoso.local'

$cert = New-SelfSignedCertificate `
    -Subject "CN=$hostName" `
    -DnsName $hostName, $hostName.Split('.')[0] `
    -Signer $ca `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(2)

$pwd = Read-Host -AsSecureString "Пароль PFX для $hostName"
Export-PfxCertificate -Cert $cert -FilePath "C:\edm-pki\$hostName.pfx" -Password $pwd | Out-Null

# Удалите временную копию из My рабочей станции; CA остаётся.
Remove-Item -Path "Cert:\LocalMachine\My\$($cert.Thumbprint)" -Force
"Отпечаток выпущенного сертификата: $($cert.Thumbprint)"
```

Затем на целевом узле EDM (с правами администратора):

```powershell
$pwd = Read-Host -AsSecureString "Пароль PFX"
Import-PfxCertificate -FilePath "\\share\edm-pki\edm-host-01.contoso.local.pfx" `
    -CertStoreLocation Cert:\LocalMachine\My `
    -Password $pwd `
    -Exportable
```

**Вариант B — выпуск непосредственно на узле EDM.** Применять только когда PFX от CA безопасно доступен на этом узле (например, небольшое одноузловое внедрение).

На узле EDM (с правами администратора):

```powershell
$pwd = Read-Host -AsSecureString "Пароль PFX от CA"
$ca = Import-PfxCertificate -FilePath "\\share\edm-pki\edm-site-ca.pfx" `
    -CertStoreLocation Cert:\LocalMachine\My -Password $pwd -Exportable

$hostName = $env:COMPUTERNAME  # либо полное DNS-имя
$cert = New-SelfSignedCertificate `
    -Subject "CN=$hostName" `
    -DnsName $hostName `
    -Signer $ca `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(2)

# Удалите CA из My узла — в штатном режиме его там быть не должно.
Remove-Item -Path "Cert:\LocalMachine\My\$($ca.Thumbprint)" -Force
"Отпечаток выпущенного сертификата: $($cert.Thumbprint)"
```

### 4.3 Проверка EKU

Конечный сертификат **обязан** иметь оба EKU: Server Authentication и Client Authentication. Без Client Auth служба EDM не сможет аутентифицироваться на других узлах.

```powershell
$cert = Get-ChildItem Cert:\LocalMachine\My | Where-Object Subject -eq "CN=$env:COMPUTERNAME"
($cert.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.37' }).EnhancedKeyUsages |
    ForEach-Object { "$($_.FriendlyName) ($($_.Value))" }
```

Ожидаемый вывод (обе строки должны присутствовать):

```
Server Authentication (1.3.6.1.5.5.7.3.1)
Client Authentication (1.3.6.1.5.5.7.3.2)
```

### 4.4 Предоставление доступа к закрытому ключу служебной учётной записи

CNG-ключи по умолчанию доступны только `SYSTEM` и `Administrators`. Если служба EDM запускается под другой учётной записью, она не сможет прочитать ключ, Kestrel не сможет предъявить серверный сертификат, и TLS-соединение оборвётся с сообщением "EOF or 0 bytes from the transport stream".

```powershell
$thumb = $cert.Thumbprint
$out = certutil -store My $thumb
$keyName = (($out | Select-String 'Unique container name') -replace '.*:\s*', '').Trim()
$keyPath = Join-Path "$env:ProgramData\Microsoft\Crypto\Keys" $keyName

# Учётная запись службы:
#   'NT AUTHORITY\SYSTEM'  — стандартная установка через MSI,
#   'ДОМЕН\svc-edm$'       — доменная сервисная учётная запись и т.д.
$serviceAccount = 'NT AUTHORITY\SYSTEM'
icacls $keyPath /grant ($serviceAccount + ':(R)')
```

Шаг можно пропустить только если служба EDM запускается под `LocalSystem` (он по умолчанию входит в `Administrators`).

### 4.5 Настройка `appsettings.json` на узле

Отредактируйте `appsettings.json` (или `appsettings.Production.json`) в каталоге установки EDM. Установщик MSI обычно заполняет большинство полей подстановкой токенов, так что вручную обычно нужно править только `Edm:Auth:RemoteServices` и `Edm:Intercom:Principal`.

```json
"Kestrel": {
  "Endpoints": {
    "GrpcSecure": {
      "Url": "https://0.0.0.0:16334",
      "SslProtocols": [ "Tls12", "Tls13" ],
      "Protocols": "Http1AndHttp2",
      "ClientCertificateMode": "AllowCertificate"
    },
    "Https": { "Url": "https://0.0.0.0:16332", "Protocols": "Http1" }
  },
  "Certificates": {
    "Default": {
      "AllowInvalid": true,
      "Location": "LocalMachine",
      "Store": "My",
      "Subject": "edm-host-01.contoso.local"
    }
  }
},
"Edm": {
  "Intercom": {
    "Kind": "SignalR",
    "Principal": "https://edm-admin.contoso.local:16334"
  },
  "Auth": {
    "RemoteServices": [
      "edm-host-01.contoso.local",
      "edm-host-02.contoso.local"
    ]
  }
}
```

Замечания:
- `Subject` должен в точности совпадать с CN конечного сертификата узла.
- `Principal` — URL головного IntercomHub — обычно администраторский узел на порту `:16334`. Его CN добавляется в `RemoteServices` автоматически, повторно перечислять не нужно.
- `RemoteServices` содержит каждый **другой** периферийный узел, который может вызывать данный. На администраторском узле должны быть перечислены все периферийные драйверные узлы; периферийному узлу обычно нужен только администраторский (и тот уже покрыт неявной записью `Principal`).

### 4.6 Перезапуск службы EDM

```powershell
Restart-Service edm
```

Kestrel и `ClientCertificateProvider` загружают сертификат на старте. Изменение конфигурации или сертификата требует перезапуска службы.

---

## 5. Проверка

После перезапуска посмотрите журнал EDM в Event Viewer: **Microprojects > EDM Service**. Корректный старт показывает:

```
Client cert loaded: subject='CN=<имя_узла>', thumbprint=<...>
Successfully connected to hub channel <канал>
```

Краткий справочник по ошибкам:

| Сообщение в журнале EDM                                       | Вероятная причина                                            |
|---------------------------------------------------------------|--------------------------------------------------------------|
| `EOF or 0 bytes from the transport stream`                    | Закрытый ключ серверного сертификата недоступен сервисной учётной записи (пропущен §4.4). |
| `RevocationStatusUnknown` от CertificateAuthenticationHandler | Недоступна точка распространения CRL; на приватном CA этого быть не должно — проверьте, что параметр `RevocationMode=NoCheck` не удалён из `Program.cs`. |
| `Certificate not allowed`                                     | CN сертификата вызывающего узла отсутствует в `RemoteServices` и не совпадает с хостом `Principal`. |
| `401 Unauthorized` при подключении к Hub                      | Исходящий сертификат не имеет EKU Client Authentication (пропущен §4.3). |
| `Client cert not found in LocalMachine\My`                    | Несоответствие subject между `Kestrel:Certificates:Default:Subject` и CN установленного сертификата. |

---

## 6. Процедура продления

В этом руководстве конечные сертификаты по умолчанию выпускаются на **2 года**, CA — на **20 лет**. Продлевайте конечные сертификаты не менее чем за 30 дней до окончания срока.

Для каждого узла, чей сертификат истекает:

1. Повторите §4.2 с тем же DNS-именем (выпускается новый сертификат; старый остаётся в хранилище до удаления).
2. Повторите §4.4, чтобы дать сервисной учётной записи доступ к новому закрытому ключу.
3. Опционально — удалите старый сертификат:
   ```powershell
   Get-ChildItem Cert:\LocalMachine\My |
       Where-Object { $_.Subject -eq "CN=$hostName" -and $_.NotAfter -lt (Get-Date) } |
       ForEach-Object { Remove-Item -Path $_.PSPath -Force }
   ```
4. `Restart-Service edm`.

CA объекта при продлении конечных сертификатов **не** ротируется. Ротация CA — отдельная, более масштабная процедура: выпустить новый CA, разнести его публичный сертификат на все узлы в `Root`, перевыпустить все конечные сертификаты, затем удалить старый CA из `Root`.

---

## 7. Резервное копирование и восстановление

| Объект                            | Где хранится                                | Цель резервного копирования                |
|-----------------------------------|---------------------------------------------|--------------------------------------------|
| Закрытый ключ CA объекта          | `C:\edm-pki\edm-site-ca.pfx` (рабочая станция администратора) | Внешнее защищённое хранилище     |
| Публичный сертификат CA объекта   | `C:\edm-pki\edm-site-ca.cer` (рабочая станция администратора) | Внешнее хранилище + общий ресурс установки |
| PFX конечных сертификатов узлов   | `C:\edm-pki\<имя_узла>.pfx` (рабочая станция администратора) | Опционально; можно перевыпустить из CA      |

Потеря PFX от CA означает невозможность выпускать новые конечные сертификаты в текущей цепочке доверия — каждому узлу потребуется новый CA и новый конечный сертификат. Обращайтесь с PFX от CA так же, как с паролем доменного администратора.
