"use client";

import { useState, type MouseEvent } from "react";
import { Check, Download, LoaderCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DownloadStatus = "idle" | "loading" | "success" | "error";

type ReportDownloadLinkProps = {
  downloadUrl: string;
  fileName: string;
  compact?: boolean;
};

export function ReportDownloadLink({
  downloadUrl,
  fileName,
  compact = false,
}: ReportDownloadLinkProps) {
  const [status, setStatus] = useState<DownloadStatus>("idle");

  async function handleDownload(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (status === "loading") {
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(downloadUrl, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Download request failed");
      }

      const fileBlob = await response.blob();
      const objectUrl = URL.createObjectURL(fileBlob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.style.display = "none";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const label =
    status === "loading"
      ? "Menyiapkan PDF..."
      : status === "success"
        ? "Unduhan dimulai"
        : "Unduh PDF";

  return (
    <div className={cn("min-w-0", compact ? "w-full sm:w-auto" : "w-full")}>
      <a
        href={downloadUrl}
        onClick={handleDownload}
        aria-disabled={status === "loading"}
        className={cn(
          buttonVariants({
            variant: "outline",
            size: compact ? "small" : "medium",
          }),
          "w-full motion-reduce:transition-none",
          status === "loading" && "pointer-events-none opacity-70",
        )}
      >
        {status === "loading" ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : status === "success" ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Download aria-hidden="true" className="size-4" />
        )}
        {label}
      </a>

      <p
        aria-live="polite"
        className={cn(
          "mt-2 text-xs leading-5",
          status === "error" ? "text-danger" : "sr-only",
        )}
      >
        {status === "error"
          ? "PDF belum dapat diunduh. Silakan coba kembali."
          : label}
      </p>
    </div>
  );
}
