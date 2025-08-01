"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "./dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { getPlatformSpecialKey } from "@/lib/utils";
import { Keyboard } from "lucide-react";
import {
  useKeyboardShortcutsHelp,
  KeyboardShortcut,
} from "@/hooks/use-keyboard-shortcuts-help";
import { useKeybindingsStore } from "@/stores/keybindings-store";
import { toast } from "sonner";

const modifier: {
  [key: string]: string;
} = {
  Shift: "Shift",
  Alt: "Alt",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Space: "Space",
};

function getKeyWithModifier(key: string) {
  if (key === "Ctrl") return getPlatformSpecialKey();
  return modifier[key] || key;
}

const ShortcutItem = ({
  shortcut,
  recordingKey,
  onStartRecording,
}: {
  shortcut: KeyboardShortcut;
  recordingKey: string | null;
  onStartRecording: (keyId: string, shortcut: KeyboardShortcut) => void;
}) => {
  // Filter out duplicate keys (e.g., if both Cmd and Ctrl versions exist, prefer Cmd on Mac)
  const displayKeys = shortcut.keys.filter((key: string) => {
    if (
      key.includes("Ctrl") &&
      shortcut.keys.includes(key.replace("Ctrl", "Cmd"))
    )
      return false;

    return true;
  });

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors">
      <div className="flex items-center gap-3 flex-1 pl-8">
        {shortcut.icon && (
          <div className="text-muted-foreground">{shortcut.icon}</div>
        )}
        <span className="text-sm text-slate-500" style={{ paddingLeft: '24px' }}>{shortcut.description}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-4" style={{ paddingRight: '16px' }}>
        {displayKeys.map((key: string, index: number) => (
          <div key={index} className="flex items-center gap-1">
            <div className="flex items-center gap-4">
              {key.split("+").map((keyPart: string, partIndex: number) => {
                const keyId = `${shortcut.id}-${index}-${partIndex}`;
                return (
                  <EditableShortcutKey
                    key={partIndex}
                    keyId={keyId}
                    originalKey={key}
                    shortcut={shortcut}
                    isRecording={recordingKey === keyId}
                    onStartRecording={() => onStartRecording(keyId, shortcut)}
                  >
                    {keyPart}
                  </EditableShortcutKey>
                );
              })}
            </div>
            {index < displayKeys.length - 1 && (
              <span className="text-xs text-muted-foreground px-1">or</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const EditableShortcutKey = ({
  children,
  keyId,
  originalKey,
  shortcut,
  isRecording,
  onStartRecording,
}: {
  children: React.ReactNode;
  keyId: string;
  originalKey: string;
  shortcut: KeyboardShortcut;
  isRecording: boolean;
  onStartRecording: () => void;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartRecording();
  };

  return (
    <Button
      variant={isRecording ? "secondary" : "outline"}
      size="sm"
      className={`font-mono text-xs min-w-[2rem] min-h-[1.75rem] mr-3 transition-all hover:scale-105 !rounded-lg ${
        isRecording
          ? "border-blue-400 bg-blue-500/20 text-blue-300"
          : "border-slate-500 bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
      style={{ borderRadius: '8px' }}
      onClick={handleClick}
      title={
        isRecording ? "Press any key combination..." : "Click to edit shortcut"
      }
    >
      {children}
    </Button>
  );
};

export const KeyboardShortcutsHelp = () => {
  const [open, setOpen] = useState(false);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [recordingShortcut, setRecordingShortcut] =
    useState<KeyboardShortcut | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const closeButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.className.includes('absolute') && btn.className.includes('right-4')
        );
        
        if (closeButtons.length > 0) {
          const closeBtn = closeButtons[0] as HTMLElement;
          console.log('🔧 Forcing close button styles...');
          
          // Style the close button properly
          closeBtn.style.setProperty('background', 'transparent', 'important');
          closeBtn.style.setProperty('background-color', 'transparent', 'important');
          closeBtn.style.setProperty('background-image', 'none', 'important');
          closeBtn.style.setProperty('color', 'white', 'important');
          closeBtn.style.setProperty('position', 'absolute', 'important');
          closeBtn.style.setProperty('right', '16px', 'important');
          closeBtn.style.setProperty('top', '16px', 'important');
          closeBtn.style.setProperty('z-index', '999', 'important');
          closeBtn.style.setProperty('display', 'block', 'important');
          closeBtn.style.setProperty('visibility', 'visible', 'important');
          closeBtn.style.setProperty('border', 'none', 'important');
          closeBtn.style.setProperty('box-shadow', 'none', 'important');
          
          // Remove hover effects
          closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.setProperty('background', 'transparent', 'important');
            closeBtn.style.setProperty('background-color', 'transparent', 'important');
          });
          closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.setProperty('background', 'transparent', 'important');
            closeBtn.style.setProperty('background-color', 'transparent', 'important');
          });
        }
      }, 500);
    }
  }, [open]);

  const {
    updateKeybinding,
    removeKeybinding,
    getKeybindingString,
    validateKeybinding,
    getKeybindingsForAction,
  } = useKeybindingsStore();

  // Get shortcuts from centralized hook
  const { shortcuts } = useKeyboardShortcutsHelp();

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  useEffect(() => {
    if (!recordingKey || !recordingShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keyString = getKeybindingString(e);
      if (keyString) {
        // Auto-save the new keybinding
        const conflict = validateKeybinding(
          keyString,
          recordingShortcut.action
        );
        if (conflict) {
          toast.error(
            `Key "${keyString}" is already bound to "${conflict.existingAction}"`
          );
          setRecordingKey(null);
          setRecordingShortcut(null);
          return;
        }

        // Remove old keybindings for this action
        const oldKeys = getKeybindingsForAction(recordingShortcut.action);
        oldKeys.forEach((key) => removeKeybinding(key));

        // Add new keybinding
        updateKeybinding(keyString, recordingShortcut.action);

        setRecordingKey(null);
        setRecordingShortcut(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      setRecordingKey(null);
      setRecordingShortcut(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    recordingKey,
    recordingShortcut,
    getKeybindingString,
    updateKeybinding,
    removeKeybinding,
    validateKeybinding,
    getKeybindingsForAction,
  ]);

  const handleStartRecording = (keyId: string, shortcut: KeyboardShortcut) => {
    setRecordingKey(keyId);
    setRecordingShortcut(shortcut);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="text" 
          size="sm" 
          className="gap-2 transition-all duration-200 !bg-transparent hover:!bg-transparent !border-transparent text-white hover:text-white"
        >
          <Keyboard className="w-4 h-4 text-white" />
          <span className="hidden sm:inline text-xs ml-2 text-white">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="w-[40vw] max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl !rounded-2xl"
        style={{ 
          backgroundColor: '#334155',
          border: 'none',
          borderRadius: '16px'
        }}
      >
        <DialogHeader className="rounded-t-2xl -m-6 p-6 mb-6" style={{ backgroundColor: '#475569' }}>
          <DialogTitle className="flex items-center justify-center text-lg text-white font-semibold">
            <Keyboard className="w-5 h-5" />
            <span style={{ marginLeft: '12px' }}>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-300 text-center">
            Speed up your workflow with these keyboard shortcuts.<br />Click any key to edit.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh] bg-slate-700" style={{ backgroundColor: '#334155' }}>
          <div className="space-y-6">
              {categories.map((category) => (
                <div key={category} className="flex flex-col gap-1">
                  <h3 className="text-xs uppercase tracking-wide font-semibold text-slate-400 mb-3" style={{ paddingLeft: '16px' }}>
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter((shortcut) => shortcut.category === category)
                      .map((shortcut, index) => (
                        <ShortcutItem
                          key={index}
                          shortcut={shortcut}
                          recordingKey={recordingKey}
                          onStartRecording={handleStartRecording}
                        />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};