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

$redisExe = "C:\Program Files\Redis\redis-server.exe"
$backendPath = Join-Path $RootPath "backend"
$frontendPath = Join-Path $RootPath "frontend"

if (Test-Path $redisExe) {
    $redisProcess = Get-Process -Name redis-server -ErrorAction SilentlyContinue
    if (-not $redisProcess) {
        Write-Host "Starting Redis on $RedisHost:$RedisPort..."
        Start-Process -FilePath $redisExe -WindowStyle Hidden
    }
    else {
        Write-Host "Redis is already running on $RedisHost:$RedisPort."
    }
}
else {
    Write-Host "Redis was not found at $redisExe. Please install Redis first."
    exit 1
}

$backendCommand = @"
cd '$backendPath'
`$env:PORT = '$BackendPort'
`$env:NODE_ENV = 'development'
`$env:PGHOST = '$PostgresHost'
`$env:PGPORT = '$PostgresPort'
`$env:PGUSER = '$PostgresUser'
`$env:PGPASSWORD = '$PostgresPassword'
`$env:PGDATABASE = '$PostgresDb'
`$env:REDIS_URL = 'redis://$RedisHost:$RedisPort'
`$env:JWT_SECRET = '$JwtSecret'
`$env:JWT_EXPIRES_IN = '$JwtExpiresIn'
npm run dev
"@

$frontendCommand = @"
cd '$frontendPath'
npm run dev -- --host 0.0.0.0 --port $FrontendPort
"@

Write-Host "Starting backend..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

Write-Host "Starting frontend..."
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand

Write-Host ""
Write-Host "EquipSure is starting..."
Write-Host "Backend: http://$BackendHost:$BackendPort"
Write-Host "Frontend: http://$BackendHost:$FrontendPort"
Write-Host "Redis: $RedisHost:$RedisPort"
