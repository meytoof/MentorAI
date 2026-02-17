"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import LoginModal from "./LoginModal";

const navigation = [
  { name: "Accueil", href: "/accueil", current: true },
  { name: "Comment ça marche", href: "/accueil#comment-ca-marche", current: false },
  { name: "Fonctionnalités", href: "/accueil#fonctionnalites", current: false },
  { name: "Tarifs", href: "/accueil#tarifs", current: false },
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function NavbarContent() {
  const [loginOpen, setLoginOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "1") setLoginOpen(true);
  }, [searchParams]);

  return (
    <>
      <Disclosure
        as="nav"
        className="relative bg-gray-800/50 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10"
      >
        <div className="px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500">
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="block size-6 group-data-open:hidden" aria-hidden />
                <XMarkIcon className="hidden size-6 group-data-open:block" aria-hidden />
              </DisclosureButton>
            </div>
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex shrink-0 items-center">
                <Image alt="Logo" width={32} height={32} src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" className="size-8" />
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                  {navigation.map((item) => (
                    <a key={item.name} href={item.href} aria-current={item.current ? "page" : undefined} className={classNames(item.current ? "bg-gray-950/50 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white", "rounded-md px-3 py-2 text-sm font-medium")}>
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <a href="/signup" className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors">
                Essai gratuit 1 jour
              </a>
              <button type="button" onClick={() => setLoginOpen(true)} className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                Connexion
              </button>
            </div>
          </div>
        </div>
        <DisclosurePanel className="sm:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navigation.map((item) => (
              <DisclosureButton key={item.name} as="a" href={item.href} aria-current={item.current ? "page" : undefined} className={classNames(item.current ? "bg-gray-950/50 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white", "block rounded-md px-3 py-2 text-base font-medium")}>
                {item.name}
              </DisclosureButton>
            ))}
            <div className="mt-2 flex gap-2 pt-2 border-t border-white/10">
              <a href="/signup" className="block flex-1 rounded-md bg-blue-500 px-4 py-2 text-center text-sm font-semibold text-white">Essai gratuit</a>
              <button type="button" onClick={() => setLoginOpen(true)} className="flex-1 rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-gray-300">
                Connexion
              </button>
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
