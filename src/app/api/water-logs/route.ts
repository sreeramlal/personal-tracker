import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WaterLog from '@/models/WaterLog';

export async function GET() {
  try {
    await dbConnect();

    // Fetch water logs from the last 30 days to calculate totals and streaks
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const logs = await WaterLog.find({
      timestamp: { $gte: thirtyDaysAgo },
    }).sort({ timestamp: -1 });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { amount, timestamp } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid water amount greater than 0 ml' },
        { status: 400 }
      );
    }

    const log = await WaterLog.create({
      amount,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
