const fs = require('fs');

const credential = {
	erpNextApi: {
		id: '9hFY985G0WpX5Xyt',
		name: 'ERPNext account',
	},
};

function buyingNode(name, parameters, x, y = 0, extra = {}) {
	return {
		parameters,
		type: 'n8n-nodes-erpnext-buying.erpNextBuying',
		typeVersion: 1,
		position: [x, y],
		id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
		name,
		credentials: credential,
		...extra,
	};
}

function codeNode(name, jsCode, x, y = 0) {
	return {
		parameters: { jsCode },
		type: 'n8n-nodes-base.code',
		typeVersion: 2,
		position: [x, y],
		id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
		name,
	};
}

function connect(names) {
	const connections = {};
	for (let i = 0; i < names.length - 1; i += 1) {
		connections[names[i]] = {
			main: [[{ node: names[i + 1], type: 'main', index: 0 }]],
		};
	}
	connections[names[names.length - 1]] = { main: [[]] };
	return connections;
}

const nodes = [
	{
		parameters: {
			httpMethod: 'POST',
			path: 'erpnext-buying-v2-real-procurement-flow-test',
			responseMode: 'lastNode',
			responseData: 'allEntries',
			options: {},
		},
		type: 'n8n-nodes-base.webhook',
		typeVersion: 2.1,
		position: [-1400, 0],
		id: 'real-procurement-webhook',
		name: 'POST Webhook',
		webhookId: 'erpnext-buying-v2-real-procurement-flow-test',
	},
	codeNode(
		'Build Real Procurement Context',
		`const now = new Date();
const today = now.toISOString().slice(0, 10);
const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const stamp = Date.now();
const runId = \`N8N-BUY-REAL-\${stamp}\`;
return [{
  json: {
    runId,
    company: 'Thái Duy Digital',
    warehouse: 'Stores - TDD',
    rejectedWarehouse: 'Goods In Transit - TDD',
    transactionDate: today,
    scheduleDate: due,
    validTill: due,
    dueDate: due,
    supplierName: \`\${runId} NCC Đặc biệt & Space / Test\`,
    disabledSupplierName: \`\${runId} Disabled Supplier\`,
    altSupplierName: \`\${runId} Alt Supplier\`,
    itemA: \`\${runId} Hàng mua đặc biệt A\`,
    itemB: \`\${runId} Item With Spaces B\`,
    qtyA: 2,
    qtyB: 3,
    receiptQtyA: 1,
    receiptQtyB: 1,
    rateA: 125,
    rateB: 80,
    accounts: {
      cash: '1110 - Cash - TDD',
      payable: '2110 - Creditors - TDD',
      expense: '5111 - Cost of Goods Sold - TDD'
    },
    taxTemplate: 'Vietnam Tax - TDD'
  }
}];`,
		-1180,
	),
	buyingNode(
		'Create Special Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier_name: $node["Build Real Procurement Context"].json.supplierName, supplier_type: "Company", supplier_group: "All Supplier Groups" }) }}',
		},
		-960,
	),
	buyingNode(
		'Get Special Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'get',
			documentName: '={{ $node["Create Special Supplier V2"].json.name }}',
		},
		-740,
	),
	buyingNode(
		'Update Special Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'update',
			documentName: '={{ $node["Create Special Supplier V2"].json.name }}',
			dataJson:
				'={{ JSON.stringify({ supplier_details: `${$node["Build Real Procurement Context"].json.runId} update test with Vietnamese supplier name and slash-safe document lookup.` }) }}',
		},
		-520,
	),
	buyingNode(
		'Create Disabled Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier_name: $node["Build Real Procurement Context"].json.disabledSupplierName, supplier_type: "Company", supplier_group: "All Supplier Groups", disabled: 1 }) }}',
		},
		-300,
	),
	buyingNode(
		'Get Disabled Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'get',
			documentName: '={{ $node["Create Disabled Supplier V2"].json.name }}',
		},
		-80,
	),
	buyingNode(
		'Create Alternate Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier_name: $node["Build Real Procurement Context"].json.altSupplierName, supplier_type: "Company", supplier_group: "All Supplier Groups" }) }}',
		},
		140,
	),
	buyingNode(
		'Create Purchase Item A V2',
		{
			resource: 'item',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ item_code: $node["Build Real Procurement Context"].json.itemA, item_name: $node["Build Real Procurement Context"].json.itemA, item_group: "Products", stock_uom: "Unit", is_stock_item: 1, is_purchase_item: 1, is_sales_item: 0, valuation_rate: $node["Build Real Procurement Context"].json.rateA, standard_rate: $node["Build Real Procurement Context"].json.rateA }) }}',
		},
		360,
	),
	buyingNode(
		'Get Purchase Item A V2',
		{
			resource: 'item',
			apiVersion: 'v2',
			operation: 'get',
			documentName: '={{ $node["Create Purchase Item A V2"].json.name }}',
		},
		580,
	),
	buyingNode(
		'Create Purchase Item B V2',
		{
			resource: 'item',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ item_code: $node["Build Real Procurement Context"].json.itemB, item_name: $node["Build Real Procurement Context"].json.itemB, item_group: "Products", stock_uom: "Unit", is_stock_item: 1, is_purchase_item: 1, is_sales_item: 0, valuation_rate: $node["Build Real Procurement Context"].json.rateB, standard_rate: $node["Build Real Procurement Context"].json.rateB }) }}',
		},
		800,
	),
	buyingNode(
		'Create Material Request Multi Item V2',
		{
			resource: 'materialRequest',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ material_request_type: "Purchase", company: $node["Build Real Procurement Context"].json.company, transaction_date: $node["Build Real Procurement Context"].json.transactionDate, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, set_warehouse: $node["Build Real Procurement Context"].json.warehouse, items: [{ item_code: $node["Build Real Procurement Context"].json.itemA, qty: $node["Build Real Procurement Context"].json.qtyA, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, warehouse: $node["Build Real Procurement Context"].json.warehouse }, { item_code: $node["Build Real Procurement Context"].json.itemB, qty: $node["Build Real Procurement Context"].json.qtyB, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, warehouse: $node["Build Real Procurement Context"].json.warehouse }] }) }}',
		},
		1020,
	),
	buyingNode(
		'Submit Material Request Multi Item V2',
		{
			resource: 'materialRequest',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		1240,
	),
	buyingNode(
		'Create RFQ Multi Supplier V2',
		{
			resource: 'requestForQuotation',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ company: $node["Build Real Procurement Context"].json.company, transaction_date: $node["Build Real Procurement Context"].json.transactionDate, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, subject: `${$node["Build Real Procurement Context"].json.runId} RFQ multi supplier`, status: "Draft", suppliers: [{ supplier: $node["Build Real Procurement Context"].json.supplierName }, { supplier: $node["Build Real Procurement Context"].json.altSupplierName }], items: [{ item_code: $node["Build Real Procurement Context"].json.itemA, qty: $node["Build Real Procurement Context"].json.qtyA, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, warehouse: $node["Build Real Procurement Context"].json.warehouse, stock_uom: "Unit", uom: "Unit", conversion_factor: 1 }, { item_code: $node["Build Real Procurement Context"].json.itemB, qty: $node["Build Real Procurement Context"].json.qtyB, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, warehouse: $node["Build Real Procurement Context"].json.warehouse, stock_uom: "Unit", uom: "Unit", conversion_factor: 1 }] }) }}',
		},
		1460,
	),
	buyingNode(
		'Submit RFQ Multi Supplier V2',
		{
			resource: 'requestForQuotation',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		1680,
	),
	buyingNode(
		'Cancel RFQ Multi Supplier V2',
		{
			resource: 'requestForQuotation',
			apiVersion: 'v2',
			operation: 'cancel',
			documentName: '={{ $json.name }}',
		},
		1900,
	),
	buyingNode(
		'Create Supplier Quotation Multi Item V2',
		{
			resource: 'supplierQuotation',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier: $node["Build Real Procurement Context"].json.supplierName, company: $node["Build Real Procurement Context"].json.company, transaction_date: $node["Build Real Procurement Context"].json.transactionDate, valid_till: $node["Build Real Procurement Context"].json.validTill, currency: "VND", taxes_and_charges: $node["Build Real Procurement Context"].json.taxTemplate, items: [{ item_code: $node["Build Real Procurement Context"].json.itemA, qty: $node["Build Real Procurement Context"].json.qtyA, rate: $node["Build Real Procurement Context"].json.rateA, warehouse: $node["Build Real Procurement Context"].json.warehouse }, { item_code: $node["Build Real Procurement Context"].json.itemB, qty: $node["Build Real Procurement Context"].json.qtyB, rate: $node["Build Real Procurement Context"].json.rateB, warehouse: $node["Build Real Procurement Context"].json.warehouse }] }) }}',
		},
		2120,
	),
	buyingNode(
		'Submit Supplier Quotation Multi Item V2',
		{
			resource: 'supplierQuotation',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		2340,
	),
	buyingNode(
		'Create Core Purchase Order V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier: $node["Build Real Procurement Context"].json.supplierName, company: $node["Build Real Procurement Context"].json.company, transaction_date: $node["Build Real Procurement Context"].json.transactionDate, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, set_warehouse: $node["Build Real Procurement Context"].json.warehouse, taxes_and_charges: $node["Build Real Procurement Context"].json.taxTemplate, apply_discount_on: "Grand Total", discount_amount: 5, items: [{ item_code: $node["Build Real Procurement Context"].json.itemA, qty: $node["Build Real Procurement Context"].json.qtyA, rate: $node["Build Real Procurement Context"].json.rateA, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, warehouse: $node["Build Real Procurement Context"].json.warehouse }, { item_code: $node["Build Real Procurement Context"].json.itemB, qty: $node["Build Real Procurement Context"].json.qtyB, rate: $node["Build Real Procurement Context"].json.rateB, schedule_date: $node["Build Real Procurement Context"].json.scheduleDate, warehouse: $node["Build Real Procurement Context"].json.warehouse }] }) }}',
		},
		2560,
	),
	buyingNode(
		'Submit Core Purchase Order V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		2780,
	),
	codeNode(
		'Build Partial Receipt Payload',
		`const ctx = $node['Build Real Procurement Context'].json;
const po = $node['Submit Core Purchase Order V2'].json;
const items = po.items.map((row, index) => ({
  item_code: row.item_code,
  qty: index === 0 ? ctx.receiptQtyA : ctx.receiptQtyB,
  rate: row.rate,
  warehouse: ctx.warehouse,
  purchase_order: po.name,
  purchase_order_item: row.name
}));
return [{ json: { payload: { supplier: ctx.supplierName, company: ctx.company, posting_date: ctx.transactionDate, set_warehouse: ctx.warehouse, items } } }];`,
		3000,
	),
	buyingNode(
		'Create Partial Purchase Receipt V2',
		{
			resource: 'purchaseReceipt',
			apiVersion: 'v2',
			operation: 'create',
			dataJson: '={{ JSON.stringify($json.payload) }}',
		},
		3220,
	),
	buyingNode(
		'Submit Partial Purchase Receipt V2',
		{
			resource: 'purchaseReceipt',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		3440,
	),
	codeNode(
		'Build Purchase Invoice Payload',
		`const ctx = $node['Build Real Procurement Context'].json;
const pr = $node['Submit Partial Purchase Receipt V2'].json;
const items = pr.items.map((row) => ({
  item_code: row.item_code,
  qty: row.qty,
  rate: row.rate,
  expense_account: ctx.accounts.expense,
  purchase_receipt: pr.name,
  pr_detail: row.name,
  purchase_order: row.purchase_order,
  po_detail: row.purchase_order_item
}));
return [{ json: { payload: { supplier: ctx.supplierName, company: ctx.company, posting_date: ctx.transactionDate, due_date: ctx.dueDate, credit_to: ctx.accounts.payable, taxes_and_charges: ctx.taxTemplate, remarks: \`\${ctx.runId} purchase invoice from receipt test\`, items } } }];`,
		3660,
	),
	buyingNode(
		'Create Purchase Invoice Custom V2',
		{
			resource: 'customDocType',
			customDocType: 'Purchase Invoice',
			apiVersion: 'v2',
			operation: 'create',
			dataJson: '={{ JSON.stringify($json.payload) }}',
		},
		3880,
	),
	buyingNode(
		'Submit Purchase Invoice Custom V2',
		{
			resource: 'customDocType',
			customDocType: 'Purchase Invoice',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		4100,
	),
	codeNode(
		'Build Partial Payment Payload',
		`const ctx = $node['Build Real Procurement Context'].json;
const invoice = $node['Submit Purchase Invoice Custom V2'].json;
const amount = Math.round(Number(invoice.grand_total || invoice.rounded_total || 0) / 2);
return [{ json: { payload: { payment_type: 'Pay', company: ctx.company, posting_date: ctx.transactionDate, party_type: 'Supplier', party: ctx.supplierName, paid_from: ctx.accounts.cash, paid_to: ctx.accounts.payable, paid_amount: amount, received_amount: amount, remarks: \`\${ctx.runId} partial payment then cancel test\`, references: [{ reference_doctype: 'Purchase Invoice', reference_name: invoice.name, allocated_amount: amount }] } } }];`,
		4320,
	),
	buyingNode(
		'Create Partial Payment Entry Custom V2',
		{
			resource: 'customDocType',
			customDocType: 'Payment Entry',
			apiVersion: 'v2',
			operation: 'create',
			dataJson: '={{ JSON.stringify($json.payload) }}',
		},
		4540,
	),
	buyingNode(
		'Submit Partial Payment Entry Custom V2',
		{
			resource: 'customDocType',
			customDocType: 'Payment Entry',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		4760,
	),
	buyingNode(
		'Cancel Partial Payment Entry Custom V2',
		{
			resource: 'customDocType',
			customDocType: 'Payment Entry',
			apiVersion: 'v2',
			operation: 'cancel',
			documentName: '={{ $json.name }}',
		},
		4980,
	),
	codeNode(
		'Build Full Payment Payload',
		`const ctx = $node['Build Real Procurement Context'].json;
const invoice = $node['Submit Purchase Invoice Custom V2'].json;
const amount = Number(invoice.grand_total || invoice.rounded_total || 0);
return [{ json: { payload: { payment_type: 'Pay', company: ctx.company, posting_date: ctx.transactionDate, party_type: 'Supplier', party: ctx.supplierName, paid_from: ctx.accounts.cash, paid_to: ctx.accounts.payable, paid_amount: amount, received_amount: amount, remarks: \`\${ctx.runId} full payment test\`, references: [{ reference_doctype: 'Purchase Invoice', reference_name: invoice.name, allocated_amount: amount }] } } }];`,
		5200,
	),
	buyingNode(
		'Create Full Payment Entry Custom V2',
		{
			resource: 'customDocType',
			customDocType: 'Payment Entry',
			apiVersion: 'v2',
			operation: 'create',
			dataJson: '={{ JSON.stringify($json.payload) }}',
		},
		5420,
	),
	buyingNode(
		'Submit Full Payment Entry Custom V2',
		{
			resource: 'customDocType',
			customDocType: 'Payment Entry',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		5640,
	),
	buyingNode(
		'Get Purchase Order By Custom DocType V2',
		{
			resource: 'customDocType',
			customDocType: 'Purchase Order',
			apiVersion: 'v2',
			operation: 'get',
			documentName: '={{ $node["Submit Core Purchase Order V2"].json.name }}',
		},
		5860,
	),
	codeNode(
		'Return Safe Real Procurement Summary',
		`const ctx = $node['Build Real Procurement Context'].json;
const docs = {
  supplier: $node['Create Special Supplier V2'].json.name,
  disabledSupplier: $node['Create Disabled Supplier V2'].json.name,
  itemA: $node['Create Purchase Item A V2'].json.name,
  itemB: $node['Create Purchase Item B V2'].json.name,
  materialRequest: $node['Submit Material Request Multi Item V2'].json.name,
  requestForQuotation: $node['Cancel RFQ Multi Supplier V2'].json.name,
  supplierQuotation: $node['Submit Supplier Quotation Multi Item V2'].json.name,
  purchaseOrder: $node['Submit Core Purchase Order V2'].json.name,
  purchaseReceipt: $node['Submit Partial Purchase Receipt V2'].json.name,
  purchaseInvoice: $node['Submit Purchase Invoice Custom V2'].json.name,
  partialPaymentEntryCancelled: $node['Cancel Partial Payment Entry Custom V2'].json.name,
  fullPaymentEntry: $node['Submit Full Payment Entry Custom V2'].json.name
};
const invoice = $node['Submit Purchase Invoice Custom V2'].json;
const fullPayment = $node['Submit Full Payment Entry Custom V2'].json;
const po = $node['Get Purchase Order By Custom DocType V2'].json;
const serialized = JSON.stringify({ docs, invoice: { name: invoice.name, grand_total: invoice.grand_total }, payment: { name: fullPayment.name, paid_amount: fullPayment.paid_amount } });
const patterns = [/api[_-]?key/i, /api[_-]?secret/i, /authorization/i, /token\\s+[A-Za-z0-9]/i, /password/i];
const securityFindings = patterns.filter((pattern) => pattern.test(serialized)).map((pattern) => pattern.toString());
return [{ json: {
  runId: ctx.runId,
  status: securityFindings.length === 0 ? 'passed' : 'needs_review',
  supplierSpecialChars: ctx.supplierName,
  disabledSupplierDisabled: $node['Get Disabled Supplier V2'].json.disabled,
  purchaseOrderDocTypeSpaceReadback: po.name,
  purchaseInvoiceGrandTotal: invoice.grand_total,
  fullPaymentPaidAmount: fullPayment.paid_amount,
  docs,
  securityFindings,
  responsePolicy: 'Only document names, totals, and leak-scan status are returned. Credentials and raw upstream errors are not returned by this summary node.'
} }];`,
		6080,
	),
];

const names = nodes.map((node) => node.name);
const workflow = [
	{
		id: 'buyRealProcurementFlowV2Test01',
		name: 'ERPNext Buying V2 Real Procurement Flow Test',
		active: false,
		nodes,
		connections: connect(names),
		settings: {
			executionOrder: 'v1',
			binaryMode: 'separate',
		},
		staticData: null,
		pinData: {},
		meta: {
			templateCredsSetupCompleted: true,
		},
		tags: [],
	},
];

fs.writeFileSync(
	'n8n-webhook-erpnext-buying-v2-real-procurement-flow-test.workflow.json',
	`${JSON.stringify(workflow, null, 2)}\n`,
);

const negativeNodes = [
	{
		parameters: {
			httpMethod: 'POST',
			path: 'erpnext-buying-v2-negative-cases-test',
			responseMode: 'lastNode',
			responseData: 'allEntries',
			options: {},
		},
		type: 'n8n-nodes-base.webhook',
		typeVersion: 2.1,
		position: [-900, 0],
		id: 'negative-cases-webhook',
		name: 'POST Webhook',
		webhookId: 'erpnext-buying-v2-negative-cases-test',
	},
	codeNode(
		'Build Negative Context',
		`const body = $json.body ?? {};
return [{
  json: {
    company: 'Thái Duy Digital',
    warehouse: 'Stores - TDD',
    transactionDate: new Date().toISOString().slice(0, 10),
    scheduleDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    supplierName: body.supplierName ?? 'N8N-BUY-REAL-1779033077692 NCC Đặc biệt & Space / Test',
    purchaseOrder: body.purchaseOrder ?? 'PUR-ORD-2026-00003',
    purchaseReceipt: body.purchaseReceipt ?? 'MAT-PRE-2026-00003',
    itemCode: body.itemCode ?? 'N8N-BUY-REAL-1779033077692 Hàng mua đặc biệt A',
    fakePurchaseOrderName: body.fakePurchaseOrderName ?? 'BAD / DOC NAME With Space'
  }
}];`,
		-680,
	),
	buyingNode(
		'Try Duplicate Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier_name: $node["Build Negative Context"].json.supplierName, supplier_type: "Company", supplier_group: "All Supplier Groups" }) }}',
		},
		-460,
		0,
		{ continueOnFail: true },
	),
	buyingNode(
		'Try Create PO Missing Supplier V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ company: $node["Build Negative Context"].json.company, transaction_date: $node["Build Negative Context"].json.transactionDate, schedule_date: $node["Build Negative Context"].json.scheduleDate, set_warehouse: $node["Build Negative Context"].json.warehouse, items: [{ item_code: $node["Build Negative Context"].json.itemCode, qty: 1, rate: 10, schedule_date: $node["Build Negative Context"].json.scheduleDate, warehouse: $node["Build Negative Context"].json.warehouse }] }) }}',
		},
		-240,
		0,
		{ continueOnFail: true },
	),
	buyingNode(
		'Try Cancel Linked Purchase Order V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'cancel',
			documentName: '={{ $node["Build Negative Context"].json.purchaseOrder }}',
		},
		-20,
		0,
		{ continueOnFail: true },
	),
	buyingNode(
		'Try Delete Submitted Purchase Receipt V2',
		{
			resource: 'purchaseReceipt',
			apiVersion: 'v2',
			operation: 'delete',
			documentName: '={{ $node["Build Negative Context"].json.purchaseReceipt }}',
		},
		200,
		0,
		{ continueOnFail: true },
	),
	buyingNode(
		'Try Get Missing Slash Name Custom PO V2',
		{
			resource: 'customDocType',
			customDocType: 'Purchase Order',
			apiVersion: 'v2',
			operation: 'get',
			documentName: '={{ $node["Build Negative Context"].json.fakePurchaseOrderName }}',
		},
		420,
		0,
		{ continueOnFail: true },
	),
	codeNode(
		'Return Safe Negative Summary',
		`const checks = [
  ['duplicateSupplier', $node['Try Duplicate Supplier V2'].json],
  ['missingSupplierPurchaseOrder', $node['Try Create PO Missing Supplier V2'].json],
  ['cancelLinkedPurchaseOrder', $node['Try Cancel Linked Purchase Order V2'].json],
  ['deleteSubmittedPurchaseReceipt', $node['Try Delete Submitted Purchase Receipt V2'].json],
  ['missingSlashSpaceDocName', $node['Try Get Missing Slash Name Custom PO V2'].json],
];
function summarize(value) {
  const text = JSON.stringify(value);
  const leaked = [/api[_-]?key/i, /api[_-]?secret/i, /authorization/i, /token\\s+[A-Za-z0-9]/i, /password/i].some((pattern) => pattern.test(text));
  const message = value?.error?.message ?? value?.message ?? value?.description ?? 'No error message returned';
  const failedAsExpected = Boolean(value?.error || value?.httpCode || value?.message || value?.description);
  return { failedAsExpected, message: String(message).slice(0, 240), leakedCredentialLikeText: leaked };
}
const results = Object.fromEntries(checks.map(([name, value]) => [name, summarize(value)]));
const allFailedAsExpected = Object.values(results).every((result) => result.failedAsExpected);
const securityFindings = Object.entries(results).filter(([, result]) => result.leakedCredentialLikeText).map(([name]) => name);
return [{
  json: {
    status: allFailedAsExpected && securityFindings.length === 0 ? 'passed' : 'needs_review',
    purchaseOrderUnderTest: $node['Build Negative Context'].json.purchaseOrder,
    purchaseReceiptUnderTest: $node['Build Negative Context'].json.purchaseReceipt,
    results,
    securityFindings,
    responsePolicy: 'Only short error summaries are returned. Raw ERPNext error payloads and credentials are not returned.'
  }
}];`,
		640,
	),
];

