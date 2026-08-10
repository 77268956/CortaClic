const mysql = require('mysql2/promise');
const databaseConfig = require('../config/database');

const pool = mysql.createPool(databaseConfig);

async function testConnection() {
	const connection = await pool.getConnection();

	try {
		await connection.ping();
		return true;
	} finally {
		connection.release();
	}
}

module.exports = {
	pool,
	testConnection,
};
