import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const optionalNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message || 'Error fetching tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const {
      title,
      priority,
      locationName,
      locationLat,
      locationLng,
      locationRadius,
    } = await request.json();
    const radius = optionalNumber(locationRadius);

    const task = await prisma.task.create({
      data: {
        title,
        priority: priority || 'MEDIUM',
        locationName: locationName?.trim() || null,
        locationLat: optionalNumber(locationLat),
        locationLng: optionalNumber(locationLng),
        locationRadius: radius ? Math.max(25, Math.round(radius)) : 150,
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message || 'Error creating task' }, { status: 500 });
  }
}
