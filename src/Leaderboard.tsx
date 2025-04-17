import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useGlobalState, usePage } from "./App";
import { Button } from "./components/ui/button";
import { Id } from "../convex/_generated/dataModel";

export function Leaderboard() {
  const { setPage } = usePage();
  const {setCharacterId, characterId} = useGlobalState();
  const userData = useQuery(api.auth.loggedInUser);
  const leaderboard = useQuery(api.leaderboard.getLeaderboard, characterId ? { characterId } : 'skip');
  const characters = useQuery(api.characters.getActiveCharacter, {});
  
  const currentCharacter = characters ? characters?.find((c) => c._id === characterId) : null;
  const isAlreadyChatting = leaderboard?.some((l) => l.characterId === characterId);

  const handleStartChat = (characterId : Id<'characters'>) => {
    setCharacterId(characterId);
    setPage('gameChat');
  };

  // Loading state
  if (!characters || !characters.length || !leaderboard) {
    return (
      <div className="flex flex-col items-center justify-center p-16 min-h-[340px] rounded-2xl shadow-lg bg-gradient-to-br from-pink-50 via-white to-pink-100 relative overflow-hidden">
        <span className="w-16 h-16 mb-6 inline-block animate-spin rounded-full border-4 border-pink-400 border-t-transparent"></span>
        <span className="text-xl font-bold text-gray-400">Loading Leaderboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl min-w-48 w-full mx-auto p-4 pb-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center text-pink-600 font-sans tracking-tight">Leaderboard for {currentCharacter?.name || '...'}</h2>
        <Button onClick={() => currentCharacter && handleStartChat(currentCharacter._id)}>{isAlreadyChatting ? 'Continue Chat' : 'Start Chat'}</Button>
      </div>
     
      <div className="space-y-6">
        {leaderboard.length === 0 && characters.length > 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-md border border-pink-100">
            <div className="text-2xl font-bold text-pink-500 mb-2 text-center">Looks like no one's made a move yet. The game of charm is waiting.</div>
            <div className="text-base text-gray-500 mb-4">Start a chat to climb the ranks.</div>
            <Button onClick={() => currentCharacter && handleStartChat(currentCharacter._id)}>Start Chat!</Button>
          </div>
        ) : leaderboard.map((player, index) => { 
          const percentageScore = player.score > 50 ? 100 : player.score ? Math.abs((player.score / 50) * 100) : 0;
          const isCurrentUser = userData?._id === player.userId;
          // Avatar: initials from username or fallback to #
          return (
            <div
              key={player._id}
              className={`flex items-center gap-4 p-5 rounded-2xl shadow bg-white border-2 ${isCurrentUser ? 'border-pink-500 bg-pink-50' : 'border-transparent'}`}
            >
              {/* Avatar + Rank */}
              <div className="flex flex-col items-center min-w-[54px]">
                <span className="py-2 px-2.5 rounded-full bg-pink-500 text-white font-bold text-2xl mt-1">#{index + 1}</span>
              </div>
              {/* Info */}
              <div className="flex-1 flex flex-col items-start justify-center">
                <span className="font-bold text-lg text-gray-800 mb-1">{player.username}</span>
                <span className="text-xs text-slate-500 mb-2">Messages: {player.messageCount}</span>
                <div className="flex items-center h-2 w-full bg-gray-200 rounded-full">
                  <div
                    className={`h-2 rounded-full ${player.score > 0 ? 'bg-pink-500' : 'bg-red-500'}`}
                    style={{ width: `${percentageScore}%` }}
                  />
                </div>
              </div>
              {/* Score */}
              <div className="flex flex-col items-end min-w-[64px]">
                <span className="font-bold text-2xl text-pink-600">{player.score.toFixed(1)}</span>
                <span className="text-xs text-slate-500">Score</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GlobalLeaderboard() {
  const userData = useQuery(api.auth.loggedInUser);
  const globalLeaderboard = useQuery(api.leaderboard.getGlobalLeaderboard, {});
  return (
    <div className="max-w-2xl min-w-40 w-full mx-auto p-4 pb-2">
      <h2 className="text-4xl font-bold text-center text-pink-600 mb-6 font-sans tracking-tight">Global Leaderboard</h2>
      <div className="space-y-6">
        {globalLeaderboard?.map((player, index) => {
          const isCurrentUser = userData?._id === player.userId;
          // Avatar: initials from username or fallback to #
          return (
            <div
              key={player._id}
              className={`flex items-center gap-4 p-5 rounded-2xl shadow bg-white border-2 ${isCurrentUser ? 'border-pink-500 bg-pink-50' : 'border-transparent'}`}
            >
              {/* Rank pill */}
              <span className="py-2 px-2.5 rounded-full bg-pink-500 text-white font-bold text-2xl">#{index + 1}</span>
              {/* Info */}
              <div className="flex-1 flex flex-col items-start justify-center">
                <span className="font-bold text-lg text-gray-800 mb-1">{player.username}</span>
              </div>
              {/* Score */}
              <div className="flex flex-col items-end min-w-[64px]">
                <span className="font-bold text-2xl text-pink-600">{player.totalScore.toFixed(1)}</span>
                <span className="text-xs text-slate-500">Score</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
