import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./components/ui/button";
import { useConvexAuth } from "convex/react";
import { Id } from "../convex/_generated/dataModel";
import { useGlobalState } from "./App";

export function GameChat() {
  const { isAuthenticated } = useConvexAuth();
  const { characterId, setCharacterId } = useGlobalState();
  const [message, setMessage] = useState("");

  const characters = useQuery(api.characters.getActiveCharacter, {});
  const messages = useQuery(api.chat.getMessages, 
    characterId ? { characterId } : "skip"
  );
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

  if (!characterId) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Choose a Character</h2>
        <div className="space-y-4">
          {[characters].flat().map((character) => (
            <div
              key={character._id}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setCharacterId(character._id)}
            >
              <h3 className="font-bold">{character.name}</h3>
              <p className="text-sm text-gray-600">{character.personality}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Chat</h2>
        <Button variant="outline" onClick={() => setCharacterId(null)}>
          Change Character
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
}
