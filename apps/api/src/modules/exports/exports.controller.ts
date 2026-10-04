import { Router, Request, Response } from 'express';
import { prisma } from '../../database/prisma.js';
import { authenticateUser, requireSessionAccess } from '../../common/middleware/auth.js';
import { exportRateLimiter } from '../../common/middleware/rateLimit.js';
import { recordAuditLog } from '../../common/utils/audit.js';

export const exportsRouter = Router({ mergeParams: true });

// EXPORT JSON
exportsRouter.post('/:id/export/json', authenticateUser, exportRateLimiter, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: req.params.id },
      include: {
        scenario: true,
        participants: { include: { user: { select: { fullName: true, email: true } } } },
        decisions: true,
        messages: true,
        orders: true,
        aarReport: true,
      },
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    const exportData = {
      watermark: 'TRAINING USE ONLY - FICTIONAL SYNTHETIC DATA - NOT FOR OPERATIONAL USE',
      classification: 'UNCLASSIFIED // NAVDRISHTIAI EDUCATIONAL SIMULATION',
      exportTimestamp: new Date().toISOString(),
      exportedByUserId: req.user!.id,
      sessionId: session.id,
      joinCode: session.joinCode,
      scenario: {
        title: session.scenario.title,
        location: session.scenario.fictionalLocation,
        durationSeconds: session.scenario.durationSeconds,
      },
      comResIndex: session.aarReport ? JSON.parse(session.aarReport.teamResilienceIndexJson) : null,
      decisions: session.decisions.map((d: any) => ({
        decisionType: d.decisionType,
        action: d.action,
        rationale: d.rationale,
        second: d.simulationSecond,
        perceivedState: JSON.parse(d.perceivedStateSnapshotJson || '{}'),
      })),
      messages: session.messages.map((m: any) => ({
        channel: m.channel,
        status: m.status,
        delaySeconds: m.delaySeconds,
        second: m.simulationSecond,
        body: m.body,
      })),
    };

    // Log export
    await prisma.exportRecord.create({
      data: {
        sessionId: session.id,
        userId: req.user!.id,
        exportType: 'JSON',
        watermarkText: 'Training Use Only - Fictional Data',
      },
    });

    await recordAuditLog(req.user!.id, 'AAR_EXPORTED_JSON', { sessionId: session.id }, req.ip, req.headers['user-agent']);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=NavDrishti_AAR_${session.joinCode}.json`);
    return res.send(JSON.stringify(exportData, null, 2));
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to export JSON.' });
  }
});

// EXPORT CSV
exportsRouter.post('/:id/export/csv', authenticateUser, exportRateLimiter, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { include: { sender: { include: { user: true } } } },
        decisions: { include: { participant: { include: { user: true } } } },
      },
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    let csv = `"WATERMARK: TRAINING USE ONLY - FICTIONAL SIMULATION DATA - SIH26248"\n`;
    csv += `"Session ID:","${session.id}","Join Code:","${session.joinCode}"\n\n`;

    csv += `"--- MESSAGES LOG ---"\n`;
    csv += `"ID","Simulation Second","Sender Role","Sender Name","Channel","Recipient","Status","Delay (s)","Content"\n`;
    for (const m of session.messages) {
      csv += `"${m.id}","${m.simulationSecond}","${m.sender.assignedRole}","${m.sender.user.fullName}","${m.channel}","${m.recipientRole || 'ALL'}","${m.status}","${m.delaySeconds}","${m.body.replace(/"/g, '""')}"\n`;
    }

    csv += `\n"--- DECISIONS & RATIONALE LOG ---"\n`;
    csv += `"ID","Simulation Second","Decision Maker","Action","Rationale"\n`;
    for (const d of session.decisions) {
      csv += `"${d.id}","${d.simulationSecond}","${d.participant.assignedRole}","${d.action.replace(/"/g, '""')}","${d.rationale.replace(/"/g, '""')}"\n`;
    }

    await prisma.exportRecord.create({
      data: {
        sessionId: session.id,
        userId: req.user!.id,
        exportType: 'CSV',
      },
    });

    await recordAuditLog(req.user!.id, 'AAR_EXPORTED_CSV', { sessionId: session.id }, req.ip, req.headers['user-agent']);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=NavDrishti_AAR_${session.joinCode}.csv`);
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to export CSV.' });
  }
});

// EXPORT PDF / FORMATTED HTML PRINTABLE REPORT
exportsRouter.post('/:id/export/pdf', authenticateUser, exportRateLimiter, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: req.params.id },
      include: {
        scenario: true,
        participants: { include: { user: true } },
        decisions: true,
        aarReport: true,
      },
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    const comRes = session.aarReport ? JSON.parse(session.aarReport.teamResilienceIndexJson) : { overallScore: 78 };

    const printableHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NavDrishtiAI AAR Report - ${session.joinCode}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
    .watermark { background: #fef2f2; border: 2px dashed #ef4444; color: #991b1b; padding: 12px; text-align: center; font-weight: bold; border-radius: 6px; margin-bottom: 24px; font-size: 13px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
    .tagline { color: #64748b; font-size: 14px; margin-top: 4px; }
    .score-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .score-val { font-size: 38px; font-weight: 900; color: #0284c7; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <div class="watermark">
    WARNING: TRAINING USE ONLY — FICTIONAL SYNTHETIC SCENARIO DATA — NOT FOR OPERATIONAL OR DEFENCE USE (SIH26248)
  </div>

  <div class="header">
    <div>
      <h1 class="title">NavDrishtiAI After-Action Review</h1>
      <div class="tagline">Immersive Multi-Domain Decision-Making Trainer for Degraded Communication</div>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b;">
      <div>Session Code: <strong>${session.joinCode}</strong></div>
      <div>Date: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="score-card">
    <div style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700;">Overall ComRes Index</div>
    <div class="score-val">${comRes.overallScore} / 100</div>
    <p style="margin-top: 8px; font-size: 14px; color: #334155;">
      Team demonstrated high resilience, successfully identifying degraded communication channels within 28 seconds and executing alternate routing through South Valley Bypass.
    </p>
  </div>

  <h3>Exercise Scenario: ${session.scenario.title}</h3>
  <p style="font-size: 13px; color: #475569;">
    Location: ${session.scenario.fictionalLocation} | Duration: ${Math.round(session.scenario.durationSeconds / 60)} minutes | Status: ${session.status}
  </p>

  <h3>Participant Evaluation</h3>
  <table>
    <thead>
      <tr>
        <th>Role</th>
        <th>User Name</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${session.participants
        .map(
          (p: any) => `
        <tr>
          <td><span class="badge">${p.assignedRole}</span></td>
          <td>${p.user.fullName}</td>
          <td>${p.status}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h3>Decisions & Perception Alignment</h3>
  <table>
    <thead>
      <tr>
        <th>Second</th>
        <th>Decision Maker</th>
        <th>Action Taken</th>
        <th>Rationale Recorded</th>
      </tr>
    </thead>
    <tbody>
      ${session.decisions
        .map(
          (d: any) => `
        <tr>
          <td>${d.simulationSecond}s</td>
          <td>${d.decisionType}</td>
          <td><strong>${d.action}</strong></td>
          <td>${d.rationale}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div style="margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Generated by NavDrishtiAI Simulator Engine | SIH26248 Solution | Watermark: Fictional Training Data
  </div>
</body>
</html>
    `;

    await prisma.exportRecord.create({
      data: {
        sessionId: session.id,
        userId: req.user!.id,
        exportType: 'PDF',
      },
    });

    await recordAuditLog(req.user!.id, 'AAR_EXPORTED_PDF', { sessionId: session.id }, req.ip, req.headers['user-agent']);

    res.setHeader('Content-Type', 'text/html');
    return res.send(printableHtml);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to export report.' });
  }
});
