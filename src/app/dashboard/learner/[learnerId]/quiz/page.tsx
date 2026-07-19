import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLearner } from "@/lib/repo/learners";
import QuizRunner from "@/components/QuizRunner";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ learnerId: string }>;
  searchParams: Promise<{ levelId?: string; category?: string }>;
}) {
  const { learnerId } = await params;
  const { levelId, category } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const learner = await getLearner(learnerId);
  if (!learner || learner.account_id !== session.accountId) notFound();
  if (!levelId) notFound();

  return (
    <QuizRunner
      learnerId={learnerId}
      levelId={levelId}
      category={category}
      learnerName={learner.display_name}
    />
  );
}
