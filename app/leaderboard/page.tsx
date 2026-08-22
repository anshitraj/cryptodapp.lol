import Header from "@/components/Header";
import LeaderboardRow from "@/components/Leaderboard/LeaderboardRow";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();
  const top = entries.slice(0, 10);
  const rest = entries.slice(10);

  return (
    <main className="pb-24">
      <Header />
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="mb-6 text-3xl font-extrabold text-ink">Leaderboard</h1>

        {entries.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center text-ink-soft">
            No paid bids yet — be the first to claim #1.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {top.map((entry) => (
            <LeaderboardRow key={entry.id} entry={entry} />
          ))}
        </div>

        {rest.length > 0 && (
          <>
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="rounded-full bg-green px-4 py-1.5 text-sm font-semibold text-white">
                The rest
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-col gap-3">
              {rest.map((entry) => (
                <LeaderboardRow key={entry.id} entry={entry} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
