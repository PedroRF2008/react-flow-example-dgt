'use client';

import { useState } from 'react';
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function BlockFooter({ onDelete, delay = 0, onDelayChange }) {
  const [isEditingDelay, setIsEditingDelay] = useState(Boolean(delay));

  const handleDelayChange = (value) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      onDelayChange(numValue);
    }
  };

  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-default-200">
      <Button
        size="sm"
        color="danger"
        variant="light"
        startContent={<Icon icon="solar:trash-bin-minimalistic-bold" className="text-lg" />}
        onPress={onDelete}
      >
        Excluir
      </Button>

      <div className="flex items-center gap-1">
        {isEditingDelay ? (
          <div className="flex items-center">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="min-w-unit-6 w-6 h-6 text-default-400 hover:text-default-500"
              onPress={() => {
                setIsEditingDelay(false);
                onDelayChange(0);
              }}
            >
              <Icon icon="solar:close-circle-linear" className="text-base" />
            </Button>
            <Input
              type="number"
              size="sm"
              min={0}
              step={0.1}
              value={delay}
              onValueChange={handleDelayChange}
              className="w-24"
              endContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">seg</span>
                </div>
              }
              classNames={{
                input: "text-right",
                inputWrapper: "h-unit-8"
              }}
            />
          </div>
        ) : (
          <Button
            size="sm"
            color="default"
            variant="flat"
            startContent={<Icon icon="solar:clock-circle-bold" className="text-lg" />}
            onPress={() => setIsEditingDelay(true)}
          >
            Adicionar Atraso
          </Button>
        )}
      </div>
    </div>
  );
} 