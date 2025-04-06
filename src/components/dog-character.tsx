"use client";

import type React from "react";
import { useEffect, useState } from "react";
import type { CharacterMood } from "@/../types";

interface DogCharacterProps {
  mood: CharacterMood;
}

const DogCharacter: React.FC<DogCharacterProps> = ({ mood }) => {
  const [blinkState, setBlinkState] = useState(false);
  const [wiggleState, setWiggleState] = useState(0);
  const [tailWag, setTailWag] = useState(0);

  // まばたきアニメーション
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 200);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // 小さな揺れアニメーション
  useEffect(() => {
    const wiggleInterval = setInterval(() => {
      setWiggleState((prev) => (prev + 1) % 3);
    }, 500);

    return () => clearInterval(wiggleInterval);
  }, []);

  // しっぽを振るアニメーション
  useEffect(() => {
    const tailInterval = setInterval(() => {
      setTailWag((prev) => (prev + 1) % 4);
    }, 250);

    return () => clearInterval(tailInterval);
  }, []);

  // 犬のピクセルアート定義
  // 0: 透明, 1: 輪郭(黒), 2: メイン色(茶色), 3: 内耳/舌(ピンク), 4: 目(白), 5: 目の色, 6: 鼻(黒)
  const dogPixels = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 4, 5, 4, 5, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 6, 6, 6, 6, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 2, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 2, 1, 0],
    [0, 0, 1, 2, 2, 1, 0, 1, 1, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  // 気分に応じた目の表現
  const getEyePixels = () => {
    // まばたき中
    if (blinkState) {
      return [
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
        [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
      ];
    }

    // 通常の目（気分による変化）
    switch (mood) {
      case "happy":
        return [
          [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
          [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
          [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
          [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 1, 4, 1, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 0],
        ];
      case "sad":
        return [
          [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
          [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
          [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
          [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 1, 4, 1, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
        ];
      case "angry":
        return [
          [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
          [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0],
          [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
          [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 1, 4, 1, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
        ];
      default: // neutral
        return [
          [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
          [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
          [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
          [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 1, 4, 1, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 2, 1, 0],
        ];
    }
  };

  // 気分に応じた口の表現
  const getMouthPixels = () => {
    switch (mood) {
      case "happy":
        return [
          [0, 1, 2, 2, 2, 2, 6, 6, 6, 6, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 2, 6, 6, 2, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 1, 0],
        ];
      case "sad":
        return [
          [0, 1, 2, 2, 2, 2, 6, 6, 6, 6, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 1, 0],
        ];
      case "angry":
        return [
          [0, 1, 2, 2, 2, 2, 6, 6, 6, 6, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 6, 2, 2, 6, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 2, 6, 6, 2, 2, 2, 2, 2, 1, 0],
        ];
      default: // neutral
        return [
          [0, 1, 2, 2, 2, 2, 6, 6, 6, 6, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0],
          [0, 1, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 1, 0],
        ];
    }
  };

  // しっぽの表現（アニメーション）
  const getTailPixels = () => {
    const tailPositions = [
      [
        [14, 13, 1],
        [15, 12, 1],
      ],
      [
        [14, 13, 1],
        [15, 13, 1],
      ],
      [
        [14, 13, 1],
        [15, 14, 1],
      ],
      [
        [14, 13, 1],
        [15, 13, 1],
      ],
    ];

    return tailPositions[tailWag].map(([x, y, value]) => ({ x, y, value }));
  };

  // 色の定義
  const colorMap: Record<number, string> = {
    0: "transparent",
    1: "#000000", // 黒（輪郭）
    2: "#FFFFFF", // 白（メイン）
    3: "#CCCCCC", // 薄いグレー（舌）
    4: "#FFFFFF", // 白（目の白い部分）
    5: "#000000", // 黒（瞳）
    6: "#333333", // 暗いグレー（鼻）
  };

  // 揺れの効果
  const wiggleOffset = [-1, 0, 1][wiggleState];

  // ピクセルを描画
  const renderPixels = () => {
    const eyePixels = getEyePixels();
    const mouthPixels = getMouthPixels();
    const tailPixels = getTailPixels();

    // 基本的な犬の形を描画
    const pixels = [];
    for (let y = 0; y < dogPixels.length; y++) {
      for (let x = 0; x < dogPixels[y].length; x++) {
        // 目の部分は特別な処理
        let pixelValue = dogPixels[y][x];

        // 目の部分を置き換え
        if (y < eyePixels.length && eyePixels[y][x] !== 0) {
          pixelValue = eyePixels[y][x];
        }

        // 口の部分を置き換え
        if (y >= 8 && y < 11 && mouthPixels[y - 8][x] !== 0) {
          pixelValue = mouthPixels[y - 8][x];
        }

        if (pixelValue !== 0) {
          pixels.push(
            <rect
              key={`${x}-${y}`}
              x={x + (y % 2 === 0 ? wiggleOffset : 0)}
              y={y}
              width="1"
              height="1"
              fill={colorMap[pixelValue]}
            />
          );
        }
      }
    }

    // しっぽを追加
    tailPixels.forEach(({ x, y, value }) => {
      pixels.push(
        <rect
          key={`tail-${x}-${y}`}
          x={x}
          y={y}
          width="1"
          height="1"
          fill={colorMap[value]}
        />
      );
    });

    return pixels;
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 16 16"
        className="w-full h-full"
        style={{
          imageRendering: "pixelated",
          animation: "breathe 3s infinite ease-in-out",
        }}
      >
        {renderPixels()}
      </svg>

      <style jsx global>{`
        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default DogCharacter;
