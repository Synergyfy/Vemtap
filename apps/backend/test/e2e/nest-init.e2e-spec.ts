import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('NestJS Init', () => {
  let moduleFixture: TestingModule;

  it('should bootstrap AppModule', async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(moduleFixture).toBeDefined();
  });
});
