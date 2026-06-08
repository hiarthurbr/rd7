"use client";

import { Button, Card } from "@heroui/react";
import { FileCode2, FileSpreadsheet, Upload, X } from "lucide-react";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type FileUploaderProps = {
  label: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  icon: "xlsx" | "xml";
};

export function FileUploader({ label, accept, file, onFileChange, icon }: FileUploaderProps) {
  const inputRef = useRef(null);
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        onFileChange(droppedFile);
      }
    },
    [onFileChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onFileChange(selectedFile);
      }
    },
    [onFileChange],
  );

  const IconComponent = icon === "xlsx" ? FileSpreadsheet : FileCode2;

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-colors",
        file
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Card.Content className="flex flex-col items-center justify-center gap-3 py-8">
        {file ? (
          <>
            <div className="flex items-center gap-3">
              <IconComponent className="size-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-muted-foreground text-xs">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileChange(null)}
              className="text-muted-foreground hover:text-danger"
            >
              <X className="size-4 mr-1" />
              Remover
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted/30 p-4">
              <Upload className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-muted-foreground text-xs">
                Arraste e solte ou clique para selecionar
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="sr-only"
              />
              <span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // @ts-expect-error
                    inputRef.current?.click();
                  }}
                >
                  <span>Selecionar arquivo</span>
                </Button>
              </span>
            </label>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
