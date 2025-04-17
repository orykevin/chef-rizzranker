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
    <button className="px-4 py-2 rounded-lg transition-colors bg-blue-500 text-white" onClick={() => void signOut()}>
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
      className={`fixed top-0 right-0 h-full w-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:hidden`}
    >
      <button
        className="absolute top-4 right-4 text-xl"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        ×
      </button>
      <nav className="mt-16 flex flex-col gap-4 px-6">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className="text-lg text-left py-2 px-2 rounded hover:bg-gray-100"
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
