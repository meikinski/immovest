import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvestmentReportPDF, type InvestmentReportData } from '@/components/pdf/InvestmentReportPDF';
import { darfVollanalyse } from '@/lib/gratisAnalyse';
import { kiSchutz } from '@/lib/kostenSchutz';
import { mitMonitoring } from '@/lib/monitoring/apiRoute';

async function handlePOST(req: Request) {
  try {
    // PDF-Report gibt es mit Premium und für die Wohnung der kostenlosen Analyse
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Bitte melde dich an.' }, { status: 401 });
    }

    const body = (await req.json()) as InvestmentReportData & { adresse?: string };
    const { adresse: rohAdresse, ...data } = body;
    // Vollständige Adresse schickt der Client mit; ältere Clients: aus Titel und Ort zusammensetzen
    const adresse = rohAdresse ?? [data?.objekt?.adresse, data?.objekt?.ort].filter(Boolean).join(', ');
    if (!(await darfVollanalyse(userId, adresse))) {
      return NextResponse.json(
        { error: 'Deine kostenlose Analyse ist für eine andere Wohnung vergeben. Den PDF-Report gibt es mit Premium.', paywall: true },
        { status: 402 }
      );
    }

    // Rate Limit (keine KI-Kosten, aber rechenintensiv)
    const schutz = await kiSchutz(req, { route: '/api/export/pdf', bucket: 'pdf', ki: false });
    if (!schutz.ok) return schutz.response;

    // Render the PDF document to a buffer
    // @ts-expect-error - Type issue with React.createElement and @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(React.createElement(InvestmentReportPDF, { data }));

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="investment-report.pdf"',
      },
    });
  } catch (e) {
    console.error('PDF generation error:', e);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export const POST = mitMonitoring('POST /api/export/pdf', handlePOST);
