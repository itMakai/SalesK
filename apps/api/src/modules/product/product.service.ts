import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
}
