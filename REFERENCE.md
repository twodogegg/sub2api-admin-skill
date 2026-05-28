# Sub2API Admin Reference

## Environment

需要配置：

```bash
export SUB2API_BASE_URL='http://170.106.140.128:8080'
export SUB2API_ADMIN_API_KEY='<admin api key>'
```

## CLI

```bash
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js <command>
```

## Commands

### `accounts list`

```bash
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts list
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts list --page-size 200
```

### `accounts get <id>`

```bash
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts get 6
```

### `accounts delete <id>`

```bash
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts delete 25
```

### `accounts keep-only --name <name>`

删除除目标名之外的全部账号。

```bash
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts keep-only \
  --name 'CoraimaInglehart055494+PayPal3@outlook.com'
```

### `accounts import-json --file <path> --template-name <name>`

从导出 JSON 导入账号，并把模板账号的关键配置复制给新账号：

- `concurrency`
- `priority`
- `group_ids`
- `credentials.model_mapping`

```bash
node ~/.agents/skills/sub2api-admin/scripts/sub2api-admin.js accounts import-json \
  --file /Users/goudan/Desktop/codex_accounts_sub2api_2026-05-28.json \
  --template-name 'CoraimaInglehart055494+PayPal3@outlook.com'
```

可选参数：

- `--skip-name <name>`：跳过一个或多个名字
- `--dry-run`：仅打印将执行的导入目标，不落库

## Confirmed Admin Endpoints

- `GET /api/v1/admin/accounts`
- `GET /api/v1/admin/accounts/:id`
- `POST /api/v1/admin/accounts`
- `PUT /api/v1/admin/accounts/:id`
- `DELETE /api/v1/admin/accounts/:id`
- `GET /api/v1/admin/accounts/:id/usage`
- `POST /api/v1/admin/accounts/today-stats/batch`
- `POST /api/v1/admin/accounts/bulk-update`
- `POST /api/v1/admin/accounts/batch-refresh`
- `POST /api/v1/admin/accounts/batch-clear-error`
- `POST /api/v1/admin/accounts/import/codex-session`
- `POST /api/v1/admin/accounts/sync/crs/preview`
- `GET /api/v1/admin/groups/all`
- `GET /api/v1/admin/proxies/all`

## Response Shape

通常为：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## Notes

- 如果管理员 API Key 报 `INVALID_ADMIN_KEY`，重新生成新的管理员 API Key。
- `PUT /admin/accounts/:id` 可能接受宽松请求体，更新前要明确字段，避免误改。
- 批量导入前最好先清理重复账号，避免同名重复创建。
