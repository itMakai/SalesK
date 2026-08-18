import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getLayout(user: any) {
    const { tenantId, id: userId, role } = user;
    
    // Try to find user-specific layout first
    let layout = await this.prisma.extended.dashboardLayout.findFirst({
      where: { tenantId, userId },
    });

    // If not found, try to find tenant default layout
    if (!layout) {
      layout = await this.prisma.extended.dashboardLayout.findFirst({
        where: { tenantId, userId: null, isDefault: true },
      });
    }

    // Role-based defaults if no custom layout is found
    if (!layout) {
      if (role === 'cashier') {
        return {
          layout: [
            { i: "w-1", x: 0, y: 0, w: 6, h: 4 }, // Sales
            { i: "w-5", x: 0, y: 4, w: 12, h: 10 }, // Recent Orders
          ],
          widgets: [
            { id: "w-1", type: "sales" },
            { id: "w-5", type: "recent-orders" },
          ],
        };
      }

      // Comprehensive, well-styled default layout for Owners/Admins
      return {
        layout: [
          // Top Row: KPI Cards
          { i: "w-1", x: 0, y: 0, w: 6, h: 4 }, // Sales
          { i: "w-2", x: 6, y: 0, w: 6, h: 4 }, // Custom KPIs

          // Second Row: Charts & Top Items
          { i: "w-3", x: 0, y: 4, w: 8, h: 10 }, // Revenue Chart
          { i: "w-4", x: 8, y: 4, w: 4, h: 10 }, // Top Products

          // Third Row: Orders & Payments
          { i: "w-5", x: 0, y: 14, w: 6, h: 9 }, // Recent Orders
          { i: "w-6", x: 6, y: 14, w: 6, h: 9 }, // Payment Breakdown

          // Fourth Row: Insights & Alerts
          { i: "w-7", x: 0, y: 23, w: 4, h: 9 }, // Customer Insights
          { i: "w-8", x: 4, y: 23, w: 4, h: 9 }, // Staff Performance
          { i: "w-9", x: 8, y: 23, w: 4, h: 9 }, // Branch Comparison

          // Bottom Row
          { i: "w-10", x: 0, y: 32, w: 12, h: 8 }, // Low Stock Alerts
        ],
        widgets: [
          { id: "w-1", type: "sales" },
          { id: "w-2", type: "custom-kpis" },
          { id: "w-3", type: "revenue-chart" },
          { id: "w-4", type: "top-products" },
          { id: "w-5", type: "recent-orders" },
          { id: "w-6", type: "payment-breakdown" },
          { id: "w-7", type: "customer-insights" },
          { id: "w-8", type: "staff-performance" },
          { id: "w-9", type: "branch-comparison" },
          { id: "w-10", type: "low-stock-alerts" },
        ],
      };
    }

    return layout;
  }

  async saveLayout(user: any, layout: any, widgets: any) {
    const { tenantId, id: userId } = user;
    
    // Check if user layout already exists
    const existing = await this.prisma.extended.dashboardLayout.findFirst({
      where: { tenantId, userId },
    });

    if (existing) {
      return this.prisma.extended.dashboardLayout.update({
        where: { id: existing.id },
        data: { layout, widgets },
      });
    }

    // Create new layout
    return this.prisma.extended.dashboardLayout.create({
      data: {
        tenantId,
        userId,
        name: 'User Custom Layout',
        layout,
        widgets,
      },
    });
  }

  async getWidgetData(user: any, type: string, timeframe: string = 'this_month') {
    const { tenantId, role, activeBranchId } = user;
    
    // Determine branch filter based on role
    const branchFilter = (role === 'owner' || role === 'admin') ? {} : { branchId: activeBranchId };

    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'last_7_days') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    }

    switch (type) {
      case 'revenue-chart': {
        const orders = await this.prisma.extended.order.findMany({
          where: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } },
          select: { total: true, createdAt: true }
        });
        
        const dailyData: Record<string, number> = {};
        orders.forEach(order => {
          const date = order.createdAt.toISOString().split('T')[0];
          dailyData[date] = (dailyData[date] || 0) + Number(order.total);
        });

        return Object.entries(dailyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([name, value]) => ({ name, value }));
      }

      case 'top-products': {
        // Using Prisma groupBy for optimization where possible, but OrderItem is linked to Order.
        // For deep relations, fetching select fields is faster than full includes.
        const orders = await this.prisma.extended.order.findMany({
          where: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } },
          select: {
            items: { select: { productId: true, productName: true, total: true } }
          }
        });

        const productRevenue: Record<string, { name: string, total: number }> = {};
        
        orders.forEach(order => {
          order.items.forEach(item => {
            if (!productRevenue[item.productId]) {
              productRevenue[item.productId] = { name: item.productName, total: 0 };
            }
            productRevenue[item.productId].total += Number(item.total);
          });
        });

        return Object.values(productRevenue)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5) // Top 5
          .map(p => ({ name: p.name, value: p.total }));
      }

      case 'recent-orders': {
        const orders = await this.prisma.extended.order.findMany({
          where: { tenantId, ...branchFilter },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { customer: true }
        });
        
        return orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: o.customer?.name || 'Walk-in',
          total: Number(o.total),
          status: o.status,
          time: o.createdAt
        }));
      }

      case 'payment-breakdown': {
        const orders = await this.prisma.extended.order.findMany({
          where: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } },
          select: { payments: { select: { method: true, amount: true } } }
        });

        const methods: Record<string, number> = {};
        orders.forEach(order => {
          order.payments.forEach(p => {
            methods[p.method] = (methods[p.method] || 0) + Number(p.amount);
          });
        });

        return Object.entries(methods).map(([name, value]) => ({ name, value }));
      }

      case 'low-stock-alerts': {
        const branchCondition = branchFilter.branchId ? { branchId: branchFilter.branchId } : {};
        const inventory = await this.prisma.extended.inventoryItem.findMany({
          where: { 
            product: { tenantId },
            ...branchCondition,
            OR: [
              { quantity: { lte: 5 } }
            ]
          },
          include: { product: true, branch: true },
          take: 10
        });
        return inventory.map(item => ({
          id: item.id,
          product: item.product.name,
          branch: item.branch.name,
          quantity: Number(item.quantity)
        }));
      }

      case 'branch-comparison': {
        // If they are a cashier/manager, they shouldn't compare branches they don't own. 
        // We'll just show their own branch.
        const orders = await this.prisma.extended.order.findMany({
          where: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } },
          select: { total: true, branch: { select: { name: true } } }
        });

        const branches: Record<string, number> = {};
        orders.forEach(o => {
          const branchName = o.branch.name;
          branches[branchName] = (branches[branchName] || 0) + Number(o.total);
        });

        return Object.entries(branches).map(([name, value]) => ({ name, value }));
      }

      case 'staff-performance': {
        const orders = await this.prisma.extended.order.findMany({
          where: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } },
          select: { total: true, cashier: { select: { firstName: true, lastName: true } } }
        });

        const staff: Record<string, number> = {};
        orders.forEach(o => {
          const staffName = `${o.cashier.firstName} ${o.cashier.lastName}`;
          staff[staffName] = (staff[staffName] || 0) + Number(o.total);
        });

        return Object.entries(staff)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }));
      }

      case 'customer-insights': {
        const orders = await this.prisma.extended.order.findMany({
          where: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } },
          select: { total: true, customer: { select: { name: true, visitCount: true } } }
        });

        const customers: Record<string, number> = {};
        let newCount = 0;
        let returningCount = 0;

        orders.forEach(o => {
          if (o.customer) {
            const customerName = o.customer.name;
            customers[customerName] = (customers[customerName] || 0) + Number(o.total);
            if (o.customer.visitCount > 1) {
              returningCount++;
            } else {
              newCount++;
            }
          }
        });

        const topSpenders = Object.entries(customers)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value }));

        return {
          topSpenders,
          newVsReturning: [
            { name: 'New', value: newCount },
            { name: 'Returning', value: returningCount }
          ]
        };
      }

      case 'custom-kpis': {
        // Optimized using aggregate
        const agg = await this.prisma.extended.order.aggregate({
          where: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } },
          _sum: { total: true },
          _count: { id: true }
        });

        const totalRevenue = Number(agg._sum.total || 0);
        const totalOrders = agg._count.id;
        const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

        // Fetch total items sold
        const items = await this.prisma.extended.orderItem.aggregate({
          where: { order: { tenantId, ...branchFilter, status: 'completed', createdAt: { gte: startDate } } },
          _sum: { quantity: true }
        });
        
        const totalItemsSold = Number(items._sum.quantity || 0);

        return {
          averageOrderValue,
          totalItemsSold,
          totalOrders
        };
      }

      default:
        return { error: 'Unknown widget type' };
    }
  }
}

