"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LuLoader2, LuCheckCircle, LuXCircle, LuActivity } from "react-icons/lu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  currentUrl?: string;
  urlsDiscovered?: number;
  errorsCount?: number;
  crawlSpeed?: number;
  estimatedTimeRemaining?: number;
  timestamp: string;
}

interface CrawlProgressPopoverProps {
  jobId: string;
  progressUrl: string;
  onComplete?: (success: boolean) => void;
}

export function CrawlProgressPopover({ jobId, progressUrl, onComplete }: CrawlProgressPopoverProps) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const getStatusIcon = () => {
    if (!progress) return <LuLoader2 className="w-4 h-4 text-violet-400 animate-spin" />;

    switch (progress.status) {
      case "completed":
        return <LuCheckCircle className="w-4 h-4 text-green-400" />;
      case "failed":
        return <LuXCircle className="w-4 h-4 text-red-400" />;
      default:
        return <LuLoader2 className="w-4 h-4 text-violet-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    if (!progress) return "border-violet-500/30 bg-violet-500/10 text-violet-300";

    switch (progress.status) {
      case "completed":
        return "border-green-500/30 bg-green-500/10 text-green-300";
      case "failed":
        return "border-red-500/30 bg-red-500/10 text-red-300";
      default:
        return "border-violet-500/30 bg-violet-500/10 text-violet-300";
    }
  };

  const getStatusText = () => {
    if (!progress) return "Initializing...";

    switch (progress.status) {
      case "pending":
        return "Pending";
      case "discovering":
        return "Discovering";
      case "crawling":
        return "Crawling";
      case "extracting":
        return "Extracting";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return progress.status;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all hover:scale-105 ${getStatusColor()}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          {progress?.progress && (
            <span className="text-xs opacity-75">
              {Math.round(progress.progress.percentage)}%
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-[#0a0a0f]/95 backdrop-blur-xl border-white/10 text-gray-200"
        align="center"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {progress ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
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

            <div className="space-y-2">
              {progress.productsFound !== undefined && progress.productsFound > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <LuActivity className="w-4 h-4" />
                  <span>{progress.productsFound} products found</span>
                </div>
              )}

              {progress.urlsDiscovered !== undefined && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium">URLs Discovered:</span>
                  <span>{progress.urlsDiscovered}</span>
                </div>
              )}

              {progress.crawlSpeed !== undefined && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium">Speed:</span>
                  <span>{progress.crawlSpeed.toFixed(2)} pages/sec</span>
                </div>
              )}

              {progress.estimatedTimeRemaining !== undefined && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium">Est. Time:</span>
                  <span>{Math.ceil(progress.estimatedTimeRemaining)}s remaining</span>
                </div>
              )}

              {progress.errorsCount !== undefined && progress.errorsCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-400">
                  <span className="font-medium">Errors:</span>
                  <span>{progress.errorsCount}</span>
                </div>
              )}

              {progress.currentUrl && (
                <div className="text-xs text-gray-500 truncate" title={progress.currentUrl}>
                  <span className="font-medium">Current:</span> {progress.currentUrl}
                </div>
              )}
            </div>

            {progress.error && (
              <p className="text-xs text-red-400 mt-2">{progress.error}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <LuLoader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <span className="text-sm text-gray-300">Initializing crawler...</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
