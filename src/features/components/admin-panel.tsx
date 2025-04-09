"use client";

import { useState } from "react";
import { Button } from "@/features/ui/button";
import { Checkbox } from "@/features/ui/checkbox";
import {
  CheckSquare,
  Terminal,
  Clock,
  Calendar,
  Plus,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/ui/collapsible";
import type { Task, Schedule } from "@/shared/types";

interface AdminPanelProps {
  tasks: Task[];
  schedules: Schedule[];
  completeTask: (title: string) => void;
  insertCommand: (command: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function AdminPanel({
  tasks,
  schedules,
  completeTask,
  insertCommand,
  sidebarOpen,
  setSidebarOpen,
}: AdminPanelProps) {
  // タスク、スケジュール、コマンドの折りたたみ状態
  const [tasksOpen, setTasksOpen] = useState(true);
  const [schedulesOpen, setSchedulesOpen] = useState(true);
  const [commandsOpen, setCommandsOpen] = useState(true);

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
      icon: <Terminal className="h-3 w-3" />,
    },
  ];

  return (
    <div
      className={`border-b md:border-b-0 md:border-r border-secondary flex flex-col transition-all duration-300 relative z-20 bg-background/80 backdrop-blur-sm ${
        sidebarOpen ? "w-full md:w-72" : "w-12"
      }`}
    >
      <div className="flex items-center justify-between p-2 border-b border-secondary">
        <h3
          className={`text-sm font-medium ${sidebarOpen ? "block" : "hidden"}`}
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
                          {schedule.date.toLocaleDateString()} {schedule.time}
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
  );
}
