import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { completed } = await request.json();
    
    const task = await prisma.task.update({
      where: { id },
      data: { completed },
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
