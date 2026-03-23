---
name: import-questions
description: 根据用户提供的原始内容（文本、题库、文档片段等），解析并批量创建题目导入到练习系统。适用于用户粘贴题目文本、提供题库内容、或描述要创建的题目时使用。
---

# 题目导入 Skill

根据用户提供的任意格式内容，解析、结构化并批量导入题目到练习系统。

## 系统概述

练习系统使用 Go + Gin 后端、SQLite 数据库、React 前端。系统已运行在 **18080** 端口，支持两种导入方式：
1. **文件导入**：将题目 JSON 放到 `backend/import_questions.json`，重启后端自动导入
2. **API 导入**：通过 `/api/questions/import` 接口批量导入（需要 JWT 认证）

## 题目数据模型

```json
{
  "title": "必填，题目标题（最长 500 字符）",
  "content": "可选，题目详细描述",
  "type": "必填，choice=选择题 | judge=判断题",
  "options": ["选择题选项数组"],
  "answer": "必填，选择题填 A/B/C/D，判断题填 true/false",
  "analysis": "可选，答案解析",
  "difficulty": "必填，1-5（1=最简单）",
  "category": "可选，分类（最长 50 字符）",
  "tags": ["可选，标签数组"]
}
```

## 导入 API

### POST /api/questions/import — 批量导入（推荐）

请求体：
```json
{
  "questions": [
    { "title": "...", "type": "choice", "options": [...], "answer": "A", "difficulty": 2, ... },
    { "title": "...", "type": "judge", "answer": "true", "difficulty": 1, ... }
  ]
}
```

响应：
```json
{
  "success": true,
  "message": "导入完成：成功 10 题，跳过 2 题（已存在），失败 0 题",
  "data": { "imported": 10, "skipped": 2, "failed": 0, "errors": [] }
}
```

- 自动按 title 去重，已存在的题目跳过
- 需要 JWT 认证（Authorization: Bearer <token>）
- 默认账号 admin/admin123

### POST /api/questions/import-file — 从服务器 JSON 文件导入

请求体：`{ "file_path": "/path/to/questions.json" }`
JSON 文件格式为题目数组（不需要外层 questions 包裹）。

## 导入工作流

### 第 1 步：分析用户输入

用户可能提供：
1. **纯文本题目**：带编号、选项、答案的文本
2. **自然语言描述**：如"生成 10 道关于 Python 的选择题"
3. **Markdown/文档片段**：知识文档、笔记内容
4. **JSON/结构化数据**：已结构化的题目
5. **混合格式**

### 第 2 步：解析为标准 JSON

**选择题**：含 A/B/C/D 选项的题目
- `type` = `"choice"`
- `options` = 选项内容数组（不含字母前缀）
- `answer` = 大写字母 A/B/C/D

**判断题**：含对/错、True/False、√/× 的题目
- `type` = `"judge"`
- `answer` = `"true"` 或 `"false"`

**难度推断**（用户未指定时）：
- 基础概念/定义 → 1-2
- 应用/理解 → 2-3
- 综合分析 → 3-4
- 高级/复杂 → 4-5

### 第 3 步：生成 JSON 文件并导入

将解析出的题目写入 `backend/import_questions.json` 文件。

**方式一：文件导入（推荐，无需登录）**
1. 生成 JSON 文件到 `backend/import_questions.json`
2. 重启后端服务自动导入：
   ```bash
   cd /root/.openclaw/workspace/practice/backend
   pkill -f practice-system || true
   ./practice-system > /tmp/practice.log 2>&1 &
   ```
3. 查看日志确认导入：`cat /tmp/practice.log | grep -E "(导入|INSERT)"`

**方式二：API 导入（需要 JWT）**
1. 登录获取 token:
   ```bash
   curl -X POST http://localhost:18080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
2. 使用 token 批量导入：
   ```bash
   curl -X POST http://localhost:18080/api/questions/import \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"questions":[...]}'
   ```

**前端导入**：
- 题目管理页面 → 点击"批量导入"按钮 → 粘贴 JSON → 导入

## 注意事项

- **答案格式**：选择题必须大写 A/B/C/D；判断题必须 `"true"` 或 `"false"`
- **选项格式**：数组中不含字母前缀（写 "内容" 不写 "A. 内容"）
- **去重**：API 自动按 title 去重
- **编码**：UTF-8

## 与 OpenClaw 集成

如果你是在 OpenClaw 环境中运行此 skill：
- 使用 `exec` 工具执行上述 shell 命令
- 使用 `write` 工具生成 JSON 文件
- 使用 `process` 工具监控后台进程
- 导入完成后用 `exec` 验证：`curl http://localhost:18080/api/questions`
