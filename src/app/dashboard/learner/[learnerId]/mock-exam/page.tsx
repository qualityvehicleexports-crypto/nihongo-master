import { notFound, redirect } from "next/navigation";
import { canAccessLearner, getSession } from "@/lib/auth";
import { getLearner } from "@/lib/repo/learners";
import MockExamRunner from "@/components/MockExamRunner";
import { getDictionary } from "@/lib/i18n";
import { MOCK_EXAM_CONFIG, MOCK_EXAM_EDITIONS } from "@/lib/repo/mockExam";

export default async function MockExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ learnerId: string }>;
  searchParams: Promise<{ levelId?: string; edition?: string }>;
}) {
  const { learnerId } = await params;
  const { levelId, edition: editionRaw } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const learner = await getLearner(learnerId);
  if (!learner || !canAccessLearner(session, learner)) notFound();
  if (!levelId || !(levelId in MOCK_EXAM_CONFIG)) notFound();

  const edition = Number(editionRaw);
  if (!editionRaw || !MOCK_EXAM_EDITIONS.includes(edition)) notFound();

  return (
    <MockExamRunner
      learnerId={learnerId}
      levelId={levelId}
      edition={edition}
      learnerName={learner.display_name}
      dict={getDictionary(learner.ui_language)}
    />
  );
}
