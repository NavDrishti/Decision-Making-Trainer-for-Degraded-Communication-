import { prisma } from '../../database/prisma.js';

export async function recordAuditLog(
  userId: string | null,
  action: string,
  details: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        detailsJson: JSON.stringify(details),
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'NavDrishti-Agent/1.0',
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
