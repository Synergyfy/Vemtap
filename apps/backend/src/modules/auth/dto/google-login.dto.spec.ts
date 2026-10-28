import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GoogleLoginDto } from './google-login.dto';

const errorsFor = async (body: Record<string, unknown>) =>
  validate(plainToInstance(GoogleLoginDto, { token: 'id-token', ...body }));

describe('GoogleLoginDto role', () => {
  it.each(['customer', 'Customer', 'CUSTOMER', 'owner', 'OWNER'])(
    'accepts %s',
    async (role) => {
      expect(await errorsFor({ role })).toHaveLength(0);
    },
  );

  it('accepts no role', async () => {
    expect(await errorsFor({})).toHaveLength(0);
  });

  it.each([
    'admin',
    'ADMIN',
    'SUPER_ADMIN',
    'super_admin',
    'manager',
    'staff',
    'agent',
    'USER',
  ])('rejects %s', async (role) => {
    const errors = await errorsFor({ role });
    expect(errors.map((error) => error.property)).toContain('role');
  });
});
