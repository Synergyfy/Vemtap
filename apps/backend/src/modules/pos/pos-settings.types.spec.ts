import { computePosCharges, resolvePosSettings } from './pos-settings.types';

describe('computePosCharges', () => {
  it('charges nothing extra with default settings', () => {
    expect(computePosCharges(undefined, 9000)).toEqual({
      netSubtotal: 9000,
      tax: 0,
      serviceCharge: 0,
      packagingFee: 0,
      total: 9000,
    });
  });

  it('adds exclusive VAT and a service charge on the net subtotal', () => {
    const charges = computePosCharges(
      {
        taxEnabled: true,
        taxRate: 7.5,
        serviceChargeEnabled: true,
        serviceChargeRate: 10,
      },
      10000,
    );
    expect(charges).toMatchObject({
      tax: 750,
      serviceCharge: 1000,
      total: 11750,
    });
  });

  it('reports the VAT share inside inclusive prices without adding it', () => {
    const charges = computePosCharges(
      { taxEnabled: true, taxRate: 7.5, pricesIncludeTax: true },
      10750,
    );
    expect(charges.tax).toBe(750);
    expect(charges.total).toBe(10750);
  });

  it('exempts takeaway from VAT and adds packaging when configured', () => {
    const charges = computePosCharges(
      {
        taxEnabled: true,
        taxRate: 7.5,
        takeawayVatExempt: true,
        packagingFee: 300,
        packagingAutoApply: true,
      },
      5000,
      { orderType: 'takeaway' },
    );
    expect(charges).toMatchObject({ tax: 0, packagingFee: 300, total: 5300 });
  });

  it('waives the service charge only when the settings allow it', () => {
    const base = { serviceChargeEnabled: true, serviceChargeRate: 10 };
    expect(
      computePosCharges({ ...base, serviceChargeWaivable: true }, 1000, {
        waiveServiceCharge: true,
      }).serviceCharge,
    ).toBe(0);
    expect(
      computePosCharges({ ...base, serviceChargeWaivable: false }, 1000, {
        waiveServiceCharge: true,
      }).serviceCharge,
    ).toBe(100);
  });

  it('never goes below zero when discounts exceed the subtotal', () => {
    expect(computePosCharges({ taxEnabled: true }, -50).total).toBe(0);
  });
});

describe('resolvePosSettings', () => {
  it('keeps defaults for nested fields the business never set', () => {
    const settings = resolvePosSettings({
      tenderRails: { transfer: { bankName: 'Wema Bank' } },
    });
    expect(settings.tenderRails?.cash).toBe(true);
    expect(settings.tenderRails?.transfer).toEqual({
      enabled: true,
      bankName: 'Wema Bank',
    });
    expect(settings.permissions?.discountMaxPercent).toBe(100);
  });
});
