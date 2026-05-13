# n8n-nodes-erpnext-buying

Planned n8n community node package for ERPNext Buying.

Planned resources:

- Supplier
- Supplier Quotation
- Request for Quotation
- Purchase Order
- Purchase Receipt
- Material Request
- Contact
- Address

## Node Identity

All `n8n2erpnext` module nodes use the same ERPNext-style logo shape. Each module changes only the main background color.

Buying uses procurement amber `#C47F00` because the module represents supplier flow, RFQs, purchase orders, receipts, and spend.

Full module color map:

| Module | Color | Hex |
| --- | --- | --- |
| Core | ERPNext blue | `#2490EF` |
| HRMS | People green | `#2E7D5F` |
| Accounting | Finance orange-red | `#D94A2B` |
| Buying | Procurement amber | `#C47F00` |
| Selling | Commerce teal | `#00A6A6` |
| Stock | Frappe black | `#171717` |

When building this module, copy the HRMS/Accounting SVG structure and change only the main background fill to `#C47F00`.
