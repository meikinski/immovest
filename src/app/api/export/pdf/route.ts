import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvestmentReportPDF, type InvestmentReportData } from '@/components/pdf/InvestmentReportPDF';
import { istPremiumAktiv } from '@/lib/premiumServer';

export async function POST(req: Request) {
  try {
    // PDF-Report gibt es nur mit Premium
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Bitte melde dich an.' }, { status: 401 });
    }
    if (!(await istPremiumAktiv(userId))) {
      return NextResponse.json({ error: 'Der PDF-Report ist Teil von Premium.' }, { status: 403 });
    }

    const data = (await req.json()) as InvestmentReportData;

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
