import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ImageLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  maxSelect?: number;
}

export const ImageLibraryDialog = ({ open, onOpenChange, onSelect, multiple = false, maxSelect }: ImageLibraryDialogProps) => {
  const fileNameOf = (path: string) => {
    const parts = (path || "").split("/");
    return parts[parts.length - 1] || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Library</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground text-sm">Select images from your library.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
