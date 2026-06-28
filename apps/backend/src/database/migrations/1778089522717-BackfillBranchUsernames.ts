import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillBranchUsernames1778089522717 implements MigrationInterface {
  name = 'BackfillBranchUsernames1778089522717';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all branches without usernames
    const branches = await queryRunner.query(
      `SELECT b.id, b.name as branch_name, bus.name as business_name 
             FROM branches b 
             LEFT JOIN businesses bus ON b."businessId" = bus.id 
             WHERE b."username" IS NULL`,
    );

    console.log(`Found ${branches.length} branches without usernames`);

    for (const branch of branches) {
      // Generate base username from branch name or business name
      const baseName = (
        branch.branch_name ||
        branch.business_name ||
        'branch'
      ).toLowerCase();

      // Replace special chars with hyphens, collapse multiple hyphens, trim
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

      // Check uniqueness against existing usernames
      let counter = 0;
      let finalUsername = username;

      while (true) {
        const existing = await queryRunner.query(
          `SELECT id FROM branches WHERE username = $1`,
          [finalUsername],
        );

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

      await queryRunner.query(
        `UPDATE branches SET username = $1 WHERE id = $2`,
        [finalUsername, branch.id],
      );

      console.log(
        `Updated branch ${branch.id} with username: ${finalUsername}`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove auto-generated usernames (set back to NULL)
    await queryRunner.query(
      `UPDATE branches SET username = NULL WHERE username IS NOT NULL`,
    );
  }
}
