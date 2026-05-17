# n8n-nodes-erpnext-buying

n8n community node package for ERPNext/Frappe Buying workflows on modern ERPNext v15-v16 deployments.

This package focuses on procurement documents and supplier-side business flows instead of trying to make one generic ERPNext node cover the entire Frappe ecosystem.

## Resources

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

## Operations

Document resources support:

- Create
- Get
- Get Many
- Update
- Delete
- Submit
- Cancel

`Frappe Method` supports calling whitelisted Frappe methods through:

- `/api/method/:method`
- `/api/v2/method/:method`

## API Compatibility

The node supports both Frappe document REST styles:

```text
/api/resource/:doctype
/api/v2/document/:doctype
```

Submit and cancel use the shared n8n2erpnext helper rule:

- Submit sends the full latest document to `frappe.client.submit`.
- Cancel sends `{ doctype, name }` to `frappe.client.cancel`.

## Credentials

Use the shared `ERPNext API` credential:

- Site URL
- Optional Site Host Header
- API Key
- API Secret
- Ignore SSL Issues

Credential fields are marked as password fields where appropriate. Do not expose API keys, API secrets, Authorization headers, tokens, or passwords in webhook responses, logs, README examples, or package artifacts.

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

## Node Identity

All `n8n2erpnext` module nodes use the same ERPNext-style logo shape. Each module changes only the main background color.

Buying uses procurement amber `#C47F00` because the module represents supplier flow, RFQs, purchase orders, receipts, and spend.

| Module | Color | Hex |
| --- | --- | --- |
| Core | ERPNext blue | `#2490EF` |
| HRMS | People green | `#2E7D5F` |
| Accounting | Finance orange-red | `#D94A2B` |
| Buying | Procurement amber | `#C47F00` |
| Selling | Commerce teal | `#00A6A6` |
| Stock | Frappe black | `#171717` |

## Test Policy

The ERPNext LXD environment used by this project is allowed to receive realistic demo/test procurement data. Buying workflow tests should use traceable test prefixes and should avoid leaking raw ERPNext documents or credential-like fields in public webhook responses.

## Tested Workflows

### GET Suppliers

Workflow artifact:

```text
n8n-webhook-erpnext-buying-get-suppliers.workflow.json
```

Live test result:

- `GET /webhook/erpnext-buying-get-suppliers` returned `200 OK`.
- Response used an allowlisted Supplier field set.
- Temporary workflow was deactivated after verification.

### Procurement Lifecycle

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-procurement-lifecycle-test.workflow.json
```

Lifecycle:

```text
Create Supplier
-> Create Item
-> Create and submit Material Request
-> Create and submit Supplier Quotation
-> Create and submit Purchase Order
-> Create and submit Purchase Receipt
-> Return safe summary
```

Live test result:

- `POST /webhook/erpnext-buying-v2-procurement-lifecycle-test` returned `200 OK`.
- Run ID: `N8N-BUY-LIFECYCLE-1779032443792`.
- Material Request: `MAT-MR-2026-00002`, submitted.
- Supplier Quotation: `PUR-SQTN-2026-00002`, submitted, grand total `90`.
- Purchase Order: `PUR-ORD-2026-00002`, submitted, grand total `90`.
- Purchase Receipt: `MAT-PRE-2026-00002`, submitted, grand total `90`.
- Stock Ledger Entry: `2` units of `N8N-BUY-LIFECYCLE-1779032443792-PROC-ITEM` into `Stores - TDD`.
- Security scan summary returned `securityFindings: []`.
- Temporary workflow was deactivated after verification and now returns `404 Active version not found`.

### Real Procurement Flow

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-real-procurement-flow-test.workflow.json
```

This workflow tests Buying as an ERP workflow, not just CRUD:

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

Live test result:

- `POST /webhook/erpnext-buying-v2-real-procurement-flow-test` returned `200 OK`.
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
- Security scan summary returned `securityFindings: []`.
- Temporary workflow was deactivated after verification and now returns `404 Active version not found`.

### Purchase Order Amend

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-purchase-order-amend-test.workflow.json
```

Live test result:

- Original Purchase Order `PUR-ORD-2026-00004` was submitted then cancelled.
- Amended Purchase Order `PUR-ORD-2026-00004-1` was created with `amended_from: PUR-ORD-2026-00004`.
- Amended Purchase Order was submitted with quantity `2`.
- Temporary workflow was deactivated after verification and now returns `404 Active version not found`.

### Negative Cases

Workflow artifact:

```text
n8n-webhook-erpnext-buying-v2-negative-cases-test.workflow.json
```

Live test result:

- `POST /webhook/erpnext-buying-v2-negative-cases-test` returned `200 OK` with safe summarized failures.
- Duplicate Supplier creation failed as expected.
- Purchase Order missing required Supplier failed as expected.
- Cancelling linked Purchase Order `PUR-ORD-2026-00003` failed as expected.
- Deleting submitted Purchase Receipt `MAT-PRE-2026-00003` failed as expected.
- Reading fake Purchase Order document name containing slash and spaces failed as expected.
- Security scan summary returned `securityFindings: []`.
- Wrong API key was tested directly against ERPNext/Frappe and returned `401 AuthenticationError`.
- Temporary workflow was deactivated after verification and now returns `404 Active version not found`.
