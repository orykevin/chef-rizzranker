import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useGlobalState } from "./App";

export function Leaderboard() {
  const userData = useQuery(api.auth.loggedInUser);
  const { characterId } = useGlobalState();
  const leaderboard = useQuery(api.leaderboard.getLeaderboard, characterId ? { characterId } : 'skip') || [];
  const characters = useQuery(api.characters.getActiveCharacter, {});
  

  const currentCharacter = characters ? characters?.find((c) => c._id === characterId) : null;

  return (
    <div className="max-w-2xl min-w-48 w-full mx-auto p-4 pb-2">
      <h2 className="text-2xl font-bold mb-4">Top Players with {currentCharacter?.name || ' - '}</h2>
      <div className="space-y-2">
        {leaderboard.map((player, index) => { 
          const percentageScore = player.score > 50 ? 100 : player.score ? Math.abs((player.score / 50) * 100) : 0;
          return (
          <div key={player._id} className={"p-4 rounded-lg shadow" + (userData?._id === player.userId ? ' bg-blue-100/50 border border-black' : 'bg-white')}>
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-slate-600">#{index + 1}</div>
              <div>
                <div className="font-semibold">{player.username}</div>
                <div className="text-sm text-slate-500">
                  Messages: {player.messageCount}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xl">{player.score.toFixed(1)}</div>
              <div className="text-sm text-slate-500">Score</div>
            </div>
            
          </div>
          <div className="flex items-center h-2 w-full bg-gray-200 rounded-full mt-3">
            <div
              className={`h-2 rounded-full ${player.score > 0 ? 'bg-blue-500' : 'bg-red-500'}`}
              style={{ width: `${percentageScore}%` }}
            />
          </div>
          </div>
        )})}
      </div>
    </div>
  );
}

export function GlobalLeaderboard() {
  const userData = useQuery(api.auth.loggedInUser);
  const globalLeaderboard = useQuery(api.leaderboard.getGlobalLeaderboard, {});
  return (
    <div className={"max-w-2xl min-w-40 w-full mx-auto p-4"}>
      <h2 className="text-2xl font-bold mb-4">Global Leaderboard</h2>
      <div className="space-y-2">
        {globalLeaderboard?.map((player, index) => (
          <div
            key={player._id}
            className={"flex items-center gap-4 justify-between p-4 rounded-lg shadow" + (userData?._id === player.userId ? ' bg-blue-100/50 border border-black' : 'bg-white')}
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-slate-600">#{index + 1}</div>
              <div className="font-semibold">{player.username}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xl">{player.totalScore.toFixed(1)}</div>
              <div className="text-sm text-slate-500">Score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
