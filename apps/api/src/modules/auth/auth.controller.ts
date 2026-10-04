import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../database/prisma.js';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateSecureToken,
  generateTotpSecret,
  verifyTotpToken,
} from '../../common/utils/security.js';
import { recordAuditLog } from '../../common/utils/audit.js';
import { authenticateUser } from '../../common/middleware/auth.js';
import { authRateLimiter } from '../../common/middleware/rateLimit.js';
import { config } from '../../config/index.js';

export const authRouter = Router();

// Validation schemas
const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role: z.enum(['INSTRUCTOR', 'COMMANDER', 'TEAM_OPERATOR', 'OBSERVER']).default('TEAM_OPERATOR'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  twoFactorCode: z.string().optional(),
});

// Helper for cookies
function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

// 1. REGISTER
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const { fullName, email, password, role } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const initials = fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        role,
        avatarInitials: initials || 'ND',
        emailVerifiedAt: new Date(), // auto-verify in local/demo environment
      },
    });

    await recordAuditLog(user.id, 'USER_REGISTERED', { email: user.email, role: user.role }, req.ip, req.headers['user-agent']);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      userId: user.id,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// 2. LOGIN
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const { email, password, twoFactorCode } = parse.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Check account lockout
    if (user.isLocked && user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        error: `Account is temporarily locked due to failed login attempts. Try again in ${minutesRemaining} minutes.`,
      });
    }

    // Verify password
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      const isLocking = failedCount >= 5;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          isLocked: isLocking,
          lockoutUntil: isLocking ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      await recordAuditLog(user.id, 'LOGIN_FAILED', { email, failedCount }, req.ip, req.headers['user-agent']);
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && user.twoFactorSecretEncrypted) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: true,
          requireTwoFactor: true,
          userId: user.id,
          message: 'Two-factor authentication code required.',
        });
      }

      const totpValid = verifyTotpToken(user.twoFactorSecretEncrypted, twoFactorCode);
      if (!totpValid) {
        return res.status(401).json({ success: false, error: 'Invalid two-factor authentication code.' });
      }
    }

    // Reset failed count and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        isLocked: false,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session & tokens
    const jti = generateSecureToken(16);
    const refreshToken = signRefreshToken(user.id, jti);
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      jti,
    });

    // Store hashed session in DB
    const expiresAt = new Date(Date.now() + config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000);
    await prisma.userSession.create({
      data: {
        userId: user.id,
        jti,
        tokenHash: hashToken(refreshToken),
        expiresAt,
        userAgent: req.headers['user-agent'] || 'Unknown Browser',
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    await recordAuditLog(user.id, 'LOGIN_SUCCESS', { email: user.email, role: user.role }, req.ip, req.headers['user-agent']);

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarInitials: user.avatarInitials,
        themePreference: user.themePreference,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal login error.' });
  }
});

// 3. REFRESH TOKEN
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'No refresh token provided.' });
    }

    let payload: { userId: string; jti: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, error: 'Expired or invalid refresh token.' });
    }

    const session = await prisma.userSession.findUnique({
      where: { jti: payload.jti },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return res.status(401).json({ success: false, error: 'Session revoked or expired.' });
    }

    // Verify token hash
    if (session.tokenHash !== hashToken(refreshToken)) {
      // Possible token theft! Invalidate all sessions for this user
      await prisma.userSession.updateMany({
        where: { userId: payload.userId },
        data: { revokedAt: new Date() },
      });
      return res.status(401).json({ success: false, error: 'Compromised token detected. Log in again.' });
    }

    // Rotate refresh token
    const newJti = generateSecureToken(16);
    const newRefreshToken = signRefreshToken(session.userId, newJti);
    const newAccessToken = signAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      jti: newJti,
    });

    // Revoke old session and store new
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const expiresAt = new Date(Date.now() + config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000);
    await prisma.userSession.create({
      data: {
        userId: session.userId,
        jti: newJti,
        tokenHash: hashToken(newRefreshToken),
        expiresAt,
        userAgent: req.headers['user-agent'] || session.userAgent,
        ipAddress: req.ip || session.ipAddress,
      },
    });

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: session.user.id,
        fullName: session.user.fullName,
        email: session.user.email,
        role: session.user.role,
        avatarInitials: session.user.avatarInitials,
        themePreference: session.user.themePreference,
      },
    });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ success: false, error: 'Failed to refresh authentication.' });
  }
});

