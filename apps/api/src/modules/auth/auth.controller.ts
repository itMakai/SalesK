import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, PinLoginDto, RefreshTokenDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '@salesk/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('pin-login')
  async pinLogin(@Body() pinLoginDto: PinLoginDto) {
    return this.authService.pinLogin(pinLoginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser, @Body() body: { refreshToken?: string }) {
    await this.authService.logout(user.id, body.refreshToken);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generateTwoFactor(@CurrentUser() user: AuthUser) {
    return this.authService.generateTwoFactorSecret(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  async verifyTwoFactor(@CurrentUser() user: AuthUser, @Body('code') code: string) {
    return this.authService.verifyTwoFactor(user.id, code);
  }
}
