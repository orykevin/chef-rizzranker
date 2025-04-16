import { useConvexAuth } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { GameChat } from "./GameChat";
import { Leaderboard } from "./Leaderboard";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <SignInForm />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Rizz Ranker</h1>
        <SignOutButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GameChat />
        <Leaderboard />
      </div>
    </div>
  );
}
