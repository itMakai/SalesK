import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, PinLoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, ROLE_PERMISSIONS, slugify } from '@salesk/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if email already exists globally
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const tenantSlug = slugify(dto.businessName);
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (existingTenant) {
      throw new ConflictException('Business name already in use');
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 3. Create Tenant, Branch, and User in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create Tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: dto.businessName,
          slug: tenantSlug,
          businessType: dto.businessType,
          email: dto.email,
          phone: dto.phone,
          enabledModules: ['core_pos'], // Will be enriched by template later
        },
      });

      // Create initial Branch (Headquarters)
      const branchCode = 'HQ'; // Simplify for now
      const branch = await prisma.branch.create({
        data: {
          tenantId: tenant.id,
          name: dto.branchName,
          code: branchCode,
          address: dto.branchAddress,
          city: dto.branchCity,
          isHeadquarters: true,
        },
      });

      // Create Owner User
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          role: UserRole.OWNER,
          permissions: ROLE_PERMISSIONS[UserRole.OWNER],
        },
      });

      // Assign Owner to Branch
      await prisma.staffAssignment.create({
        data: {
          userId: user.id,
          branchId: branch.id,
          roleAtBranch: UserRole.OWNER,
        },
      });

      return { tenant, branch, user };
    });

    const tokens = await this.generateTokens(result.user, result.branch.id);
    return {
      user: this.sanitizeUser(result.user),
      tenant: result.tenant,
      branch: result.branch,
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        staffAssignments: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Determine active branch (if requested, else first assigned)
    let activeBranchId = dto.branchId;
    if (!activeBranchId && user.staffAssignments.length > 0) {
      activeBranchId = user.staffAssignments[0].branchId;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user, activeBranchId);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async pinLogin(dto: PinLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        pin: dto.pin,
        staffAssignments: {
          some: { branchId: dto.branchId },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid PIN');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user, dto.branchId);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(session.user);
    
    // Delete old session
    await this.prisma.session.delete({ where: { id: session.id } });

    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.session.deleteMany({
        where: { userId, refreshToken },
      });
    } else {
      // Logout from all devices
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }
  }

  private async generateTokens(user: any, activeBranchId?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      permissions: user.permissions,
      branchId: activeBranchId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '15m') as any,
    });

    const refreshToken = uuidv4();
    const refreshExpiresInDays = parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRATION_DAYS') || '7', 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 mins in seconds (adjust based on config)
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, pin, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // --- 2FA Methods ---
  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { tenant: true } });
    if (!user) throw new UnauthorizedException();

    const otplib = require('otplib');
    const secret = otplib.authenticator.generateSecret();
    const otpauthUrl = otplib.authenticator.keyuri(user.email, user.tenant.name || 'SalesK', secret);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    const qrcode = require('qrcode');
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return {
      secret,
      qrCodeDataUrl,
    };
  }

  async verifyTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException();
    }

    const otplib = require('otplib');
    const isValid = otplib.authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (isValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });
      return { success: true };
    }

    throw new UnauthorizedException('Invalid 2FA code');
  }
}
