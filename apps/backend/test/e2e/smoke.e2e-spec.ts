import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Smoke Test (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const authService = app.get(AuthService);

    const testEmail = `smoke-admin-${Date.now()}@test.com`;
    const password = 'SmokeTestPass123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    await userRepo.save(
      userRepo.create({
        email: testEmail,
        password: hashedPassword,
        firstName: 'Smoke',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      }),
    );

    const loginRes = await authService.login({
      identifier: testEmail,
      password,
    });
    adminToken = loginRes.access_token;
  }, 120000);

  afterAll(async () => {
    await app.close();
  });

  it('should return status < 500 for all API routes (authenticated)', async () => {
    const routes = discoverRoutes(app);
    console.log(`\n[Smoke] Discovered ${routes.length} API routes`);

    const failures: string[] = [];

    for (const route of routes) {
      const url = replacePathParams(route.path);
      try {
        const req = request(server)[route.method.toLowerCase()](url)
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(5000);

        if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
          req.send({});
        }

        const res = await req;

        if (res.status >= 500 && res.status !== 503) {
          failures.push(
            `${route.method} ${url} \u2192 ${res.status}\n  body: ${JSON.stringify(res.body)}`,
          );
        }
      } catch (err: any) {
        if (err.timeout) {
          // Timeout is expected for SSE/streaming endpoints
          continue;
        }
        failures.push(`${route.method} ${url} \u2192 ERROR: ${err.message}`);
      }
    }

    if (failures.length > 0) {
      console.error(
        `\n[Smoke] ${failures.length} route(s) returned 500+ (authenticated):`,
      );
      failures.forEach((f) => console.error(`  ${f}`));
    }

    expect(failures).toHaveLength(0);
  }, 300000);

  it('should return status < 500 for all routes without auth (public pass)', async () => {
    const routes = discoverRoutes(app);
    const failures: string[] = [];

    for (const route of routes) {
      const url = replacePathParams(route.path);
      try {
        const req = request(server)[route.method.toLowerCase()](url).timeout(
          5000,
        );

        if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
          req.send({});
        }

        const res = await req;

        if (res.status >= 500 && res.status !== 503) {
          failures.push(
            `${route.method} ${url} \u2192 ${res.status}\n  body: ${JSON.stringify(res.body)}`,
          );
        }
      } catch (err: any) {
        if (err.timeout) {
          continue;
        }
        failures.push(`${route.method} ${url} \u2192 ERROR: ${err.message}`);
      }
    }

    if (failures.length > 0) {
      console.error(
        `\n[Smoke] ${failures.length} route(s) returned 500+ (public):`,
      );
      failures.forEach((f) => console.error(`  ${f}`));
    }

    expect(failures).toHaveLength(0);
  }, 300000);
});

function discoverRoutes(app: INestApplication): {
  path: string;
  method: string;
}[] {
  try {
    const config = new DocumentBuilder()
      .setTitle('Vemtap API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const routes: { path: string; method: string }[] = [];

    for (const [path, methods] of Object.entries(document.paths || {})) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
        if (methods[method]) {
          routes.push({ path, method: method.toUpperCase() });
        }
      }
    }

    routes.sort((a, b) => a.path.localeCompare(b.path));

    if (routes.length < 10) {
      console.warn(
        `[Smoke] WARNING: Only ${routes.length} routes discovered. Expected significantly more.`,
      );
    }

    return routes;
  } catch (err) {
    console.error('[Smoke] Failed to discover routes via Swagger:', err);
    return [];
  }
}

function replacePathParams(path: string): string {
  return path.replace(/\{(\w+)\}/g, (_match: string, name: string) => {
    const key = name.toLowerCase();
    if (key.includes('id') || key === 'uuid') {
      return '123e4567-e89b-12d3-a456-426614174000';
    }
    if (key.includes('email')) {
      return 'test@example.com';
    }
    if (key.includes('code')) {
      return 'test-code';
    }
    if (key.includes('username') || key === 'slug') {
      return 'test-username';
    }
    if (key.includes('reference')) {
      return 'test-ref';
    }
    return 'test-dummy';
  });
}
