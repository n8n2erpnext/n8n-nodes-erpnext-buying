# n8n-nodes-erpnext-buying

Community n8n node package for ERPNext/Frappe Buying v15-v16.

This package is part of the `n8n2erpnext` ecosystem. It focuses on ERPNext procurement and supplier-side workflows, while keeping generic escape hatches for custom DocTypes and whitelisted Frappe methods.

## Who This Is For

This package is built for teams that run ERPNext Buying and want controlled procurement automations in n8n.

Typical users:

- ERP administrators who maintain ERPNext/Frappe.
- Procurement, warehouse, finance, or operations teams that need supplier, RFQ, purchase order, receipt, or invoice workflows.
- Integration teams that want repeatable n8n automations without writing custom Frappe client code for every buying process.

The node is intentionally conservative: it exposes standard Buying document operations, supports Frappe API v1 and v2, and allows controlled fallback access to custom DocTypes and whitelisted Frappe methods.

## Architecture At A Glance

Read workflow from left to right:

```text
ERPNext / Frappe Buying  <---- API token ---->  n8n ERPNext Buying node  <---- webhook/API ---->  Client / App / Report
```

Common read pattern:

```text
Client
  -> n8n Webhook
  -> ERPNext Buying node
  -> Frappe REST API
  -> ERPNext Buying DocType
  -> filtered JSON response
```

Common procurement lifecycle pattern:

```text
n8n Webhook / Schedule / App Event
  -> validation / mapping / approval logic
  -> ERPNext Buying node
  -> Supplier, Material Request, RFQ, Supplier Quotation, Purchase Order, or Purchase Receipt
  -> safe summary response or downstream system
```

Recommended production network pattern:

```text
Public Client
  -> HTTPS reverse proxy / VPN / allowlist
  -> n8n
  -> private network or internal VPS address
  -> ERPNext / Frappe site
```

## Supported Resources

- Supplier
- Supplier Quotation
- Request for Quotation
- Purchase Order
- Purchase Receipt
- Material Request
- Item
- Contact
- Address
- Custom DocType
- Frappe Method

`Custom DocType` is used when a procurement workflow crosses into another ERPNext module, such as `Purchase Invoice` or `Payment Entry`.

## Node Identity

All `n8n2erpnext` module nodes use the same ERPNext-style logo shape. Each module changes only the main background color.

| Module | Color | Hex | Reason |
| --- | --- | --- | --- |
| Core | ERPNext blue | `#2490EF` | Foundation package, closest to the ERPNext brand color. |
| HRMS | People green | `#2E7D5F` | Human operations, employees, attendance, leave, payroll. |
| Accounting | Finance orange-red | `#D94A2B` | Ledger, journals, invoices, financial control. |
| Buying | Procurement amber | `#C47F00` | Purchase flow, suppliers, RFQs, purchase orders, receipts, spend. |
| Selling | Commerce teal | `#00A6A6` | Customer-facing pipeline, quotations, sales orders, revenue. |
| Stock | Frappe black | `#171717` | Warehouses, items, inventory movement; aligned with Frappe black. |

When building another module, copy the HRMS/Accounting SVG structure and change only the main background fill to that module color.

## Operations

For Buying doctypes:

- Create
- Get
- Get Many
- Update
- Delete
- Submit
- Cancel

For Frappe methods:

- Run Method

## API Versions

The node supports both ERPNext/Frappe document API styles:

- `v1`: `/api/resource/:doctype`
- `v2`: `/api/v2/document/:doctype`

Use `v1` for broad compatibility. Use `v2` when your ERPNext/Frappe v16 environment is ready for the newer document API behavior.

Submit and cancel use the shared `n8n2erpnext` helper rule:

- Submit fetches the latest document and sends `{ doc }` to `frappe.client.submit`.
- Cancel fetches the latest document and sends `{ doctype, name }` to `frappe.client.cancel`.

Reference:

