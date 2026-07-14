import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.psbfhomirpzlkinuttea.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Shivam@d`1tal',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PG successfully.');

    // Update password of shivam@infoartledger.com to 'password123'
    const res = await client.query(
      `UPDATE auth.users 
       SET encrypted_password = crypt('password123', gen_salt('bf', 10)) 
       WHERE email = 'shivam@infoartledger.com'`
    );
    console.log('Updated rows:', res.rowCount);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
