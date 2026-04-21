const mysql = require('mysql2/promise');
require('dotenv').config();

const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo

function offsetForId(id) {
  // Small deterministic spread (~0-3km)
  const latOffset = ((id % 5) - 2) * 0.01;
  const lngOffset = ((id % 7) - 3) * 0.01;
  return { lat: DEFAULT_CENTER.lat + latOffset, lng: DEFAULT_CENTER.lng + lngOffset };
}

async function seedSellerLocations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await connection.execute(
      `SELECT id
       FROM seller_profiles
       WHERE latitude IS NULL OR longitude IS NULL
       ORDER BY id`
    );

    if (!rows.length) {
      console.log('No seller_profiles need location seeding.');
      return;
    }

    for (const row of rows) {
      const { lat, lng } = offsetForId(row.id);
      await connection.execute(
        `UPDATE seller_profiles
         SET latitude = ?, longitude = ?, city = COALESCE(city, 'Colombo'), state = COALESCE(state, 'Western')
         WHERE id = ?`,
        [lat, lng, row.id]
      );
    }

    console.log(`Seeded locations for ${rows.length} seller profile(s).`);
  } finally {
    await connection.end();
  }
}

seedSellerLocations().catch((err) => {
  console.error('Failed to seed seller locations:', err.message);
  process.exit(1);
});