const negativeNames = negativeNodes.map((node) => node.name);
const negativeWorkflow = [
	{
		id: 'buyNegativeCasesV2Test01',
		name: 'ERPNext Buying V2 Negative Cases Test',
		active: false,
		nodes: negativeNodes,
		connections: connect(negativeNames),
		settings: {
			executionOrder: 'v1',
			binaryMode: 'separate',
		},
		staticData: null,
		pinData: {},
		meta: {
			templateCredsSetupCompleted: true,
		},
		tags: [],
	},
];

fs.writeFileSync(
	'n8n-webhook-erpnext-buying-v2-negative-cases-test.workflow.json',
	`${JSON.stringify(negativeWorkflow, null, 2)}\n`,
);

const amendNodes = [
	{
		parameters: {
			httpMethod: 'POST',
			path: 'erpnext-buying-v2-purchase-order-amend-test',
			responseMode: 'lastNode',
			responseData: 'allEntries',
			options: {},
		},
		type: 'n8n-nodes-base.webhook',
		typeVersion: 2.1,
		position: [-900, 0],
		id: 'po-amend-webhook',
		name: 'POST Webhook',
		webhookId: 'erpnext-buying-v2-purchase-order-amend-test',
	},
	codeNode(
		'Build Amend Context',
		`const now = new Date();
const today = now.toISOString().slice(0, 10);
const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const runId = \`N8N-BUY-AMEND-\${Date.now()}\`;
return [{ json: {
  runId,
  company: 'Thái Duy Digital',
  warehouse: 'Stores - TDD',
  transactionDate: today,
  scheduleDate: due,
  supplierName: \`\${runId} Supplier\`,
  itemCode: \`\${runId} Item\`,
  originalQty: 1,
  amendedQty: 2,
  rate: 70
} }];`,
		-680,
	),
	buyingNode(
		'Create Amend Supplier V2',
		{
			resource: 'supplier',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier_name: $node["Build Amend Context"].json.supplierName, supplier_type: "Company", supplier_group: "All Supplier Groups" }) }}',
		},
		-460,
	),
	buyingNode(
		'Create Amend Item V2',
		{
			resource: 'item',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ item_code: $node["Build Amend Context"].json.itemCode, item_name: $node["Build Amend Context"].json.itemCode, item_group: "Products", stock_uom: "Unit", is_stock_item: 1, is_purchase_item: 1, is_sales_item: 0, valuation_rate: $node["Build Amend Context"].json.rate, standard_rate: $node["Build Amend Context"].json.rate }) }}',
		},
		-240,
	),
	buyingNode(
		'Create Original PO V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier: $node["Build Amend Context"].json.supplierName, company: $node["Build Amend Context"].json.company, transaction_date: $node["Build Amend Context"].json.transactionDate, schedule_date: $node["Build Amend Context"].json.scheduleDate, set_warehouse: $node["Build Amend Context"].json.warehouse, items: [{ item_code: $node["Build Amend Context"].json.itemCode, qty: $node["Build Amend Context"].json.originalQty, rate: $node["Build Amend Context"].json.rate, schedule_date: $node["Build Amend Context"].json.scheduleDate, warehouse: $node["Build Amend Context"].json.warehouse }] }) }}',
		},
		-20,
	),
	buyingNode(
		'Submit Original PO V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		200,
	),
	buyingNode(
		'Cancel Original PO V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'cancel',
			documentName: '={{ $json.name }}',
		},
		420,
	),
	buyingNode(
		'Create Amended PO V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'create',
			dataJson:
				'={{ JSON.stringify({ supplier: $node["Build Amend Context"].json.supplierName, company: $node["Build Amend Context"].json.company, transaction_date: $node["Build Amend Context"].json.transactionDate, schedule_date: $node["Build Amend Context"].json.scheduleDate, set_warehouse: $node["Build Amend Context"].json.warehouse, amended_from: $node["Cancel Original PO V2"].json.name, items: [{ item_code: $node["Build Amend Context"].json.itemCode, qty: $node["Build Amend Context"].json.amendedQty, rate: $node["Build Amend Context"].json.rate, schedule_date: $node["Build Amend Context"].json.scheduleDate, warehouse: $node["Build Amend Context"].json.warehouse }] }) }}',
		},
		640,
	),
	buyingNode(
		'Submit Amended PO V2',
		{
			resource: 'purchaseOrder',
			apiVersion: 'v2',
			operation: 'submit',
			documentName: '={{ $json.name }}',
		},
		860,
	),
	codeNode(
		'Return Safe Amend Summary',
		`const original = $node['Cancel Original PO V2'].json;
const amended = $node['Submit Amended PO V2'].json;
return [{ json: {
  status: original.docstatus === 2 && amended.docstatus === 1 && amended.amended_from === original.name ? 'passed' : 'needs_review',
  runId: $node['Build Amend Context'].json.runId,
  originalPurchaseOrder: original.name,
  originalDocstatus: original.docstatus,
  amendedPurchaseOrder: amended.name,
  amendedFrom: amended.amended_from,
  amendedDocstatus: amended.docstatus,
  amendedQty: amended.items?.[0]?.qty,
  responsePolicy: 'Only document names and amendment status are returned.'
} }];`,
		1080,
	),
];

const amendNames = amendNodes.map((node) => node.name);
const amendWorkflow = [
	{
		id: 'buyPurchaseOrderAmendV2Test01',
		name: 'ERPNext Buying V2 Purchase Order Amend Test',
		active: false,
		nodes: amendNodes,
		connections: connect(amendNames),
		settings: {
			executionOrder: 'v1',
			binaryMode: 'separate',
		},
		staticData: null,
		pinData: {},
		meta: {
			templateCredsSetupCompleted: true,
		},
		tags: [],
	},
];

fs.writeFileSync(
	'n8n-webhook-erpnext-buying-v2-purchase-order-amend-test.workflow.json',
	`${JSON.stringify(amendWorkflow, null, 2)}\n`,
);
