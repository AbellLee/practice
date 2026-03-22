# 后端服务重启脚本
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   刷题系统 - 后端服务重启工具" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 获取当前脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$exePath = Join-Path $scriptPath "practice-system.exe"

# 步骤 1: 停止旧服务
Write-Host "[1/3] 正在停止旧服务..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object { $_.ProcessName -like "*practice-system*" }
if ($processes.Count -gt 0) {
    foreach ($process in $processes) {
        Write-Host "  停止进程：$($process.Name) (PID: $($process.Id))" -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force
    }
    Write-Host "  旧服务已停止" -ForegroundColor Green
} else {
    Write-Host "  未发现运行中的服务" -ForegroundColor Gray
}

# 等待端口释放
Write-Host "  等待端口释放..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# 步骤 2: 启动新服务
Write-Host ""
Write-Host "[2/2] 启动新服务..." -ForegroundColor Yellow
if (Test-Path $exePath) {
    Start-Process -FilePath $exePath -WindowStyle Normal
    Write-Host "  服务已启动" -ForegroundColor Green
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "   后端服务运行中" -ForegroundColor Green
    Write-Host "   地址：http://localhost:8080" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
} else {
    Write-Host "  错误：找不到 practice-system.exe" -ForegroundColor Red
    Write-Host "  请先运行：go build -o practice-system.exe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
