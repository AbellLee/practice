# Git 403 错误解决方案

## 问题描述
```
remote: Permission to AbellLee/practice.git denied to AbellLee.
fatal: unable to access 'https://github.com/AbellLee/practice.git/': The requested URL returned error: 403
```

## 已完成的操作
✅ 清除了 Git 代理配置
✅ 清除了 Windows 凭据管理器中的 GitHub 凭证
✅ 配置了 Git 用户名：AbellLee

## 需要手动完成的步骤

### 步骤 1：设置 GitHub 邮箱
在 PowerShell 中运行：
```powershell
git config --global user.email "你的 GitHub 注册邮箱"
```

### 步骤 2：获取 Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 **"Generate new token (classic)"**
3. 填写备注（如："Git Desktop"）
4. 选择过期时间（建议 90 天）
5. **勾选权限**（只需勾选这一个）：
   - ✅ **`repo`** (Full control of private repositories)
   - ⚠️ 不需要其他权限，`repo` 已包含 push/pull 所需的所有权限
6. 点击 **"Generate token"**
7. **复制 Token**（以 `ghp_` 开头，只显示一次！）

#### Token 权限说明

| 权限 | 用途 | 是否需要 |
|------|------|----------|
| `repo` | 读写私有和公共仓库 | ✅ **必需** |
| `workflow` | 管理 GitHub Actions | ❌ 不需要 |
| `write:packages` | 发布包 | ❌ 不需要 |
| `user` | 读取用户信息 | ❌ 不需要 |

**最小权限原则**：只勾选 `repo` 就足够进行代码 push/pull 操作。

### 步骤 3：重新 Push 代码

```powershell
cd C:\Users\Abell\OneDrive\Desktop\刷题
git push -u origin master
```

当提示输入凭证时：
- **Username**: `AbellLee`
- **Password**: 粘贴刚才复制的 Token（输入时不会显示字符）

## 常见问题

### Q: 如果还是 403 错误怎么办？
A: 确保：
1. Token 有 `repo` 权限
2. Token 没有过期
3. 用户名正确（区分大小写）

### Q: Token 丢失了怎么办？
A: 需要重新生成一个新的 Token，旧的会失效。

### Q: 可以不用 Token 吗？
A: 不可以，GitHub 从 2021 年 8 月起已不再支持密码验证。

## 验证配置

```powershell
# 查看 Git 配置
git config --global --list

# 测试连接
git remote -v
```

## 参考链接
- GitHub Token 文档：https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- Git 凭证管理：https://docs.github.com/en/get-started/getting-started-with-git/caching-your-github-credentials-in-git
