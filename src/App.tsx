import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Sidebar } from "./SignOutButton";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { GameChat } from "./GameChat";
import { GlobalLeaderboard, Leaderboard } from "./Leaderboard";
import { api } from "../convex/_generated/api";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "./components/ui/button";
import { ToastProvider } from "./components/ui/toast";

type StateContextType = {
  characterId: Id<'characters'> | null;
  setCharacterId: (id: Id<'characters'> | null) => void;
}

type PageContextType = {
  page: 'leaderboard' | 'globalLeaderboard' | 'gameChat' | 'characterSelection';
  setPage: (page: 'leaderboard' | 'globalLeaderboard' | 'gameChat' | 'characterSelection') => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const usePage = () => {
  const context = useContext(PageContext);
  if (!context) throw new Error('usePage must be used within a PageProvider');
  return context;
};

export const PageProvider = ({ children }: { children: ReactNode }) => {
  const [page, setPage] = useState<PageContextType['page']>('characterSelection');

  return (
    <PageContext.Provider value={{ page, setPage }}>
      {children}
    </PageContext.Provider>
  );
};

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [name, setName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const userData = useQuery(api.auth.loggedInUser);
  const updateProfile = useMutation(api.auth.updateProfile);

  if (isLoading) {
    return <div className="w-screen h-screen flex items-center justify-center">Loading...</div>;
  }

  if (userData === undefined) {
    return <div className="w-screen h-screen flex items-center justify-center">Loading User Data...</div>;
  }

  if (!isAuthenticated) {
    return <SignInForm />;
  }

  if (!userData?.name) {
    return <div className="container max-w-2xl mx-auto p-4 mt-12">
      <h1 className="text-2xl font-bold my-6">Please complete your profile</h1>
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
    <PageProvider>
      <ToastProvider>
      <StateProvider>
        <GameUi sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </StateProvider>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={[
          { label: "Game Chat", onClick: () => { setSidebarOpen(false); window.dispatchEvent(new CustomEvent('sidebar-nav', { detail: 'characterSelection' })); } },
          { label: "Global Leaderboard", onClick: () => { setSidebarOpen(false); window.dispatchEvent(new CustomEvent('sidebar-nav', { detail: 'globalLeaderboard' })); } },
          { label: "Sign Out", onClick: () => { setSidebarOpen(false); window.dispatchEvent(new CustomEvent('sidebar-nav', { detail: 'signOut' })); } },
        ]}
      />
      </ToastProvider>
    </PageProvider>
  );
}

export const GameUi = ({ setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) => {
  const { page, setPage } = usePage();
  // Listen for sidebar menu navigation
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === 'signOut') {
        // You can trigger sign out logic here if needed
        // For now, do nothing (SignOutButton is still visible in desktop)
      } else {
        setPage(e.detail);
      }
    };
    window.addEventListener('sidebar-nav', handler as any);
    return () => window.removeEventListener('sidebar-nav', handler as any);
  }, [setPage]);

  return (
    <div className="container mx-auto p-1 md:p-4">
      <div className="flex justify-between items-center mb-4 mx-1">
        <h1 className="text-2xl font-bold">Rizz Ranker</h1>
        <div className="gap-2 hidden md:flex">
          <Button variant="outline" onClick={() => setPage('characterSelection')}>Game Chat</Button>
          <Button variant="outline" onClick={() => setPage('globalLeaderboard')}>Global Leaderboard</Button>
          <SignOutButton />
        </div>
        <button
        className="md:hidden text-3xl p-2 focus:outline-none"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        &#9776;
      </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {(page === 'gameChat' || page === 'characterSelection') && <GameChat />}
        {page === 'leaderboard' && <Leaderboard />}
        {page === 'globalLeaderboard' && <GlobalLeaderboard />}
      </div>
    </div>
  );
}
