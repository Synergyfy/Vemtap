import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { BusinessesService } from './modules/businesses/businesses.service';
import { UserRole } from './modules/users/entities/user.entity';
import { BranchesService } from './modules/branches/branches.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const businessesService = app.get(BusinessesService);
  const branchesService = app.get(BranchesService);

  console.log('Seeding data...');

  // 1. Create Owner & Business
  let owner = await usersService.findByEmail('business@latap.com');
  if (!owner) {
    const hashedPassword = await bcrypt.hash('business123', 10);
    owner = await usersService.create({
      firstName: 'John',
      lastName: 'Smith',
      email: 'business@latap.com',
      password: hashedPassword,
      role: UserRole.OWNER,
    });
    console.log('Created Owner: business@latap.com');

    // Create Business for Owner (this automatically creates Main Branch and links owner)
    const biz = await businessesService.create({
      name: 'The Azure Bistro',
      monthlyVisitors: '501-2000',
      ownerId: owner.id,
    });
    console.log('Created Business: The Azure Bistro');

    // Update Main Branch with settings
    const branches = await branchesService.findAll(owner.id);
    const mainBranch = branches[0];
    if (mainBranch) {
      await branchesService.update(owner.id, mainBranch.id, {
        welcomeMessage: 'Welcome to Azure Bistro!',
        rewardEnabled: true,
      });
      console.log('Updated Main Branch settings');
    }
  }

  // 2. Create Manager (Linked to Branch)
  const business = await businessesService.findByOwner(owner.id);

  let branchId: string | undefined;
  if (business) {
    const branches = await branchesService.findAll(owner.id);
    branchId = branches[0]?.id;
  }

  const manager = await usersService.findByEmail('manager@latap.com');
  if (!manager) {
    const hashedPassword = await bcrypt.hash('manager123', 10);
    await usersService.create({
      firstName: 'Sarah',
      lastName: 'Supervisor',
      email: 'manager@latap.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
      branchId: branchId,
    });
    console.log('Created Manager: manager@latap.com');
  }

  // 3. Create Staff
  const staff = await usersService.findByEmail('staff@latap.com');
  if (!staff) {
    const hashedPassword = await bcrypt.hash('staff123', 10);
    await usersService.create({
      firstName: 'Michael',
      lastName: 'Cashier',
      email: 'staff@latap.com',
      password: hashedPassword,
      role: UserRole.STAFF,
      branchId: branchId,
    });
    console.log('Created Staff: staff@latap.com');
  }

  // 4. Create Admin
  const admin = await usersService.findByEmail('admin@latap.com');
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await usersService.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@latap.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    console.log('Created Admin: admin@latap.com');
  }

  // 5. Create Customer
  const customer = await usersService.findByEmail('customer@latap.com');
  if (!customer) {
    const hashedPassword = await bcrypt.hash('customer123', 10);
    await usersService.create({
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'customer@latap.com',
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    });
    console.log('Created Customer: customer@latap.com');
  }

  console.log('Seeding complete!');
  await app.close();
}

bootstrap();
