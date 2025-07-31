"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { HeaderBase } from "./header-base";
import { useSession } from "@/lib/auth-wrapper";
import { getStars } from "@/lib/fetch-github-stars";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useElectronLink } from "@/lib/electron-navigation";
import { UniversalLink } from "./universal-link";

export function Header() {
  const { data: session } = useSession();
  const [star, setStar] = useState<string>("");
  const { handleClick, isElectron } = useElectronLink();

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const data = await getStars();
        setStar(data);
      } catch (err) {
        console.error("Failed to fetch GitHub stars", err);
      }
    };

    fetchStars();
  }, []);


  const leftContent = (
    <UniversalLink 
      href="/" 
      className="flex items-center gap-3 no-underline"
      style={{ textDecoration: 'none' }}
    >
      <Image src="./logo.svg" alt="OpenCut Logo" width={32} height={32} style={{ marginLeft: '380px' }} />
      <span className="text-xl font-medium" style={{ color: 'white' }}>OpenCut</span>
    </UniversalLink>
  );

  const rightContent = (
    <nav className="flex items-center bg-black/30 backdrop-blur-md rounded-full px-4 py-2 border-2 border-white/20 shadow-lg" style={{ marginRight: '120px', transform: 'translateX(-30px)' }}>
      <UniversalLink 
        href="/blog"
        className="text-sm hover:text-gray-300 transition-colors no-underline"
        style={{ textDecoration: 'none', marginRight: '24px', color: 'white' }}
      >
        Blog
      </UniversalLink>
      <UniversalLink 
        href="/contributors"
        className="text-sm hover:text-gray-300 transition-colors no-underline"
        style={{ textDecoration: 'none', marginRight: '24px', color: 'white' }}
      >
        Contributors
      </UniversalLink>
      <UniversalLink 
        href="/projects"
      >
        <button
          style={{
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid rgb(209, 213, 219)',
            borderRadius: '12px',
            height: '30px',
            paddingLeft: '20px',
            paddingRight: '20px',
            fontSize: '16px',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: '0.2s',
            transform: 'translateY(0px)',
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = '#f3f4f6'
            target.style.transform = 'translateY(-2px)'
            target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = 'white'
            target.style.transform = 'translateY(0px)'
            target.style.boxShadow = 'rgba(0, 0, 0, 0.1) 0px 1px 3px'
          }}
        >
          Projects
          <ArrowRight className="ml-0.5 h-4 w-4" />
        </button>
      </UniversalLink>
    </nav>
  );

  return (
    <div className="mx-4 md:mx-0">
      <HeaderBase
        className="bg-accent rounded-2xl max-w-3xl mx-auto mt-4 pl-4 pr-[14px]"
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
}
