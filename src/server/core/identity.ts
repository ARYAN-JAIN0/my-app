import { getDb } from "./db";

export async function getDefaultUserId() {
  const db = getDb();
  const email = process.env.DEFAULT_USER_EMAIL || "owner@revo.local";
  const name = process.env.DEFAULT_USER_NAME || "Revo Owner";

  const user = await db.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
    select: { id: true },
  });

  return user.id;
}
