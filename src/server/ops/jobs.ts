import { getDb } from "../core/db";
import { getDefaultUserId } from "../core/identity";

export async function getJobsSnapshot() {
  const db = getDb();
  const userId = await getDefaultUserId();

  const [importJobs, jobRuns] = await Promise.all([
    db.importJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.jobRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return {
    importJobs,
    jobRuns,
  };
}

