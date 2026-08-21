import { MigrationInterface, QueryRunner } from 'typeorm';

interface BranchRow {
  id: string;
  branch_name: string | null;
  business_name: string | null;
}

/**
 * Backfills the `username` column for branches created after the original
 * `BackfillBranchUsernames1778089522717` migration ran. The onboarding main
 * branch is created in `BusinessesService.create()` without a username, so any
 * new registration since the original backfill has a NULL username. This
 * migration assigns a unique username (derived from the branch name) to every
 * branch that still has none.
 *
 * Data safety:
 * - Only touches rows WHERE username IS NULL, so branches that already have a
 *   username are never modified.
 * - Every generated username is checked for uniqueness against existing rows
 *   (and rows processed earlier in this run) before being written.
 * - If a branch name sanitises to fewer than 3 chars, a deterministic suffix is
 *   appended so the value always satisfies the `username` column's 3-char
 *   minimum and the alphanumeric start/end format rules.
 */
export class BackfillMissingBranchUsernames1786930000001 implements MigrationInterface {
  name = 'BackfillMissingBranchUsernames1786930000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const branches = (await queryRunner.query(
      `SELECT b.id, b.name as branch_name, bus.name as business_name
             FROM branches b
             LEFT JOIN businesses bus ON b."businessId" = bus.id
             WHERE b."username" IS NULL`,
    )) as BranchRow[];

    console.log(
      `[BackfillMissingBranchUsernames] Found ${branches.length} branches without usernames`,
    );

    for (const branch of branches) {
      const finalUsername = await this.resolveUniqueUsername(
        queryRunner,
        branch.branch_name || branch.business_name || 'branch',
      );

      await queryRunner.query(
        `UPDATE branches SET username = $1 WHERE id = $2`,
        [finalUsername, branch.id],
      );

      console.log(
        `[BackfillMissingBranchUsernames] Updated branch ${branch.id} with username: ${finalUsername}`,
      );
    }
  }

  private async resolveUniqueUsername(
    queryRunner: QueryRunner,
    rawName: string,
  ): Promise<string> {
    const baseName = rawName.toLowerCase();

    let username = baseName
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    // Ensure minimum length
    if (username.length < 3) {
      username = username + '123'.substring(0, 3 - username.length);
    }

    // Ensure starts and ends with alnum
    if (!/^[a-z0-9]/.test(username)) username = 'b-' + username;
    if (!/[a-z0-9]$/.test(username)) username = username + '-b';

    // Ensure uniqueness against existing usernames
    let counter = 0;
    let finalUsername = username;

    while (true) {
      const existing = (await queryRunner.query(
        `SELECT id FROM branches WHERE username = $1`,
        [finalUsername],
      )) as Array<{ id: string }>;

      if (existing.length === 0) {
        break; // Username is unique
      }

      counter++;
      finalUsername = `${username}-${counter}`;

      if (counter > 100) {
        // Fallback to random suffix
        finalUsername = `${username}-${Math.floor(Math.random() * 10000)}`;
        break;
      }
    }

    return finalUsername;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Idempotent rollback: we cannot reliably distinguish which rows this
    // migration touched from those assigned by the original backfill, so we
    // intentionally leave the data in place to avoid destructive changes.
    await queryRunner.query(`SELECT 1`);
  }
}
