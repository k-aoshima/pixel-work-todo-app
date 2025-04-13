"use client";

import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from "react";
import { Code, Plus, Calendar, Terminal, CheckSquare } from "lucide-react";
import { AppHeader } from "@/features/components/app-header";
import { AdminPanel } from "@/features/components/admin-panel";
import { ChatPanel } from "@/features/components/chat-panel";
import { CharacterDisplay } from "@/features/components/character-display";
import { createClient } from "@/app/utils/supabase/client"; // Supabaseクライアントをインポート
import { useAuth } from "@/shared/hooks/use-auth";
import { useCharacter } from "@/shared/hooks/use-character";
import { useScheduleAssist } from "@/shared/hooks/use-schedule-assist";
import {
  analyzeMessage,
  updateCharacterAttitude,
  generateCharacterResponse,
} from "@/shared/lib/ai-utils";
import type {
  // Task, // @/shared/types からの Task インポートを削除
  Schedule,
  Message,
} from "@/shared/types";
import type { Database } from "@/app/types/database.types"; // 生成された型をインポート

// Task型をDatabaseから取得 (テーブル名は 'Task')
type Task = Database["public"]["Tables"]["Task"]["Row"];
// TaskのInsert型も定義
type TaskInsert = Database["public"]["Tables"]["Task"]["Insert"];
// TaskのUpdate型も定義
type TaskUpdate = Database["public"]["Tables"]["Task"]["Update"];


export default function Home() {
  const supabase = createClient(); // Supabaseクライアントを初期化
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
  const [schedules, setSchedules] = useState<Schedule[]>([]); // Scheduleも同様にDB連携が必要になる可能性がある
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [setupAnswers, setSetupAnswers] = useState<string[]>([]);
  const { isLoggedIn, username, handleLogout, user } = useAuth(); // userオブジェクトを取得
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
          const taskIdentifier = parts.slice(1).join(" ");
          // IDで検索するか、タイトルで検索するかを決める (ここではタイトルで検索)
          const taskToComplete = tasks.find(t => t.task?.toLowerCase() === taskIdentifier.toLowerCase() && !t.is_completed); // is_completed に変更
          if (taskToComplete) {
            completeTask(taskToComplete.id); // IDを渡すように変更
            respondToCommand(`タスク「${taskToComplete.task}」を完了しました！素晴らしい！`);
          } else {
            respondToCommand(`未完了のタスク「${taskIdentifier}」が見つかりませんでした。`);
          }
        }
        break;

      case "#status":
        const todayTasks = tasks
          .filter((t) => !t.is_completed) // is_completed に変更
          .map((t) => t.task) // taskカラムを使用
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

  // タスク追加 (asyncに変更)
  const addTask = async (title: string) => {
    if (!user) {
      console.error("addTask failed: User object is null."); // ユーザーがnullの場合のエラーログ
      respondToCommand(`タスク「${title}」の追加に失敗しました。ログイン状態を確認してください。`);
      return;
    }

    console.log("--- addTask called ---"); // 関数が呼ばれたことを確認
    console.log("User object:", user); // user オブジェクト全体を出力
    console.log("User ID:", user?.id); // user.id を安全に出力

    const newTaskData: TaskInsert = {
      task: title,
      user_id: user.id, // user_idを追加
      // isCompleted はデフォルトで false のはずなので省略可
      // created_at はデフォルトで now() のはずなので省略可
    };

    const { data, error } = await supabase
      .from("Task") // テーブル名を 'Task' に変更
      .insert(newTaskData)
      .select() // 挿入したデータを返すようにする
      .single(); // 1件だけ挿入するのでsingle()

    if (error) {
      console.error("Error adding task:", error.message);
      respondToCommand(`タスク「${title}」の追加中にエラーが発生しました。`);
    } else if (data) {
      // 状態を更新
      setTasks((prev) => [data, ...prev]); // 新しいタスクをリストの先頭に追加
      // respondToCommand は processCommand 内で行うのでここでは不要
    }
  };

  // タスク完了 (asyncに変更, 引数をidに変更)
  const completeTask = async (id: number) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate || taskToUpdate.is_completed) return; // is_completed に変更

    const updates: TaskUpdate = {
      is_completed: true, // is_completed に変更
    };

    const { error } = await supabase
      .from("Task") // テーブル名を 'Task' に変更
      .update(updates)
      .eq("id", id); // idでタスクを指定

    if (error) {
      console.error("Error completing task:", error.message);
      respondToCommand(`タスクの完了処理中にエラーが発生しました。`);
    } else {
      // 状態を更新
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, is_completed: true } : task // is_completed に変更
        )
      );
      // respondToCommand は processCommand 内で行うのでここでは不要
    }
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

  // DBからタスクを取得するuseEffect
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      const { data: fetchedTasks, error } = await supabase // 変数名を変更
        .from("Task") // テーブル名を 'Task' に変更
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("--- fetchTasks Response ---"); // ログ追加
      console.log("Fetched Tasks Data:", fetchedTasks); // 取得データログ
      console.log("Fetch Tasks Error:", error); // エラーログ

      if (error) {
        console.error("Error fetching tasks:", error.message);
        // エラーが発生した場合でも空の配列をセットする (UIのクラッシュを防ぐため)
        setTasks([]);
      } else if (fetchedTasks) {
        // is_completed カラムを使用するように修正 (型定義と一致)
        setTasks(fetchedTasks);
        console.log(`Fetched ${fetchedTasks.length} tasks.`); // 取得件数ログ
      } else {
        // fetchedTasks が null や undefined の場合 (通常は起こらないはずだが念のため)
        console.warn("fetchTasks returned null or undefined data, setting tasks to empty array.");
        setTasks([]);
      }
    };

    if (isLoggedIn && user) {
      fetchTasks();
    }
  }, [isLoggedIn, user, supabase]); // 依存配列にsupabaseを追加

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
          tasks={tasks} // tasks をそのまま渡す (AdminPanel側でis_completedとtaskを使うように修正が必要)
          schedules={schedules}
          completeTask={completeTask} // completeTaskの引数がidになったことをAdminPanelに伝える必要あり
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
