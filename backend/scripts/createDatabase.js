const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  let connection;
  try {
    // Conexión sin base de datos específica
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Permitir múltiples statements
    });

    console.log('✅ Connected to MySQL server');

    // Crear base de datos si no existe (usando query en lugar de execute)
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'hotel_manager'}`
    );
    console.log('✅ Database created or already exists');

    // Usar la base de datos
    await connection.query(`USE ${process.env.DB_NAME || 'hotel_manager'}`);
    console.log('✅ Using database');

    // Crear tabla de usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'supervisor', 'recepcionista', 'invitado') DEFAULT 'recepcionista',
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Crear tabla de asistencias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT,
        fecha DATE NOT NULL,
        hora_entrada TIME,
        hora_salida TIME,
        tipo ENUM('entrada', 'salida') NOT NULL,
        ubicacion VARCHAR(255),
        observaciones TEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_fecha (fecha),
        INDEX idx_usuario_fecha (usuario_id, fecha)
      )
    `);
    console.log('✅ Attendance table created');

    // Crear tabla de tareas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tareas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        usuario_asignado INT,
        usuario_creador INT,
        estado ENUM('pendiente', 'en_progreso', 'completada', 'cancelada') DEFAULT 'pendiente',
        prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_limite DATETIME,
        fecha_completado DATETIME,
        FOREIGN KEY (usuario_asignado) REFERENCES usuarios(id),
        FOREIGN KEY (usuario_creador) REFERENCES usuarios(id)
      )
    `);
    console.log('✅ Tasks table created');

    // Crear tabla de notas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        titulo VARCHAR(255) NOT NULL,
        contenido TEXT NOT NULL,
        usuario_id INT,
        tipo ENUM('personal', 'equipo', 'general') DEFAULT 'personal',
        importante BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Notes table created');

    // Crear tabla de reportes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reportes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        usuario_id INT,
        tipo ENUM('incidente', 'mejora', 'mantenimiento', 'general') DEFAULT 'general',
        estado ENUM('abierto', 'en_proceso', 'resuelto', 'cerrado') DEFAULT 'abierto',
        prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    console.log('✅ Reports table created');

    console.log('🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase();