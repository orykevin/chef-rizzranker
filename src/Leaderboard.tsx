import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useGlobalState } from "./App";

export function Leaderboard() {
  const { characterId } = useGlobalState();
  const leaderboard = useQuery(api.leaderboard.getLeaderboard, characterId ? { characterId } : 'skip') || [];
  const characters = useQuery(api.characters.getActiveCharacter, {});

  const currentCharacter = characters ? characters?.find((c) => c._id === characterId) : null;

  console.log(characters, characterId)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Top Players with {currentCharacter?.name || ' - '}</h2>
      <div className="space-y-2">
        {leaderboard.map((player, index) => (
          <div
            key={player._id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-slate-500">#{index + 1}</div>
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
        ))}
      </div>
    </div>
  );
}
