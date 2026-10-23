-- EduSmart fresh Supabase schema
-- Finance, procurement, stores, and payroll
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/financeOperationsData.ts :: INITIAL_FEE_STRUCTURES (6 rows)
drop table if exists "edusmart"."fee_structures" cascade;
create table "edusmart"."fee_structures" (
  "id" text not null,
  "name" text not null,
  "amount" bigint not null,
  "grade_level" text not null,
  "frequency" text not null,
  "is_optional" boolean not null,
  "category" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."fee_structures" is $es$School data from src/data/financeOperationsData.ts export INITIAL_FEE_STRUCTURES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."fee_structures" ("id", "name", "amount", "grade_level", "frequency", "is_optional", "category", "school_id") values
  ($es$fee-1$es$, $es$Primary Tuition & Instruction Fee$es$, 38000, $es$Grades 1-6$es$, $es$Termly$es$, false, $es$Tuition$es$, $es$tenant-riara$es$),
  ($es$fee-2$es$, $es$Junior School Core Academic Tuition$es$, 48000, $es$Grades 7-9$es$, $es$Termly$es$, false, $es$Tuition$es$, $es$tenant-riara$es$),
  ($es$fee-3$es$, $es$Integrated Science & ICT STEM Lab Levy$es$, 6500, $es$Grades 7-9$es$, $es$Termly$es$, false, $es$STEM & ICT$es$, $es$tenant-riara$es$),
  ($es$fee-4$es$, $es$Nutritious Hot Lunch & Dining Program$es$, 11000, $es$Grades 1-9$es$, $es$Termly$es$, false, $es$Lunch & Dining$es$, $es$tenant-riara$es$),
  ($es$fee-5$es$, $es$Swimming & Co-Curricular Academy$es$, 5000, $es$Grades 1-9$es$, $es$Termly$es$, true, $es$Activity & Sports$es$, $es$tenant-riara$es$),
  ($es$fee-6$es$, $es$Daily School Bus Doorstep Transport (Zone 1)$es$, 14500, $es$Grades 1-9$es$, $es$Termly$es$, true, $es$Transport$es$, $es$tenant-riara$es$);
create index "fee_structures_school_id_idx" on "edusmart"."fee_structures" ("school_id");
alter table "edusmart"."fee_structures" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_GL_ACCOUNTS (10 rows)
drop table if exists "edusmart"."gl_accounts" cascade;
create table "edusmart"."gl_accounts" (
  "code" text not null,
  "name" text not null,
  "category" text not null,
  "balance" bigint not null,
  "currency" text not null,
  "description" text not null,
  "school_id" text not null,
  primary key ("school_id", "code")
);
comment on table "edusmart"."gl_accounts" is $es$School data from src/data/financeOperationsData.ts export INITIAL_GL_ACCOUNTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."gl_accounts" ("code", "name", "category", "balance", "currency", "description", "school_id") values
  ($es$1010$es$, $es$Main Operations Bank Account (KCB)$es$, $es$Asset$es$, 18450200, $es$KES$es$, $es$Primary institutional operational account for fee collections and disbursements$es$, $es$tenant-riara$es$),
  ($es$1020$es$, $es$Safaricom M-PESA Paybill 522123 Clearing$es$, $es$Asset$es$, 2145800, $es$KES$es$, $es$Real-time parent fee mobile collections awaiting daily automated sweep$es$, $es$tenant-riara$es$),
  ($es$1050$es$, $es$Central Stores Inventory Asset Value$es$, $es$Asset$es$, 3420000, $es$KES$es$, $es$Total capital value of current physical inventory in stock$es$, $es$tenant-riara$es$),
  ($es$2010$es$, $es$Accounts Payable (Trade Creditors)$es$, $es$Liability$es$, 1840000, $es$KES$es$, $es$Outstanding pending supplier invoices awaiting net 30 day disbursement$es$, $es$tenant-riara$es$),
  ($es$2030$es$, $es$Statutory Payroll Deductions Payable (KRA, NSSF, SHIF)$es$, $es$Liability$es$, 940000, $es$KES$es$, $es$Employee PAYE, NSSF, Housing Levy withheld awaiting 9th of next month remittance$es$, $es$tenant-riara$es$),
  ($es$3010$es$, $es$School Termly Tuition Revenue$es$, $es$Revenue$es$, 46250000, $es$KES$es$, $es$Accumulated termly academic tuition collections$es$, $es$tenant-riara$es$),
  ($es$3020$es$, $es$Lunch, Dining & Boarding Revenue$es$, $es$Revenue$es$, 12400000, $es$KES$es$, $es$Catering and boarding auxiliary revenue stream$es$, $es$tenant-riara$es$),
  ($es$4010$es$, $es$Teaching Faculty Salaries & Allowances$es$, $es$Expense$es$, 21850000, $es$KES$es$, $es$Monthly instructional staff compensation$es$, $es$tenant-riara$es$),
  ($es$4020$es$, $es$Learning Materials, Laboratory & STEM$es$, $es$Expense$es$, 4620000, $es$KES$es$, $es$Classroom books, science specimens, stationery, coding resources$es$, $es$tenant-riara$es$),
  ($es$4030$es$, $es$Fleet Fuel & Bus Maintenance Expenses$es$, $es$Expense$es$, 2850000, $es$KES$es$, $es$Vehicle servicing, diesel fuel, insurance inspection$es$, $es$tenant-riara$es$);
create index "gl_accounts_school_id_idx" on "edusmart"."gl_accounts" ("school_id");
alter table "edusmart"."gl_accounts" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_BUDGETS (5 rows)
drop table if exists "edusmart"."budgets" cascade;
create table "edusmart"."budgets" (
  "id" text not null,
  "tenant_id" text not null,
  "department" text not null,
  "fiscal_year" text not null,
  "allocated_amount" bigint not null,
  "committed_amount" bigint not null,
  "spent_amount" bigint not null,
  "remaining_amount" bigint not null,
  "lead_officer" text not null,
  primary key ("id")
);
comment on table "edusmart"."budgets" is $es$School data from src/data/financeOperationsData.ts export INITIAL_BUDGETS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."budgets" ("id", "tenant_id", "department", "fiscal_year", "allocated_amount", "committed_amount", "spent_amount", "remaining_amount", "lead_officer") values
  ($es$bgt-1$es$, $es$tenant-riara$es$, $es$Academics & CBC Curriculum$es$, $es$2026$es$, 5200000, 950000, 2850000, 1400000, $es$Mr. Patrick Kamau$es$),
  ($es$bgt-2$es$, $es$tenant-riara$es$, $es$Science Laboratory & STEM$es$, $es$2026$es$, 3100000, 480000, 1650000, 970000, $es$Mrs. Lydia Muthoni$es$),
  ($es$bgt-3$es$, $es$tenant-riara$es$, $es$Sports, Clubs & Co-Curricular$es$, $es$2026$es$, 2200000, 320000, 1100000, 780000, $es$Coach Daniel Kimani$es$),
  ($es$bgt-4$es$, $es$tenant-riara$es$, $es$School Fleet & Transport$es$, $es$2026$es$, 4500000, 650000, 2450000, 1400000, $es$Mr. Francis Mwangi$es$),
  ($es$bgt-5$es$, $es$tenant-riara$es$, $es$Facilities, Security & Hygiene$es$, $es$2026$es$, 2800000, 420000, 1450000, 930000, $es$Mr. Joseph Otieno$es$);
create index "budgets_tenant_id_idx" on "edusmart"."budgets" ("tenant_id");
alter table "edusmart"."budgets" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_SUPPLIERS (4 rows)
drop table if exists "edusmart"."suppliers" cascade;
create table "edusmart"."suppliers" (
  "id" text not null,
  "tenant_id" text not null,
  "name" text not null,
  "kra_pin" text not null,
  "tax_compliance_valid" boolean not null,
  "category" text not null,
  "contact_person" text not null,
  "phone" text not null,
  "email" text not null,
  "address" text not null,
  "bank_name" text not null,
  "bank_account" text not null,
  "rating" bigint not null,
  "status" text not null,
  primary key ("id")
);
comment on table "edusmart"."suppliers" is $es$School data from src/data/financeOperationsData.ts export INITIAL_SUPPLIERS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."suppliers" ("id", "tenant_id", "name", "kra_pin", "tax_compliance_valid", "category", "contact_person", "phone", "email", "address", "bank_name", "bank_account", "rating", "status") values
  ($es$sup-1$es$, $es$tenant-riara$es$, $es$Text Book Centre Ltd$es$, $es$P051123456Z$es$, true, $es$Textbooks & Stationery$es$, $es$Mr. Ramesh Shah$es$, $es$+254 722 203 400$es$, $es$corporate@tbc.co.ke$es$, $es$Kijabe Street / Sarit Centre, Nairobi$es$, $es$Standard Chartered Bank$es$, $es$010204992100$es$, 5, $es$Approved$es$),
  ($es$sup-2$es$, $es$tenant-riara$es$, $es$Chemlab Kenya East Africa Ltd$es$, $es$P051987654A$es$, true, $es$Laboratory Chemicals & Apparatus$es$, $es$Dr. Kennedy Oduor$es$, $es$+254 733 992 110$es$, $es$orders@chemlab-ea.com$es$, $es$Industrial Area, Enterprise Road, Nairobi$es$, $es$Equity Bank Kenya$es$, $es$0810293847291$es$, 5, $es$Approved$es$),
  ($es$sup-3$es$, $es$tenant-riara$es$, $es$Nairobi Sports House & Apparel$es$, $es$P051445566B$es$, true, $es$Sports Gear & Trophies$es$, $es$Ms. Pauline Muthoni$es$, $es$+254 720 123 456$es$, $es$info@nairobisports.co.ke$es$, $es$Moi Avenue, Nairobi CBD$es$, $es$KCB Bank$es$, $es$1102938472$es$, 4, $es$Approved$es$),
  ($es$sup-4$es$, $es$tenant-riara$es$, $es$Bidco Africa Institutional Food Division$es$, $es$P051778899C$es$, true, $es$Food Supplies & Kitchen Provisions$es$, $es$Mr. Hassan Noor$es$, $es$+254 711 445 566$es$, $es$institutions@bidco-group.com$es$, $es$Thika Superhighway, Ruiru Industrial Hub$es$, $es$Cooperative Bank of Kenya$es$, $es$01129384719200$es$, 5, $es$Approved$es$);
create index "suppliers_tenant_id_idx" on "edusmart"."suppliers" ("tenant_id");
alter table "edusmart"."suppliers" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_REQUISITIONS (2 rows)
drop table if exists "edusmart"."requisitions" cascade;
create table "edusmart"."requisitions" (
  "id" text not null,
  "req_number" text not null,
  "tenant_id" text not null,
  "department" text not null,
  "requested_by" text not null,
  "requester_role" text not null,
  "request_date" text not null,
  "required_date" text not null,
  "priority" text not null,
  "justification" text not null,
  "items" jsonb not null,
  "total_estimated_cost" bigint not null,
  "status" text not null,
  "approval_chain" jsonb not null,
  primary key ("id")
);
comment on table "edusmart"."requisitions" is $es$School data from src/data/financeOperationsData.ts export INITIAL_REQUISITIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."requisitions" ("id", "req_number", "tenant_id", "department", "requested_by", "requester_role", "request_date", "required_date", "priority", "justification", "items", "total_estimated_cost", "status", "approval_chain") values
  ($es$req-1$es$, $es$REQ-2026-0042$es$, $es$tenant-riara$es$, $es$Science Laboratory & STEM$es$, $es$Mrs. Lydia Muthoni$es$, $es$Senior Science Teacher$es$, $es$2026-03-05$es$, $es$2026-03-18$es$, $es$High$es$, $es$Critical biological specimens, microscopic glass slides, and diluted acids needed for Grade 8 Term 1 KNEC formative CBA experiments.$es$, $es$[{"id":"item-1","description":"Compound Optical Microscopes (1000x)","specification":"Monocular with LED illumination & mechanical stage","quantity":4,"unit":"Units","estimatedUnitCost":18500,"estimatedTotal":74000},{"id":"item-2","description":"Pre-prepared Plant Tissue Slides (Set of 50)","specification":"KICD approved plant stem, leaf, and root cross sections","quantity":5,"unit":"Sets","estimatedUnitCost":4500,"estimatedTotal":22500},{"id":"item-3","description":"Dilute Hydrochloric Acid (0.1M, 2.5L)","specification":"Analytical grade laboratory bottle","quantity":6,"unit":"Bottles","estimatedUnitCost":2800,"estimatedTotal":16800}]$es$::jsonb, 113300, $es$Head Teacher Approved$es$, $es$[{"role":"Head of Department","approverName":"Mr. James Ochieng","approvedAt":"2026-03-06 09:15","status":"Approved","comments":"Essential for Junior School CBC curriculum delivery."},{"role":"Finance / Bursar","approverName":"Mr. David Mwangi","approvedAt":"2026-03-07 11:30","status":"Approved","comments":"Budget available under Science Lab allocation (Code 4020)."},{"role":"Head Teacher","approverName":"Mr. Patrick Kamau","approvedAt":"2026-03-08 14:00","status":"Approved","comments":"Approved for immediate Local Purchase Order issuance."}]$es$::jsonb),
  ($es$req-2$es$, $es$REQ-2026-0043$es$, $es$tenant-riara$es$, $es$Sports, Clubs & Co-Curricular$es$, $es$Coach Daniel Kimani$es$, $es$Head of Athletics & Football$es$, $es$2026-03-10$es$, $es$2026-03-24$es$, $es$Medium$es$, $es$Replacement footballs, referee whistles, agility cones, and first-aid stretcher for Sub-County inter-school tournament.$es$, $es$[{"id":"item-4","description":"Mitre Match Size 5 Footballs","specification":"FIFA Quality Pro certified match balls","quantity":12,"unit":"Balls","estimatedUnitCost":3500,"estimatedTotal":42000},{"id":"item-5","description":"Heavy Duty Training Agility Cones","specification":"Set of 40 multi-color 9-inch cones","quantity":4,"unit":"Sets","estimatedUnitCost":2400,"estimatedTotal":9600}]$es$::jsonb, 51600, $es$LPO Created$es$, $es$[{"role":"Head of Department","approverName":"Coach Daniel Kimani","approvedAt":"2026-03-10 14:10","status":"Approved"},{"role":"Finance / Bursar","approverName":"Mr. David Mwangi","approvedAt":"2026-03-11 10:20","status":"Approved"},{"role":"Head Teacher","approverName":"Mr. Patrick Kamau","approvedAt":"2026-03-11 16:45","status":"Approved"}]$es$::jsonb);
create index "requisitions_tenant_id_idx" on "edusmart"."requisitions" ("tenant_id");
alter table "edusmart"."requisitions" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_LPOS (1 rows)
drop table if exists "edusmart"."lpos" cascade;
create table "edusmart"."lpos" (
  "id" text not null,
  "lpo_number" text not null,
  "tenant_id" text not null,
  "requisition_id" text not null,
  "vendor_id" text not null,
  "vendor_name" text not null,
  "vendor_phone" text not null,
  "order_date" text not null,
  "delivery_due_date" text not null,
  "items" jsonb not null,
  "subtotal" bigint not null,
  "tax_vat" bigint not null,
  "total_amount" bigint not null,
  "payment_terms" text not null,
  "delivery_location" text not null,
  "authorized_by" text not null,
  "status" text not null,
  primary key ("id")
);
comment on table "edusmart"."lpos" is $es$School data from src/data/financeOperationsData.ts export INITIAL_LPOS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."lpos" ("id", "lpo_number", "tenant_id", "requisition_id", "vendor_id", "vendor_name", "vendor_phone", "order_date", "delivery_due_date", "items", "subtotal", "tax_vat", "total_amount", "payment_terms", "delivery_location", "authorized_by", "status") values
  ($es$lpo-1$es$, $es$LPO-2026-0088$es$, $es$tenant-riara$es$, $es$req-1$es$, $es$sup-2$es$, $es$Chemlab Kenya East Africa Ltd$es$, $es$+254 733 992 110$es$, $es$2026-03-09$es$, $es$2026-03-22$es$, $es$[{"description":"Compound Optical Microscopes (1000x)","quantity":4,"unit":"Units","unitPrice":18500,"totalPrice":74000},{"description":"Pre-prepared Plant Tissue Slides (Set of 50)","quantity":5,"unit":"Sets","unitPrice":4500,"totalPrice":22500},{"description":"Dilute Hydrochloric Acid (0.1M, 2.5L)","quantity":6,"unit":"Bottles","unitPrice":2800,"totalPrice":16800}]$es$::jsonb, 113300, 18128, 131428, $es$30 Days Net after Inspection & Goods Received Note$es$, $es$Riara Junior School Science Laboratory Block B$es$, $es$Mr. Patrick Kamau (Principal)$es$, $es$Issued$es$);
create index "lpos_tenant_id_idx" on "edusmart"."lpos" ("tenant_id");
alter table "edusmart"."lpos" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_INVENTORY (7 rows)
drop table if exists "edusmart"."inventory" cascade;
create table "edusmart"."inventory" (
  "id" text not null,
  "item_code" text not null,
  "tenant_id" text not null,
  "name" text not null,
  "category" text not null,
  "store_location" text not null,
  "unit" text not null,
  "current_stock" bigint not null,
  "reorder_level" bigint not null,
  "unit_cost" bigint not null,
  "total_value" bigint not null,
  "last_restocked_date" text not null,
  "supplier_name" text not null,
  primary key ("id")
);
comment on table "edusmart"."inventory" is $es$School data from src/data/financeOperationsData.ts export INITIAL_INVENTORY. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."inventory" ("id", "item_code", "tenant_id", "name", "category", "store_location", "unit", "current_stock", "reorder_level", "unit_cost", "total_value", "last_restocked_date", "supplier_name") values
  ($es$inv-1$es$, $es$STN-PPR-01$es$, $es$tenant-riara$es$, $es$A4 White Ruled Printing Paper (80gsm)$es$, $es$Classroom Stationery$es$, $es$Main Central Store$es$, $es$Reams$es$, 240, 50, 680, 163200, $es$2026-02-15$es$, $es$Text Book Centre Ltd$es$),
  ($es$inv-2$es$, $es$STN-FOL-02$es$, $es$tenant-riara$es$, $es$CBC Learner Formative Assessment Portfolios$es$, $es$Classroom Stationery$es$, $es$Main Central Store$es$, $es$Pcs$es$, 420, 100, 260, 109200, $es$2026-02-20$es$, $es$Text Book Centre Ltd$es$),
  ($es$inv-3$es$, $es$LAB-MIC-03$es$, $es$tenant-riara$es$, $es$Monocular Student Compound Microscope 1000x$es$, $es$Science Lab Reagents & Apparatus$es$, $es$Science Laboratory Store$es$, $es$Units$es$, 18, 5, 18500, 333000, $es$2026-01-10$es$, $es$Chemlab Kenya East Africa Ltd$es$),
  ($es$inv-4$es$, $es$LAB-ACD-04$es$, $es$tenant-riara$es$, $es$Dilute Hydrochloric Acid 0.1M (2.5L Container)$es$, $es$Science Lab Reagents & Apparatus$es$, $es$Science Laboratory Store$es$, $es$Bottles$es$, 14, 6, 2800, 39200, $es$2026-02-05$es$, $es$Chemlab Kenya East Africa Ltd$es$),
  ($es$inv-5$es$, $es$SPT-BAL-05$es$, $es$tenant-riara$es$, $es$Mitre Match Size 5 Footballs (FIFA Approved)$es$, $es$Sports & Athletics Equipment$es$, $es$Sports Equipment Shed$es$, $es$Balls$es$, 28, 10, 3500, 98000, $es$2026-02-12$es$, $es$Nairobi Sports House & Apparel$es$),
  ($es$inv-6$es$, $es$UNI-BLZ-06$es$, $es$tenant-riara$es$, $es$Junior School Embroidered Navy Blazer (Size 34-38)$es$, $es$Uniforms & Apparel$es$, $es$Main Central Store$es$, $es$Pcs$es$, 85, 25, 3800, 323000, $es$2026-01-28$es$, $es$Nairobi Sports House & Apparel$es$),
  ($es$inv-7$es$, $es$KIT-RIC-07$es$, $es$tenant-riara$es$, $es$Pure Mwea Pishori Rice Grade 1 (50Kg Sack)$es$, $es$Kitchen Dry Provisions$es$, $es$Kitchen Pantry Store$es$, $es$Sacks$es$, 45, 15, 8200, 369000, $es$2026-03-01$es$, $es$Bidco Africa Institutional Food Division$es$);
create index "inventory_tenant_id_idx" on "edusmart"."inventory" ("tenant_id");
alter table "edusmart"."inventory" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_GRNS (1 rows)
drop table if exists "edusmart"."grns" cascade;
create table "edusmart"."grns" (
  "id" text not null,
  "grn_number" text not null,
  "tenant_id" text not null,
  "lpo_id" text not null,
  "lpo_number" text not null,
  "vendor_name" text not null,
  "delivery_note_number" text not null,
  "received_date" text not null,
  "received_by" text not null,
  "inspected_by" text not null,
  "inspection_passed" boolean not null,
  "items_received" jsonb not null,
  "total_accepted_value" bigint not null,
  "remarks" text not null,
  primary key ("id")
);
comment on table "edusmart"."grns" is $es$School data from src/data/financeOperationsData.ts export INITIAL_GRNS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."grns" ("id", "grn_number", "tenant_id", "lpo_id", "lpo_number", "vendor_name", "delivery_note_number", "received_date", "received_by", "inspected_by", "inspection_passed", "items_received", "total_accepted_value", "remarks") values
  ($es$grn-1$es$, $es$GRN-2026-0104$es$, $es$tenant-riara$es$, $es$lpo-1$es$, $es$LPO-2026-0088$es$, $es$Chemlab Kenya East Africa Ltd$es$, $es$DN-89201$es$, $es$2026-03-12$es$, $es$Mr. Joseph Otieno (Storekeeper)$es$, $es$Mrs. Lydia Muthoni (Senior Science Teacher)$es$, true, $es$[{"itemId":"inv-3","itemName":"Monocular Student Compound Microscope 1000x","orderedQty":4,"receivedQty":4,"acceptedQty":4,"rejectedQty":0,"unitCost":18500},{"itemId":"inv-4","itemName":"Dilute Hydrochloric Acid 0.1M (2.5L Container)","orderedQty":6,"receivedQty":6,"acceptedQty":6,"rejectedQty":0,"unitCost":2800}]$es$::jsonb, 90800, $es$Delivered in pristine condition with unbroken safety seals and calibration certificates.$es$);
create index "grns_tenant_id_idx" on "edusmart"."grns" ("tenant_id");
alter table "edusmart"."grns" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_SIVS (1 rows)
drop table if exists "edusmart"."sivs" cascade;
create table "edusmart"."sivs" (
  "id" text not null,
  "siv_number" text not null,
  "tenant_id" text not null,
  "issue_date" text not null,
  "issued_to_name" text not null,
  "issued_to_role" text not null,
  "department" text not null,
  "purpose" text not null,
  "issued_by" text not null,
  "items" jsonb not null,
  "total_value" bigint not null,
  "status" text not null,
  primary key ("id")
);
comment on table "edusmart"."sivs" is $es$School data from src/data/financeOperationsData.ts export INITIAL_SIVS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."sivs" ("id", "siv_number", "tenant_id", "issue_date", "issued_to_name", "issued_to_role", "department", "purpose", "issued_by", "items", "total_value", "status") values
  ($es$siv-1$es$, $es$SIV-2026-0210$es$, $es$tenant-riara$es$, $es$2026-03-13$es$, $es$Madame Alice Mutiso$es$, $es$Grade 7 Mara Class Teacher$es$, $es$Junior School Languages & Humanities$es$, $es$Distribution of termly CBC formative assessment portfolio dossiers to 36 learners.$es$, $es$Mr. Joseph Otieno (Chief Storekeeper)$es$, $es$[{"itemId":"inv-2","itemName":"CBC Learner Formative Assessment Portfolios","quantity":36,"unit":"Pcs","unitCost":260,"totalCost":9360}]$es$::jsonb, 9360, $es$Dispatched & Signed$es$);
create index "sivs_tenant_id_idx" on "edusmart"."sivs" ("tenant_id");
alter table "edusmart"."sivs" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_EMPLOYEES (5 rows)
drop table if exists "edusmart"."employees" cascade;
create table "edusmart"."employees" (
  "id" text not null,
  "tenant_id" text not null,
  "employee_number" text not null,
  "name" text not null,
  "national_id" text not null,
  "tsc_number" text,
  "kra_pin" text not null,
  "nssf_number" text not null,
  "nhif_shif_number" text not null,
  "department" text not null,
  "designation" text not null,
  "employment_type" text not null,
  "date_of_joining" text not null,
  "email" text not null,
  "phone" text not null,
  "bank_name" text not null,
  "bank_account" text not null,
  "bank_branch" text not null,
  "basic_salary" bigint not null,
  "house_allowance" bigint not null,
  "commuter_allowance" bigint not null,
  "hardship_allowance" bigint not null,
  "responsibility_allowance" bigint not null,
  "gross_pay" bigint not null,
  "status" text not null,
  primary key ("id")
);
comment on table "edusmart"."employees" is $es$School data from src/data/financeOperationsData.ts export INITIAL_EMPLOYEES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."employees" ("id", "tenant_id", "employee_number", "name", "national_id", "tsc_number", "kra_pin", "nssf_number", "nhif_shif_number", "department", "designation", "employment_type", "date_of_joining", "email", "phone", "bank_name", "bank_account", "bank_branch", "basic_salary", "house_allowance", "commuter_allowance", "hardship_allowance", "responsibility_allowance", "gross_pay", "status") values
  ($es$emp-1$es$, $es$tenant-riara$es$, $es$EMP-RS-001$es$, $es$Mr. Patrick Kamau$es$, $es$12445892$es$, $es$TSC/489201/ED$es$, $es$A004829103K$es$, $es$1092837492$es$, $es$9201928301$es$, $es$Executive Administration$es$, $es$School Principal & Campus Lead$es$, $es$Permanent & Pensionable$es$, $es$2015-01-05$es$, $es$admin@riaraschools.ac.ke$es$, $es$+254 703 038 100$es$, $es$KCB Bank Kenya$es$, $es$1102938472$es$, $es$Kilimani Branch$es$, 145000, 35000, 12000, 0, 25000, 217000, $es$Active$es$),
  ($es$emp-2$es$, $es$tenant-riara$es$, $es$EMP-RS-002$es$, $es$Mrs. Lydia Muthoni$es$, $es$18920394$es$, $es$TSC/552309/ED$es$, $es$A005910293L$es$, $es$1102938491$es$, $es$9301928340$es$, $es$Science & Mathematics Faculty$es$, $es$Senior Science Teacher & Head of STEM$es$, $es$Permanent & Pensionable$es$, $es$2018-05-12$es$, $es$l.muthoni@edusmart.ac.ke$es$, $es$+254 722 441 552$es$, $es$Equity Bank Kenya$es$, $es$0810294829104$es$, $es$Community Upper Hill Branch$es$, 88000, 22000, 8000, 0, 10000, 128000, $es$Active$es$),
  ($es$emp-3$es$, $es$tenant-riara$es$, $es$EMP-RS-003$es$, $es$Madame Alice Mutiso$es$, $es$22839401$es$, $es$TSC/892019/ED$es$, $es$A006829104M$es$, $es$1129384910$es$, $es$9401928391$es$, $es$Languages & Humanities$es$, $es$Grade 7 Mara Class Teacher & English Faculty$es$, $es$Permanent & Pensionable$es$, $es$2020-01-08$es$, $es$a.mutiso@edusmart.ac.ke$es$, $es$+254 722 334 455$es$, $es$Cooperative Bank of Kenya$es$, $es$01129384910200$es$, $es$Yaya Centre Branch$es$, 74000, 18000, 6000, 0, 5000, 103000, $es$Active$es$),
  ($es$emp-4$es$, $es$tenant-riara$es$, $es$EMP-RS-004$es$, $es$Mr. David Mwangi$es$, $es$15920384$es$, null, $es$A003910294N$es$, $es$1094839201$es$, $es$9102938492$es$, $es$Finance & Accounts$es$, $es$School Bursar & Finance Director$es$, $es$Permanent & Pensionable$es$, $es$2016-09-01$es$, $es$finance@edusmart.ac.ke$es$, $es$+254 721 889 900$es$, $es$Standard Chartered Bank$es$, $es$010209482910$es$, $es$Harambee Avenue Branch$es$, 95000, 25000, 10000, 0, 12000, 142000, $es$Active$es$),
  ($es$emp-5$es$, $es$tenant-riara$es$, $es$EMP-RS-005$es$, $es$Mr. Joseph Otieno$es$, $es$24910293$es$, null, $es$A007910294O$es$, $es$1139482019$es$, $es$9502938491$es$, $es$Stores & Facilities Logistics$es$, $es$Chief Storekeeper & Inventory Custodian$es$, $es$Permanent & Pensionable$es$, $es$2019-03-15$es$, $es$stores@edusmart.ac.ke$es$, $es$+254 724 667 788$es$, $es$NCBA Bank Kenya$es$, $es$10029384910$es$, $es$Upper Hill Branch$es$, 52000, 12000, 5000, 0, 0, 69000, $es$Active$es$);
create index "employees_tenant_id_idx" on "edusmart"."employees" ("tenant_id");
alter table "edusmart"."employees" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_PAYROLL_RUNS (1 rows)
drop table if exists "edusmart"."payroll_runs" cascade;
create table "edusmart"."payroll_runs" (
  "id" text not null,
  "run_number" text not null,
  "tenant_id" text not null,
  "payroll_month" text not null,
  "academic_year" text not null,
  "term" text not null,
  "total_employees" bigint not null,
  "total_gross_pay" bigint not null,
  "total_paye_tax" bigint not null,
  "total_nssf" bigint not null,
  "total_nhif_shif" bigint not null,
  "total_housing_levy" bigint not null,
  "total_net_pay" bigint not null,
  "status" text not null,
  "prepared_by" text not null,
  "approved_by" text not null,
  "approval_date" text not null,
  "general_ledger_journal_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."payroll_runs" is $es$School data from src/data/financeOperationsData.ts export INITIAL_PAYROLL_RUNS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."payroll_runs" ("id", "run_number", "tenant_id", "payroll_month", "academic_year", "term", "total_employees", "total_gross_pay", "total_paye_tax", "total_nssf", "total_nhif_shif", "total_housing_levy", "total_net_pay", "status", "prepared_by", "approved_by", "approval_date", "general_ledger_journal_id") values
  ($es$pay-2026-02$es$, $es$PAY-2026-002$es$, $es$tenant-riara$es$, $es$February 2026$es$, $es$2026$es$, $es$Term 1, 2026$es$, 5, 659000, 128450, 10800, 18122, 9885, 491743, $es$Disbursed$es$, $es$Mr. David Mwangi (Bursar)$es$, $es$Mr. Patrick Kamau (Head Teacher)$es$, $es$2026-02-27 15:30$es$, $es$GL-PAY-2026-02$es$);
create index "payroll_runs_tenant_id_idx" on "edusmart"."payroll_runs" ("tenant_id");
alter table "edusmart"."payroll_runs" enable row level security;

-- src/data/financeOperationsData.ts :: INITIAL_AUDIT_LOGS (4 rows)
drop table if exists "edusmart"."audit_logs" cascade;
create table "edusmart"."audit_logs" (
  "id" text not null,
  "tenant_id" text not null,
  "timestamp" text not null,
  "user_email" text not null,
  "user_name" text not null,
  "user_role" text not null,
  "module" text not null,
  "action_type" text not null,
  "description" text not null,
  "reference_id" text not null,
  "amount_impacted" bigint not null,
  primary key ("id")
);
comment on table "edusmart"."audit_logs" is $es$School data from src/data/financeOperationsData.ts export INITIAL_AUDIT_LOGS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."audit_logs" ("id", "tenant_id", "timestamp", "user_email", "user_name", "user_role", "module", "action_type", "description", "reference_id", "amount_impacted") values
  ($es$log-1$es$, $es$tenant-riara$es$, $es$2026-03-08 14:02:10$es$, $es$admin@riaraschools.ac.ke$es$, $es$Mr. Patrick Kamau$es$, $es$head_teacher$es$, $es$Procurement$es$, $es$REQUISITION_APPROVED$es$, $es$Final executive approval granted for Science Laboratory Requisition REQ-2026-0042.$es$, $es$REQ-2026-0042$es$, 113300),
  ($es$log-2$es$, $es$tenant-riara$es$, $es$2026-03-09 10:15:30$es$, $es$finance@edusmart.ac.ke$es$, $es$Mr. David Mwangi$es$, $es$finance_officer$es$, $es$Procurement$es$, $es$LPO_ISSUED$es$, $es$Issued LPO-2026-0088 to Chemlab Kenya East Africa Ltd.$es$, $es$LPO-2026-0088$es$, 131428),
  ($es$log-3$es$, $es$tenant-riara$es$, $es$2026-03-12 11:45:00$es$, $es$stores@edusmart.ac.ke$es$, $es$Mr. Joseph Otieno$es$, $es$storekeeper$es$, $es$Stores$es$, $es$GRN_ACCEPTED$es$, $es$Received Goods Received Note GRN-2026-0104. Added 4 microscopes & 6 acid bottles to stock.$es$, $es$GRN-2026-0104$es$, 90800),
  ($es$log-4$es$, $es$tenant-riara$es$, $es$2026-03-13 09:30:15$es$, $es$stores@edusmart.ac.ke$es$, $es$Mr. Joseph Otieno$es$, $es$storekeeper$es$, $es$Stores$es$, $es$STORE_ISSUED$es$, $es$Dispatched SIV-2026-0210: 36 CBC portfolios to Grade 7 Mara Class Teacher.$es$, $es$SIV-2026-0210$es$, 9360);
create index "audit_logs_tenant_id_idx" on "edusmart"."audit_logs" ("tenant_id");
alter table "edusmart"."audit_logs" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
