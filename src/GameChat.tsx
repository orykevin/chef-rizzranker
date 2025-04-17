import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./components/ui/button";
import { useConvexAuth } from "convex/react";
import { useGlobalState, usePage } from "./App";
import { Id } from "../convex/_generated/dataModel";

export function GameChat() {
  const { isAuthenticated } = useConvexAuth();
  const userData = useQuery(api.auth.loggedInUser);
  const { setPage, page } = usePage();
  const { characterId, setCharacterId } = useGlobalState();
  const [message, setMessage] = useState("");
  const [showCharacterInfo, setShowCharacterInfo] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [aiPending, setAiPending] = useState(false);

  const messageRef = useRef<HTMLDivElement | null>(null);
  const characters = useQuery(api.characters.getActiveCharacter, {});
  const messages = useQuery(api.chat.getMessages, 
    characterId ? { characterId } : "skip"
  );
  const allLeaderboard = useQuery(api.leaderboard.getAllUserLeaderboards, {});

  // Countdown timer for next character
  useEffect(() => {
    if (!characters || !Array.isArray(characters) || characters.length === 0) return;
    // Find latest character by _creationTime
    const latest = [...characters].sort((a, b) => b._creationTime - a._creationTime)[0];
    if (!latest) return;
    const expiry = latest._creationTime + 24 * 60 * 60 * 1000;
    const updateCountdown = () => {
      const now = Date.now();
      let diff = expiry - now;
      if (diff < 0) diff = 0;
      const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }, [characters]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [messages]);
  
  const sendMessage = useMutation(api.chat.sendMessage);
  const selectedCharacterData = characters?.find((c) => c._id === characterId);

  if (!isAuthenticated) {
    return <div>Please sign in to play</div>;
  }

  if (!characters) {
    return <div className="flex flex-col items-center justify-center p-16 min-h-[340px] rounded-2xl shadow-lg bg-gradient-to-br from-pink-50 via-white to-pink-100 relative overflow-hidden">
      <span className="text-base font-medium text-pink-600">Loading Characters...</span>
    </div>;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterId || !message.trim()) return;

    try {
      setAiPending(true);
      await sendMessage({
        characterId,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setAiPending(false);
    }
  };

  const handleStartChat = (characterId : Id<'characters'>) => {
    setCharacterId(characterId);
    setPage('gameChat');
  };

  const handleSeeLeaderboard = (characterId : Id<'characters'>) => {
    setCharacterId(characterId);
    setPage('leaderboard');
  };

  const formatDateToShortMonth = (dateInput: number) => {
    const date = new Date(dateInput);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }



  if(page === 'gameChat') return (
    <div className="relative flex flex-col h-[calc(100vh-76px)] bg-white rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:p-6 p-4 pt-0 sm:pt-6 border-b">
        <h2 className="text-2xl font-bold text-pink-600">{selectedCharacterData?.name || ' - '}</h2>
        <div className="flex gap-3">
          <Button onClick={() => setShowCharacterInfo(!showCharacterInfo)}>{showCharacterInfo ? 'Hide' : 'Details'}</Button>
          <Button variant="outline" onClick={() => {setCharacterId(null); setPage('characterSelection')}}>
            Change Character
          </Button>
        </div>
      </div>

      <div className="w-full overflow-hidden absolute top-[145px] sm:top-[73px] transition-all duration-300 bg-white shadow-sm" style={{height: showCharacterInfo ? 'max-content' : '0', opacity: showCharacterInfo ? '1' : '0'}}>
        <div className="space-y-2 p-6">
          <p className="!mb-4"><b>Personality:</b> <span className="rounded-full bg-pink-50 px-3 py-1 ml-2">{selectedCharacterData?.personality || ' - '}</span></p>
          <p className="w-full text-wrap"><b>Background:</b> <span className="rounded-full bg-gray-100 px-3 py-1 ml-2">{selectedCharacterData?.background || ' - '}</span></p>
          <p><b>Interests:</b> {selectedCharacterData?.interests.map((i: string) => <span key={i} className="inline-block rounded-full bg-purple-100 text-purple-700 px-3 py-1 mx-1 my-1 text-sm font-semibold">{i}</span>) || ' - '}</p>
          <p><b>Likes:</b> {selectedCharacterData?.preferences.likes.map((l: string) => <span key={l} className="inline-block rounded-full bg-pink-100 text-pink-600 px-3 py-1 mx-1 my-1 text-sm font-semibold">{l}</span>) || ' - '}</p>
          <p><b>Dislikes:</b> {selectedCharacterData?.preferences.dislikes.map((d: string) => <span key={d} className="inline-block rounded-full bg-gray-200 text-gray-500 px-3 py-1 mx-1 my-1 text-sm font-semibold">{d}</span>) || ' - '}</p>
        </div>
      </div>


      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        ref={messageRef}
      >
        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`max-w-[75%] w-max px-5 py-3 rounded-xl text-base font-medium shadow-sm break-words ${
              msg.isAiResponse
                ? "bg-gray-100 text-gray-700 ml-0"
                : "bg-pink-500 text-white ml-auto"
            }`}
          >
            <p>{msg.content}</p>
            {msg.score && (
              <div className="text-xs mt-1 text-pink-600 pr-1 text-end">
                Score: {msg.score.toFixed(1)}
              </div>
            )}
          </div>
        ))}
      </div>
      {aiPending && (
        <div className="flex items-center gap-2 px-6 pb-4 pt-2">
          <span className="w-4 h-4 inline-block animate-spin rounded-full border-2 border-pink-400 border-t-transparent"></span>
          <span className="text-sm text-pink-400 font-medium">AI is replying<span className="animate-pulse">...</span></span>
        </div>
      )}
      <form onSubmit={handleSendMessage} className="p-6 border-t bg-white rounded-b-2xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-5 py-3 rounded-full border border-pink-300 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            disabled={aiPending}
          />
          <Button type="submit" disabled={!message.trim() || aiPending}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );

  if (page === 'characterSelection') {
    return (
      <div className="p-3 sm:p-6 bg-white rounded-2xl shadow-lg">
        <div className="mb-2 flex flex-col md:items-center md:justify-between">

        <h2 className="text-3xl font-bold text-center text-pink-600 mb-2 font-sans tracking-tight">Choose Your Match</h2>
        <p className="text-lg text-center text-gray-500 mb-4 font-medium">Hi {userData?.name}, who do you want to chat with?</p>
        <span className="block text-xs text-center text-gray-400 mb-2">Next character in: <span className="font-mono text-base text-pink-600">{countdown}</span></span>
        </div>
        <div className="space-y-6">
          {[characters].flat().map((character) => {
            const currentLeaderboard = allLeaderboard?.find((entry) => entry.characterId === character._id);
            const percentageScore = currentLeaderboard && currentLeaderboard?.score > 50 ? 100 : currentLeaderboard?.score ? Math.abs((currentLeaderboard.score / 50) * 100) : 0;
            const avatarLetter = character.name ? character.name[0].toUpperCase() : '?';
            return(
              <div
                key={character._id}
                className="relative flex flex-col md:flex-row items-center gap-5 p-6 rounded-2xl shadow bg-white border border-pink-100 hover:shadow-lg transition cursor-pointer"
                onClick={() => setCharacterId(character._id)}
              >
                {/* Creation date pill */}
                <span className="absolute -top-3 left-0 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 shadow">{formatDateToShortMonth(character._creationTime)}</span>
                {/* Avatar */}
                <div className="flex gap-2 items-center justify-between w-full">
                <span className="w-14 h-14 flex items-center justify-center rounded-full bg-pink-500 text-white font-bold text-3xl mr-2 shadow">{avatarLetter}</span>
                {/* Info */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-bold text-lg text-gray-900">{character.name}</span>
                  <span className="inline-block rounded-full bg-pink-50 text-pink-600 px-4 py-1 text-xs font-semibold mb-1 mt-1">{character.personality}</span>
                  <div className="flex items-center h-2 w-full bg-gray-200 rounded-full my-2">
                    <div
                      className={`h-2 rounded-full ${currentLeaderboard && currentLeaderboard?.score > 0 ? 'bg-pink-500' : 'bg-red-500'}`}
                      style={{ width: `${percentageScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{currentLeaderboard && (currentLeaderboard?.messageCount === 1 ? `1 message` : currentLeaderboard?.messageCount > 0 ? `${currentLeaderboard?.messageCount} messages` : 'No messages')}</span>
                </div>
                </div>
                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-2 min-w-max">
                  <Button variant="outline" onClick={e => { e.stopPropagation(); handleSeeLeaderboard(character._id); }}>Leaderboard</Button>
                  <Button onClick={e => { e.stopPropagation(); handleStartChat(character._id); }}>{currentLeaderboard ? "Continue Chat" : "Start Chat"}</Button>
                </div>
              </div>
            )})}
        </div>
      </div>
    );
  }

  
}
