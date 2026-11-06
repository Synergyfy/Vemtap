import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateCatalogueCategoryDto,
  UpdateCatalogueCategoryDto,
} from './category.dto';

describe('catalogue category DTO details', () => {
  const details = {
    kind: 'service',
    description: 'Facials and massages',
    icon: 'spa',
    imageUrl: 'https://cdn.example.com/spa.jpg',
  };

  it('accepts type, description, icon and image on create', () => {
    const dto = plainToInstance(CreateCatalogueCategoryDto, {
      name: 'Treatments',
      ...details,
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts the same details on update', () => {
    expect(
      validateSync(plainToInstance(UpdateCatalogueCategoryDto, details)),
    ).toHaveLength(0);
  });

  it('rejects an unknown category type', () => {
    const dto = plainToInstance(CreateCatalogueCategoryDto, {
      name: 'Treatments',
      kind: 'bundle',
    });
    expect(validateSync(dto).map((error) => error.property)).toEqual(['kind']);
  });
});