- [Frappe REST API](https://docs.frappe.io/framework/user/en/api/rest)

## Credentials

Create an API key and secret in ERPNext/Frappe, then configure:

- Site URL: `https://erp.example.com`
- Site Host Header, optional: `erp.example.com`
- API Key
- API Secret
- Ignore SSL Issues, optional

The node authenticates with:

```http
Authorization: token api_key:api_secret
```

Credential fields are marked as password fields where appropriate. Do not expose API keys, API secrets, Authorization headers, tokens, or passwords in webhook responses, logs, README examples, or package artifacts.

### Internal URL With Public Host Header

When n8n and ERPNext run on the same VPS, you can point n8n at the internal ERPNext address and still send the public ERPNext host header:

- Site URL: `http://erpnext.internal:8001`
- Site Host Header: `erp.example.com`

This avoids public reverse-proxy authentication while still letting ERPNext receive the expected site host.

For the current VPS/LXD test setup:

```text
Site URL: http://10.192.135.2:8001
Site Host Header: erp.thaiduy.digital
```

This is infrastructure routing information for the project test environment, not credential material. API keys and API secrets are not included in this README.

For production, create a dedicated ERPNext integration user instead of using a daily admin account. Give that user only the roles required for the workflows it runs.

Official Frappe references:

- [Frappe REST API authentication](https://docs.frappe.io/framework/user/en/api/rest)
- [Frappe token based authentication](https://docs.frappe.io/framework/v15/user/en/guides/integration/rest_api/token_based_authentication)
- [Generate Frappe API key and secret](https://docs.frappe.io/framework/v15/user/en/guides/integration/how_to_setup_token_based_auth)

## Examples

Get recent suppliers:

```json
{
  "resource": "supplier",
  "operation": "getMany",
  "apiVersion": "v1",
  "fields": "name,supplier_name,supplier_group,supplier_type,country,disabled",
  "filtersJson": "[]",
  "returnAll": false,
  "limit": 20,
  "orderBy": "modified desc"
}
```

Get submitted purchase orders:

```json
{
  "resource": "purchaseOrder",
  "operation": "getMany",
  "apiVersion": "v2",
  "fields": "name,supplier,transaction_date,grand_total,status,per_received",
  "filtersJson": "[[\"docstatus\",\"=\",1]]",
  "returnAll": false,
  "limit": 20,
  "orderBy": "transaction_date desc"
}
```

Run a whitelisted Frappe method:

```json
{
  "resource": "frappeMethod",
  "operation": "runMethod",
  "methodName": "frappe.client.get_value",
  "argumentsJson": {
    "doctype": "Purchase Order",
    "filters": { "name": "PUR-ORD-2026-00003" },
    "fieldname": ["name", "supplier", "grand_total", "status"]
  }
}
```

Use `Custom DocType` for procurement-adjacent documents:

```json
{
  "resource": "customDocType",
  "customDocType": "Purchase Invoice",
  "operation": "get",
  "apiVersion": "v2",
  "documentName": "ACC-PINV-2026-00002"
}
```

## Webhook From n8n To ERPNext Buying

Use this pattern when you want an HTTP endpoint in n8n that reads or writes Buying data in ERPNext.

```text
Client / Browser / App
  -> n8n webhook URL
  -> ERPNext Buying node
  -> Frappe REST API
  -> ERPNext Buying DocType
  -> JSON response or safe summary
```

### 1. Configure The ERPNext Credential

In n8n, create or edit an `ERPNext API` credential:

- Site URL: `http://erpnext.internal:8001`
- Site Host Header: `erp.example.com`
- API Key: your ERPNext API key
- API Secret: your ERPNext API secret
- Ignore SSL Issues: `false`

For the current VPS/LXD test setup:

```text
Site URL: http://10.192.135.2:8001
Site Host Header: erp.thaiduy.digital
```

### 2. Create A Read Workflow

Create a workflow with these nodes:

```text
GET Webhook -> ERPNext Buying
```

Webhook node:

- HTTP Method: `GET`
- Path: `erpnext-buying-get-suppliers`
- Respond: `When Last Node Finishes`
- Response Data: `All Entries`

ERPNext Buying node:

- Credential: your `ERPNext API` credential
- Resource: `Supplier`
- Operation: `Get Many`
- API Version: `v1`
- Fields: `name,supplier_name,supplier_group,supplier_type,country,disabled`
- Filters JSON: `[]`
- Return All: `false`
- Limit: `20`
- Order By: `modified desc`

### 3. Activate And Test

Activate the workflow, then call:

```bash
curl -i https://n8n.example.com/webhook/erpnext-buying-get-suppliers
```

On the local VPS, you can test without going through the public proxy:

```bash
curl -i http://127.0.0.1:5678/webhook/erpnext-buying-get-suppliers
```

The tested workflow artifact is included in this repository:

```text
n8n-webhook-erpnext-buying-get-suppliers.workflow.json
```

## Webhook From ERPNext v16 To n8n

Use this pattern when ERPNext should call n8n automatically after a Buying document is created or updated. For example, ERPNext can call a n8n workflow whenever a `Purchase Order`, `Purchase Receipt`, or `Supplier Quotation` changes.

```text
ERPNext Doc Event
  -> Frappe Webhook
  -> POST n8n webhook URL
  -> n8n workflow
  -> validation, notification, sync, approval, audit, or downstream automation
```

### 1. Create The n8n Webhook Receiver

Create a workflow in n8n with a Webhook trigger:

```text
Webhook -> your processing nodes
```

Webhook node:

- HTTP Method: `POST`
- Path: `erpnext-buying-event`
- Authentication: `None` for a private/internal test, or `Header Auth` for production
- Respond: `Immediately` or `When Last Node Finishes`

The production webhook URL will look like:

```text
https://n8n.example.com/webhook/erpnext-buying-event
```

On this VPS, if ERPNext and n8n are on the same host/network, you can also use an internal n8n URL from ERPNext.

### 2. Add The Webhook In ERPNext/Frappe v16

In ERPNext/Frappe Desk:

1. Open the global search bar.
2. Search for `Webhook`.
3. Open `Webhook` from the Integrations area.
4. Click `New`.

Configure the Webhook:

- Enabled: checked
- Webhook Doctype: `Purchase Order`, `Purchase Receipt`, `Supplier Quotation`, or another Buying DocType
- Doc Event: `on_submit`, `on_cancel`, `after_insert`, or `on_update` depending on the workflow
- Request URL: your n8n production webhook URL
- Request Method: `POST`
- Request Structure: `JSON`
- Webhook JSON: use an allowlisted body like the example below

Example JSON body:

```json
{
  "event": "purchase_order_submitted",
  "doctype": "{{ doc.doctype }}",
  "name": "{{ doc.name }}",
  "supplier": "{{ doc.supplier }}",
  "company": "{{ doc.company }}",
  "transaction_date": "{{ doc.transaction_date }}",
  "grand_total": "{{ doc.grand_total }}",
  "status": "{{ doc.status }}",
  "modified": "{{ doc.modified }}"
}
```

For production, add a shared secret header and validate it in n8n:

```text
X-ERPNext-Webhook-Secret: your-long-random-secret
```

If you use Frappe's Webhook Secret field, Frappe adds an `X-Frappe-Webhook-Signature` header generated from the payload and secret. You can verify this signature in n8n with a Code node if needed.

Official Frappe reference:

- [Frappe Webhooks](https://docs.frappe.io/framework/user/en/guides/integration/webhooks)

## Tested Workflow Artifacts

The repository includes workflow artifacts used during live ERPNext LXD testing.

Read-only artifact:

```text
n8n-webhook-erpnext-buying-get-suppliers.workflow.json
```

Write-test artifacts:

```text
n8n-webhook-erpnext-buying-v2-procurement-lifecycle-test.workflow.json
n8n-webhook-erpnext-buying-v2-real-procurement-flow-test.workflow.json
n8n-webhook-erpnext-buying-v2-purchase-order-amend-test.workflow.json
```

Negative/security artifact:

```text
n8n-webhook-erpnext-buying-v2-negative-cases-test.workflow.json
```

Buying write-test workflows create real demo/test documents in the ERPNext LXD test instance. Activate them only during testing and deactivate them after verification unless a trusted operator intentionally keeps them active.

## GET Suppliers Test

Workflow artifact:

```text
n8n-webhook-erpnext-buying-get-suppliers.workflow.json
```

Test shape:

```text
GET Webhook -> ERPNext Buying
```

ERPNext Buying node:

- Resource: `Supplier`
- Operation: `Get Many`
- API Version: `v1`
- Fields: `name,supplier_name,supplier_group,supplier_type,country,disabled`
- Limit: `20`
- Order By: `modified desc`

Verified result:

- Local webhook returned `HTTP/1.1 200 OK`.
- Response returned Supplier data from the ERPNext LXD test site.
- Example Supplier returned: `N8N-ACC-LIFECYCLE-1778752708065 Supplier`.
- Response used an allowlisted read-only field set.
- No API key, API secret, Authorization header, token, or password was returned.

The test workflow was deactivated after verification.

## Procurement Lifecycle Test

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-procurement-lifecycle-test.workflow.json
```

Test shape:

```text
POST Webhook
-> Create Supplier
-> Create Item
-> Create and submit Material Request
-> Create and submit Supplier Quotation
-> Create and submit Purchase Order
-> Create and submit Purchase Receipt
-> Return safe summary
```

Verified result:

- Local webhook returned `HTTP/1.1 200 OK`.
- Run ID: `N8N-BUY-LIFECYCLE-1779032443792`.
- Material Request: `MAT-MR-2026-00002`, submitted.
- Supplier Quotation: `PUR-SQTN-2026-00002`, submitted, grand total `90`.
- Purchase Order: `PUR-ORD-2026-00002`, submitted, grand total `90`.
- Purchase Receipt: `MAT-PRE-2026-00002`, submitted, grand total `90`.
- Stock Ledger Entry: `2` units of `N8N-BUY-LIFECYCLE-1779032443792-PROC-ITEM` into `Stores - TDD`.
- Security scan summary returned `securityFindings: []`.

The test workflow was deactivated after verification.

## Real Procurement Flow Test

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-real-procurement-flow-test.workflow.json
```

This workflow tests Buying as an ERP process, not only CRUD:

```text
Supplier with Vietnamese/special characters
-> Supplier get/update
-> Disabled Supplier readback
-> Two purchase Items with Vietnamese/spaces
-> Multi-item Material Request submit
-> Multi-supplier RFQ submit/cancel
-> Multi-item Supplier Quotation submit
-> Multi-item Purchase Order with tax template and discount
-> Partial Purchase Receipt from Purchase Order
-> Purchase Invoice via Custom DocType
-> Partial Payment Entry submit/cancel via Custom DocType
-> Full Payment Entry via Custom DocType
-> Purchase Order readback via Custom DocType "Purchase Order"
```

The first run exposed a real ERPNext validation issue:

- `Request for Quotation.subject` is required.
- RFQ item rows require `stock_uom`, `uom`, and `conversion_factor`.

After fixing the workflow payload, the live test passed.

Verified result:

- Local webhook returned `HTTP/1.1 200 OK`.
- Run ID: `N8N-BUY-REAL-1779033077692`.
- Supplier with slash/spaces/Vietnamese characters: `N8N-BUY-REAL-1779033077692 NCC Đặc biệt & Space / Test`.
- Disabled supplier readback returned `disabled: 1`.
- RFQ `PUR-RFQ-2026-00001` was submitted then cancelled.
- Supplier Quotation `PUR-SQTN-2026-00003` submitted with grand total `490`.
- Purchase Order `PUR-ORD-2026-00003` submitted with two items, discount `5`, grand total `485`, and `per_received 40`.
- Purchase Receipt `MAT-PRE-2026-00003` submitted as partial receipt with stock ledger rows for both items.
- Purchase Invoice `ACC-PINV-2026-00002` submitted and paid, grand total `205`, outstanding amount `0`.
- Partial Payment Entry `ACC-PAY-2026-00003` was submitted then cancelled.
- Full Payment Entry `ACC-PAY-2026-00004` was submitted for `205`.
- Purchase Order readback through `Custom DocType` with DocType `Purchase Order` returned `PUR-ORD-2026-00003`.
- Security scan summary returned `securityFindings: []`.

ERPNext DB verification:

```text
Supplier special name updated successfully; disabled supplier has disabled=1.
RFQ PUR-RFQ-2026-00001: docstatus 2, Cancelled.
Supplier Quotation PUR-SQTN-2026-00003: docstatus 1, Submitted, grand_total 490.
Purchase Order PUR-ORD-2026-00003: docstatus 1, status To Receive and Bill, grand_total 485, discount_amount 5, per_received 40.
Purchase Order items:
  N8N-BUY-REAL-1779033077692 Hàng mua đặc biệt A | qty 2 | rate 125 | amount 250
  N8N-BUY-REAL-1779033077692 Item With Spaces B | qty 3 | rate 80 | amount 240
Purchase Receipt MAT-PRE-2026-00003: docstatus 1, Completed, grand_total 205.
Stock Ledger:
  Item A actual_qty 1 into Stores - TDD
  Item B actual_qty 1 into Stores - TDD
Purchase Invoice ACC-PINV-2026-00002: docstatus 1, Paid, grand_total 205, outstanding_amount 0.
Payment Entry ACC-PAY-2026-00003: docstatus 2, Pay, paid_amount 103.
Payment Entry ACC-PAY-2026-00004: docstatus 1, Pay, paid_amount 205.
```

The test workflow was deactivated after verification.

## Purchase Order Amend Test

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-purchase-order-amend-test.workflow.json
```

Test shape:

```text
Create Supplier
-> Create Item
-> Create Purchase Order
-> Submit Purchase Order
-> Cancel Purchase Order
-> Create amended Purchase Order with amended_from
-> Submit amended Purchase Order
-> Return safe summary
```

Verified result:

- Local webhook returned `HTTP/1.1 200 OK`.
- Run ID: `N8N-BUY-AMEND-1779033301954`.
- Original Purchase Order `PUR-ORD-2026-00004` was submitted then cancelled.
- Original docstatus after cancel: `2`.
- Amended Purchase Order `PUR-ORD-2026-00004-1` was created with `amended_from: PUR-ORD-2026-00004`.
- Amended Purchase Order was submitted.
- Amended docstatus: `1`.
- Amended quantity: `2`.

The test workflow was deactivated after verification.

## Negative Cases Test

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-negative-cases-test.workflow.json
```

Test shape:

```text
POST Webhook
-> Try duplicate Supplier create
-> Try Purchase Order missing required Supplier
-> Try cancel linked Purchase Order
-> Try delete submitted Purchase Receipt
-> Try get fake Purchase Order name with slash/spaces
-> Return safe negative summary
```

Verified result:

- Local webhook returned `HTTP/1.1 200 OK`.
- Purchase Order under test: `PUR-ORD-2026-00003`.
- Purchase Receipt under test: `MAT-PRE-2026-00003`.
- Duplicate Supplier creation failed as expected.
- Purchase Order missing required Supplier failed as expected.
- Cancelling linked Purchase Order `PUR-ORD-2026-00003` failed as expected.
- Deleting submitted Purchase Receipt `MAT-PRE-2026-00003` failed as expected.
- Reading fake Purchase Order document name containing slash and spaces failed as expected.
- Security scan summary returned `securityFindings: []`.

Wrong API key was tested directly against ERPNext/Frappe:

```text
GET /api/resource/Purchase%20Order?limit_page_length=1
Authorization: token invalid_key:invalid_secret
HTTP/1.1 401 UNAUTHORIZED
{"exc_type":"AuthenticationError"}
```

The test workflow was deactivated after verification.

## Development

```bash
npm install
npm run lint
npm run build
npm pack
```

The package declares `n8n-workflow` as both:

- `peerDependencies`: host n8n provides runtime package
- `devDependencies`: local TypeScript/lint/build support

`form-data` is pinned through `overrides` to avoid the unsafe boundary random vulnerability reported by Dependabot on older transitive versions.

## Release Checklist

Before tagging a release:

```bash
npm ci
npm run lint
npx @n8n/node-cli lint
npm run build
npx @n8n/node-cli build
npm audit --omit=dev
npm pack --dry-run
```

For provenance publishing, push a semver tag:

```bash
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

The GitHub Actions workflow publishes to npm with provenance:

```text
npm publish --access public --provenance
```

## Test Policy

The ERPNext LXD environment used by this project is allowed to receive realistic demo/test procurement data. Buying workflow tests should use traceable test prefixes and should avoid leaking raw ERPNext documents or credential-like fields in public webhook responses.

Temporary write-test workflows should be deactivated after verification. Current live tests confirmed these endpoints returned `404 Active version not found` after cleanup:

```text
/webhook/erpnext-buying-v2-real-procurement-flow-test
/webhook/erpnext-buying-v2-negative-cases-test
/webhook/erpnext-buying-v2-purchase-order-amend-test
```

## Security Notes

Recommended baseline:

- Use a dedicated ERPNext API user for n8n integrations.
- Avoid using a full Administrator API key in production.
- Scope ERPNext roles to the exact DocTypes and actions needed by the workflow.
- Prefer `Get Many` with explicit `Fields` over `Get` when exposing webhook responses, because `Get` can return full documents including comments, owners, child tables, totals, stock, and accounting metadata.
- Keep n8n webhook URLs private unless they are meant to be public.
- Add authentication to public n8n webhooks, such as header auth, reverse proxy auth, VPN, IP allowlisting, or a shared secret.
- Do not log API keys, API secrets, Authorization headers, raw upstream error bodies, or full procurement documents into external systems unless there is a clear retention policy.
- Use HTTPS for public traffic.
- If n8n and ERPNext are on the same VPS or private network, prefer the internal ERPNext URL plus `Site Host Header`.
- Rotate API keys after testing, after staff changes, and after any suspected exposure.
- Review n8n execution data retention. Disable or reduce saved execution data for workflows that process supplier pricing, purchase invoices, payment allocations, warehouse receipts, or vendor contracts.
- Deactivate temporary write-test workflows after verification.

## Security Notice

This package pins transitive `form-data` resolution with an npm `overrides` entry so `npm audit --omit=dev` reports no known vulnerabilities at release time. Keep this override in place until upstream dependencies resolve to a safe version without assistance.

In this package's tested deployment model, security risk is also reduced by:

- Internal network access between n8n and ERPNext.
- Reverse proxy or VPN controls for public endpoints.
- Dedicated ERPNext API credentials with scoped roles.
- Explicit field selection for public webhook responses.
- Safe summary nodes for write-heavy lifecycle tests.
- Avoiding public exposure of generic Custom DocType and Frappe Method workflows.

Do not treat this mitigation as a permanent substitute for dependency maintenance. Re-run `npm audit --omit=dev` before publishing a new package version and upgrade compatible n8n dependencies when the upstream dependency chain allows it without breaking n8n node compatibility.

## Deployment Checklist For SME And Mid-Market Teams

Before going live:

- Confirm ERPNext/Frappe version and choose API `v1` or `v2`.
- Create a dedicated ERPNext integration user.
- Assign only the ERPNext roles needed for Supplier, Item, Material Request, RFQ, Supplier Quotation, Purchase Order, Purchase Receipt, and any Custom DocTypes used by your workflow.
- Configure n8n credentials with the ERPNext internal URL when available.
- Set `Site Host Header` if ERPNext is served by a named Frappe site.
- Use allowlisted fields in public read workflows.
- Add shared-secret or proxy authentication for public write webhooks.
- Test write operations in a staging or dedicated ERPNext test site before production.
- Deactivate temporary write-test workflows after verification.
- Review n8n execution data retention for procurement and financial documents.

Suggested production approach:

- Keep read-only supplier and purchase-order reporting workflows separate from write-heavy workflows.
- Put purchase-order creation behind approval logic.
- Use explicit request validation before creating or submitting ERPNext documents.
- Return safe summaries instead of raw ERPNext documents from public webhooks.
- Keep audit trails for submitted and cancelled Purchase Orders, Receipts, Invoices, and Payment Entries.

## Troubleshooting

- `401` or `403`: verify API key, API secret, user roles, and DocType permissions in ERPNext.
- TLS `EPROTO` or `tlsv1 alert internal error`: use the internal ERPNext HTTP URL from n8n when the public domain is protected by a reverse proxy or VPN layer.
- Frappe site not found or wrong site: set `Site Host Header` to the public ERPNext site name.
- `Request for Quotation` create fails: verify `subject` and child item fields such as `stock_uom`, `uom`, and `conversion_factor`.
- `Purchase Order` submit fails: verify supplier, item purchase flags, schedule date, warehouse, UOM, tax template, and company.
- `Purchase Receipt` submit fails: verify stock item settings, accepted warehouse, purchase order item references, and over-receipt rules.
- `Purchase Invoice` or `Payment Entry` fails through `Custom DocType`: verify payable account, expense account, supplier, linked receipt/invoice, and fiscal period.
- Cancel fails after downstream documents exist: ERPNext may correctly block cancellation of linked documents until downstream effects are cancelled.
- Delete fails for submitted documents: ERPNext normally requires cancel first and may still block deletion based on links and permissions.

## Scope Boundaries

This package is intentionally Buying-focused. Other ERPNext modules should live in separate packages so each module can evolve independently:

- `n8n-nodes-frappe-core`
- `n8n-nodes-erpnext-hrms`
- `n8n-nodes-erpnext-accounting`
- `n8n-nodes-erpnext-buying`
- `n8n-nodes-erpnext-selling`
- `n8n-nodes-erpnext-stock`

Use `Custom DocType` for adjacent documents when a Buying workflow needs to cross into another module, such as `Purchase Invoice` and `Payment Entry`. If a workflow is mostly financial, prefer the Accounting package.

## References

Frappe / ERPNext:

- [Frappe REST API](https://docs.frappe.io/framework/user/en/api/rest)
- [Frappe token based authentication](https://docs.frappe.io/framework/v15/user/en/guides/integration/rest_api/token_based_authentication)
- [Frappe Webhooks](https://docs.frappe.io/framework/user/en/guides/integration/webhooks)
- [ERPNext Buying](https://docs.frappe.io/erpnext/user/manual/en/buying)
- [Supplier](https://docs.frappe.io/erpnext/user/manual/en/supplier)
- [Item](https://docs.frappe.io/erpnext/user/manual/en/item)
- [Material Request](https://docs.frappe.io/erpnext/user/manual/en/material-request)
- [Request for Quotation](https://docs.frappe.io/erpnext/user/manual/en/request-for-quotation)
- [Supplier Quotation](https://docs.frappe.io/erpnext/user/manual/en/supplier-quotation)
- [Purchase Order](https://docs.frappe.io/erpnext/user/manual/en/purchase-order)
- [Purchase Receipt](https://docs.frappe.io/erpnext/user/manual/en/purchase-receipt)
- [Purchase Invoice](https://docs.frappe.io/erpnext/user/manual/en/purchase-invoice)
- [Payment Entry](https://docs.frappe.io/erpnext/user/manual/en/payment-entry)

n8n:

- [Community nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Install community nodes](https://docs.n8n.io/integrations/community-nodes/installation/)
- [Creating nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [Declarative-style nodes](https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/)
- [Node linter](https://docs.n8n.io/integrations/creating-nodes/test/node-linter/)
- [Submit community nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/)

## Maintainer Notes

Prepared and reviewed with care by Codex for the `n8n2erpnext` ERPNext Buying integration work.
