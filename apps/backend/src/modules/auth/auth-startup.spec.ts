import { Test } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('AuthModule Startup', () => {
  beforeAll(() => {
    jest.spyOn(DataSource.prototype, 'initialize').mockImplementation(function (
      this: any,
    ) {
      this.options = this.options || {};
      if (!this.options.entities) this.options.entities = [];
      return Promise.resolve(this);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should compile AuthModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.register({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test',
          autoLoadEntities: true,
        }),
        AuthModule,
      ],
    }).compile();

    const service = module.get(AuthService);
    expect(service).toBeDefined();
    await module.close();
  });
});
