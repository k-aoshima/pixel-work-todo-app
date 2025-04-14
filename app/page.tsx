"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type KeyboardEvent,
} from "react";
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
  // Schedule, // @/shared/types からの Schedule インポートを削除
  Message,
} from "@/shared/types";
import type { Database } from "@/app/types/database.types"; // 生成された型をインポート

// Task型をDatabaseから取得 (テーブル名は 'Task')
type Task = Database["public"]["Tables"]["Task"]["Row"];
// TaskのInsert型も定義
type TaskInsert = Database["public"]["Tables"]["Task"]["Insert"];
// TaskのUpdate型も定義
type TaskUpdate = Database["public"]["Tables"]["Task"]["Update"];

// Schedule型をDatabaseから取得 (テーブル名は 'Schedule')
type Schedule = Database["public"]["Tables"]["Schedule"]["Row"];
// ScheduleのInsert型も定義
type ScheduleInsert = Database["public"]["Tables"]["Schedule"]["Insert"];

// ★ CharacterProfile の型定義をインポート (database.types.ts から取得)
type CharacterProfile = Database["public"]["Tables"]["CharacterProfile"]["Row"];
type CharacterProfileInsert =
  Database["public"]["Tables"]["CharacterProfile"]["Insert"];
type CharacterProfileUpdate =
  Database["public"]["Tables"]["CharacterProfile"]["Update"];

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
  } = useCharacter(); // 元の setCharacter は内部でのみ使用

  // ★ キャラクター変更とDB更新を行う新しいハンドラー関数
  const handleCharacterChange = async (newCharacter: ReturnType<typeof useCharacter>['character']) => {
    // 1. ローカルステートを即時更新 (UI反映のため)
    setCharacter(newCharacter);

    // 2. DB更新処理 (ユーザーが存在することのみを確認)
    if (!user) {
      console.warn("Cannot update character type in DB: User not available.");
      // 必要であればユーザーにエラー通知
      return;
    }

    // ★ characterProfile が null でも更新処理を実行
    console.log(`Attempting to update character type to '${newCharacter}' in DB for user ID: ${user.id}`);

    // ★ 更新対象を characterProfile.id ではなく user.id で指定する
    const { error } = await supabase
      .from("CharacterProfile")
      .update({ character_type: newCharacter })
      .eq("user_id", user.id); // ★ user_id で更新対象を指定

    if (error) {
      console.error("Error updating character type in DB:", error.message);
      // 必要であればユーザーにエラー通知 (例: Toast)
      // 元のキャラクタータイプに戻すことも検討？ (今回は行わない)
    } else {
      console.log("Character type updated successfully in DB.");
      // ★ DB更新成功後、ローカルの characterProfile state も更新する
      setCharacterProfile((prevProfile) => {
        if (prevProfile) {
          // 既存のプロファイル情報に新しいキャラクタータイプをマージ
          return { ...prevProfile, character_type: newCharacter };
        }
        // prevProfile が null の場合は稀だが、念のため null を返す
        console.warn("Updated character type in DB, but local profile state was null.");
        return null;
      });
    }
  };

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
  const [schedules, setSchedules] = useState<Schedule[]>([]); // 型をDBから取得したものに変更
  // const [setupComplete, setSetupComplete] = useState(false); // needsSetup に置き換え
  const [needsSetup, setNeedsSetup] = useState(true); // 初期設定が必要かどうかの状態
  const [setupStep, setSetupStep] = useState(0);
  const [setupAnswers, setSetupAnswers] = useState<string[]>([]);
  const { isLoggedIn, username, handleLogout, user } = useAuth(); // userオブジェクトを取得
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null); // DBからのプロファイルデータ
  const [isProfileLoading, setIsProfileLoading] = useState(true); // ★ プロファイル読み込み状態
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
  const setupQuestions = useMemo(
    () => [
      "朝は得意？それとも夜が好き？",
      "どんなタイプの仕事が好き？",
      "最近、楽しいと感じたのはどんな時？",
      "猫と犬、どちらが好き？",
    ],
    []
  );

  // 初期設定の回答を処理 (async に変更)
  const handleSetupAnswer = async (answer: string) => {
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

      // ★ DBにキャラクター設定を保存する処理を追加 (重複チェック付き)
      const saveCharacterProfile = async () => {
        if (!user) {
          console.error("Cannot save profile: user is null.");
          respondToCommand("キャラクター設定の保存に失敗しました。ログイン状態を確認してください。");
          return;
        }

        // 1. 重複チェック: 同じユーザーIDとキャラクター種別が既に存在するか確認
        const { data: existingProfile, error: checkError } = await supabase
          .from("CharacterProfile")
          .select("id")
          .eq("user_id", user.id)
          .eq("character_type", newCharacter)
          .maybeSingle(); // 存在しない場合は null が返る

        if (checkError) {
          console.error("Error checking existing character profile:", checkError.message);
          respondToCommand(`キャラクター設定の確認中にエラーが発生しました: ${checkError.message}`);
          return;
        }

        if (existingProfile) {
          console.warn(`Character type '${newCharacter}' already exists for this user.`);
          respondToCommand(`既に「${newCharacter === 'cat' ? '猫' : '犬'}」のキャラクターが存在します。別のキャラクターを選択するか、設定を続けてください。`);
          // ★ 重複時は設定完了とせず、ユーザーに再選択を促すため needsSetup は true のままにする
          // ★ setupStep を戻すなど、UI/UXに応じた調整が必要な場合がある
          // ★ 今回はメッセージ表示のみ
          return; // 保存処理を中断
        }

        // 2. 重複がない場合のみ挿入処理を実行
        const profileData: CharacterProfileInsert = {
          user_id: user.id,
          character_type: newCharacter,
          character_personality: personality, // 性格をJSONとして保存する場合、適切な形式に変換が必要
        };

        console.log("Attempting to save character profile:", profileData);

        const { data: insertedData, error: insertError } = await supabase
          .from("CharacterProfile")
          .insert(profileData)
          .select()
          .single();

        if (insertError) {
          console.error("Error saving character profile:", insertError.message);
          respondToCommand(`キャラクター設定の保存中にエラーが発生しました: ${insertError.message}`);
        } else if (insertedData) {
          console.log("Character profile saved successfully:", insertedData);
          setCharacterProfile(insertedData); // 保存したデータを状態に反映
          setNeedsSetup(false); // ★ 保存成功後に設定完了とする
          // 設定完了メッセージは saveCharacterProfile の呼び出し元で表示される
        }
      };

      // 保存処理を実行し、成功した場合のみ設定完了メッセージを表示
      await saveCharacterProfile(); // await を追加して完了を待つ

      // ★ needsSetup が false になった場合（＝保存成功時）のみ完了メッセージを表示
      // この条件分岐は await saveCharacterProfile(); の後に移動済みなので、
      // ここにあった重複ブロックを削除
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

    // ★ 初期設定が必要な場合は回答として処理 (needsSetup を使用)
    if (needsSetup) {
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
      // ★ setTimeout を削除し、async/await を使うように変更
      const processNormalMessage = async () => {
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
      };
      processNormalMessage(); // 非同期関数を実行
    }

    // メッセージ入力欄をクリア (カスタムメッセージでない場合)
    if (!customMessage) {
      setMessage("");
    }
    // コマンドリストを非表示にする処理を追加
    if (showCommandList) {
      setShowCommandList(false);
    }
    // スケジュールアシストを非表示にする処理を追加 (ただし #schedule コマンド直後を除く)
    if (showScheduleAssist && !messageToSend.startsWith("#schedule")) {
      setShowScheduleAssist(false);
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
          // respondToCommand は addTask 内で成功時に行うように変更
        }
        break;

      case "#schedule":
        if (parts.length > 3) {
          const dateStr = parts[1]; // 日付文字列 (YYYY-MM-DD)
          const timeStr = parts[2]; // 時間文字列 (HH:MM or HH:MM:SS)
          const title = parts.slice(3).join(" ");
          addSchedule(dateStr, timeStr, title);
          // respondToCommand は addSchedule 内で成功時に行うように変更
        }
        break;

      case "#done":
        if (parts.length > 1) {
          const taskIdentifier = parts.slice(1).join(" ");
          const taskToComplete = tasks.find(
            (t) =>
              t.task?.toLowerCase() === taskIdentifier.toLowerCase() &&
              !t.is_completed
          );
          if (taskToComplete) {
            completeTask(taskToComplete.id);
            // respondToCommand は completeTask 内で成功時に行うように変更
          } else {
            respondToCommand(
              `未完了のタスク「${taskIdentifier}」が見つかりませんでした。`
            );
          }
        }
        break;

      case "#status":
        const todayTasks = tasks
          .filter((t) => !t.is_completed)
          .map((t) => t.task)
          .join("\n- ");

        // DBから取得したスケジュールデータを使うように変更
        const today = new Date().toISOString().split("T")[0]; // 今日の日付を YYYY-MM-DD 形式で取得
        const todaySchedules = schedules
          // schedule_date_time (文字列) から日付部分を抽出して比較
          .filter((s) => s.schedule_date_time?.startsWith(today))
          .map((s) => {
            // schedule_date_time から時間部分を抽出 (HH:MM:SS or HH:MM)
            const timePart = s.schedule_date_time?.split(" ")[1] || "";
            // 秒を省略する場合
            const displayTime = timePart.split(":").slice(0, 2).join(":");
            return `${displayTime} ${s.schedule_name}`; // カラム名を使用
          })
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
      console.error("addTask failed: User object is null.");
      respondToCommand(
        `タスク「${title}」の追加に失敗しました。ログイン状態を確認してください。`
      );
      return;
    }

    const newTaskData: TaskInsert = {
      task: title,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("Task")
      .insert(newTaskData)
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error.message);
      respondToCommand(
        `タスク「${title}」の追加中にエラーが発生しました: ${error.message}`
      );
    } else if (data) {
      setTasks((prev) => [data, ...prev]);
      respondToCommand(`タスク「${title}」を追加しました！頑張ってください！`);
    }
  };

  // タスク完了 (asyncに変更, 引数をidに変更)
  const completeTask = async (id: number) => {
    const taskToUpdate = tasks.find((t) => t.id === id);
    if (!taskToUpdate || taskToUpdate.is_completed) return;

    const updates: TaskUpdate = {
      is_completed: true,
    };

    const { error } = await supabase.from("Task").update(updates).eq("id", id);

    if (error) {
      console.error("Error completing task:", error.message);
      respondToCommand(
        `タスク「${taskToUpdate.task}」の完了処理中にエラーが発生しました: ${error.message}`
      );
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, is_completed: true } : task
        )
      );
      respondToCommand(
        `タスク「${taskToUpdate.task}」を完了しました！素晴らしい！`
      );
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
    // addSchedule: createSchedule, // useScheduleAssist の addSchedule は使わない
  } = useScheduleAssist({ sendMessage });

  // スケジュール追加 (asyncに変更, DB連携)
  const addSchedule = async (
    dateStrInput: string,
    timeStr: string,
    title: string
  ) => {
    // dateStr の引数名変更
    if (!user) {
      console.error("addSchedule failed: User object is null.");
      respondToCommand(
        `スケジュール「${title}」の追加に失敗しました。ログイン状態を確認してください。`
      );
      return;
    }

    // 日付の区切り文字をハイフンに統一
    const dateStr = dateStrInput.replace(/\//g, "-");

    // 日付と時刻を結合して schedule_date_time 文字列を作成
    // YYYY-MM-DD HH:MM:SS 形式を仮定 (DBのカラム型に合わせる)
    const scheduleDateTime = `${dateStr} ${timeStr}`;

    // バリデーション (ハイフン区切りでチェック)
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(scheduleDateTime)) {
      respondToCommand(
        `日付または時間の形式が無効です。「YYYY-MM-DD HH:MM」または「YYYY-MM-DD HH:MM:SS」形式で入力してください。入力値: ${dateStrInput} ${timeStr}`
      ); // エラー時に元の入力値も表示
      return;
    }

    const newScheduleData: ScheduleInsert = {
      // DBのカラム名に合わせて修正
      schedule_name: title,
      schedule_date_time: scheduleDateTime,
      user_id: user.id,
    };

    // ★デバッグログ追加: 送信するデータを確認
    console.log(
      "Attempting to add schedule with data:",
      JSON.stringify(newScheduleData, null, 2)
    );

    const { data, error } = await supabase
      .from("Schedule")
      .insert(newScheduleData)
      .select()
      .single();

    if (error) {
      console.error("Error adding schedule:", error.message);
      respondToCommand(
        `スケジュール「${title}」の追加中にエラーが発生しました: ${error.message}`
      );
    } else if (data) {
      console.log("Schedule added successfully:", data);
      const addedSchedule = data as Schedule;
      setSchedules((prev) =>
        [addedSchedule, ...prev].sort((a, b) => {
          // ソート順を schedule_date_time で維持
          const timeA = a.schedule_date_time || "";
          const timeB = b.schedule_date_time || "";
          return timeA.localeCompare(timeB);
        })
      );
      respondToCommand(
        `${dateStr} ${timeStr}に「${title}」の予定を追加しました！忘れないようにお知らせしますね！`
      );
    }
  };

  // 自動スクロール用のuseEffect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // DBからタスクとスケジュールを取得するuseEffect
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        console.log("fetchTasks skipped: user is null");
        return;
      }
      console.log("fetchTasks called for user:", user.id);

      const { data: fetchedTasks, error } = await supabase
        .from("Task")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("--- fetchTasks Response ---");
      console.log("Fetched Tasks Data:", fetchedTasks);
      console.log("Fetch Tasks Error:", error);

      if (error) {
        console.error("Error fetching tasks:", error.message);
        setTasks([]);
      } else if (fetchedTasks) {
        setTasks(fetchedTasks);
        console.log(`Fetched ${fetchedTasks.length} tasks.`);
      } else {
        console.warn(
          "fetchTasks returned null or undefined data, setting tasks to empty array."
        );
        setTasks([]);
      }
    };

    // DBからスケジュールを取得するuseEffect
    const fetchSchedules = async () => {
      if (!user) {
        console.log("fetchSchedules skipped: user is null");
        return;
      }
      console.log("fetchSchedules called for user:", user.id);

      const { data: fetchedSchedules, error } = await supabase
        .from("Schedule")
        .select("*")
        .eq("user_id", user.id)
        // schedule_date_time でソート
        .order("schedule_date_time", { ascending: true });

      console.log("--- fetchSchedules Response ---");
      console.log("Fetched Schedules Data:", fetchedSchedules);
      console.log("Fetch Schedules Error:", error);

      if (error) {
        console.error("Error fetching schedules:", error.message);
        setSchedules([]);
      } else if (fetchedSchedules) {
        setSchedules(fetchedSchedules as Schedule[]);
        console.log(`Fetched ${fetchedSchedules.length} schedules.`);
      } else {
        console.warn(
          "fetchSchedules returned null or undefined data, setting schedules to empty array."
        );
        setSchedules([]);
      }
    };

    // ★ キャラクタープロファイル取得処理を追加
    const fetchCharacterProfile = async () => {
      // ★ ユーザーがいない場合はローディング完了として終了 (Main useEffect で制御するため不要)
      // if (!user) { ... }

      // ★ ローディング開始は Main useEffect で行う

      try {
        // ★ user が null の可能性は Main useEffect で排除されているはずだが念のためチェック
        if (!user) {
          console.warn("fetchCharacterProfile called unexpectedly with null user.");
          setNeedsSetup(true);
          return; // 処理中断
        }

        const { data: profile, error } = await supabase
          .from("CharacterProfile")
          .select("*")
          .eq("user_id", user.id)
          .single();

        console.log("--- fetchCharacterProfile Response ---");
        console.log("Profile Data:", profile);
        console.log("Profile Error:", error);

        if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
          console.error("Error fetching character profile:", error.message);
          setNeedsSetup(true);
        } else if (profile) {
          console.log("Character profile found:", profile);
          setCharacter(profile.character_type as ReturnType<typeof useCharacter>['character'] || 'cat');
          setCharacterPersonality(profile.character_personality as string || 'friendly');
          setCharacterAttitude('friendly');
          setCharacterProfile(profile);
          setNeedsSetup(false);
        } else {
          console.log("No character profile found, needs setup");
          setNeedsSetup(true);
          // ★★★ ここでの質問追加ロジックは削除 ★★★
        }
      } catch (fetchError) { // 予期せぬエラーをキャッチ
        console.error("Unexpected error fetching character profile:", fetchError);
        setNeedsSetup(true); // エラー時は初期設定が必要と判断
        // ★★★ ここでの質問追加ロジックは削除 ★★★
      } finally {
        setIsProfileLoading(false); // ★ 成功/失敗/エラーに関わらずローディング完了
      }
    };

    if (isLoggedIn && user) {
      console.log("User is logged in, fetching data...");
      setIsProfileLoading(true); // ★ プロファイル取得前にローディング開始
      fetchTasks();
      fetchSchedules();
      fetchCharacterProfile(); // ★ プロファイル取得も実行 (内部で finally でローディング完了)
    } else {
      console.log(
        "User is not logged in or user object is null, skipping data fetch."
      );
      setTasks([]);
      setSchedules([]);
      setNeedsSetup(true); // ★ 未ログイン時も初期設定が必要
      setIsProfileLoading(false); // ★ 未ログイン時はローディング完了とする
    }
    // ★ 依存配列を修正: supabase は通常変更されないため削除、必要なセッターのみ残す
    // ★ setCharacterProfile, setIsProfileLoading を依存配列に追加
  }, [isLoggedIn, user, setCharacter, setCharacterPersonality, setCharacterAttitude, setNeedsSetup, setupQuestions, setCharacterProfile, setIsProfileLoading]);

  // ★ 初期設定の質問を表示するための useEffect (再導入)
  useEffect(() => {
    // プロファイル読み込み完了後(!isProfileLoading)に、
    // 初期設定が必要(needsSetup)で、ログイン済み(user)で、
    // プロファイルが実際に存在せず(characterProfile === null)、
    // かつ最初の挨拶メッセージのみ表示されている(messages.length === 1)場合
    if (!isProfileLoading && needsSetup && user && characterProfile === null && messages.length === 1) {
      console.log(">>> useEffect [Setup Question]: Conditions met, adding setup question.");
      setMessages((prevMessages) => {
        // 念のため、重複追加を防ぐ
        if (!prevMessages.some(msg => msg.id === 'setup-q1')) {
          return [
            ...prevMessages,
            {
              id: "setup-q1",
              content: setupQuestions[0],
              sender: "character",
              timestamp: new Date(),
            },
          ];
        }
        return prevMessages;
      });
    }
  // 依存配列には、条件判定に使用する state を含める
  // user と characterProfile はオブジェクトなので、その存在有無を示す boolean や ID を使う方が安定する場合があるが、
  // ここでは読み込み完了後の状態変化をトリガーとするため、isProfileLoading と needsSetup を主軸にする
  }, [isProfileLoading, needsSetup, user, characterProfile, messages, setupQuestions]); // messages も依存配列に含め、メッセージ追加後の再評価を防ぐためのチェックを内部で行う

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
        setCharacter={handleCharacterChange} // ★ 元の setCharacter の代わりに新しいハンドラーを渡す
        handleLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <AdminPanel
          tasks={tasks}
          schedules={schedules} // schedules をそのまま渡す (AdminPanel側でカラム名を使うように修正が必要)
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
          // setupComplete={setupComplete} // needsSetup に置き換え
          needsSetup={needsSetup} // ★ props 変更
          showScheduleAssist={showScheduleAssist}
          scheduleDate={scheduleDate}
          scheduleTime={scheduleTime}
          scheduleTitle={scheduleTitle}
          setScheduleDate={setScheduleDate}
          setScheduleTime={setScheduleTime}
          setScheduleTitle={setScheduleTitle}
          setShowScheduleAssist={setShowScheduleAssist}
          confirmSchedule={confirmSchedule} // これは useScheduleAssist のものなので、DB連携とは別
          timeOptions={timeOptions}
        />
      </div>
    </div>
  );
}
