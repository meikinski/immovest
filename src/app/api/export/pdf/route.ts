import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvestmentReportPDF, type InvestmentReportData } from '@/components/pdf/InvestmentReportPDF';

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as InvestmentReportData;

    // Render the PDF document to a buffer
    // @ts-ignore - Type issue with React.createElement and @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(React.createElement(InvestmentReportPDF, { data }));

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="immobilien_analyse.pdf"',
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
