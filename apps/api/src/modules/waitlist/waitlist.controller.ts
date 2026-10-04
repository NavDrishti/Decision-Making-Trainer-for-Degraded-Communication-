import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';

export const waitlistRouter = Router();

const waitlistSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  organization: z.string().optional(),
  interestType: z.enum(['COMMAND_ROOM_VR', 'OPERATIONAL_OVERLAY_AR', 'IMMERSIVE_BRIEFING', 'RESEARCH_PILOT']).default('COMMAND_ROOM_VR'),
  notes: z.string().optional(),
});

waitlistRouter.post('/ar-vr', async (req: Request, res: Response) => {
  try {
    const parse = waitlistSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const { name, email, organization, interestType, notes } = parse.data;

    const entry = await prisma.arVrWaitlistEntry.create({
      data: {
        name,
        email: email.toLowerCase(),
        organization,
        interestType,
        notes,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! You have been added to the NavDrishti AR/VR Command Suite preview list.',
      entryId: entry.id,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to record waitlist entry.' });
  }
});
