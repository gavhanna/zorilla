import { db } from '../db';
import { users } from '../db/schema';
import bcrypt from 'bcrypt';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export async function initializeApp() {
    console.log('Running database migrations...');
    try {
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✓ Migrations completed successfully');
    } catch (error) {
        console.error('Failed to run migrations:', error);
        throw error;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin';

    if (!adminEmail || !adminPassword) {
        console.log('No admin credentials provided, skipping admin user creation');
        return;
    }

    try {
        // Check if admin user already exists
        const existingUsers = await db.select().from(users).limit(1);

        if (existingUsers.length > 0) {
            console.log('Users already exist, skipping admin user creation');
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await db.insert(users).values({
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: 'admin',
        });

        console.log(`✓ Admin user created: ${adminEmail}`);
    } catch (error) {
        console.error('Failed to create admin user:', error);
        throw error;
    }
}
