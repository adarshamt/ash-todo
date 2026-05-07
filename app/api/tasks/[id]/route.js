import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const payload = await request.json();
    const data = {};

    if ('completed' in payload) {
      data.completed = Boolean(payload.completed);
    }

    if ('locationAlerted' in payload) {
      data.locationAlerted = Boolean(payload.locationAlerted);
    }
    
    const task = await prisma.task.update({
      where: { id },
      data,
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating task' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await prisma.task.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting task' }, { status: 500 });
  }
}
