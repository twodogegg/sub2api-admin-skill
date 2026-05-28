#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const BASE_URL = (process.env.SUB2API_BASE_URL || "http://170.106.140.128:8080").replace(/\/$/, "");
const ADMIN_API_KEY = process.env.SUB2API_ADMIN_API_KEY || "";

function usage() {
  console.log(`Usage:
  sub2api-admin.js accounts list [--page-size 200]
  sub2api-admin.js accounts get <id>
  sub2api-admin.js accounts delete <id>
  sub2api-admin.js accounts keep-only --name <account-name>
  sub2api-admin.js accounts import-json --file <path> --template-name <name> [--skip-name <name>] [--dry-run]
`);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        if (flags[key] === undefined) {
          flags[key] = next;
        } else if (Array.isArray(flags[key])) {
          flags[key].push(next);
        } else {
          flags[key] = [flags[key], next];
        }
        i += 1;
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

function authHeaders() {
  if (ADMIN_API_KEY) return { "x-api-key": ADMIN_API_KEY };
  throw new Error("Missing SUB2API_ADMIN_API_KEY");
}

async function apiRequest(method, pathname, body) {
  const headers = {
    ...authHeaders(),
    Accept: "application/json",
  };
  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${pathname}`, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok || (data && data.code !== undefined && data.code !== 0 && data.code !== "0")) {
    const detail = data.message || data.code || res.statusText;
    throw new Error(`${method} ${pathname} failed: ${detail}`);
  }
  return data.data;
}

async function listAccounts(pageSize = 200) {
  return apiRequest(
    "GET",
    `/api/v1/admin/accounts?page=1&page_size=${pageSize}&sort_by=name&sort_order=asc&lite=1`
  );
}

async function getAccount(id) {
  return apiRequest("GET", `/api/v1/admin/accounts/${id}`);
}

async function deleteAccount(id) {
  return apiRequest("DELETE", `/api/v1/admin/accounts/${id}`);
}

function asArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

async function commandAccounts(args) {
  const sub = args.positional[1];
  if (sub === "list") {
    const pageSize = Number(args.flags["page-size"] || 200);
    const data = await listAccounts(pageSize);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (sub === "get") {
    const id = args.positional[2];
    if (!id) throw new Error("accounts get requires <id>");
    const data = await getAccount(id);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (sub === "delete") {
    const id = args.positional[2];
    if (!id) throw new Error("accounts delete requires <id>");
    const data = await deleteAccount(id);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (sub === "keep-only") {
    const name = args.flags.name;
    if (!name) throw new Error("accounts keep-only requires --name");
    const data = await listAccounts(200);
    const items = data.items || [];
    const keep = items.find((item) => item.name === name);
    if (!keep) throw new Error(`account not found: ${name}`);
    const targets = items.filter((item) => item.name !== name);
    const results = [];
    for (const item of targets) {
      const out = await deleteAccount(item.id);
      results.push({ id: item.id, name: item.name, result: out });
    }
    console.log(JSON.stringify({ kept: { id: keep.id, name: keep.name }, deleted: results }, null, 2));
    return;
  }

  if (sub === "import-json") {
    const file = args.flags.file;
    const templateName = args.flags["template-name"];
    const dryRun = Boolean(args.flags["dry-run"]);
    const skipNames = new Set(asArray(args.flags["skip-name"]));
    if (!file) throw new Error("accounts import-json requires --file");
    if (!templateName) throw new Error("accounts import-json requires --template-name");

    const raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
    const accounts = raw.accounts || [];
    const live = await listAccounts(200);
    const liveItems = live.items || [];
    const template = liveItems.find((item) => item.name === templateName);
    if (!template) throw new Error(`template account not found in backend: ${templateName}`);

    const templateGroupIds = template.group_ids || [];
    const templateConcurrency = template.concurrency;
    const templatePriority = template.priority;
    const templateModelMapping = (template.credentials && template.credentials.model_mapping) || {};

    const existingNames = new Set(liveItems.map((item) => item.name));
    const planned = accounts.filter((acc) => acc.name !== templateName && !skipNames.has(acc.name));

    if (dryRun) {
      console.log(
        JSON.stringify(
          {
            template: {
              name: template.name,
              concurrency: templateConcurrency,
              priority: templatePriority,
              group_ids: templateGroupIds,
              model_mapping: templateModelMapping,
            },
            to_import: planned.map((acc) => ({
              name: acc.name,
              exists: existingNames.has(acc.name),
            })),
          },
          null,
          2
        )
      );
      return;
    }

    const results = [];
    for (const acc of planned) {
      if (existingNames.has(acc.name)) {
        results.push({ name: acc.name, skipped: true, reason: "already exists" });
        continue;
      }
      const payload = {
        ...acc,
        group_ids: templateGroupIds,
        concurrency: templateConcurrency,
        priority: templatePriority,
        credentials: {
          ...acc.credentials,
          model_mapping: templateModelMapping,
        },
      };
      const created = await apiRequest("POST", "/api/v1/admin/accounts", payload);
      results.push({ name: acc.name, id: created.id, skipped: false });
    }
    console.log(JSON.stringify({ imported: results }, null, 2));
    return;
  }

  throw new Error(`unknown accounts subcommand: ${sub || "(missing)"}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.positional[0];
  if (!root) {
    usage();
    process.exit(1);
  }
  if (root === "accounts") {
    await commandAccounts(args);
    return;
  }
  throw new Error(`unknown command: ${root}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
