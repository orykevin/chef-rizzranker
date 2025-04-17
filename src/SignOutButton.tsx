"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button className="rounded-full bg-pink-500 text-white font-bold px-8 py-3 shadow hover:bg-pink-600 active:bg-pink-700 transition" onClick={() => void signOut()}>
      Sign out
    </button>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: { label: string; onClick: () => void }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, menuItems }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-white rounded-l-3xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:hidden`}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 pb-1 rounded-full bg-pink-500 text-white flex items-center justify-center text-2xl shadow-lg hover:bg-pink-600 transition"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        ×
      </button>
      <nav className="mt-20 flex flex-col gap-6 px-8">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className="text-xl font-bold text-left py-4 px-4 rounded-full hover:bg-pink-50 hover:text-pink-600 transition"
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
