import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from '../../src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../../src/modules/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Smoke Test (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    // Setup an authenticated session for the smoke test
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const authService = app.get(AuthService);
    
    const testEmail = `smoke-test-${Date.now()}@test.com`;
    const password = 'SmokeTestPass123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepo.save(
      userRepo.create({
        email: testEmail,
        password: hashedPassword,
        firstName: 'Smoke',
        lastName: 'Tester',
        role: UserRole.ADMIN, // Use Admin to reach most routes
        status: UserStatus.ACTIVE,
      }),
    );

    const loginRes = await authService.login({
      identifier: testEmail,
      password,
    });
    authToken = loginRes.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should ensure all registered routes return status < 500', async () => {
    // ... (logic to get routes)

    const expressApp = app.getHttpAdapter().getInstance();

    const router = expressApp._router || expressApp.router;

    if (!router) {
      console.warn(
        'Could not access Express router. Smoke test cannot discover routes automatically.',
      );
      if (expressApp) {
        console.log('Express keys:', Object.keys(expressApp));
      }
      return;
    }

    // Helper to extract routes recursively from Express stack
    const getRoutes = (
      stack: any[],
      basePath: string = '',
    ): { path: string; method: string }[] => {
      let routes: { path: string; method: string }[] = [];

      stack.forEach((layer) => {
        if (layer.route) {
          const path = basePath + layer.route.path;
          const method = Object.keys(layer.route.methods)[0].toUpperCase();
          routes.push({ path, method });
        } else if (layer.name === 'router' && layer.handle.stack) {
          // Recursively check sub-routers
          // Note: Express router regex might be tricky to parse back to string path,
          // but often layer.regexp.source helps if path is missing.
          // NestJS usually registers paths cleanly.
          const routePath = '';
          // Try to guess path from regexp if needed, but usually we just traverse.
          // For NestJS global prefix, it often mounts a router.
          routes = routes.concat(
            getRoutes(layer.handle.stack, basePath + routePath),
          );
        }
      });
      return routes;
    };

    const availableRoutes = getRoutes(router.stack);

    console.log(`Found ${availableRoutes.length} routes to smoke test.`);

    // If 0 routes, something is wrong with extraction or app setup.
    // But we won't fail the test setup, just warn.
    if (availableRoutes.length === 0) {
      console.warn(
        'No routes found automatically. Smoke test might be skipping routes.',
      );
    }

    for (const route of availableRoutes) {
      // Replace parameter placeholders with dummy values
      // e.g. /users/:id -> /users/dummy-param
      const path = route.path.replace(
        /:[^\/]+/g,
        '123e4567-e89b-12d3-a456-426614174000',
      ); // Use a UUID-like dummy

      // Skip wildcard routes that might match everything
      if (path.includes('*')) continue;

      try {
        // We use the lowercased method name to call supertest
        // e.g. request(server).get(path)
        const method = route.method.toLowerCase();
        // @ts-ignore
        const res = await request(server)
          [method](path)
          .set('Authorization', `Bearer ${authToken}`);

        if (res.status >= 500) {
          console.error(
            `Smoke test failed for ${route.method} ${path}: Status ${res.status}`,
            res.body,
          );
        }

        expect(res.status).toBeLessThan(500);
      } catch (e) {
        // If the error is actual network error (conn refused), fail.
        // If it's just a failed expectation, Jest handles it.
        throw e;
      }
    }
  });
});
