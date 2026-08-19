import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    console.error('🔥 GLOBAL ERROR CAUGHT 🔥', exception);

    // Write to error.log
    try {
      const logMsg = `\n[${new Date().toISOString()}] ${request.url}\n${exception?.stack || exception?.message || exception}\n`;
      fs.appendFileSync(path.join(__dirname, '..', 'error.log'), logMsg);
    } catch(e) {}

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception?.message || 'Internal server error',
      error: exception,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from the uploads directory
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  app.setGlobalPrefix('api/v1');
  
  app.enableCors({
    origin: '*', // TODO: configure for production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.API_PORT ?? process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API running on: http://localhost:${port}/api/v1 (bound to 0.0.0.0)`);
}
bootstrap();
