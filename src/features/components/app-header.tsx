"use client";

import { Button } from "@/features/ui/button";
import { Cat, Dog, Code, LogOut } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { CharacterType } from "@/shared/types";

interface AppHeaderProps {
  username: string;
  character: CharacterType;
  setCharacter: (character: CharacterType) => void;
  handleLogout: () => void;
}

export function AppHeader({
  username,
  character,
  setCharacter,
  handleLogout,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-secondary relative z-20 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Code className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          PixelWork
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground mr-2">
          <span className="text-primary">@{username}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCharacter("cat")}
          className={cn(character === "cat" && "bg-secondary text-primary")}
        >
          <Cat className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCharacter("dog")}
          className={cn(character === "dog" && "bg-secondary text-primary")}
        >
          <Dog className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
