"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuLoader2, LuCheckCircle, LuXCircle, LuActivity } from "react-icons/lu";

interface ProgressUpdate {
  jobId: string;
  status: "pending" | "discovering" | "crawling" | "extracting" | "completed" | "failed";
  message: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  productsFound?: number;
  pagesProcessed?: number;
  error?: string;
  timestamp: string;
}

interface CrawlProgressProps {
  jobId: string;
  progressUrl: string;
  onComplete?: (success: boolean) => void;
}

export function CrawlProgress({ jobId, progressUrl, onComplete }: CrawlProgressProps) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(progressUrl);

    eventSource.addEventListener("connected", () => {
      console.log("Connected to crawler progress stream");
    });

    eventSource.addEventListener("progress", (event) => {
      try {
        const data: ProgressUpdate = JSON.parse(event.data);
        setProgress(data);

        if (data.status === "completed" || data.status === "failed") {
          eventSource.close();
          onComplete?.(data.status === "completed");
        }
      } catch (parseError) {
        console.error("Failed to parse progress update:", parseError);
      }
    });

    eventSource.onerror = () => {
      console.error("SSE connection lost");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [progressUrl, onComplete]);

  if (!progress) {
    return (
      <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
        <LuLoader2 className="w-5 h-5 text-violet-400 animate-spin" />
        <span className="text-sm text-gray-300">Initializing crawler...</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case "completed":
        return <LuCheckCircle className="w-5 h-5 text-green-400" />;
      case "failed":
        return <LuXCircle className="w-5 h-5 text-red-400" />;
      default:
        return <LuLoader2 className="w-5 h-5 text-violet-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case "completed":
        return "border-green-500/20 bg-green-500/10";
      case "failed":
        return "border-red-500/20 bg-red-500/10";
      default:
        return "border-violet-500/20 bg-violet-500/10";
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={progress.status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`space-y-3 p-4 border rounded-xl ${getStatusColor()}`}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200">{progress.message}</p>
            {progress.pagesProcessed !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                {progress.pagesProcessed} pages processed
              </p>
            )}
          </div>
        </div>

        {progress.progress && progress.status !== "completed" && progress.status !== "failed" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span>{Math.round(progress.progress.percentage)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {progress.productsFound !== undefined && progress.productsFound > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <LuActivity className="w-4 h-4" />
            <span>{progress.productsFound} products found</span>
          </div>
        )}

        {progress.error && (
          <p className="text-xs text-red-400 mt-2">{progress.error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
