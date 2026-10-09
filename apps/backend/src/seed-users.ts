import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { BusinessesService } from './modules/businesses/businesses.service';
import { UserRole, UserStatus } from './modules/users/entities/user.entity';
import { BusinessStatus } from './modules/businesses/entities/business.entity';

const PASSWORD = '123456';

const CUSTOMERS = [
  {
    firstName: 'Sunday',
    lastName: 'Blinkz',
    email: 'sundayblinkz1@gmail.com',
  },
];

const OWNERS = [
  {
    firstName: 'Sunday',
    lastName: 'Patrick',
    email: 'sundaypatrick406@gmail.com',
    businessName: 'Patrick Ventures',
  },
  {
    firstName: 'Sunday',
    lastName: 'Ochuko',
    email: 'sundayochuko101@gmail.com',
    businessName: 'Ochuko Ventures',
  },
];

async function upsertUser(
  usersService: UsersService,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  },
) {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  const existing = await usersService.findByEmail(data.email);

  if (existing) {
    existing.firstName = data.firstName;
    existing.lastName = data.lastName;
    existing.password = hashedPassword;
    existing.role = data.role;
    existing.status = UserStatus.ACTIVE;
    existing.emailVerified = true;
    existing.isPasswordChanged = true;
    const saved = await usersService.create(existing);
    console.log(`Updated user: ${data.email} (${data.role})`);
    return saved;
  }

  const created = await usersService.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: hashedPassword,
    role: data.role,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    isPasswordChanged: true,
  });
  console.log(`Created user: ${data.email} (${data.role})`);
  return created;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const businessesService = app.get(BusinessesService);

  for (const customer of CUSTOMERS) {
    await upsertUser(usersService, { ...customer, role: UserRole.CUSTOMER });
  }

  for (const owner of OWNERS) {
    const user = await upsertUser(usersService, {
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      role: UserRole.OWNER,
    });

    const existingBusiness = await businessesService.findByOwner(user.id);
    if (existingBusiness) {
      console.log(
        `Business already exists for ${owner.email}: ${existingBusiness.name}`,
      );
      continue;
    }

    await businessesService.create({
      name: owner.businessName,
      ownerId: user.id,
      status: BusinessStatus.ACTIVE,
    });
    console.log(
      `Created business "${owner.businessName}" for ${owner.email} (with Main Branch)`,
    );
  }

  console.log('User seeding complete!');
  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('User seeding failed:', error);
  process.exit(1);
});
