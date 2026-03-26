"use client";

import Magnetic from "@/components/ui/Magnetic";
import EncryptedText from "@/components/ui/EncryptedText";

const links = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-10 py-6 mix-blend-difference">
      <Magnetic>
        <a
          href="#"
          className="font-[var(--font-cormorant)] text-2xl font-light text-white tracking-wider"
        >
          H
        </a>
      </Magnetic>
      <div className="flex gap-9">
        {links.map((link) => (
          <Magnetic key={link.href} strength={0.2}>
            <a
              href={link.href}
              className="text-xs font-normal uppercase tracking-[0.12em] text-[#5a584f] relative transition-colors duration-300 hover:text-[#eae8e3] group"
            >
              <EncryptedText text={link.label} speed={30} />
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#c9a84c] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
            </a>
          </Magnetic>
        ))}
      </div>
    </nav>
  );
}
