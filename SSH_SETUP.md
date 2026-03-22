# SSH 方式配置 Git（一劳永逸）

## 为什么需要 SSH？

GitHub **不支持**直接使用账号密码进行 HTTPS Git 操作，只接受：
- ✅ Personal Access Token（代替密码）
- ✅ SSH 密钥

## 方式对比

| 方式 | 优点 | 缺点 |
|------|------|------|
| **HTTPS + Token** | 配置简单 | 需要手动输入 Token |
| **SSH 密钥** | 设置一次，永久使用 | 初次配置稍复杂 |

---

## SSH 配置步骤

### 步骤 1：生成 SSH 密钥

在 PowerShell 中运行：
```powershell
ssh-keygen -t ed25519 -C "你的 GitHub 邮箱"
```

按提示操作：
- 保存路径：直接按 Enter（使用默认路径）
- 密码短语：直接按 Enter（不设置密码）

### 步骤 2：查看公钥

```powershell
type $HOME\.ssh\id_ed25519.pub
```

复制输出的内容（以 `ssh-ed25519` 开头的一整行）

### 步骤 3：添加到 GitHub

1. 访问 https://github.com/settings/keys
2. 点击 **"New SSH key"**
3. 填写标题（如："My Desktop"）
4. 粘贴刚才复制的公钥内容
5. 点击 **"Add SSH key"**

### 步骤 4：切换远程仓库为 SSH

```powershell
cd C:\Users\Abell\OneDrive\Desktop\刷题
git remote set-url origin git@github.com:AbellLee/practice.git
```

### 步骤 5：测试连接

```powershell
ssh -T git@github.com
```

看到 `Hi AbellLee! You've successfully authenticated...` 表示成功。

### 步骤 6：Push 代码

```powershell
git push -u origin master
```

现在不需要输入任何密码！

---

## 快速切换回 HTTPS

如果想改回 HTTPS 方式：

```powershell
git remote set-url origin https://github.com/AbellLee/practice.git
```

---

## 常见问题

### Q: 找不到 ssh-keygen 命令？
A: 安装 Git for Windows 时会自带 SSH 工具。

### Q: 已有 SSH 密钥怎么办？
A: 可以直接使用现有的，或者生成新的：
```powershell
ssh-keygen -t ed25519 -C "备注" -f "~/.ssh/github_new"
```

### Q: 多个 GitHub 账号怎么办？
A: 可以配置 SSH config 文件区分不同账号。
