# 清除 GitHub Git 凭证
# 在 PowerShell 中运行此脚本

Write-Host "正在清除 GitHub Git 凭证..." -ForegroundColor Yellow

# 方法 1: 使用 cmdkey 清除凭据
cmdkey /list | ForEach-Object {
    if ($_ -match "Target:.*github") {
        $match = $_ -match "Target:(.*)"
        $target = $matches[1].Trim()
        Write-Host "找到凭据：$target" -ForegroundColor Cyan
        cmdkey /delete:$target
        Write-Host "已删除：$target" -ForegroundColor Green
    }
}

# 方法 2: 清除 Git 凭证存储
$gitCredentialPath = "$env:USERPROFILE\.git-credentials"
if (Test-Path $gitCredentialPath) {
    Write-Host "删除 Git 凭证文件..." -ForegroundColor Yellow
    Remove-Item $gitCredentialPath -Force
    Write-Host "已删除：$gitCredentialPath" -ForegroundColor Green
}

Write-Host "`n凭证清除完成！" -ForegroundColor Green
Write-Host "`n下一步操作:" -ForegroundColor Cyan
Write-Host "1. 运行：git config --global user.email `"你的 GitHub 邮箱`"" -ForegroundColor White
Write-Host "2. 运行：git push -u origin master" -ForegroundColor White
Write-Host "3. 当提示输入密码时，使用 GitHub Personal Access Token（不是 GitHub 密码）" -ForegroundColor White
Write-Host "`n如果没有 Token，请访问：https://github.com/settings/tokens" -ForegroundColor White
Write-Host "创建一个新的 token，勾选 'repo' 权限" -ForegroundColor White
