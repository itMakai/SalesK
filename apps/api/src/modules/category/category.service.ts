import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { slugify } from '@salesk/shared';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const slug = slugify(createCategoryDto.name);
    
    // Check if slug exists in this tenant (Prisma extension injects tenantId)
    const existing = await this.prisma.extended.category.findFirst({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('A category with this name already exists');
    }

    if (createCategoryDto.parentId) {
      const parent = await this.prisma.extended.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.extended.category.create({
      data: {
        ...createCategoryDto,
        slug,
      } as any,
    });
  }

  async findAll(includeChildren = false) {
    if (includeChildren) {
      // Fetch only top-level categories but include their children
      return this.prisma.extended.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
            include: {
              children: true // Support up to 3 levels deep if needed
            }
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
    }

    return this.prisma.extended.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.extended.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Validate existence

    let slug: string | undefined;
    if (updateCategoryDto.name) {
      slug = slugify(updateCategoryDto.name);
      const existing = await this.prisma.extended.category.findFirst({
        where: { slug, id: { not: id } },
      });

      if (existing) {
        throw new BadRequestException('A category with this name already exists');
      }
    }

    if (updateCategoryDto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    return this.prisma.extended.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        ...(slug && { slug }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Validate existence

    // Check if it has children
    const childrenCount = await this.prisma.extended.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete category with nested sub-categories. Delete or move them first.');
    }

    return this.prisma.extended.category.delete({
      where: { id },
    });
  }
}
