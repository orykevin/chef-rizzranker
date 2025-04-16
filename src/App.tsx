import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { GameChat } from "./GameChat";
import { Leaderboard } from "./Leaderboard";
import { api } from "../convex/_generated/api";
import { createContext, ReactNode, useContext, useState } from "react";
import { Id } from "../convex/_generated/dataModel";

type StateContextType = {
  characterId: Id<'characters'> | null;
  setCharacterId: (id: Id<'characters'> | null) => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const useGlobalState = () => {
  const context = useContext(StateContext);
  if (!context) throw new Error('useState must be used within a StateProvider');
  return context;
};

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const [characterId, setCharacterId] = useState<Id<'characters'> | null>(null);

  return (
    <StateContext.Provider value={{ characterId, setCharacterId }}>
      {children}
    </StateContext.Provider>
  );
};

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [name, setName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const userData = useQuery(api.auth.loggedInUser);
  const updateProfile = useMutation(api.auth.updateProfile);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (userData === undefined) {
    return <div>Loading User Data...</div>;
  }

  if (!isAuthenticated) {
    return <SignInForm />;
  }

  if (!userData?.name) {
    return <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Please complete your profile</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={ async (e) => {
          e.preventDefault();
          if (isUpdating) return;
          setIsUpdating(true);
          const formData = new FormData(e.target as HTMLFormElement);
          updateProfile({ name: formData.get("name") as string }).then((res) => {
            if(res) setIsUpdating(false);
          });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" type="text" name="name" placeholder="Name" required />
        <button className="auth-button" type="submit" disabled={isUpdating}>
          Update Profile
        </button>
      </form>
    </div>;
  }

  return (
    <StateProvider>
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
    </StateProvider>
  );
}
