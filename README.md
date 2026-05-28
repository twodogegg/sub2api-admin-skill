# sub2api-admin

一个用于管理 Sub2API 后台的 Codex skill，聚焦账号管理和管理员 API 调用。

## 能力

- 列出账号
- 查询单个账号
- 删除账号
- 只保留指定账号并删除其他账号
- 从 Sub2API 导出 JSON 批量导入账号
- 导入时复用模板账号的并发、优先级、分组和模型映射

## 目录结构

```text
sub2api-admin/
├── README.md
├── SKILL.md
├── REFERENCE.md
└── scripts/
    └── sub2api-admin.js
```

## 环境变量

只使用管理员 API Key：

```bash
export SUB2API_BASE_URL='https://your-sub2api-host'
export SUB2API_ADMIN_API_KEY='<your-admin-api-key>'
```

## 直接使用脚本

```bash
node scripts/sub2api-admin.js accounts list
node scripts/sub2api-admin.js accounts get 6
node scripts/sub2api-admin.js accounts delete 25
```

批量导入：

```bash
node scripts/sub2api-admin.js accounts import-json \
  --file /path/accounts.json \
  --template-name 'CoraimaInglehart055494+PayPal3@outlook.com'
```

## 作为 skill 使用

把这个目录放到你的 skills 路径后，按 `SKILL.md` 的触发描述调用即可。

需要详细接口和命令说明时，查看 [REFERENCE.md](REFERENCE.md)。

## 已确认接口

- `GET /api/v1/admin/accounts`
- `GET /api/v1/admin/accounts/:id`
- `POST /api/v1/admin/accounts`
- `PUT /api/v1/admin/accounts/:id`
- `DELETE /api/v1/admin/accounts/:id`
- `GET /api/v1/admin/groups/all`
- `GET /api/v1/admin/proxies/all`

## 注意事项

- 鉴权只使用 `x-api-key`
- 不要把真实管理员 API Key 提交进仓库
- 批量导入前，建议先清理重复账号
