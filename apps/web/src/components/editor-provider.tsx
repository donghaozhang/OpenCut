"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";

interface EditorProviderProps {
  children: React.ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const { isInitializing, isPanelsReady, initializeApp } = useEditorStore();

  useEffect(() => {
    // Debug editor provider initialization (disabled by default)
    // console.log('🎬 EDITOR PROVIDER INIT:', {
    //   isInitializing,
    //   isPanelsReady,
    //   timestamp: Date.now()
    // });
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
  }, [isInitializing, isPanelsReady]);

  // Show loading screen while initializing
  if (isInitializing || !isPanelsReady) {
    // Debug loading screen display (disabled by default)
    // console.log('⏳ EDITOR PROVIDER LOADING SCREEN:', {
    //   isInitializing,
    //   isPanelsReady,
    //   reason: isInitializing ? 'initializing' : 'panels not ready',
    //   timestamp: Date.now()
    // });
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Debug provider ready state (disabled by default)
  // console.log('✅ EDITOR PROVIDER READY - RENDERING CHILDREN:', {
  //   isInitializing,
  //   isPanelsReady,
  //   timestamp: Date.now()
  // });

  // App is ready, render children
  return <>{children}</>;
}
