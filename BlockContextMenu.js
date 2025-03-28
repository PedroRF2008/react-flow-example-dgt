'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function BlockContextMenu({ onClose, onDelete, onDuplicate }) {
  return (
    <div
      className="context-menu bg-background/90 backdrop-blur-[2px] rounded-lg shadow-lg border border-default-200 overflow-hidden min-w-[160px] py-1.5 nodrag"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="w-full px-3 py-2 text-sm flex items-center gap-2.5 transition-colors hover:bg-default-100 active:bg-default-200 text-default-600"
      >
        <Icon icon="solar:copy-bold-duotone" className="text-lg" />
        Duplicar
      </button>
      
      <div className="h-px bg-default-200/50 my-1.5" />
      
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-3 py-2 text-sm flex items-center gap-2.5 transition-colors hover:bg-default-100 active:bg-default-200 text-danger hover:text-danger-500"
      >
        <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-lg" />
        Excluir
      </button>
    </div>
  );
} 