'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      telefono VARCHAR(50),
      password VARCHAR(255),
      google_id VARCHAR(255),
      rol INT DEFAULT 2,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS barberos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      especialidad VARCHAR(255),
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS servicios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT,
      precio DECIMAL(10, 2) NOT NULL,
      duracion_minutos INT NOT NULL,
      imagen VARCHAR(255),
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS citas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL,
      barbero_id INT NOT NULL,
      servicio_id INT NOT NULL,
      fecha_hora DATETIME NOT NULL,
      estado INT DEFAULT 0,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
      FOREIGN KEY (barbero_id) REFERENCES barberos(id),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    );

    CREATE TABLE IF NOT EXISTS horarios_barberos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      barbero_id INT NOT NULL,
      dia_semana INT NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fin TIME NOT NULL,
      FOREIGN KEY (barbero_id) REFERENCES barberos(id)
    );
  `);
};

exports.down = function(db) {
  return db.runSql(`
    DROP TABLE IF EXISTS horarios_barberos;
    DROP TABLE IF EXISTS citas;
    DROP TABLE IF EXISTS servicios;
    DROP TABLE IF EXISTS barberos;
    DROP TABLE IF EXISTS usuarios;
  `);
};

exports._meta = {
  "version": 1
};