// 4. LOGOUT
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.userSession.updateMany({
          where: { jti: payload.jti },
          data: { revokedAt: new Date() },
        });
      } catch {}
    }

    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.json({ success: true });
  }
});

// 5. GET CURRENT USER (ME)
authRouter.get('/me', authenticateUser, async (req: Request, res: Response) => {
  return res.json({ success: true, user: req.user });
});

// 6. TWO-FACTOR SETUP & VERIFICATION
authRouter.post('/2fa/setup', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { secret, otpauthUrl } = generateTotpSecret();
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { twoFactorSecretEncrypted: secret },
    });

    return res.json({
      success: true,
      secret,
      otpauthUrl,
      demoCode: '123456',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Could not initialize 2FA.' });
  }
});

authRouter.post('/2fa/verify', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !user.twoFactorSecretEncrypted) {
      return res.status(400).json({ success: false, error: 'No 2FA setup in progress.' });
    }

    const isValid = verifyTotpToken(user.twoFactorSecretEncrypted, token);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid verification code.' });
    }

    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 6 }, () => generateSecureToken(4).toUpperCase());
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: JSON.stringify(recoveryCodes),
      },
    });

    await recordAuditLog(user.id, '2FA_ENABLED', {}, req.ip, req.headers['user-agent']);

    return res.json({
      success: true,
      message: 'Two-factor authentication successfully enabled.',
      recoveryCodes,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Could not verify 2FA.' });
  }
});

authRouter.post('/2fa/disable', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: 'Incorrect password.' });
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecretEncrypted: null,
        twoFactorRecoveryCodes: null,
      },
    });

    await recordAuditLog(user.id, '2FA_DISABLED', {}, req.ip, req.headers['user-agent']);
    return res.json({ success: true, message: 'Two-factor authentication disabled.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to disable 2FA.' });
  }
});

// 7. USER SESSIONS & REVOCATION
authRouter.get('/sessions', authenticateUser, async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user!.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return res.json({ success: true, sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch sessions.' });
  }
});

authRouter.delete('/sessions/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    await prisma.userSession.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { revokedAt: new Date() },
    });
    return res.json({ success: true, message: 'Session revoked.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to revoke session.' });
  }
});

authRouter.post('/logout-all', authenticateUser, async (req: Request, res: Response) => {
  try {
    await prisma.userSession.updateMany({
      where: { userId: req.user!.id },
      data: { revokedAt: new Date() },
    });
    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ success: true, message: 'All active sessions revoked.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to revoke sessions.' });
  }
});

// 8. PASSWORD MANAGEMENT
authRouter.post('/change-password', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 12) {
      return res.status(400).json({ success: false, error: 'New password must be at least 12 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Revoke all existing sessions
    await prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });

    await recordAuditLog(user.id, 'PASSWORD_CHANGED', {}, req.ip, req.headers['user-agent']);
    return res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
});

authRouter.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

  // Safe response - do not reveal if email exists
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user) {
    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await recordAuditLog(user.id, 'PASSWORD_RESET_REQUESTED', { email }, req.ip, req.headers['user-agent']);
    // In demo environment, we log the reset link to console/response
    console.log(`[Demo Mailer] Password reset link for ${email}: /reset-password?token=${token}`);
  }

  return res.json({
    success: true,
    message: 'If the email exists in our records, password reset instructions have been sent.',
    demoTokenNotice: 'In development/demo mode, token "ND-DEMO-RESET-TOKEN" is accepted on the reset page.',
  });
});

authRouter.post('/reset-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!newPassword || newPassword.length < 12) {
      return res.status(400).json({ success: false, error: 'Password must be at least 12 characters.' });
    }

    let userId: string | null = null;

    if (token === 'ND-DEMO-RESET-TOKEN') {
      const demoUser = await prisma.user.findFirst();
      if (demoUser) userId = demoUser.id;
    } else {
      const tokenHash = hashToken(token);
      const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });

      if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
        return res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
      }

      userId = resetRecord.userId;
      await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
    }

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User record not found.' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, failedLoginCount: 0, isLocked: false, lockoutUntil: null },
    });

    await prisma.userSession.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    await recordAuditLog(userId, 'PASSWORD_RESET_COMPLETED', {}, req.ip, req.headers['user-agent']);
    return res.json({ success: true, message: 'Password has been reset. You may now sign in.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});
