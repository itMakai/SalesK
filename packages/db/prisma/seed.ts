import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create a dummy tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant' },
    update: {},
    create: {
      id: 'default-tenant',
      name: 'Default SalesK',
      businessType: 'retail',
      slug: 'default-salesk',
      email: 'admin@salesk.com',
      phone: '0700000000',
    },
  });

  // 2. Create a default branch
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch' },
    update: {},
    create: {
      id: 'default-branch',
      tenantId: tenant.id,
      name: 'Main Store',
      code: 'MAIN-01',
      address: 'Nairobi, Kenya',
      isHeadquarters: true,
    },
  });

  // 3. Create a default user (owner)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@salesk.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@salesk.com',
      passwordHash: '$2b$10$dummyHashSoLoginIsSafe', // Can't login directly with this seed, use register API for real test
      firstName: 'Admin',
      lastName: 'User',
      role: 'owner',
    },
  });

  // 4. Set Tax Config for branch
  await prisma.taxConfig.upsert({
    where: { branchId: branch.id },
    update: {},
    create: {
      branchId: branch.id,
      taxName: 'VAT',
      taxRate: 16.0,
      taxNumber: 'P000000000A',
    },
  });

  // 5. Create Categories
  const catDrinks = await prisma.category.upsert({
    where: { id: 'cat-drinks' },
    update: {},
    create: { id: 'cat-drinks', tenantId: tenant.id, name: 'Drinks', slug: 'drinks' },
  });

  const catSnacks = await prisma.category.upsert({
    where: { id: 'cat-snacks' },
    update: {},
    create: { id: 'cat-snacks', tenantId: tenant.id, name: 'Snacks', slug: 'snacks' },
  });

  // 6. Create Products
  const products = [
    { name: 'Coca Cola 500ml', sku: 'COKE-500', basePrice: 70, categoryId: catDrinks.id, barcode: '123456789012' },
    { name: 'Fanta Orange 500ml', sku: 'FANTA-500', basePrice: 70, categoryId: catDrinks.id, barcode: '123456789013' },
    { name: 'Dasani Water 1L', sku: 'DASANI-1L', basePrice: 100, categoryId: catDrinks.id, barcode: '123456789014' },
    { name: 'Lays Classic', sku: 'LAYS-CLS', basePrice: 150, categoryId: catSnacks.id, barcode: '123456789015' },
    { name: 'Urban Bites BBQ', sku: 'URB-BBQ', basePrice: 120, categoryId: catSnacks.id, barcode: '123456789016' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku! } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        basePrice: p.basePrice,
        categoryId: p.categoryId,
        isActive: true,
        trackInventory: true,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
