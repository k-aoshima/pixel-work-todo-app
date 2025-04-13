import React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/features/ui/input";
import { Button } from "@/features/ui/button";

interface TerminalInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}

interface TerminalFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  error?: string;
  inputs: TerminalInputProps[];
  children?: React.ReactNode;
  submitText?: string;
  loading?: boolean;
}

function TerminalInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
}: TerminalInputProps) {
  return (
    <div className="space-y-2">
      <div className="terminal-line flex items-center gap-2">
        <span className="text-primary">$</span>
        <span className="text-muted-foreground">{label}:</span>
      </div>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="terminal-input bg-secondary border-muted"
        autoComplete={autoComplete}
        disabled={disabled}
      />
    </div>
  );
}

export function TerminalForm({ 
  title, 
  error, 
  inputs, 
  children, 
  onSubmit,
  submitText = "送信",
  loading = false,
}: TerminalFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-secondary/50 p-3 rounded-md flex items-start gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="terminal-container bg-secondary/50 p-4 rounded-md mt-0">
        <div className="terminal-header flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="w-3 h-3 rounded-full bg-destructive"></span>
          <span className="w-3 h-3 rounded-full bg-muted"></span>
          <span className="w-3 h-3 rounded-full bg-primary"></span>
          <span className="flex-1 text-center">{title}</span>
        </div>

        <div className="space-y-4">
          {inputs.map((input, index) => (
            <TerminalInput key={index} {...input} />
          ))}
        </div>
      </div>

      {children}
      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={loading}
      >
        {loading ? "処理中..." : submitText}
      </Button>
    </form>
  );
}
