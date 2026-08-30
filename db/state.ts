import { env } from "cloudflare:workers";

export async function readSharedState() {
  const row = await env.DB.prepare(
    "SELECT data, updated_at AS updatedAt FROM pika_state WHERE id = ?"
  )
    .bind(1)
    .first<{ data: string; updatedAt: number }>();

  if (!row) return null;

  return {
    data: JSON.parse(row.data) as unknown,
    updatedAt: row.updatedAt,
  };
}

export async function writeSharedState(data: unknown) {
  const serialized = JSON.stringify(data);
  const updatedAt = Date.now();

  await env.DB.prepare(
    `INSERT INTO pika_state (id, data, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  )
    .bind(1, serialized, updatedAt)
    .run();

  return updatedAt;
}
