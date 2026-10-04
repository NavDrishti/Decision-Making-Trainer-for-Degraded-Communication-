import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';

export const supportRouter = Router();

const supportSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

supportRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parse = supportSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const { name, email, role, subject, message } = parse.data;

    const ticket = await prisma.supportRequest.create({
      data: {
        name,
        email: email.toLowerCase(),
        role,
        subject,
        message,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Support request received. A platform coordinator will respond shortly.',
      ticketId: ticket.id,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to submit support request.' });
  }
});
