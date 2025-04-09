"use client";

import type React from "react";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/features/ui/button";
import { Input } from "@/features/ui/input";
import { Badge } from "@/features/ui/badge";
import { Checkbox } from "@/features/ui/checkbox";
import { ScrollArea } from "@/features/ui/scroll-area";
import {
  Cat,
  Dog,
  Clock,
  Send,
  Calendar,
  Plus,
  Code,
  Terminal,
  Hash,
  CheckSquare,
  FileCode,
  LogOut,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useToast } from "@/shared/hooks/use-toast";
import CatCharacter from "@/features/cat-character";
import DogCharacter from "@/features/dog-character";
import {
  analyzeMessage,
  updateCharacterAttitude,
  generateCharacterResponse,
} from "@/shared/lib/ai-utils";
import type {
  Task,
  Schedule,
  CharacterMood,
  CharacterType,
  Message,
} from "@/shared/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/popover";
import { Calendar as CalendarComponent } from "@/features/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/ui/collapsible";

export default function Home() {
  // 状態変数は変更なし
  const [character, setCharacter] = useState<CharacterType>("cat");
  const [characterMood, setCharacterMood] = useState<CharacterMood>("happy");
  const [characterPersonality, setCharacterPersonality] =
    useState<string>("friendly");
  const [characterAttitude, setCharacterAttitude] =
    useState<string>("friendly");
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [showCommandList, setShowCommandList] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // サイドパネルの表示状態
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // タスク、スケジュール、コマンドの折りたたみ状態
  const [tasksOpen, setTasksOpen] = useState(true);
  const [schedulesOpen, setSchedulesOpen] = useState(true);
  const [commandsOpen, setCommandsOpen] = useState(true);

  // メッセージ分析履歴
  const [messageAnalysisHistory, setMessageAnalysisHistory] = useState<
    Array<{
      intent: string;
      sentiment: string;
      intensity: number;
    }>
  >([]);

  // スケジュール入力アシスト用の状態
  const [showScheduleAssist, setShowScheduleAssist] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    new Date()
  );
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTitle, setScheduleTitle] = useState("");

  // 認証状態の確認
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem("pixelwork-auth");
      if (authData) {
        try {
          const { username, isLoggedIn } = JSON.parse(authData);
          if (isLoggedIn) {
            setIsLoggedIn(true);
            setUsername(username);
            return true;
          }
        } catch (e) {
          console.error("認証データの解析エラー:", e);
        }
      }
      return false;
    };

    const isAuth = checkAuth();
    if (!isAuth) {
      router.push("/login");
    }
  }, [router]);

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem("pixelwork-auth");
    toast({
      title: "ログアウト",
      description: "ログアウトしました。",
    });
    router.push("/login");
  };

  // 利用可能なコマンドリスト
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
      icon: <FileCode className="h-3 w-3" />,
    },
  ];

  // 初期設定の質問
  const setupQuestions = [
    "朝は得意？それとも夜が好き？",
    "どんなタイプの仕事が好き？",
    "最近、楽しいと感じたのはどんな時？",
    "猫と犬、どちらが好き？",
  ];

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

  // スケジュール入力を確定
  const confirmSchedule = () => {
    if (!scheduleDate || !scheduleTime || !scheduleTitle) {
      toast({
        title: "入力エラー",
        description: "日付、時間、タイトルをすべて入力してください",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(scheduleDate, "yyyy/MM/dd");
    const fullCommand = `#schedule ${dateStr} ${scheduleTime} ${scheduleTitle}`;

    // メッセージとして送信
    setMessage(fullCommand);
    sendMessage(fullCommand);

    // 入力をリセット
    setShowScheduleAssist(false);
    setScheduleTitle("");
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
    setTasksOpen(true); // タスクを追加したら自動的に開く
  };

  // スケジュール追加
  const addSchedule = (date: string, time: string, title: string) => {
    // 日付フォーマットの簡易チェック（実際はもっと堅牢にする）
    let formattedDate = date;
    if (date.match(/^\d{1,2}\/\d{1,2}$/)) {
      const [month, day] = date.split("/");
      const year = new Date().getFullYear();
      formattedDate = `${year}/${month}/${day}`;
    }

    const newSchedule: Schedule = {
      id: Date.now().toString(),
      title,
      date: new Date(formattedDate),
      time,
      createdAt: new Date(),
    };
    setSchedules((prev) => [...prev, newSchedule]);
    setSchedulesOpen(true); // スケジュールを追加したら自動的に開く
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

  // 気分更新
  const updateMood = (mood: string) => {
    // 気分のキーワードに基づいてキャラクターの気分を変更
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

  // コマンドへの応答
  const respondToCommand = (response: string) => {
    // キャラクターの態度に応じた応答スタイルを適用
    let styledResponse = response;

    if (character === "cat") {
      if (characterAttitude === "tsundere") {
        styledResponse = `${response} ...別にあなたのためじゃないんだからね`;
      } else if (characterAttitude === "aloof") {
        styledResponse = `${response} ...`;
      } else if (characterAttitude === "helpful") {
        styledResponse = `${response} 他に何かお手伝いできることはあるかにゃ？`;
      }
    } else {
      // dog
      if (characterAttitude === "sympathetic") {
        styledResponse = `${response} 頑張ってるね！`;
      } else if (characterAttitude === "energetic") {
        styledResponse = `${response} わんわん！`;
      } else if (characterAttitude === "helpful") {
        styledResponse = `${response} 他にも手伝えることがあれば言ってね！`;
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: styledResponse,
        sender: "character",
        timestamp: new Date(),
      },
    ]);
  };

  // 自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 初期メッセージ
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
  }, []);

  // 時間選択肢の生成
  const timeOptions = Array.from({ length: 24 }).flatMap((_, hour) =>
    [0, 30].map(
      (minute) =>
        `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`
    )
  );

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
      {/* キャラクター表示エリア - 固定位置に配置 */}
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

      <div className="flex flex-1 overflow-hidden">
        {/* サイドパネル - 左側に配置 */}
        <div
          className={`border-b md:border-b-0 md:border-r border-secondary flex flex-col transition-all duration-300 relative z-20 bg-background/80 backdrop-blur-sm ${
            sidebarOpen ? "w-full md:w-72" : "w-12"
          }`}
        >
          <div className="flex items-center justify-between p-2 border-b border-secondary">
            <h3
              className={`text-sm font-medium ${
                sidebarOpen ? "block" : "hidden"
              }`}
            >
              管理パネル
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {sidebarOpen && (
            <div className="flex-1 overflow-auto p-3 space-y-4">
              {/* タスク - 折りたたみ可能 */}
              <Collapsible
                open={tasksOpen}
                onOpenChange={setTasksOpen}
                className="border border-secondary rounded-md overflow-hidden"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-secondary/50 hover:bg-secondary text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>タスク</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      tasksOpen ? "rotate-90" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2">
                  {tasks.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-3">
                      <p>
                        タスクはまだありません。
                        <br />
                        <span className="text-primary">「#task タスク名」</span>
                        で追加できます。
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {tasks
                        .filter((task) => !task.completed)
                        .map((task) => (
                          <li
                            key={task.id}
                            className="task-item flex items-center gap-2 p-2 rounded-md"
                          >
                            <Checkbox
                              id={task.id}
                              checked={task.completed}
                              onCheckedChange={() => completeTask(task.title)}
                              className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <label
                              htmlFor={task.id}
                              className="text-xs flex-1 cursor-pointer"
                            >
                              {task.title}
                            </label>
                          </li>
                        ))}
                    </ul>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* スケジュール - 折りたたみ可能 */}
              <Collapsible
                open={schedulesOpen}
                onOpenChange={setSchedulesOpen}
                className="border border-secondary rounded-md overflow-hidden"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-secondary/50 hover:bg-secondary text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>スケジュール</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      schedulesOpen ? "rotate-90" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2">
                  {schedules.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-3">
                      <p>
                        予定はまだありません。
                        <br />
                        <span className="text-primary">
                          「#schedule 日付 時間 予定名」
                        </span>
                        で追加できます。
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {schedules.map((schedule) => (
                        <li
                          key={schedule.id}
                          className="task-item flex items-start gap-2 p-2 rounded-md"
                        >
                          <Clock className="h-3 w-3 mt-0.5 text-primary" />
                          <div className="text-xs flex-1">
                            <div className="font-medium">{schedule.title}</div>
                            <div className="text-muted-foreground">
                              {schedule.date.toLocaleDateString()}{" "}
                              {schedule.time}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* コマンド - 折りたたみ可能 */}
              <Collapsible
                open={commandsOpen}
                onOpenChange={setCommandsOpen}
                className="border border-secondary rounded-md overflow-hidden"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-secondary/50 hover:bg-secondary text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <span>コマンド</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      commandsOpen ? "rotate-90" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2">
                  <div className="space-y-1 text-xs">
                    {commands.map((cmd) => (
                      <div
                        key={cmd.id}
                        className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer"
                        onClick={() => insertCommand("#" + cmd.id)}
                      >
                        <div className="w-4 h-4 flex items-center justify-center text-primary">
                          {cmd.icon}
                        </div>
                        <div className="flex-1">
                          <span className="code-keyword">{cmd.id}</span> -{" "}
                          {cmd.label.split(" - ")[1]}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>

        {/* 中央のスペース */}

        {/* チャット部分 - 右側に配置 */}
        <div className="flex-1 flex flex-col overflow-hidden border-l border-secondary">
          {/* 会話表示エリア - 固定高さでスクロール可能に */}
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <MessageSquare className="h-4 w-4" />
                <span>会話</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
                <div className="space-y-2 p-4 flex flex-col items-end">
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.id}-${index}`}
                      className="text-sm max-w-[90%]"
                    >
                      {msg.sender === "user" ? (
                        <div className="text-right">
                          <p className="text-foreground">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="whitespace-pre-wrap text-foreground">
                            {msg.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* 入力欄 - チャットエリアの下部に配置 */}
            <div className="border-t border-secondary relative z-20 bg-background/80 backdrop-blur-sm">
              {showScheduleAssist ? (
                <div className="p-2 bg-secondary border-t border-muted">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left font-normal text-xs bg-card border-muted"
                          >
                            <Calendar className="mr-1 h-3 w-3 text-primary" />
                            {scheduleDate
                              ? format(scheduleDate, "yyyy/MM/dd", {
                                  locale: ja,
                                })
                              : "日付を選択"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-muted">
                          <CalendarComponent
                            mode="single"
                            selected={scheduleDate}
                            onSelect={setScheduleDate}
                            initialFocus
                            className="bg-card text-foreground"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Select
                        value={scheduleTime}
                        onValueChange={setScheduleTime}
                      >
                        <SelectTrigger className="text-xs h-8 bg-card border-muted">
                          <SelectValue placeholder="時間" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-muted">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-[2] min-w-[180px]">
                      <Input
                        value={scheduleTitle}
                        onChange={(e) => setScheduleTitle(e.target.value)}
                        placeholder="予定のタイトル"
                        className="text-xs h-8 bg-card border-muted"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScheduleAssist(false)}
                      className="text-xs border-muted"
                    >
                      キャンセル
                    </Button>
                    <Button
                      size="sm"
                      onClick={confirmSchedule}
                      className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      登録
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  className="flex items-center gap-1 px-4 py-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        setupComplete ? "メッセージを入力..." : "回答を入力..."
                      }
                      className="border border-muted bg-background/50 focus-visible:ring-1 focus-visible:ring-primary h-10 text-sm rounded-full pl-4 pr-10"
                    />
                    {showCommandList && (
                      <div className="absolute top-auto bottom-full left-0 w-full mb-1 bg-card rounded-md border border-muted shadow-lg z-10">
                        <div className="p-2">
                          <h4 className="text-xs font-medium text-primary mb-1">
                            コマンド
                          </h4>
                          <ul className="space-y-1">
                            {commands.map((command, index) => (
                              <li key={command.id}>
                                <button
                                  className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2 ${
                                    selectedCommandIndex === index
                                      ? "bg-secondary text-primary"
                                      : "hover:bg-secondary/50"
                                  }`}
                                  onClick={() =>
                                    insertCommand("#" + command.id)
                                  }
                                >
                                  <Hash className="h-3 w-3" />
                                  <span className="code-keyword">
                                    {command.id}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {" "}
                                    - {command.label.split(" - ")[1]}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
