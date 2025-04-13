"use client";

import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from "react";
import { Code, Plus, Calendar, Terminal, CheckSquare } from "lucide-react";
import { AppHeader } from "@/features/components/app-header";
import { AdminPanel } from "@/features/components/admin-panel";
import { ChatPanel } from "@/features/components/chat-panel";
import { CharacterDisplay } from "@/features/components/character-display";
import { useAuth } from "@/shared/hooks/use-auth";
import { useCharacter } from "@/shared/hooks/use-character";
import { useScheduleAssist } from "@/shared/hooks/use-schedule-assist";
import {
  analyzeMessage,
  updateCharacterAttitude,
  generateCharacterResponse,
} from "@/shared/lib/ai-utils";
import type {
  Task,
  Schedule,
  Message,
} from "@/shared/types";

export default function Home() {
  const {
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
  } = useCharacter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "こんにちは！PixelWorkへようこそ！タスクやスケジュールの管理をお手伝いします。",
      sender: "character",
      timestamp: new Date(),
    },
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [setupAnswers, setSetupAnswers] = useState<string[]>([]);
  const { isLoggedIn, username, handleLogout } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [showCommandList, setShowCommandList] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // コマンドリスト
  const commands = [
    {
      id: "task",
      label: "#task - タスクを追加",
      icon: <Plus className="h-3 w-3" />,
    },
    {
      id: "schedule",
      label: "#schedule - スケジュールを追加",
      icon: <Calendar className="h-3 w-3" />,
    },
    {
      id: "done",
      label: "#done - タスクを完了",
      icon: <CheckSquare className="h-3 w-3" />,
    },
    {
      id: "status",
      label: "#status - 状況確認",
      icon: <Terminal className="h-3 w-3" />,
    },
    {
      id: "mood",
      label: "#mood - 気分を共有",
      icon: <Terminal className="h-3 w-3" />,
    },
  ];

  // メッセージ分析履歴
  const [messageAnalysisHistory, setMessageAnalysisHistory] = useState<
    Array<{
      intent: string;
      sentiment: string;
      intensity: number;
    }>
  >([]);

  // 初期設定の質問
  const setupQuestions = useMemo(() => [
    "朝は得意？それとも夜が好き？",
    "どんなタイプの仕事が好き？",
    "最近、楽しいと感じたのはどんな時？",
    "猫と犬、どちらが好き？",
  ], []);

  // 初期設定の回答を処理
  const handleSetupAnswer = (answer: string) => {
    const newAnswers = [...setupAnswers, answer];
    setSetupAnswers(newAnswers);

    // 次の質問へ、または設定完了
    if (setupStep < setupQuestions.length - 1) {
      setSetupStep(setupStep + 1);

      // キャラクターからの返答を追加
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: answer,
          sender: "user",
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          content: setupQuestions[setupStep + 1],
          sender: "character",
          timestamp: new Date(),
        },
      ]);
    } else {
      // 最後の質問（猫と犬の選択）で性格とキャラクターを決定
      const newCharacter = answer.includes("猫") ? "cat" : "dog";
      setCharacter(newCharacter);

      // 他の回答から性格を決定（簡易版）
      let personality = "friendly";
      if (newAnswers[0].includes("朝")) personality = "energetic";
      else if (newAnswers[0].includes("夜")) personality = "calm";

      setCharacterPersonality(personality);
      setCharacterAttitude("friendly"); // 初期態度を設定
      setSetupComplete(true);

      // 設定完了メッセージ
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: answer,
          sender: "user",
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          content: `設定完了！${
            newCharacter === "cat" ? "猫" : "犬"
          }のキャラクターで、${
            personality === "energetic"
              ? "元気"
              : personality === "calm"
              ? "落ち着いた"
              : "フレンドリーな"
          }性格になりました。\n\nコマンドの使い方:\n#task タスク名 - タスクを追加\n#schedule 日付 時間 予定名 - スケジュールを追加\n#done タスク名 - タスクを完了\n#status - 今日のタスクと予定を表示\n#mood 気分 - 気分を共有`,
          sender: "character",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // #が入力されたらコマンドリストを表示
    if (value === "#") {
      setShowCommandList(true);
      setSelectedCommandIndex(0);
    } else if (showCommandList && !value.startsWith("#")) {
      setShowCommandList(false);
    }

    // #scheduleが入力されたらスケジュールアシストを表示する準備
    if (value.includes("#schedule") && !showScheduleAssist) {
      setShowScheduleAssist(true);
    } else if (!value.startsWith("#schedule")) {
      setShowScheduleAssist(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showCommandList) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedCommandIndex((prev) => (prev + 1) % commands.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedCommandIndex(
            (prev) => (prev - 1 + commands.length) % commands.length
          );
          break;
        case "Enter":
          e.preventDefault();
          insertCommand("#" + commands[selectedCommandIndex].id);
          break;
        case "Escape":
          setShowCommandList(false);
          break;
      }
    }
  };

  const insertCommand = (command: string) => {
    setMessage(command + " ");
    setShowCommandList(false);
    inputRef.current?.focus();
  };

  // メッセージ送信処理
  const sendMessage = (customMessage?: string) => {
    const messageToSend = customMessage || message;

    if (!messageToSend.trim()) return;

    // 初期設定中は回答として処理
    if (!setupComplete) {
      handleSetupAnswer(messageToSend);
      setMessage("");
      return;
    }

    // 通常のメッセージ処理
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // コマンド処理
    if (messageToSend.startsWith("#")) {
      processCommand(messageToSend);
    } else {
      // 通常のメッセージ - AIで分析して返答
      setTimeout(() => {
        // メッセージを分析
        const analysis = analyzeMessage(messageToSend);

        // 分析履歴を更新
        const newAnalysis = {
          intent: analysis.intent,
          sentiment: analysis.sentiment,
          intensity: analysis.intensity,
        };

        const updatedHistory = [...messageAnalysisHistory, newAnalysis];
        setMessageAnalysisHistory(updatedHistory);

        // キャラクターの態度を更新
        const newAttitude = updateCharacterAttitude(
          characterAttitude,
          updatedHistory,
          character
        );
        if (newAttitude !== characterAttitude) {
          setCharacterAttitude(newAttitude);
          console.log(
            `キャラクターの態度が変化: ${characterAttitude} → ${newAttitude}`
          );
        }

        // キャラクターの気分を更新
        if (analysis.sentiment === "positive" && analysis.intensity >= 7) {
          setCharacterMood("happy");
        } else if (
          analysis.sentiment === "negative" &&
          analysis.intensity >= 7
        ) {
          setCharacterMood("sad");
        } else if (
          analysis.intent === "criticism" ||
          (analysis.sentiment === "negative" && analysis.intensity >= 9)
        ) {
          setCharacterMood("angry");
        }

        // キャラクターの応答を生成
        const response = generateCharacterResponse(
          newAnalysis,
          character,
          newAttitude,
          characterMood
        );

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: response,
            sender: "character",
            timestamp: new Date(),
          },
        ]);
      }, 500);
    }

    if (!customMessage) {
      setMessage("");
    }
  };

  // コマンド処理
  const processCommand = (cmd: string) => {
    const parts = cmd.split(" ");
    const command = parts[0].toLowerCase();

    switch (command) {
      case "#task":
        if (parts.length > 1) {
          const taskName = parts.slice(1).join(" ");
          addTask(taskName);
          respondToCommand(
            `タスク「${taskName}」を追加しました！頑張ってください！`
          );
        }
        break;

      case "#schedule":
        if (parts.length > 3) {
          const date = parts[1];
          const time = parts[2];
          const title = parts.slice(3).join(" ");
          addSchedule(date, time, title);
          respondToCommand(
            `${date} ${time}に「${title}」の予定を追加しました！忘れないようにお知らせしますね！`
          );
        }
        break;

      case "#done":
        if (parts.length > 1) {
          const taskName = parts.slice(1).join(" ");
          completeTask(taskName);
          respondToCommand(`タスク「${taskName}」を完了しました！素晴らしい！`);
        }
        break;

      case "#status":
        const todayTasks = tasks
          .filter((t) => !t.completed)
          .map((t) => t.title)
          .join("\n- ");
        const todaySchedules = schedules
          .filter(
            (s) => new Date(s.date).toDateString() === new Date().toDateString()
          )
          .map((s) => `${s.time} ${s.title}`)
          .join("\n- ");

        respondToCommand(
          `【今日のタスク】\n${
            todayTasks ? "- " + todayTasks : "なし"
          }\n\n【今日の予定】\n${
            todaySchedules ? "- " + todaySchedules : "なし"
          }`
        );
        break;

      case "#mood":
        if (parts.length > 1) {
          const mood = parts.slice(1).join(" ");
          updateMood(mood);
          respondToCommand(`気分は「${mood}」なんですね。理解しました！`);
        }
        break;

      default:
        respondToCommand("すみません、そのコマンドは理解できませんでした。");
    }
  };

  // タスク追加
  const addTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  // タスク完了
  const completeTask = (title: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.title.toLowerCase() === title.toLowerCase()
          ? { ...task, completed: true }
          : task
      )
    );
  };

  // コマンドへの応答
  const respondToCommand = (response: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: getStyledResponse(response),
        sender: "character",
        timestamp: new Date(),
      },
    ]);
  };

  // スケジュール機能の初期化
  const {
    showScheduleAssist,
    setShowScheduleAssist,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    scheduleTitle,
    setScheduleTitle,
    timeOptions,
    confirmSchedule,
    addSchedule: createSchedule,
  } = useScheduleAssist({ sendMessage });

  // スケジュール追加のラッパー関数
  const addSchedule = (date: string, time: string, title: string) => {
    const newSchedule = createSchedule(date, time, title);
    setSchedules((prev) => [...prev, newSchedule]);
  };

  // 自動スクロール用のuseEffect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 初期メッセージ用のuseEffect
  useEffect(() => {
    if (!setupComplete && setupStep === 0 && messages.length === 1) {
      setMessages((prev) => [
        ...prev,
        {
          id: "2",
          content: setupQuestions[0],
          sender: "character",
          timestamp: new Date(),
        },
      ]);
    }
  }, [setupComplete, setupStep, messages.length, setupQuestions]);

  // ログインしていない場合はローディング表示
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">
            <Code className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">PixelWork</h1>
          </div>
          <p className="text-muted-foreground mt-4">認証情報を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background relative">
      <CharacterDisplay
        character={character}
        characterMood={characterMood}
        characterPersonality={characterPersonality}
        characterAttitude={characterAttitude}
        getAttitudeText={getAttitudeText}
        sidebarOpen={sidebarOpen}
      />

      <AppHeader
        username={username}
        character={character}
        setCharacter={setCharacter}
        handleLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <AdminPanel
          tasks={tasks}
          schedules={schedules}
          completeTask={completeTask}
          insertCommand={insertCommand}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <ChatPanel
          messages={messages}
          messagesEndRef={messagesEndRef}
          message={message}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
          sendMessage={sendMessage}
          showCommandList={showCommandList}
          commands={commands}
          selectedCommandIndex={selectedCommandIndex}
          insertCommand={insertCommand}
          inputRef={inputRef}
          setupComplete={setupComplete}
          showScheduleAssist={showScheduleAssist}
          scheduleDate={scheduleDate}
          scheduleTime={scheduleTime}
          scheduleTitle={scheduleTitle}
          setScheduleDate={setScheduleDate}
          setScheduleTime={setScheduleTime}
          setScheduleTitle={setScheduleTitle}
          setShowScheduleAssist={setShowScheduleAssist}
          confirmSchedule={confirmSchedule}
          timeOptions={timeOptions}
        />
      </div>
    </div>
  );
}
