import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, BranchPricingDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { branchPricing, ...productData } = createProductDto;

    // Optional SKU uniqueness check (handled mostly by DB, but good for custom error)
    if (productData.sku) {
      const existing = await this.prisma.extended.product.findFirst({
        where: { sku: productData.sku },
      });
      if (existing) {
        throw new BadRequestException('A product with this SKU already exists');
      }
    }

    return this.prisma.extended.product.create({
      data: {
        ...(productData as any),
        branchPricing: branchPricing ? {
          create: branchPricing.map(bp => ({
            branchId: bp.branchId,
            price: bp.price,
            isAvailable: bp.isAvailable ?? true,
          })),
        } : undefined,
      },
      include: {
        branchPricing: true,
      },
    });
  }

  async findAll(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};
    
    return this.prisma.extended.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { category: true, branchPricing: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.extended.product.findUnique({
      where: { id },
      include: { category: true, branchPricing: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Ensure existence

    if (updateProductDto.sku) {
      const existing = await this.prisma.extended.product.findFirst({
        where: { sku: updateProductDto.sku, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException('A product with this SKU already exists');
      }
    }

    return this.prisma.extended.product.update({
      where: { id },
      data: updateProductDto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure existence

    return this.prisma.extended.product.delete({
      where: { id },
    });
  }

  // --- Branch Pricing Overrides ---

  async updateBranchPricing(productId: string, branchPricing: BranchPricingDto[]) {
    await this.findOne(productId); // Ensure existence

    return this.prisma.$transaction(async (tx) => {
      for (const bp of branchPricing) {
        await (tx as any).branchPricing.upsert({
          where: {
            productId_branchId: { productId, branchId: bp.branchId },
          },
          update: {
            price: bp.price,
            isAvailable: bp.isAvailable ?? true,
          },
          create: {
            productId,
            branchId: bp.branchId,
            price: bp.price,
            isAvailable: bp.isAvailable ?? true,
          },
        });
      }

      return (tx as any).product.findUnique({
        where: { id: productId },
        include: { branchPricing: true },
      });
    });
  }

  // --- Bulk Import / Export ---

  async bulkImport(fileBuffer: Buffer) {
    const products: any[] = [];
    return new Promise((resolve, reject) => {
      Readable.from(fileBuffer)
        .pipe(csv())
        .on('data', (data: any) => products.push(data))
        .on('end', async () => {
          try {
            let importedCount = 0;
            // Simple sequential import (could be optimized with createMany if no nested relations)
            for (const item of products) {
              await this.prisma.extended.product.create({
                data: {
                  name: item.name,
                  sku: item.sku || undefined,
                  barcode: item.barcode || undefined,
                  description: item.description || undefined,
                  basePrice: parseFloat(item.basePrice) || 0,
                  costPrice: item.costPrice ? parseFloat(item.costPrice) : undefined,
                  trackInventory: item.trackInventory === 'true' || item.trackInventory === '1',
                  isActive: item.isActive !== 'false' && item.isActive !== '0',
                } as any,
              });
              importedCount++;
            }
            resolve({ success: true, count: importedCount });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error: any) => reject(error));
    });
  }

  async exportCatalog() {
    const products = await this.prisma.extended.product.findMany({
      include: { category: true },
    });

    if (!products || products.length === 0) {
      return 'name,sku,barcode,basePrice,costPrice,trackInventory,isActive,categoryName\n';
    }

    const headers = 'name,sku,barcode,basePrice,costPrice,trackInventory,isActive,categoryName\n';
    const rows = products.map((p) => {
      return `"${p.name}","${p.sku || ''}","${p.barcode || ''}",${p.basePrice},${p.costPrice || ''},${p.trackInventory},${p.isActive},"${p.category?.name || ''}"`;
    }).join('\n');

    return headers + rows;
  }
}
