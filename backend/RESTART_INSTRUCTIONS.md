# 后端服务重启说明

## 问题描述
前端访问时出现多个 404 错误，涉及以下接口：
- `/api/practice/favorites` - 收藏功能
- `/api/practice/wrong-book` - 错题本功能
- `/api/practice/statistics` - 统计功能

## 已完成的修复
✅ 已在 `backend/main.go` 中添加练习功能路由
✅ 已重新编译后端程序 `practice-system.exe`

## 重启后端服务的步骤

### 方法 1：使用重启脚本（推荐）
1. 双击运行 `backend/restart-server.bat`
2. 脚本会自动停止旧服务并启动新服务

### 方法 2：手动重启
1. 打开任务管理器（Ctrl+Shift+Esc）
2. 找到 `practice-system.exe` 或 `go` 进程
3. 右键点击，选择"结束任务"
4. 打开新的 PowerShell 窗口
5. 运行以下命令：
   ```powershell
   cd C:\Users\Abell\OneDrive\Desktop\刷题\backend
   .\practice-system.exe
   ```

### 方法 3：使用命令行
1. 打开命令提示符或 PowerShell
2. 运行：
   ```cmd
   taskkill /F /IM practice-system.exe
   ```
3. 然后运行：
   ```cmd
   cd C:\Users\Abell\OneDrive\Desktop\刷题\backend
   practice-system.exe
   ```

## 验证修复
重启后端服务后：
1. 打开浏览器访问 http://localhost:5173/
2. 打开开发者工具（F12）-> Network 标签
3. 刷新页面，检查是否还有 404 错误
4. 测试收藏、错题本、统计等功能是否正常

## 修复后的路由列表
- ✅ GET `/api/practice/favorites` - 获取收藏列表
- ✅ POST `/api/practice/favorites` - 添加收藏
- ✅ DELETE `/api/practice/favorites/:id` - 删除收藏
- ✅ GET `/api/practice/wrong-book` - 获取错题本
- ✅ POST `/api/practice/wrong-book/:id/review` - 标记已复习
- ✅ GET `/api/practice/daily` - 获取每日练习
- ✅ GET `/api/practice/statistics` - 获取统计数据

## 注意事项
- 后端服务运行在 http://localhost:8080
- 前端服务运行在 http://localhost:5173
- 确保 8080 端口没有被其他程序占用
- 重启后端服务后，等待 2-3 秒让服务完全启动
