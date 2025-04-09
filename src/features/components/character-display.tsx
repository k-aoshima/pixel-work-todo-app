"use client";

import { Badge } from "@/features/ui/badge";
import CatCharacter from "@/features/cat-character";
import DogCharacter from "@/features/dog-character";
import type { CharacterMood, CharacterType } from "@/shared/types";

interface CharacterDisplayProps {
  character: CharacterType;
  characterMood: CharacterMood;
  characterPersonality: string;
  characterAttitude: string;
  getAttitudeText: () => string;
  sidebarOpen: boolean;
}

export function CharacterDisplay({
  character,
  characterMood,
  characterPersonality,
  getAttitudeText,
  sidebarOpen,
}: CharacterDisplayProps) {
  return (
    <div className="fixed inset-0 w-full h-full z-0 bg-background flex items-center justify-center pointer-events-none">
      <div
        className={`flex flex-col items-center transition-all duration-300 pointer-events-auto ${
          sidebarOpen ? "md:translate-x-[36px]" : "md:translate-x-[6px]"
        }`}
      >
        <div className="character-container w-32 h-32 md:w-40 md:h-40 relative z-10">
          {character === "cat" ? (
            <CatCharacter mood={characterMood} />
          ) : (
            <DogCharacter mood={characterMood} />
          )}
        </div>

        <div className="text-center mt-4 bg-background/40 backdrop-blur-sm p-2 rounded-lg">
          <h2 className="text-xl font-bold text-primary mb-2">
            {character === "cat" ? "PixelCat" : "PixelDog"}
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant="outline"
              className="text-xs font-normal bg-secondary/80 text-foreground"
            >
              {characterPersonality === "energetic"
                ? "元気"
                : characterPersonality === "calm"
                ? "穏やか"
                : "フレンドリー"}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-normal bg-secondary/80 text-foreground"
            >
              {getAttitudeText()}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-normal bg-secondary/80 text-foreground"
            >
              {characterMood === "happy"
                ? "嬉しい"
                : characterMood === "sad"
                ? "悲しい"
                : characterMood === "angry"
                ? "怒り"
                : "普通"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
