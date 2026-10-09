import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CategoriesService } from './modules/categories/categories.service';
import { Category } from './modules/businesses/entities/category.entity';

/**
 * Taxonomy cleanup (`backend-fixies.md` §6).
 *
 * - Deletes known junk categories created during testing.
 * - Trims leading/trailing whitespace (and collapses inner runs) from names,
 *   e.g. `"Agriculture "` → `"Agriculture"`.
 *
 * Idempotent and safe to re-run. Deletions/renames go through
 * `CategoriesService` so the categories cache is cleared automatically.
 */

const JUNK_NAMES = ['frank', 'zejab', 'test', 'txxhhh'];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const categoriesService = app.get(CategoriesService);

  const { items } = await categoriesService.findAllCategories({
    page: 1,
    limit: 10000,
  });

  let deleted = 0;
  let trimmed = 0;
  let skipped = 0;

  for (const category of items) {
    const rawName = category.name ?? '';
    const normalized = rawName.trim().replace(/\s+/g, ' ');

    if (JUNK_NAMES.includes(normalized.toLowerCase())) {
      await categoriesService.deleteCategory(category.id);
      console.log(`Deleted junk category "${rawName}" (${category.id})`);
      deleted++;
      continue;
    }

    if (normalized !== rawName) {
      const conflict = items.find(
        (other: Category) =>
          other.id !== category.id && other.name === normalized,
      );
      if (conflict) {
        console.log(
          `Skipped "${rawName}" — trimmed name "${normalized}" already exists`,
        );
        skipped++;
        continue;
      }

      await categoriesService.updateCategory(category.id, {
        name: normalized,
      });
      console.log(`Trimmed "${rawName}" -> "${normalized}"`);
      trimmed++;
    }
  }

  console.log(
    `Category cleanup complete: deleted=${deleted}, trimmed=${trimmed}, skipped=${skipped}`,
  );
  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Category cleanup failed:', error);
  process.exit(1);
});
