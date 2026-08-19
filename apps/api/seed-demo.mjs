/**
 * SalesK – Full Demo Seed Script
 * ─────────────────────────────────────────────────────────────────
 * Calls the live API at http://localhost:4000/api/v1 to seed a
 * realistic business scenario: "Savanna Mart" — a multi-branch
 * retail + café + salon operation in Nairobi, Kenya.
 *
 * Usage:  node apps/api/seed-demo.mjs
 * ─────────────────────────────────────────────────────────────────
 */

import axios from 'axios';

const BASE = 'http://localhost:4000/api/v1';
const api  = axios.create({ baseURL: BASE });

let token = '';
let currentTenantId = '';
const auth = () => ({ headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': currentTenantId } });
const log  = (msg) => console.log(`  ✔  ${msg}`);
const step = (msg) => console.log(`\n──── ${msg}`);

// ─── helpers ────────────────────────────────────────────────────
async function post(path, data) {
  const r = await api.post(path, data, auth());
  return r.data;
}
async function get(path) {
  const r = await api.get(path, auth());
  return r.data;
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════
async function seed() {
  console.log('\n🌱  SalesK Demo Seed — starting…\n');

  // ─── 1. Register owner + tenant ────────────────────────────
  step('1 · Register Tenant & Owner');
  let loginRes;
  try {
    loginRes = await api.post('/auth/register', {
      businessName: 'Savanna Mart',
      businessType: 'retail',
      email:        'owner@savannamart.co.ke',
      password:     'Demo@1234',
      firstName:    'James',
      lastName:     'Waweru',
      phone:        '+254712000001',
      country:      'KE',
      currency:     'KES',
    });
    log('Tenant & owner registered');
  } catch {
    // Already exists — just login
    loginRes = await api.post('/auth/login', {
      email:    'owner@savannamart.co.ke',
      password: 'Demo@1234',
    });
    log('Tenant already exists — logged in');
  }

  const { user, tokens } = loginRes.data;
  token = tokens.accessToken;
  const tenantId = user.tenantId;
  currentTenantId = tenantId;
  log(`Tenant ID: ${tenantId}`);

  // ─── 2. Branches ───────────────────────────────────────────
  step('2 · Branches');
  const branchDefs = [
    { name: 'CBD Main Store',   code: 'CBD-01', city: 'Nairobi', address: 'Kimathi Street, CBD', phone: '+254712001001', isHeadquarters: true },
    { name: 'Westlands Outlet', code: 'WLD-02', city: 'Nairobi', address: 'Westgate Mall, Level 1', phone: '+254712001002', isHeadquarters: false },
    { name: 'Karen Branch',     code: 'KRN-03', city: 'Nairobi', address: 'Karen Crossroads', phone: '+254712001003', isHeadquarters: false },
  ];
  const branches = [];
  for (const b of branchDefs) {
    try {
      const res = await post('/branches', b);
      branches.push(res);
      log(`Branch: ${b.name}`);
    } catch { log(`Branch ${b.name} skipped (exists)`); }
  }

  // Fetch branches to get IDs
  const allBranches = await get('/branches');
  const cbdBranch = allBranches.find(b => b.code === 'CBD-01') || allBranches[0];
  const wldBranch = allBranches.find(b => b.code === 'WLD-02') || allBranches[1] || allBranches[0];
  const krnBranch = allBranches.find(b => b.code === 'KRN-03') || allBranches[2] || allBranches[0];
  log(`Using branches: ${cbdBranch.name}, ${wldBranch.name}, ${krnBranch.name}`);

  // ─── 3. Staff users ────────────────────────────────────────
  step('3 · Staff Users');
  const staffDefs = [
    { firstName: 'Amina',  lastName: 'Hassan',  email: 'amina@savannamart.co.ke',  role: 'manager',  branchId: cbdBranch.id, phone: '+254712002001', password: 'Staff@1234' },
    { firstName: 'Brian',  lastName: 'Omondi',  email: 'brian@savannamart.co.ke',  role: 'cashier',  branchId: cbdBranch.id, phone: '+254712002002', password: 'Staff@1234' },
    { firstName: 'Cynthia',lastName: 'Wanjiku', email: 'cynthia@savannamart.co.ke',role: 'cashier',  branchId: wldBranch.id, phone: '+254712002003', password: 'Staff@1234' },
    { firstName: 'David',  lastName: 'Kipkoech',email: 'david@savannamart.co.ke',  role: 'manager',  branchId: krnBranch.id, phone: '+254712002004', password: 'Staff@1234' },
    { firstName: 'Eve',    lastName: 'Nyambura', email: 'eve@savannamart.co.ke',   role: 'kitchen',  branchId: cbdBranch.id, phone: '+254712002005', password: 'Staff@1234' },
    { firstName: 'Frank',  lastName: 'Mwangi',  email: 'frank@savannamart.co.ke',  role: 'viewer',   branchId: cbdBranch.id, phone: '+254712002006', password: 'Staff@1234' },
  ];
  const staffMap = {};
  for (const s of staffDefs) {
    try {
      const res = await post('/users/invite', s);
      staffMap[s.email] = res.id;
      log(`Staff ${s.firstName} created`);
    } catch (e) {
      if (e.response?.status === 400) console.log(e.response.data);
      log(`Staff ${s.firstName} skipped (exists)`);
    }
  }
  const allStaff = await get('/users');
  const aminaId = allStaff.find(u => u.email === 'amina@savannamart.co.ke')?.id || allStaff[0]?.id;
  const eveId   = allStaff.find(u => u.email === 'eve@savannamart.co.ke')?.id   || allStaff[0]?.id;

  // ─── 4. Categories ─────────────────────────────────────────
  step('4 · Product Categories');
  const catDefs = [
    { name: 'Beverages',    slug: 'beverages',    isKitchen: false },
    { name: 'Food & Snacks',slug: 'food-snacks',  isKitchen: true  },
    { name: 'Dairy',        slug: 'dairy',        isKitchen: false },
    { name: 'Household',    slug: 'household',    isKitchen: false },
    { name: 'Electronics',  slug: 'electronics',  isKitchen: false },
    { name: 'Personal Care',slug: 'personal-care',isKitchen: false },
    { name: 'Stationery',   slug: 'stationery',   isKitchen: false },
    { name: 'Hot Kitchen',  slug: 'hot-kitchen',  isKitchen: true  },
  ];
  const catMap = {};
  for (const c of catDefs) {
    try {
      const res = await post('/categories', { name: c.name, isKitchen: c.isKitchen });
      catMap[c.slug] = res.id;
      log(`Category: ${c.name}`);
    } catch (e) {
      if (e.response?.status === 400) console.log(e.response.data);
      log(`Category ${c.name} skipped (exists)`);
    }
  }
  // Fetch to ensure IDs
  const allCats = await get('/categories');
  for (const c of allCats) { catMap[c.slug] = c.id; }

  // ─── 5. Products ───────────────────────────────────────────
  step('5 · Products (50 items)');
  const productDefs = [
    // Beverages
    { name: 'Coca Cola 500ml',      sku: 'BEV-001', basePrice: 60,   costPrice: 40,  categoryId: catMap['beverages'],    unit: 'bottle', taxRate: 16 },
    { name: 'Fanta Orange 500ml',   sku: 'BEV-002', basePrice: 60,   costPrice: 40,  categoryId: catMap['beverages'],    unit: 'bottle', taxRate: 16 },
    { name: 'Sprite 500ml',         sku: 'BEV-003', basePrice: 60,   costPrice: 40,  categoryId: catMap['beverages'],    unit: 'bottle', taxRate: 16 },
    { name: 'Mineral Water 500ml',  sku: 'BEV-004', basePrice: 40,   costPrice: 25,  categoryId: catMap['beverages'],    unit: 'bottle', taxRate: 0  },
    { name: 'Juice Delmonte 1L',    sku: 'BEV-005', basePrice: 180,  costPrice: 130, categoryId: catMap['beverages'],    unit: 'carton', taxRate: 0  },
    { name: 'Coffee Beans 250g',    sku: 'BEV-006', basePrice: 650,  costPrice: 450, categoryId: catMap['beverages'],    unit: 'packet', taxRate: 0  },
    { name: 'Ketepa Tea Bags 50pk', sku: 'BEV-007', basePrice: 280,  costPrice: 190, categoryId: catMap['beverages'],    unit: 'box',    taxRate: 0  },
    { name: 'Red Bull 250ml',       sku: 'BEV-008', basePrice: 250,  costPrice: 180, categoryId: catMap['beverages'],    unit: 'can',    taxRate: 16 },
    // Food & Snacks
    { name: 'Pringles Original',    sku: 'FD-001',  basePrice: 450,  costPrice: 320, categoryId: catMap['food-snacks'],  unit: 'can',    taxRate: 16 },
    { name: 'Lay\'s Classic 100g',  sku: 'FD-002',  basePrice: 120,  costPrice: 80,  categoryId: catMap['food-snacks'],  unit: 'packet', taxRate: 16 },
    { name: 'Digestive Biscuits',   sku: 'FD-003',  basePrice: 95,   costPrice: 60,  categoryId: catMap['food-snacks'],  unit: 'packet', taxRate: 0  },
    { name: 'Cadbury Dairy Milk',   sku: 'FD-004',  basePrice: 180,  costPrice: 120, categoryId: catMap['food-snacks'],  unit: 'bar',    taxRate: 0  },
    { name: 'Smarties 48g',        sku: 'FD-005',  basePrice: 85,   costPrice: 55,  categoryId: catMap['food-snacks'],  unit: 'tube',   taxRate: 0  },
    { name: 'Bread Supa Loaf',      sku: 'FD-006',  basePrice: 60,   costPrice: 45,  categoryId: catMap['food-snacks'],  unit: 'loaf',   taxRate: 0  },
    { name: 'Wheat Flour 2kg',      sku: 'FD-007',  basePrice: 220,  costPrice: 170, categoryId: catMap['food-snacks'],  unit: 'bag',    taxRate: 0  },
    // Hot Kitchen (restaurant)
    { name: 'Chapati (2 pcs)',      sku: 'KIT-001', basePrice: 60,   costPrice: 25,  categoryId: catMap['hot-kitchen'],  unit: 'serving',taxRate: 16 },
    { name: 'Beef Stew',            sku: 'KIT-002', basePrice: 280,  costPrice: 120, categoryId: catMap['hot-kitchen'],  unit: 'serving',taxRate: 16 },
    { name: 'Chicken Pilau',        sku: 'KIT-003', basePrice: 380,  costPrice: 180, categoryId: catMap['hot-kitchen'],  unit: 'serving',taxRate: 16 },
    { name: 'Ugali + Sukuma',       sku: 'KIT-004', basePrice: 120,  costPrice: 50,  categoryId: catMap['hot-kitchen'],  unit: 'plate',  taxRate: 16 },
    { name: 'Mandazi (3 pcs)',      sku: 'KIT-005', basePrice: 40,   costPrice: 15,  categoryId: catMap['hot-kitchen'],  unit: 'serving',taxRate: 16 },
    { name: 'Samosa (2 pcs)',       sku: 'KIT-006', basePrice: 80,   costPrice: 35,  categoryId: catMap['hot-kitchen'],  unit: 'serving',taxRate: 16 },
    { name: 'Masala Tea',           sku: 'KIT-007', basePrice: 50,   costPrice: 15,  categoryId: catMap['hot-kitchen'],  unit: 'cup',    taxRate: 16 },
    { name: 'Espresso Shot',        sku: 'KIT-008', basePrice: 150,  costPrice: 40,  categoryId: catMap['hot-kitchen'],  unit: 'cup',    taxRate: 16 },
    // Dairy
    { name: 'Fresh Milk 500ml',     sku: 'DAI-001', basePrice: 55,   costPrice: 40,  categoryId: catMap['dairy'],        unit: 'bottle', taxRate: 0  },
    { name: 'Yoghurt Strawberry',   sku: 'DAI-002', basePrice: 75,   costPrice: 50,  categoryId: catMap['dairy'],        unit: 'cup',    taxRate: 0  },
    { name: 'Butter 250g',          sku: 'DAI-003', basePrice: 220,  costPrice: 160, categoryId: catMap['dairy'],        unit: 'pack',   taxRate: 0  },
    { name: 'Cheddar Cheese 200g',  sku: 'DAI-004', basePrice: 380,  costPrice: 260, categoryId: catMap['dairy'],        unit: 'block',  taxRate: 0  },
    { name: 'Eggs (tray 30)',       sku: 'DAI-005', basePrice: 480,  costPrice: 350, categoryId: catMap['dairy'],        unit: 'tray',   taxRate: 0  },
    // Household
    { name: 'Ariel Detergent 1kg',  sku: 'HH-001',  basePrice: 350,  costPrice: 240, categoryId: catMap['household'],    unit: 'pack',   taxRate: 16 },
    { name: 'Toilet Paper 6 rolls', sku: 'HH-002',  basePrice: 280,  costPrice: 190, categoryId: catMap['household'],    unit: 'pack',   taxRate: 16 },
    { name: 'Dettol 500ml',         sku: 'HH-003',  basePrice: 420,  costPrice: 290, categoryId: catMap['household'],    unit: 'bottle', taxRate: 16 },
    { name: 'Cooking Oil 1L',       sku: 'HH-004',  basePrice: 250,  costPrice: 190, categoryId: catMap['household'],    unit: 'bottle', taxRate: 0  },
    { name: 'Sugar 1kg',            sku: 'HH-005',  basePrice: 165,  costPrice: 130, categoryId: catMap['household'],    unit: 'bag',    taxRate: 0  },
    { name: 'Salt 1kg',             sku: 'HH-006',  basePrice: 55,   costPrice: 35,  categoryId: catMap['household'],    unit: 'pack',   taxRate: 0  },
    // Personal Care
    { name: 'Dove Soap 150g',       sku: 'PC-001',  basePrice: 180,  costPrice: 120, categoryId: catMap['personal-care'],unit: 'bar',    taxRate: 16 },
    { name: 'Head & Shoulders 400ml',sku:'PC-002',  basePrice: 680,  costPrice: 480, categoryId: catMap['personal-care'],unit: 'bottle', taxRate: 16 },
    { name: 'Colgate Toothpaste',   sku: 'PC-003',  basePrice: 145,  costPrice: 95,  categoryId: catMap['personal-care'],unit: 'tube',   taxRate: 16 },
    { name: 'Nivea Body Lotion',    sku: 'PC-004',  basePrice: 580,  costPrice: 390, categoryId: catMap['personal-care'],unit: 'bottle', taxRate: 16 },
    { name: 'Always Pads 8pk',      sku: 'PC-005',  basePrice: 120,  costPrice: 80,  categoryId: catMap['personal-care'],unit: 'pack',   taxRate: 0  },
    { name: 'Gillette Razor',       sku: 'PC-006',  basePrice: 95,   costPrice: 60,  categoryId: catMap['personal-care'],unit: 'piece',  taxRate: 16 },
    // Electronics
    { name: 'USB-C Cable 1m',       sku: 'EL-001',  basePrice: 350,  costPrice: 200, categoryId: catMap['electronics'],  unit: 'piece',  taxRate: 16 },
    { name: 'Power Bank 10000mAh',  sku: 'EL-002',  basePrice: 3200, costPrice: 2100,categoryId: catMap['electronics'],  unit: 'piece',  taxRate: 16 },
    { name: 'Earbuds Wireless',     sku: 'EL-003',  basePrice: 1800, costPrice: 1100,categoryId: catMap['electronics'],  unit: 'pair',   taxRate: 16 },
    { name: 'Screen Protector',     sku: 'EL-004',  basePrice: 250,  costPrice: 120, categoryId: catMap['electronics'],  unit: 'piece',  taxRate: 16 },
    { name: 'Phone Case Universal', sku: 'EL-005',  basePrice: 450,  costPrice: 220, categoryId: catMap['electronics'],  unit: 'piece',  taxRate: 16 },
    // Stationery
    { name: 'A4 Paper Ream 500',    sku: 'ST-001',  basePrice: 750,  costPrice: 520, categoryId: catMap['stationery'],   unit: 'ream',   taxRate: 16 },
    { name: 'Biro Pens 12pk',       sku: 'ST-002',  basePrice: 120,  costPrice: 70,  categoryId: catMap['stationery'],   unit: 'box',    taxRate: 16 },
    { name: 'Notebook A5',          sku: 'ST-003',  basePrice: 180,  costPrice: 100, categoryId: catMap['stationery'],   unit: 'piece',  taxRate: 16 },
    { name: 'Stapler + Staples',    sku: 'ST-004',  basePrice: 380,  costPrice: 220, categoryId: catMap['stationery'],   unit: 'set',    taxRate: 16 },
    { name: 'Sticky Notes 100pk',   sku: 'ST-005',  basePrice: 95,   costPrice: 55,  categoryId: catMap['stationery'],   unit: 'pack',   taxRate: 16 },
  ];

  const productMap = {}; // sku → id
  for (const p of productDefs) {
    if (!p.categoryId) { log(`Skipping ${p.name} (no category)`); continue; }
    try {
      const res = await post('/products', p);
      productMap[p.sku] = res.id;
      log(`Product: ${p.name} — KES ${p.basePrice}`);
    } catch (e) {
      if (e.response?.status === 400) console.log(e.response.data);
      log(`Product ${p.name} skipped (exists)`);
    }
  }
  // Fetch to fill skipped
  const allProds = await get('/products');
  for (const p of allProds) { if (p.sku) productMap[p.sku] = p.id; }

  // ─── 6. Inventory (stock for CBD & Westlands) ──────────────
  step('6 · Initial Inventory Stock');
  const stockItems = [
    // CBD
    ...productDefs.slice(0, 35).map(p => ({
      productId: productMap[p.sku],
      branchId: cbdBranch.id,
      quantity: Math.floor(Math.random() * 80) + 20,
      lowStockThreshold: 10,
    })),
    // Westlands
    ...productDefs.slice(0, 25).map(p => ({
      productId: productMap[p.sku],
      branchId: wldBranch.id,
      quantity: Math.floor(Math.random() * 50) + 10,
      lowStockThreshold: 8,
    })),
  ];
  for (const item of stockItems) {
    if (!item.productId) continue;
    try {
      await post('/inventory/adjust', {
        productId: item.productId,
        branchId:  item.branchId,
        type:      'adjustment',
        quantity:  item.quantity,
        notes:     'Initial stock — demo seed',
      });
    } catch { /* some may fail if already stocked */ }
  }
  log(`Stocked ${stockItems.length} inventory items`);

  // ─── 7. Suppliers ──────────────────────────────────────────
  step('7 · Suppliers');
  const supplierDefs = [
    { name: 'Nairobi Beverages Ltd',  email: 'orders@nairobibev.co.ke', phone: '+254700100001', address: 'Industrial Area, Nairobi', taxPin: 'P051000001A' },
    { name: 'Highlands Dairy Co.',    email: 'supply@highlands.co.ke',  phone: '+254700100002', address: 'Kiambu Road', taxPin: 'P051000002B' },
    { name: 'Metro Foods Distributor',email: 'info@metrofoods.co.ke',   phone: '+254700100003', address: 'Mombasa Road', taxPin: 'P051000003C' },
    { name: 'Tech Gadgets Kenya',     email: 'sales@techgadgets.co.ke', phone: '+254700100004', address: 'Tom Mboya Street', taxPin: 'P051000004D' },
    { name: 'Pencraft Stationery',    email: 'orders@pencraft.co.ke',   phone: '+254700100005', address: 'River Road', taxPin: 'P051000005E' },
  ];
  const supplierMap = {};
  for (const s of supplierDefs) {
    try {
      const res = await post('/suppliers', s);
      supplierMap[s.name] = res.id;
      log(`Supplier: ${s.name}`);
    } catch { log(`Supplier ${s.name} skipped`); }
  }
  const allSuppliers = await get('/suppliers');
  for (const s of allSuppliers) { supplierMap[s.name] = s.id; }
  const suppId1 = allSuppliers[0]?.id;
  const suppId2 = allSuppliers[1]?.id;

  // ─── 8. Purchase Orders ────────────────────────────────────
  step('8 · Purchase Orders');
  if (suppId1 && productMap['BEV-001']) {
    try {
      await post('/purchase-orders', {
        branchId:   cbdBranch.id,
        supplierId: suppId1,
        expectedDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        notes: 'Monthly beverages restock',
        items: [
          { productId: productMap['BEV-001'], quantity: 120, unitCost: 40 },
          { productId: productMap['BEV-002'], quantity: 120, unitCost: 40 },
          { productId: productMap['BEV-004'], quantity: 200, unitCost: 25 },
          { productId: productMap['BEV-008'], quantity: 48,  unitCost: 180 },
        ],
      });
      log('Purchase Order #1 — Beverages restock (CBD)');
    } catch { log('PO #1 skipped'); }
  }
  if (suppId2 && productMap['DAI-001']) {
    try {
      await post('/purchase-orders', {
        branchId:   wldBranch.id,
        supplierId: suppId2,
        expectedDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        notes: 'Dairy weekly delivery',
        items: [
          { productId: productMap['DAI-001'], quantity: 80,  unitCost: 40 },
          { productId: productMap['DAI-002'], quantity: 60,  unitCost: 50 },
          { productId: productMap['DAI-005'], quantity: 20,  unitCost: 350 },
        ],
      });
      log('Purchase Order #2 — Dairy (Westlands)');
    } catch { log('PO #2 skipped'); }
  }

  // ─── 9. Customers ──────────────────────────────────────────
  step('9 · Customers');
  const customerDefs = [
    { name: 'Grace Otieno',   phone: '+254711300001', email: 'grace@email.com',  loyaltyPoints: 450,  totalSpent: 18500, visitCount: 12 },
    { name: 'Peter Kamau',    phone: '+254711300002', email: 'peter@email.com',  loyaltyPoints: 1200, totalSpent: 52000, visitCount: 34 },
    { name: 'Mary Njeri',     phone: '+254711300003', email: 'mary@email.com',   loyaltyPoints: 80,   totalSpent: 4200,  visitCount: 3  },
    { name: 'John Mutua',     phone: '+254711300004', email: 'john@email.com',   loyaltyPoints: 320,  totalSpent: 15000, visitCount: 8  },
    { name: 'Faith Achieng',  phone: '+254711300005', email: 'faith@email.com',  loyaltyPoints: 950,  totalSpent: 38000, visitCount: 22 },
    { name: 'Samuel Kiprop',  phone: '+254711300006', email: null,               loyaltyPoints: 140,  totalSpent: 6500,  visitCount: 5  },
    { name: 'Esther Wairimu', phone: '+254711300007', email: 'esther@email.com', loyaltyPoints: 2100, totalSpent: 89000, visitCount: 51 },
    { name: 'Michael Oloo',   phone: '+254711300008', email: 'michael@email.com',loyaltyPoints: 60,   totalSpent: 2800,  visitCount: 2  },
    { name: 'Nancy Cheptoo',  phone: '+254711300009', email: null,               loyaltyPoints: 0,    totalSpent: 800,   visitCount: 1  },
    { name: 'Kevin Githinji', phone: '+254711300010', email: 'kevin@email.com',  loyaltyPoints: 590,  totalSpent: 24000, visitCount: 15 },
  ];
  const customerMap = {};
  for (const c of customerDefs) {
    try {
      const res = await post('/customers', c);
      customerMap[c.name] = res.id;
      log(`Customer: ${c.name} (${c.visitCount} visits, KES ${c.totalSpent})`);
    } catch { log(`Customer ${c.name} skipped`); }
  }
  const allCustomers = await get('/customers');
  for (const c of allCustomers) { customerMap[c.name] = c.id; }

  // ─── 10. Restaurant Tables ─────────────────────────────────
  step('10 · Restaurant Tables (CBD branch)');
  const tableDefs = [
    { name: 'Table 1', capacity: 2, section: 'Window',  posX: 10,  posY: 10  },
    { name: 'Table 2', capacity: 4, section: 'Window',  posX: 10,  posY: 120 },
    { name: 'Table 3', capacity: 4, section: 'Centre',  posX: 150, posY: 10  },
    { name: 'Table 4', capacity: 6, section: 'Centre',  posX: 150, posY: 120 },
    { name: 'Table 5', capacity: 6, section: 'Centre',  posX: 150, posY: 240 },
    { name: 'Table 6', capacity: 2, section: 'Bar',     posX: 300, posY: 10  },
    { name: 'Table 7', capacity: 4, section: 'Bar',     posX: 300, posY: 120 },
    { name: 'Table 8', capacity: 8, section: 'Private', posX: 420, posY: 10  },
  ];
  for (const t of tableDefs) {
    try {
      await post('/tables', { ...t, branchId: cbdBranch.id });
      log(`Table: ${t.name} (${t.section}, cap ${t.capacity})`);
    } catch { log(`Table ${t.name} skipped`); }
  }

  // ─── 11. Salon Services ────────────────────────────────────
  step('11 · Salon Services');
  const serviceDefs = [
    { name: 'Haircut (Ladies)',    description: 'Cut & style',              durationMinutes: 60,  price: 800  },
    { name: 'Haircut (Gents)',     description: 'Fade & trim',              durationMinutes: 30,  price: 400  },
    { name: 'Hair Colour',         description: 'Full colour application',  durationMinutes: 120, price: 3500 },
    { name: 'Blowout & Style',     description: 'Wash, blow & style',       durationMinutes: 45,  price: 600  },
    { name: 'Manicure',            description: 'Full nail care',           durationMinutes: 45,  price: 500  },
    { name: 'Pedicure',            description: 'Foot soak & nail care',    durationMinutes: 60,  price: 700  },
    { name: 'Facial Basic',        description: 'Cleanse & moisturise',     durationMinutes: 60,  price: 1200 },
    { name: 'Facial Deep Clean',   description: 'Exfoliation + masque',     durationMinutes: 90,  price: 2500 },
    { name: 'Eyebrow Threading',   description: 'Precise shaping',          durationMinutes: 15,  price: 200  },
    { name: 'Waxing (legs)',       description: 'Full leg wax',             durationMinutes: 60,  price: 1500 },
    { name: 'Massage (30 min)',    description: 'Relaxation massage',        durationMinutes: 30,  price: 1800 },
    { name: 'Massage (60 min)',    description: 'Full body relaxation',      durationMinutes: 60,  price: 3200 },
  ];
  const serviceMap = {};
  for (const s of serviceDefs) {
    try {
      const res = await post('/services', s);
      serviceMap[s.name] = res.id;
      log(`Service: ${s.name} — KES ${s.price}`);
    } catch { log(`Service ${s.name} skipped`); }
  }
  const allServices = await get('/services');
  for (const s of allServices) { serviceMap[s.name] = s.id; }

  // ─── 12. Appointments ──────────────────────────────────────
  step('12 · Appointments');
  const now = new Date();
  const todayDate = now.toISOString().slice(0, 10);
  const hairId = allServices.find(s => s.name === 'Haircut (Ladies)')?.id || allServices[0]?.id;
  const facialId = allServices.find(s => s.name === 'Facial Basic')?.id   || allServices[0]?.id;
  const manId    = allServices.find(s => s.name === 'Manicure')?.id        || allServices[0]?.id;
  const custIds  = Object.values(customerMap);

  const apptDefs = [
    { serviceId: hairId,   startTime: `${todayDate}T09:00:00`, endTime: `${todayDate}T10:00:00`, status: 'confirmed', customerId: custIds[0], staffId: aminaId, notes: 'Prefers gentle products' },
    { serviceId: facialId, startTime: `${todayDate}T10:30:00`, endTime: `${todayDate}T11:30:00`, status: 'booked',    customerId: custIds[1], staffId: aminaId  },
    { serviceId: manId,    startTime: `${todayDate}T11:00:00`, endTime: `${todayDate}T11:45:00`, status: 'booked',    customerId: custIds[2]                     },
    { serviceId: hairId,   startTime: `${todayDate}T13:00:00`, endTime: `${todayDate}T14:00:00`, status: 'booked',    customerId: custIds[3]                     },
    { serviceId: facialId, startTime: `${todayDate}T14:30:00`, endTime: `${todayDate}T15:30:00`, status: 'booked',    customerId: custIds[4], staffId: aminaId  },
  ];
  for (const a of apptDefs) {
    if (!a.serviceId) continue;
    try {
      await post('/appointments', { ...a, branchId: cbdBranch.id });
      log(`Appointment booked at ${a.startTime.split('T')[1]}`);
    } catch { log(`Appointment skipped`); }
  }

  // ─── 13. Summary ───────────────────────────────────────────
  step('✅  Seed Complete!');
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │          DEMO LOGIN CREDENTIALS                  │
  ├──────────────────────────────────────────────────┤
  │  Owner / Full Access                             │
  │  Email:    owner@savannamart.co.ke               │
  │  Password: Demo@1234                             │
  ├──────────────────────────────────────────────────┤
  │  Manager (CBD)                                   │
  │  Email:    amina@savannamart.co.ke               │
  │  Password: Staff@1234                            │
  ├──────────────────────────────────────────────────┤
  │  Cashier (CBD)                                   │
  │  Email:    brian@savannamart.co.ke               │
  │  Password: Staff@1234                            │
  ├──────────────────────────────────────────────────┤
  │  Cashier (Westlands)                             │
  │  Email:    cynthia@savannamart.co.ke             │
  │  Password: Staff@1234                            │
  ├──────────────────────────────────────────────────┤
  │  Kitchen Staff (CBD)                             │
  │  Email:    eve@savannamart.co.ke                 │
  │  Password: Staff@1234                            │
  └──────────────────────────────────────────────────┘

  Data seeded:
    • 1 Tenant  (Savanna Mart)
    • 3 Branches (CBD, Westlands, Karen)
    • 6 Staff users
    • 8 Categories
    • 50 Products
    • Stock for CBD + Westlands branches
    • 5 Suppliers
    • 2 Purchase Orders
    • 10 Customers (with loyalty data)
    • 8 Restaurant Tables
    • 12 Salon Services
    • 5 Today's Appointments

  Open http://localhost:3000 and log in!
`);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.response?.data || err.message);
  process.exit(1);
});
