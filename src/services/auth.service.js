import bcrypt from 'bcrypt';
import logger from '#config/logger.js';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger(`Error hashing the password: ${error}`);
    throw new Error('Error hashing');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error(`Error comparing password: ${error}`);
    throw new Error('Error comparing password');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = db.select().from(users).where(eq(users.email, email)).limit(1);
    if((await existingUser).length > 0) throw new Error('User with this email already exists');
        
    const password_hash = await hashPassword(password);

    const [newUser] = await db.insert(users).values({ name, email, password: password_hash, role }).returning({
      id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at
    });

    logger.info(`User ${newUser.email} created successfully!!`);
    return newUser;
  } catch (error) {
    logger.error(`Error creating the user: ${error}`);
    throw error;
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
    if (!existingUser) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(password, existingUser.password);
        
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

        // Return user without password
        const { password: _password, ...userWithoutPassword } = existingUser;
    return userWithoutPassword;
  } catch (error) {
    logger.error(`Error authenticating user: ${error}`);
    throw error;
  }
};
