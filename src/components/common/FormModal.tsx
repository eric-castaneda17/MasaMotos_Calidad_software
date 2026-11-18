"use client";

import { Modal } from "@/components/ui/modal";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "md" | "lg";
  children: React.ReactNode;
}

export default function FormModal({ isOpen, onClose, title, description, size = "md", children }: FormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={size === "lg" ? "m-4 max-w-2xl" : "m-4 max-w-lg"}
    >
      <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7">
        <div className="mb-5 pe-12">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        {children}
      </div>
    </Modal>
  );
}
