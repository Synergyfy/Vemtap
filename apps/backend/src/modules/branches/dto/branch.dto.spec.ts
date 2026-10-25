import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateBranchDto, UpdateBranchDto } from './branch.dto';

describe('branch DTO manager and district fields', () => {
  const manager = {
    managerName: 'Chidinma Okafor',
    managerEmail: 'chidinma@example.com',
    managerPhone: '+2348030000000',
    district: 'Abuja Municipal • Garki District',
  };

  it('accepts manager contact and district on create', () => {
    const dto = plainToInstance(CreateBranchDto, { name: 'Garki', ...manager });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts manager contact and district on update', () => {
    const dto = plainToInstance(UpdateBranchDto, manager);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects an invalid manager email', () => {
    const dto = plainToInstance(CreateBranchDto, {
      name: 'Garki',
      managerEmail: 'not-an-email',
    });
    expect(validateSync(dto).map((error) => error.property)).toEqual([
      'managerEmail',
    ]);
  });
});
