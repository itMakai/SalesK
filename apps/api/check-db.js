const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'owner@savannamart.co.ke' }
  });
  if (!user) {
    console.log("No owner found!");
    return;
  }
  
  console.log("Users:", await prisma.user.count({where: {tenantId: user.tenantId}}));
  console.log("Customers:", await prisma.customer.count({where: {tenantId: user.tenantId}}));
  console.log("Suppliers:", await prisma.supplier.count({where: {tenantId: user.tenantId}}));
  console.log("Purchase Orders:", await prisma.purchaseOrder.count({where: {tenantId: user.tenantId}}));
}

main().finally(() => prisma.$disconnect());
