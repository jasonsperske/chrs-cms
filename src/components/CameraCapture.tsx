"use client";
import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Entry } from "@/lib/types/library/Entry";

type Props = {
  open: boolean;
  onClose: () => void;
  onAnalyze: (files: File[]) => Promise<void>;
  onAddFiles: (files: File[]) => void;
  isAnalyzing: boolean;
  variations: Entry[];
  onSelectVariant: (variant: Entry) => void;
  onClearVariations: () => void;
};

export default function CameraCapture({
  open,
  onClose,
  onAnalyze,
  onAddFiles,
  isAnalyzing,
  variations,
  onSelectVariant,
  onClearVariations,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captures, setCaptures] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCaptures([]);
      return;
    }
    setError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError(
        "Camera access requires HTTPS (or localhost) and a supported browser."
      );
      return;
    }

    let cancelled = false;
    let activeStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        activeStream = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to access camera"
          );
        }
      });

    return () => {
      cancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [open]);

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        setCaptures((prev) => [...prev, file]);
      },
      "image/jpeg",
      0.92
    );
  }

  async function analyze() {
    if (captures.length === 0 || isAnalyzing) return;
    const batch = captures;
    setCaptures([]);
    try {
      await onAnalyze(batch);
    } catch {
      setCaptures(batch);
    }
  }

  function handleClose() {
    if (captures.length > 0) {
      onAddFiles(captures);
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="max-w-md sm:max-w-lg p-3 gap-3 bg-black text-white border-neutral-800">
        <div className="flex flex-col gap-3">
          <div className="relative bg-black rounded overflow-hidden aspect-[3/4] flex items-center justify-center">
            {error ? (
              <div className="p-6 text-center text-sm text-neutral-200">
                {error}
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[calc(100vh-80px)] object-cover"
              />
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm">
                Analyzing…
              </div>
            )}
          </div>

          {captures.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {captures.map((file, idx) => (
                <div key={idx} className="relative shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`capture ${idx + 1}`}
                    className="h-14 w-14 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCaptures((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black/80 text-white text-xs leading-none flex items-center justify-center"
                    aria-label="Remove capture"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="text-black"
            >
              Close
            </Button>
            <button
              type="button"
              onClick={snap}
              disabled={!!error || isAnalyzing}
              aria-label="Capture photo"
              className="h-16 w-16 rounded-full bg-white border-4 border-neutral-300 active:scale-95 transition-transform disabled:opacity-40"
            />
            <Button
              type="button"
              onClick={analyze}
              disabled={captures.length === 0 || isAnalyzing}
            >
              Analyze{captures.length > 0 ? ` (${captures.length})` : ""}
            </Button>
          </div>

          {variations.length > 0 && (
            <div className="bg-white text-black rounded p-2 max-h-[40vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2">
                <div className="text-sm font-medium">
                  {variations.length} interpretation
                  {variations.length === 1 ? "" : "s"}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearVariations}
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {variations.map((variant, index) => (
                  <Card
                    key={`variant-${index}`}
                    className="p-2 cursor-pointer"
                    onClick={() => {
                      onSelectVariant(variant);
                      onClose();
                    }}
                  >
                    <CardHeader className="p-1">
                      {variant.title} ({variant.mediaType})
                    </CardHeader>
                    <CardContent className="p-1 text-sm">
                      {variant.author ? <p>by {variant.author}</p> : null}
                      <p>
                        {variant.publishedBy
                          ? `Published by ${variant.publishedBy}`
                          : null}{" "}
                        {variant.publishedLocation}{" "}
                        {variant.publishedOn ? `(${variant.publishedOn})` : null}
                      </p>
                      {variant.serialNumber ? (
                        <p>isbn:{variant.serialNumber}</p>
                      ) : null}
                      {variant.catalogNumber ? (
                        <p>catalog:{variant.catalogNumber}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
