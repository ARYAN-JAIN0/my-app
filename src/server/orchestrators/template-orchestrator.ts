import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";
import { AppError } from "../core/http";

export async function listTemplates() {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.emailTemplate.findMany({
    where: { userId },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });
}

export async function createTemplate(input: {
  name: string;
  category: string;
  subject: string;
  body: string;
  active?: boolean;
}) {
  const db = getDb();
  const userId = await getDefaultUserId();
  return db.emailTemplate.create({
    data: {
      userId,
      name: input.name,
      category: input.category,
      subject: input.subject,
      body: input.body,
      active: input.active ?? true,
    },
  });
}

export async function updateTemplate(
  id: string,
  input: Partial<{
    name: string;
    category: string;
    subject: string;
    body: string;
    active: boolean;
  }>
) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const template = await db.emailTemplate.findUnique({ where: { id } });
  if (!template || template.userId !== userId) throw new AppError("not_found", 404, "Template not found");
  return db.emailTemplate.update({ where: { id }, data: input });
}

export async function deleteTemplate(id: string) {
  const db = getDb();
  const userId = await getDefaultUserId();
  const template = await db.emailTemplate.findUnique({ where: { id } });
  if (!template || template.userId !== userId) throw new AppError("not_found", 404, "Template not found");
  await db.emailTemplate.delete({ where: { id } });
  return { id };
}
