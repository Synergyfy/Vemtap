import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CategoriesService } from './modules/marketing-assets/services/categories.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriesService = app.get(CategoriesService);
  try {
    const categories = await categoriesService.findAll(true);
    console.log(
      'Successfully found marketing categories count:',
      categories.length,
    );
    console.log('Categories:', JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error('Failed to find marketing categories:', err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
