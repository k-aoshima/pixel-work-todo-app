import { useState } from "react";
import type { Schedule } from "@/shared/types";
import { format } from "date-fns";
import { useToast } from "./use-toast";

export function useScheduleAssist({
  sendMessage
}: {
  sendMessage: (message: string) => void;
}) {
  const [showScheduleAssist, setShowScheduleAssist] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    new Date()
  );
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const { toast } = useToast();

  // 時間選択肢の生成
  const timeOptions = Array.from({ length: 24 }).flatMap((_, hour) =>
    [0, 30].map(
      (minute) =>
        `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`
    )
  );

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
    sendMessage(fullCommand);

    // 入力をリセット
    setShowScheduleAssist(false);
    setScheduleTitle("");
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

    return {
      id: Date.now().toString(),
      title,
      date: new Date(formattedDate),
      time,
      createdAt: new Date(),
    } as Schedule;
  };

  return {
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
    addSchedule,
  };
}
