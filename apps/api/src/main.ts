import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'v1');
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('MentorHub API')
    .setDescription('MentorHub Backend API Documentation - v2.0 with Reviews, Payments, Messaging, Gamification, Goals & Marketplace')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('meeting-types', 'Meeting types management')
    .addTag('availability', 'Mentor availability')
    .addTag('bookings', 'Booking management')
    .addTag('reviews', 'Reviews and ratings system')
    .addTag('payments', 'Payment processing and Stripe integration')
    .addTag('messaging', 'Real-time messaging and conversations')
    .addTag('gamification', 'Points, achievements, and leaderboards')
    .addTag('goals', 'Goals and milestones tracking')
    .addTag('marketplace', 'Public mentor marketplace and search')
    .addTag('admin', 'Admin panel endpoints')
    .addTag('public', 'Public booking endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`
🚀 MentorHub API is running!
📝 API Documentation: http://localhost:${port}/api/docs
🔗 API Endpoint: http://localhost:${port}/${apiPrefix}
  `);
}

bootstrap();
