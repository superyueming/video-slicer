import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Pause, Play, X, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

interface ChunkedUploaderProps {
  onUploadComplete: (result: { url: string; key: string; filename: string }) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function ChunkedUploader({
  onUploadComplete,
  onUploadError,
  accept = "video/*",
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB default
}: ChunkedUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "paused" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedChunks, setUploadedChunks] = useState<number[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPausedRef = useRef(false);

  const initUploadMutation = trpc.upload.initUpload.useMutation();
  const uploadChunkMutation = trpc.upload.uploadChunk.useMutation();
  const completeUploadMutation = trpc.upload.completeUpload.useMutation();
  const cancelUploadMutation = trpc.upload.cancelUpload.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > maxSize) {
      setErrorMessage(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
      setStatus("error");
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setProgress(0);
    setUploadedChunks([]);
    setErrorMessage(null);
  };

  const readChunk = (file: File, chunkIndex: number, chunkSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(chunk);
    });
  };

  const startUpload = useCallback(async () => {
    if (!file) return;

    try {
      setStatus("uploading");
      isPausedRef.current = false;

      // Initialize upload session
      const newUploadId = uploadId || uuidv4();
      setUploadId(newUploadId);

      const initResult = await initUploadMutation.mutateAsync({
        uploadId: newUploadId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        chunkSize: CHUNK_SIZE,
      });

      setTotalChunks(initResult.totalChunks);

      // Upload chunks
      for (let i = 0; i < initResult.totalChunks; i++) {
        if (isPausedRef.current) {
          setStatus("paused");
          return;
        }

        // Skip already uploaded chunks
        if (uploadedChunks.includes(i)) {
          continue;
        }

        // Read chunk
        const chunkData = await readChunk(file, i, CHUNK_SIZE);

        // Upload chunk
        const result = await uploadChunkMutation.mutateAsync({
          uploadId: newUploadId,
          chunkIndex: i,
          chunk: chunkData,
        });

        // Update progress
        setUploadedChunks(prev => [...prev, i]);
        setProgress(result.progress);
      }

      // Complete upload
      const completeResult = await completeUploadMutation.mutateAsync({
        uploadId: newUploadId,
      });

      setStatus("completed");
      setProgress(100);
      onUploadComplete({
        url: completeResult.url,
        key: completeResult.key,
        filename: file.name,
      });
    } catch (error) {
      console.error("[ChunkedUploader] Error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      onUploadError?.(error instanceof Error ? error : new Error("Upload failed"));
    }
  }, [file, uploadId, uploadedChunks, initUploadMutation, uploadChunkMutation, completeUploadMutation, onUploadComplete, onUploadError]);

  const pauseUpload = () => {
    isPausedRef.current = true;
    setStatus("paused");
  };

  const resumeUpload = () => {
    startUpload();
  };

  const cancelUpload = async () => {
    if (uploadId) {
      try {
        await cancelUploadMutation.mutateAsync({ uploadId });
      } catch (error) {
        console.error("[ChunkedUploader] Cancel error:", error);
      }
    }

    setFile(null);
    setUploadId(null);
    setStatus("idle");
    setProgress(0);
    setUploadedChunks([]);
    setTotalChunks(0);
    setErrorMessage(null);
    isPausedRef.current = false;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* File Input */}
      {!file && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 hover:border-primary transition-colors">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Click to select a video file (max {Math.round(maxSize / 1024 / 1024)}MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <Button asChild>
            <label htmlFor="file-input" className="cursor-pointer">
              Select File
            </label>
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {file && (
        <div className="space-y-4 border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelUpload}
              disabled={status === "uploading"}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {status === "completed" ? "Completed" : `${progress}%`}
                {totalChunks > 0 && status !== "completed" && (
                  <span className="ml-2">
                    ({uploadedChunks.length}/{totalChunks} chunks)
                  </span>
                )}
              </span>
              {status === "uploading" && (
                <span className="text-primary">Uploading...</span>
              )}
              {status === "paused" && (
                <span className="text-yellow-500">Paused</span>
              )}
              {status === "error" && (
                <span className="text-destructive">Error</span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {status === "idle" && (
              <Button onClick={startUpload} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Start Upload
              </Button>
            )}

            {status === "uploading" && (
              <Button onClick={pauseUpload} variant="outline" className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            {status === "paused" && (
              <Button onClick={resumeUpload} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}

            {status === "completed" && (
              <Button disabled className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Completed
              </Button>
            )}

            {status === "error" && (
              <Button onClick={startUpload} variant="outline" className="flex-1">
                Retry
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
