import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5137'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);

  // Renderのスピンダウンを防ぐため、10分ごとに自己Pingを送信（本番環境のみ）
  if (process.env.NODE_ENV === 'production') {
    const PING_INTERVAL = 10 * 60 * 1000; // 10分
    const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

    setInterval(async () => {
      try {
        const response = await fetch(`${serverUrl}/health`);
        if (response.ok) {
          console.log(`[Keep-Alive] Ping successful at ${new Date().toISOString()}`);
        } else {
          console.warn(`[Keep-Alive] Ping failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`[Keep-Alive] Ping error:`, error.message);
      }
    }, PING_INTERVAL);

    console.log(`[Keep-Alive] Self-ping enabled (every 10 minutes to ${serverUrl}/health)`);
  }
}
bootstrap();
