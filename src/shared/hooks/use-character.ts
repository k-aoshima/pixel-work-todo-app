import { useState } from "react";
import type { CharacterType, CharacterMood } from "@/shared/types";

export function useCharacter() {
  const [character, setCharacter] = useState<CharacterType>("cat");
  const [characterMood, setCharacterMood] = useState<CharacterMood>("happy");
  const [characterPersonality, setCharacterPersonality] = 
    useState<string>("friendly");
  const [characterAttitude, setCharacterAttitude] = 
    useState<string>("friendly");

  // キャラクターの気分を更新
  const updateMood = (mood: string) => {
    if (
      mood.includes("疲れ") ||
      mood.includes("つかれ") ||
      mood.includes("悲し") ||
      mood.includes("かなし")
    ) {
      setCharacterMood("sad");
    } else if (
      mood.includes("楽し") ||
      mood.includes("たのし") ||
      mood.includes("嬉し") ||
      mood.includes("うれし")
    ) {
      setCharacterMood("happy");
    } else if (
      mood.includes("怒") ||
      mood.includes("おこ") ||
      mood.includes("イライラ")
    ) {
      setCharacterMood("angry");
    } else {
      setCharacterMood("neutral");
    }
  };

  // キャラクターの応答スタイルを適用
  const getStyledResponse = (response: string) => {
    if (character === "cat") {
      if (characterAttitude === "tsundere") {
        return `${response} ...別にあなたのためじゃないんだからね`;
      } else if (characterAttitude === "aloof") {
        return `${response} ...`;
      } else if (characterAttitude === "helpful") {
        return `${response} 他に何かお手伝いできることはあるかにゃ？`;
      }
    } else {
      // dog
      if (characterAttitude === "sympathetic") {
        return `${response} 頑張ってるね！`;
      } else if (characterAttitude === "energetic") {
        return `${response} わんわん！`;
      } else if (characterAttitude === "helpful") {
        return `${response} 他にも手伝えることがあれば言ってね！`;
      }
    }
    return response;
  };

  // キャラクターの態度を表示するテキスト
  const getAttitudeText = () => {
    if (character === "cat") {
      switch (characterAttitude) {
        case "friendly":
          return "フレンドリー";
        case "tsundere":
          return "ツンデレ";
        case "aloof":
          return "クール";
        case "helpful":
          return "お世話好き";
        default:
          return "フレンドリー";
      }
    } else {
      switch (characterAttitude) {
        case "friendly":
          return "フレンドリー";
        case "sympathetic":
          return "共感的";
        case "energetic":
          return "元気";
        case "helpful":
          return "お世話好き";
        default:
          return "フレンドリー";
      }
    }
  };

  return {
    character,
    setCharacter,
    characterMood,
    setCharacterMood,
    characterPersonality,
    setCharacterPersonality,
    characterAttitude,
    setCharacterAttitude,
    updateMood,
    getStyledResponse,
    getAttitudeText,
  };
}
