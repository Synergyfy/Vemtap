import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { UserRole, User } from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createTestApp } from '../utils/create-app';

describe('Staff Management (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: any;
  let businessRepository: any;

  beforeAll(async () => {
    app = await createTestApp();

    jwtService = app.get<JwtService>(JwtService);
    userRepository = app.get(getRepositoryToken(User));
    businessRepository = app.get(getRepositoryToken(Business));

    // 1. Seed Owners first
    await userRepository.save([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'owner@team.com',
        password: 'password',
        firstName: 'Owner',
        lastName: 'One',
        role: UserRole.OWNER,
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174010',
        email: 'other@team.com',
        password: 'password',
        firstName: 'Other',
        lastName: 'Owner',
        role: UserRole.OWNER,
      },
    ]);

    // 2. Seed Businesses referencing owners
    await businessRepository.save([
      { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Biz One', ownerId: '123e4567-e89b-12d3-a456-426614174000' },
      { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Biz Two', ownerId: '123e4567-e89b-12d3-a456-426614174010' },
    ]);

    // 3. Update Owners with businessId and seed Staff
    await userRepository.save([
      { id: '123e4567-e89b-12d3-a456-426614174000', businessId: '123e4567-e89b-12d3-a456-426614174001' },
      { id: '123e4567-e89b-12d3-a456-426614174010', businessId: '123e4567-e89b-12d3-a456-426614174002' },
      {
        id: '123e4567-e89b-12d3-a456-426614174004',
        email: 'staff@team.com',
        password: 'password',
        firstName: 'Staff',
        lastName: 'Two',
        role: UserRole.STAFF,
        businessId: '123e4567-e89b-12d3-a456-426614174001',
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: string) => jwtService.sign({ sub: userId });

  describe('/users/staff (GET)', () => {
    it('should return staff for owner', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174000');
      return request(app.getHttpServer())
        .get('/api/v1/users/staff')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Should include staff and owner themselves since they share businessId
        });
    });
  });

  describe('/users/staff/invite (POST)', () => {
    it('should allow owner to invite staff', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174000');
      return request(app.getHttpServer())
        .post('/api/v1/users/staff/invite')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'New',
          lastName: 'Staff',
          email: 'new@team.com',
          role: UserRole.STAFF,
        })
        .expect(201);
    });

    it('should forbid staff from inviting other staff', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174004');
      return request(app.getHttpServer())
        .post('/api/v1/users/staff/invite')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Illegal',
          lastName: 'Invite',
          email: 'fail@team.com',
          role: UserRole.STAFF,
        })
        .expect(403);
    });
  });

  describe('/users/staff/:id (DELETE)', () => {
    it('should allow owner to remove staff', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174000');
      return request(app.getHttpServer())
        .delete('/api/v1/users/staff/123e4567-e89b-12d3-a456-426614174004')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should prevent owner from removing staff from ANOTHER business', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174010'); // Owner of biz-2
      return request(app.getHttpServer())
        .delete('/api/v1/users/staff/123e4567-e89b-12d3-a456-426614174000') // Trying to delete owner of biz-1 (not staff, but still another user)
        .set('Authorization', `Bearer ${token}`)
        .expect(404); // Service throws 404 if businessId mismatch
    });
  });
});
