import dataSource from './data-source';

async function dropConflicted() {
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();

    console.log('Dropping conflicted loyalty tables...');

    const tables = [
        'rewards',
        'redemptions',
        'loyalty_profiles',
        'loyalty_transactions',
        'point_transactions'
    ];

    for (const table of tables) {
        try {
            await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
            console.log(`Dropped table: ${table}`);
        } catch (err) {
            console.error(`Failed to drop table ${table}:`, err.message);
        }
    }

    await dataSource.destroy();
    console.log('Done.');
}

dropConflicted().catch(console.error);
