import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BusinessProfilingService } from '../modules/business-profiling/business-profiling.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessProfile } from '../modules/business-profiling/entities/business-profile.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const profilingService = app.get(BusinessProfilingService);
  const profileRepo = app.get<Repository<BusinessProfile>>(getRepositoryToken(BusinessProfile));

  console.log('🚀 Starting Business Profiling Insights Migration...');

  const profiles = await profileRepo.find();
  console.log(`📊 Found ${profiles.length} total profiles.`);

  let updatedCount = 0;

  for (const profile of profiles) {
    // Force update for all profiles to ensure they have the new Expert System insights
    console.log(`🔄 Processing: ${profile.businessName}...`);
    
    try {
      const { score, priority, insights } = profilingService.calculateProfiling(
        profile.businessType,
        profile.physicalSetup
      );

      profile.score = score;
      profile.priority = priority;
      profile.insights = insights;

      // Also ensure XP and Achievements are initialized if missing
      if (profile.xpEarned === undefined || profile.xpEarned === null) {
        profile.xpEarned = 0;
      }
      if (!profile.achievements) {
        profile.achievements = [];
      }

      await profileRepo.save(profile);
      updatedCount++;
    } catch (err) {
      console.error(`❌ Error updating ${profile.businessName}:`, err.message);
    }
  }

  console.log(`\n✅ Migration complete! Updated ${updatedCount} profiles.`);
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
