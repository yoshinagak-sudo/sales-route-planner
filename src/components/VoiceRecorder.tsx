"use client";

import * as React from "react";
import { Mic, Square, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  onRecordComplete?: (blob: Blob, durationSec: number) => void;
  className?: string;
};

type State = "idle" | "recording" | "recorded" | "error";

/**
 * 音声録音ボタン（Phase 1: UI のみ、送信先なし）
 * - 画面幅100%・高さ80pxの大型ボタン
 * - 録音中は赤点滅 + タイマー、押下で停止
 * - MediaRecorder 未対応ブラウザではフォールバックメッセージ
 */
export function VoiceRecorder({ onRecordComplete, className }: Props) {
  const [state, setState] = React.useState<State>("idle");
  const [durationSec, setDurationSec] = React.useState(0);
  const [recordedDuration, setRecordedDuration] = React.useState<number | null>(
    null,
  );
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // アンマウント時にトラック停止
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      toast.error("このブラウザでは録音がサポートされていません");
      setState("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const dur = durationSec;
        setRecordedDuration(dur);
        setState("recorded");
        onRecordComplete?.(blob, dur);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setDurationSec(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        setDurationSec((d) => d + 1);
      }, 1000);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? `マイク利用を許可してください (${e.message})`
          : "録音開始に失敗しました",
      );
      setState("error");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const reset = () => {
    setState("idle");
    setRecordedDuration(null);
    setDurationSec(0);
  };

  if (state === "recording") {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className={cn(
          "w-full h-20 rounded-xl font-semibold text-base",
          "bg-danger text-danger-foreground shadow-sm",
          "flex items-center justify-center gap-3",
          "focus-visible:ring-3 focus-visible:ring-danger/40 focus-visible:outline-none",
          className,
        )}
        aria-label="録音を停止"
      >
        <span className="relative grid size-10 place-items-center">
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <Square className="size-5 relative" fill="currentColor" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span>録音中</span>
          <span className="text-xs font-medium tabular-nums opacity-90">
            {formatTimer(durationSec)} 経過 / タップで停止
          </span>
        </span>
      </button>
    );
  }

  if (state === "recorded") {
    return (
      <div
        className={cn(
          "w-full h-20 rounded-xl border-2 border-brand/40 bg-brand/5",
          "flex items-center justify-between px-4 gap-3",
          className,
        )}
        role="status"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-brand text-brand-foreground">
            <CircleCheck className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-brand">録音完了</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTimer(recordedDuration ?? 0)}{" "}
              (デモ: 送信先なし・文字起こしは Phase 2)
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-8 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-muted"
        >
          録り直す
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      className={cn(
        "w-full h-20 rounded-xl font-semibold text-base",
        "bg-brand text-brand-foreground shadow-sm",
        "hover:bg-brand-dark transition-colors",
        "flex items-center justify-center gap-3",
        "focus-visible:ring-3 focus-visible:ring-brand/40 focus-visible:outline-none",
        state === "error" && "opacity-70",
        className,
      )}
      aria-label="録音を開始"
    >
      <Mic className="size-6" aria-hidden="true" />
      <span className="flex flex-col items-start leading-tight">
        <span>録音を開始</span>
        <span className="text-xs font-medium opacity-90">
          画面を閉じても訪問メモに残ります
        </span>
      </span>
    </button>
  );
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
