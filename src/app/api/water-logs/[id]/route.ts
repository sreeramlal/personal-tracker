import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WaterLog from '@/models/WaterLog';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Log ID is required' }, { status: 400 });
    }

    const deletedLog = await WaterLog.findByIdAndDelete(id);

    if (!deletedLog) {
      return NextResponse.json({ success: false, error: 'Water log not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedLog });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
