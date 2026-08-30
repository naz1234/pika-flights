import { readSharedState, writeSharedState } from "@/db/state";

export async function GET() {
  try {
    const state = await readSharedState();
    return Response.json(state ?? { data: null, updatedAt: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load plan";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { data?: unknown };

    if (!payload.data || typeof payload.data !== "object") {
      return Response.json({ error: "Plan data is required" }, { status: 400 });
    }

    const size = new TextEncoder().encode(JSON.stringify(payload.data)).length;
    if (size > 500_000) {
      return Response.json({ error: "Plan is too large to save" }, { status: 413 });
    }

    const updatedAt = await writeSharedState(payload.data);
    return Response.json({ ok: true, updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save plan";
    return Response.json({ error: message }, { status: 500 });
  }
}
