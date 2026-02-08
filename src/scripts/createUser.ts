import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";

async function createUser() {
    const email = "test@example.com";
    const password = "password123";
    const name = "Test User";

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
        .insert(users)
        .values({
            name,
            email,
            password: hashedPassword,
        })
        .returning();

    if (newUser) {
        console.log("✓ User created:", { id: newUser.id, email: newUser.email, name: newUser.name });
        console.log("  You can now login with:", email, password);
    }
}

createUser().catch(console.error);
