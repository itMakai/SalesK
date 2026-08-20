import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, BranchPricingDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@salesk/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(@Query('categoryId') categoryId?: string) {
    return this.productService.findAll(categoryId);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.productService.bulkImport(file.buffer);
  }

  @Get('export')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  async exportProducts(@Res() res: Response) {
    const csv = await this.productService.exportCatalog();
    res.header('Content-Type', 'text/csv');
    res.attachment('products.csv');
    return res.send(csv);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'product-' + uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`
    };
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Patch(':id/branch-pricing')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  updateBranchPricing(
    @Param('id') id: string,
    @Body() branchPricing: BranchPricingDto[],
  ) {
    return this.productService.updateBranchPricing(id, branchPricing);
  }
}
