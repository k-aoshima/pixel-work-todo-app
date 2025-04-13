"use client";

import { Button } from "@/features/ui/button";
import { Input } from "@/features/ui/input";
import { ScrollArea } from "@/features/ui/scroll-area";
import { Send, Hash, MessageSquare, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/popover";
import { Calendar as CalendarComponent } from "@/features/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/ui/select";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Message } from "@/shared/types";
import type { KeyboardEvent, RefObject, JSX } from "react";

interface ChatPanelProps {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  message: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  sendMessage: () => void;
  showCommandList: boolean;
  commands: Array<{
    id: string;
    label: string;
    icon: JSX.Element;
  }>;
  selectedCommandIndex: number;
  insertCommand: (command: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  setupComplete: boolean;
  showScheduleAssist: boolean;
  scheduleDate: Date | undefined;
  scheduleTime: string;
  scheduleTitle: string;
  setScheduleDate: (date: Date | undefined) => void;
  setScheduleTime: (time: string) => void;
  setScheduleTitle: (title: string) => void;
  setShowScheduleAssist: (show: boolean) => void;
  confirmSchedule: () => void;
  timeOptions: string[];
}

export function ChatPanel({
  messages,
  messagesEndRef,
  message,
  handleInputChange,
  handleKeyDown,
  sendMessage,
  showCommandList,
  commands,
  selectedCommandIndex,
  insertCommand,
  inputRef,
  setupComplete,
  showScheduleAssist,
  scheduleDate,
  scheduleTime,
  scheduleTitle,
  setScheduleDate,
  setScheduleTime,
  setScheduleTitle,
  setShowScheduleAssist,
  confirmSchedule,
  timeOptions,
}: ChatPanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-l border-secondary">
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
                <div key={`${msg.id}-${index}`} className="text-sm max-w-[90%]">
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
                        className="bg-card text-foreground"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <Select value={scheduleTime} onValueChange={setScheduleTime}>
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
                              onClick={() => insertCommand("#" + command.id)}
                            >
                              <Hash className="h-3 w-3" />
                              <span className="code-keyword">{command.id}</span>
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
  );
}
