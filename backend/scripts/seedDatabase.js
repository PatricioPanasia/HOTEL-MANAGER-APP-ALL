const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_manager'
    });

    console.log('✅ Connected to database for seeding');

    // Hash de contraseñas
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insertar usuario administrador
    await connection.execute(
      `INSERT IGNORE INTO usuarios (nombre, email, password, rol) 
       VALUES (?, ?, ?, ?)`,
      ['Administrador', 'admin@hotel.com', hashedPassword, 'admin']
    );
    console.log('✅ Admin user created (admin@hotel.com / admin123)');

    // Insertar usuarios de ejemplo
    const sampleUsers = [
      ['Supervisor Ejemplo', 'supervisor@hotel.com', await bcrypt.hash('super123', 10), 'supervisor'],
      ['Recepcionista Uno', 'recepcion1@hotel.com', await bcrypt.hash('recepcion123', 10), 'recepcionista'],
      ['Recepcionista Dos', 'recepcion2@hotel.com', await bcrypt.hash('recepcion123', 10), 'recepcionista']
    ];

    for (const user of sampleUsers) {
      await connection.execute(
        `INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`,
        user
      );
    }
    console.log('✅ Sample users created');

    // Insertar tareas de ejemplo
    await connection.execute(`
      INSERT IGNORE INTO tareas (titulo, descripcion, usuario_asignado, usuario_creador, prioridad, estado) 
      VALUES 
      ('Revisar inventario', 'Verificar stock de productos en recepción', 3, 1, 'media', 'pendiente'),
      ('Limpieza área común', 'Limpiar lobby y áreas de espera', 3, 2, 'alta', 'en_progreso'),
      ('Reporte mensual', 'Preparar reporte de actividades del mes', 2, 1, 'baja', 'pendiente')
    `);
    console.log('✅ Sample tasks created');

    console.log('🎉 Database seeded successfully!');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();