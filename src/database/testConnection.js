const { testConnection } = require('./connection');

async function main() {
  try {
    const connected = await testConnection();

    if (connected) {
      console.log('Conexion a la base de datos exitosa');
      process.exit(0);
    }

    console.log('No se pudo validar la conexion a la base de datos');
    process.exit(1);
  } catch (error) {
    console.error('Error al conectar con la base de datos:');
    console.error(error.message);
    process.exit(1);
  }
}

main();