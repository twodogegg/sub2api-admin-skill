---
name: sub2api-admin
description: 管理 Sub2API 后台的账号与基础管理接口，支持列表、查询、删除、只保留指定账号、按模板账号批量导入 JSON、调用管理员 API。Use when 用户提到 Sub2API、170.106.140.128:8080、管理员 API Key、账号管理、批量导入账号、保留某个账号删除其他账号，或要通过 API 管理 Sub2API 后台。
---

# Sub2API Admin

## Quick Start

优先使用自带 CLI，而不是临时手写 `curl`：

```bash
export SUB2API_BASE_URL='http://170.106.140.128:8080'
export SUB2API_ADMIN_API_KEY='<admin api key>'

node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts list
```

需要参数和返回说明时，查看 [REFERENCE.md](REFERENCE.md)。

## Workflows

### 1. 建立连接

1. 优先复用环境变量：
   - `SUB2API_BASE_URL`
   - `SUB2API_ADMIN_API_KEY`
2. 只使用 `SUB2API_ADMIN_API_KEY`。
3. 如果 `x-api-key` 返回 `INVALID_ADMIN_KEY`，说明管理员 API Key 已失效，让用户重新生成管理员 API Key。

### 2. 账号查询与核对

常用顺序：

1. `accounts list`
2. `accounts get <id>`
3. 对照目标账号，确认：
   - `concurrency`
   - `priority`
   - `group_ids`
   - `credentials.model_mapping`

### 3. 删除与清理

删除前先列出目标账号名和 ID，再执行删除。

- 删除单个：`accounts delete <id>`
- 只保留某个名字：`accounts keep-only --name '<email>'`

### 4. JSON 批量导入

用于导入 Sub2API 导出 JSON 或同结构账号清单。

1. 先选一个模板账号，读取它的配置。
2. 复制模板的这些字段到待导入账号：
   - `concurrency`
   - `priority`
   - `group_ids`
   - `credentials.model_mapping`
3. 跳过模板账号自身，避免重复导入。
4. 导入后回查列表，确认数量和关键字段。

建议直接用：

```bash
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts import-json \
  --file /path/accounts.json \
  --template-name 'CoraimaInglehart055494+PayPal3@outlook.com'
```

### 5. 批量操作原则

1. 先查，后改，最后回查。
2. 变更线上数据前，明确目标集合。
3. 不确定接口时，优先只读验证，不盲写。

## Notes

- 默认 API 前缀是 `<base>/api/v1/admin`
- 后台鉴权只使用 `x-api-key: <admin-api-key>`
- 不要在 skill 文件里硬编码真实密钥；用环境变量或当前会话传入。
