"use client";

import type React from "react";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import CatCharacter from "@/components/cat-character";
import DogCharacter from "@/components/dog-character";
import {
  analyzeMessage,
  updateCharacterAttitude,
  generateCharacterResponse,
} from "@/lib/ai-utils";
import type {
  Task,
  Schedule,
  CharacterMood,
  CharacterType,
  Message,
} from "@/../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [character, setCharacter] = useState<CharacterType>("cat");
  const [characterMood, setCharacterMood] = useState<CharacterMood>("happy");
  const [characterPersonality, setCharacterPersonality] =
    useState<string>("friendly");
  const [characterAttitude, setCharacterAttitude] =
    useState<string>("friendly");
  const [message, setMessage] = useState("");
  const [messageIdCounter, setMessageIdCounter] = useState(1); // IDカウンターを追加
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
      setMessages((prev) => {
        // IDをインクリメント
        const messageId1 = messageIdCounter.toString();
        setMessageIdCounter(messageIdCounter + 1);
        const messageId2 = messageIdCounter.toString();
        setMessageIdCounter(messageIdCounter + 1);

        return [
          ...prev,
          {
            id: messageId1,
            content: answer,
            sender: "user",
            timestamp: new Date(),
          },
          {
            id: messageId2,
            content: setupQuestions[setupStep + 1],
            sender: "character",
            timestamp: new Date(),
          },
        ];
      });
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
    if (value === "#schedule" && !showScheduleAssist) {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="flex min-h-screen bg-background p-4">
      <div className="flex flex-col w-full max-w-6xl mx-auto gap-4">
        <header className="flex items-center justify-between mb-2">
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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
          {/* キャラクターセクション - 左側 */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <Card className="border-secondary bg-card shadow-lg flex-1">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <div className="character-container w-48 h-48 mb-4">
                  {character === "cat" ? (
                    <CatCharacter mood={characterMood} />
                  ) : (
                    <DogCharacter mood={characterMood} />
                  )}
                </div>

                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-primary mb-2">
                    {character === "cat" ? "PixelCat" : "PixelDog"}
                  </h2>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal bg-secondary text-foreground"
                    >
                      {characterPersonality === "energetic"
                        ? "元気"
                        : characterPersonality === "calm"
                        ? "穏やか"
                        : "フレンドリー"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal bg-secondary text-foreground"
                    >
                      {getAttitudeText()}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal bg-secondary text-foreground"
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

                <div className="character-speech-bubble w-full">
                  {messages.length > 0 &&
                    messages[messages.length - 1].sender === "character" && (
                      <p className="text-sm whitespace-pre-wrap">
                        {messages[messages.length - 1].content}
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-secondary bg-card shadow-lg">
              <CardHeader className="pb-2 border-b border-secondary">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span>コマンド</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  {commands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer"
                      onClick={() => insertCommand("#" + cmd.id)}
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-primary">
                        {cmd.icon}
                      </div>
                      <div className="flex-1">
                        <span className="code-keyword">{cmd.id}</span> -{" "}
                        {cmd.label.split(" - ")[1]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メインコンテンツ - 右側 */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <Card className="border-secondary bg-card shadow-lg flex-1">
              <CardHeader className="pb-2 border-b border-secondary">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <span>タスクとスケジュール</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="tasks">
                  <TabsList className="w-full rounded-none border-b border-secondary">
                    <TabsTrigger
                      value="tasks"
                      className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                    >
                      タスク
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedule"
                      className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                    >
                      スケジュール
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="tasks" className="p-4">
                    {tasks.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <p>
                          タスクはまだありません。
                          <br />
                          <span className="text-primary">
                            「#task タスク名」
                          </span>
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
                                className="text-sm flex-1 cursor-pointer"
                              >
                                {task.title}
                              </label>
                            </li>
                          ))}
                      </ul>
                    )}
                  </TabsContent>
                  <TabsContent value="schedule" className="p-4">
                    {schedules.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
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
                            <Clock className="h-4 w-4 mt-0.5 text-primary" />
                            <div className="text-sm flex-1">
                              <div className="font-medium">
                                {schedule.title}
                              </div>
                              <div className="text-muted-foreground">
                                {schedule.date.toLocaleDateString()}{" "}
                                {schedule.time}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-secondary bg-card shadow-lg">
              <CardHeader className="pb-2 border-b border-secondary">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span>ターミナル</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        {msg.sender === "user" ? (
                          <div className="terminal-prompt">
                            <span className="text-foreground">
                              {msg.content}
                            </span>
                          </div>
                        ) : (
                          <div className="pl-2 border-l-2 border-primary">
                            <span className="text-muted-foreground text-xs">
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {showScheduleAssist ? (
                  <div className="w-full space-y-4 bg-secondary p-4 rounded-lg mt-4 border border-muted">
                    <h3 className="font-medium text-sm text-primary">
                      スケジュール登録
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          日付
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal text-sm bg-card border-muted"
                            >
                              <Calendar className="mr-2 h-4 w-4 text-primary" />
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

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          時間
                        </label>
                        <Select
                          value={scheduleTime}
                          onValueChange={setScheduleTime}
                        >
                          <SelectTrigger className="text-sm bg-card border-muted">
                            <SelectValue placeholder="時間を選択" />
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
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        タイトル
                      </label>
                      <Input
                        value={scheduleTitle}
                        onChange={(e) => setScheduleTitle(e.target.value)}
                        placeholder="予定のタイトルを入力"
                        className="text-sm bg-card border-muted"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowScheduleAssist(false)}
                        className="text-xs border-muted"
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={confirmSchedule}
                        className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        登録
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form
                    className="flex w-full gap-2 relative mt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                  >
                    <div className="relative flex-1 terminal-prompt">
                      <Input
                        ref={inputRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={
                          setupComplete
                            ? "コマンドまたはメッセージを入力..."
                            : "回答を入力..."
                        }
                        className="terminal-input pl-6 border-muted bg-secondary"
                      />
                      {showCommandList && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-card rounded-md border border-muted shadow-lg z-10">
                          <div className="p-2">
                            <h4 className="text-xs font-medium text-primary mb-2">
                              コマンド
                            </h4>
                            <ul className="space-y-1">
                              {commands.map((command, index) => (
                                <li key={command.id}>
                                  <button
                                    className={`w-full text-left px-2 py-1 text-sm rounded flex items-center gap-2 ${
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
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
