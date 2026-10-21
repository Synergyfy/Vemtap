// Timestamps are stored as `timestamp without time zone` in UTC and node-postgres
// reads them back in the process zone. Production runs in UTC; pin it so a
// developer machine in another zone does not shift every date it returns.
process.env.TZ = 'UTC';
