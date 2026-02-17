"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/30 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/dashboard/whiteboard" className="text-base font-medium text-white/90 hover:text-white">
        Tableau
      </Link>

      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <UserCircleIcon className="h-5 w-5 text-white/70" />
          <span className="hidden sm:inline">Mon compte</span>
          <ChevronDownIcon className="h-4 w-4 text-white/60" />
        </MenuButton>
        <MenuItems
          transition
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-neutral-900/95 py-1 shadow-xl ring-1 ring-black/20 backdrop-blur-xl transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? "Compte"}</p>
            <p className="truncate text-xs text-white/50">{user?.email}</p>
          </div>
          <MenuItem>
            {({ focus }) => (
              <Link
                href="/dashboard/compte"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                  focus ? "bg-white/10 text-white" : "text-white/80"
                }`}
              >
                <Cog6ToothIcon className="h-4 w-4" />
                Mon compte & abonnement
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button
                onClick={() => signOut({ callbackUrl: "/accueil" })}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm ${
                  focus ? "bg-white/10 text-white" : "text-white/80"
                }`}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Déconnexion
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>
    </header>
  );
}
