// ConfirmModal.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <Card className="max-w-sm w-full pt-4" style={{ backgroundColor: "#ffffffe6" }} onClick={(e) => e.stopPropagation()}>
        <CardContent>
          <p className="whitespace-pre-line p-2 mb-2">{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-orange-400 hover:bg-orange-500"
            >
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmModal;
