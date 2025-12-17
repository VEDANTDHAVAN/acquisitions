import logger from '#config/logger.js';
import { signUpSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signUp = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);

    if(!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }
    const { name, email, password, role } = validationResult.data;

    // Auth Service
    const user = await createUser({ name, email, password, role });

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${email}`);
    res.status(201).json({
      message: 'User registered',
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role
      }
    });
  } catch (error) {
    logger.error('SignUp error', error);

    if(error.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if(!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    // Auth Service
    const user = await authenticateUser({ email, password });

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

    cookies.set(res, 'token', token);

    logger.info(`User signed in successfully: ${email}`);
    res.status(200).json({
      message: 'User signed in successfully',
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role
      }
    });
  } catch (error) {
    logger.error('SignIn error', error);

    if(error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
        
    if(error.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
        
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');
        
    logger.info('User signed out successfully');
    res.status(200).json({
      message: 'User signed out successfully'
    });
  } catch (error) {
    logger.error('SignOut error', error);
    next(error);
  }
};
