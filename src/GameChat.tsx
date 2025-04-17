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
  const characters = useQuery(api.characters.getActiveCharacter, {});
  const messages = useQuery(api.chat.getMessages, 
    characterId ? { characterId } : "skip"
  );
  const allLeaderboard = useQuery(api.leaderboard.getAllUserLeaderboards, {});

  const messageRef = useRef<HTMLDivElement>(null);

    // Countdown timer for next character
    const [countdown, setCountdown] = useState<string>("");
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
    return <div>Loading characters...</div>;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterId || !message.trim()) return;

    try {
      await sendMessage({
        characterId,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
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
    <div className="relative flex flex-col h-[600px] bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">{selectedCharacterData?.name || ' - '}</h2>
        <div className="flex gap-2">
        <Button onClick={() => setShowCharacterInfo(!showCharacterInfo)}>{showCharacterInfo ? 'Hide' : 'Details'}</Button>
        <Button variant="outline" onClick={() => {setCharacterId(null); setPage('characterSelection')}}>
          Change Character
        </Button>
        </div>
        
      </div>

      <div className="w-full overflow-hidden absolute top-[73px] transition-all duration-300 bg-white shadow-sm" style={{height: showCharacterInfo ? 'max-content' : '0', opacity: showCharacterInfo ? '1' : '0'}}>
        <div className="space-y-2 p-3">
          <p><b>Personality : </b>{selectedCharacterData?.personality || ' - '}</p>
          <p className="w-full text-wrap"><b>Background : </b>{selectedCharacterData?.background || ' - '}</p>
          <p><b>Interests : </b>{selectedCharacterData?.interests.join(', ') || ' - '}</p>
          <p><b>Likes : </b>{selectedCharacterData?.preferences.likes.join(', ') || ' - '}</p>
          <p><b>Dislikes : </b>{selectedCharacterData?.preferences.dislikes.join(', ') || ' - '}</p>
        </div>
      </div>


      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={messageRef}
      >
        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.isAiResponse
                ? "bg-gray-100 ml-0"
                : "bg-blue-500 text-white ml-auto"
            }`}
          >
            <p>{msg.content}</p>
            {msg.score && (
              <div className="text-xs mt-1 text-gray-500">
                Score: {msg.score.toFixed(1)}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
          />
          <Button type="submit" disabled={!message.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );

  if (page === 'characterSelection') {
    return (
      <div className="p-2 sm:p-4 bg-white rounded-lg shadow">
        <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between">

        <h2 className="text-xl mb-4"><b>Hi {userData?.name},</b><br/> who do you want to chat with?</h2>
          <span className="text-xs text-gray-500">Next character in: <span className="font-mono text-base text-blue-700">{countdown}</span></span>
        </div>
        <div className="space-y-4">
          {[characters].flat().map((character) => {
            const currentLeaderboard = allLeaderboard?.find((entry) => entry.characterId === character._id);
            const percentageScore = currentLeaderboard && currentLeaderboard?.score > 50 ? 100 : currentLeaderboard?.score ? Math.abs((currentLeaderboard.score / 50) * 100) : 0;
            return(
            <div
              key={character._id}
              className="relative p-4 block items-center justify-between border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setCharacterId(character._id)}
            >
              <span className="absolute -top-2 -right-0 p-2 bg-gray-200 rounded-md text-xs" >
                {formatDateToShortMonth(character._creationTime)}
              </span>
              <div className="mb-3 lg:mb-0">
                <h3 className="font-bold">{character.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{character.personality}</p>
              </div>
              <div className="flex gap-2 items-center justify-between flex-col md:flex-row">
              <div className="flex items-center h-2 w-full bg-gray-200 rounded-full md:max-w-[240px] lg:max-w-[480px]">
                <div
                  className={`h-2 rounded-full ${currentLeaderboard && currentLeaderboard?.score > 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                  style={{ width: `${percentageScore}%` }}
                />
              </div>
              <div className="flex items-center gap-3 justify-between md:justify-end w-full md:min-w-max">
                <p className="text-sm text-gray-600">{currentLeaderboard && (currentLeaderboard?.messageCount === 1 ? `1 message` : currentLeaderboard?.messageCount > 0 ? `${currentLeaderboard?.messageCount} messages` : null)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleSeeLeaderboard(character._id)}>Leaderboard</Button>
                  <Button onClick={() => handleStartChat(character._id)}>
                    Start Chat
                  </Button>
                </div>
              </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    );
  }

  
}
