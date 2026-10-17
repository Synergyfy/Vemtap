import { tierLadder } from './network-tiers';

describe('tierLadder', () => {
  it('locks every tier with nothing verified', () => {
    const ladder = tierLadder(0);
    expect(ladder.tiers.map((t) => t.state)).toEqual([
      'locked',
      'locked',
      'locked',
      'locked',
    ]);
    expect(ladder.current).toBeNull();
    expect(ladder.next).toMatchObject({
      id: 'starter',
      remaining: 3,
      progress: 0,
    });
  });

  it('marks the highest reached tier active and earlier ones unlocked', () => {
    const ladder = tierLadder(7);
    expect(ladder.tiers.map((t) => t.state)).toEqual([
      'unlocked',
      'active',
      'locked',
      'locked',
    ]);
    expect(ladder.current?.id).toBe('partner');
    expect(ladder.next).toMatchObject({
      id: 'community',
      remaining: 3,
      progress: 0.7,
    });
    expect(ladder.tiers[3].progress).toBeCloseTo(0.28);
  });

  it('has no next tier at the top', () => {
    const ladder = tierLadder(30);
    expect(ladder.current?.id).toBe('builder');
    expect(ladder.next).toBeNull();
    expect(ladder.tiers.every((t) => t.progress === 1)).toBe(true);
  });
});
