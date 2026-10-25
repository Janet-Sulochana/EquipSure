param(
    [string]$RootPath = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$BackendHost = 'localhost',
    [int]$BackendPort = 5000,
    [int]$FrontendPort = 3000,
    [string]$RedisHost = 'localhost',
    [int]$RedisPort = 6379,
    [string]$PostgresHost = 'localhost',
    [int]$PostgresPort = 5432,
    [string]$PostgresUser = 'postgres',
    [string]$PostgresPassword = 'janet@2214',
    [string]$PostgresDb = 'equipsuredb',
    [string]$JwtSecret = 'equipsure_super_secret_jwt_key_2026_healthcare_security',
    [string]$JwtExpiresIn = '7d'
)

$backendPath = Join-Path $RootPath "backend"
$frontendPath = Join-Path $RootPath "frontend"

Write-Host "Checking EquipSure prerequisites..."

Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match 'OneDrive\\Desktop\\EquipSure' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$redisCandidates = @(
    (Get-Command redis-server -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
    "C:\Program Files\Redis\redis-server.exe",
    "C:\Program Files (x86)\Redis\redis-server.exe"
)

$redisExe = $redisCandidates |
    Where-Object { $_ -and (Test-Path $_) } |
    Select-Object -First 1

if (-not $redisExe) {
    Write-Host "Redis was not found in PATH or the standard install location. Please install Redis first."
    exit 1
}

$redisProcess = Get-Process -Name redis-server -ErrorAction SilentlyContinue
if (-not $redisProcess) {
    Write-Host "Starting Redis on ${RedisHost}:${RedisPort}..."
    Start-Process -FilePath $redisExe -ArgumentList '--port', $RedisPort.ToString(), '--bind', $RedisHost -WindowStyle Hidden
}
else {
    Write-Host "Redis is already running on ${RedisHost}:${RedisPort}."
}

if (-not (Test-Path (Join-Path $backendPath 'node_modules'))) {
    Write-Host "Installing backend dependencies..."
    Push-Location $backendPath
    npm install
    Pop-Location
}

if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
    Write-Host "Installing frontend dependencies..."
    Push-Location $frontendPath
    npm install
    Pop-Location
}

$backendCommand = @"
Set-Location '$backendPath'
`$env:PORT = '$BackendPort'
`$env:NODE_ENV = 'development'
`$env:PGHOST = '$PostgresHost'
`$env:PGPORT = '$PostgresPort'
`$env:PGUSER = '$PostgresUser'
`$env:PGPASSWORD = '$PostgresPassword'
`$env:PGDATABASE = '$PostgresDb'
`$env:REDIS_URL = 'redis://${RedisHost}:${RedisPort}'
`$env:JWT_SECRET = '$JwtSecret'
`$env:JWT_EXPIRES_IN = '$JwtExpiresIn'
npm run dev
"@

$frontendCommand = @"
Set-Location '$frontendPath'
npm run dev -- --host 0.0.0.0 --port $FrontendPort
"@

Write-Host "Starting backend..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

Write-Host "Starting frontend..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host ""
Write-Host "EquipSure is starting..."
Write-Host "Backend: http://${BackendHost}:${BackendPort}"
Write-Host "Frontend: http://${BackendHost}:${FrontendPort}"
Write-Host "Redis: ${RedisHost}:${RedisPort}"
Write-Host "Use Ctrl+C in each launcher window to stop the app."
