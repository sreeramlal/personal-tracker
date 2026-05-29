import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WaterSetting from '@/models/WaterSetting';

export async function GET() {
  try {
    await dbConnect();
    let setting = await WaterSetting.findOne({ userId: 'default' });

    if (!setting) {
      // Auto-seed default settings if none exist yet in the database
      setting = await WaterSetting.create({
        target: 2000,
        userId: 'default',
      });
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { target } = body;

    if (!target || typeof target !== 'number' || target < 500 || target > 10000) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid target amount between 500 ml and 10000 ml' },
        { status: 400 }
      );
    }

    const setting = await WaterSetting.findOneAndUpdate(
      { userId: 'default' },
      { target },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
