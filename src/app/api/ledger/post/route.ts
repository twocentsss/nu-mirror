
import { NextResponse } from 'next/server';
import { postFlowEvent } from '@/lib/features/ledger/accounting';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { accountCode, amount, unit, description, segments } = body;
        
        if (!accountCode || amount === undefined || !unit || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const event = await postFlowEvent(accountCode, amount, unit, description, segments);
        
        return NextResponse.json({ success: true, event });
    } catch (error) {
        console.error('Error posting flow event:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
