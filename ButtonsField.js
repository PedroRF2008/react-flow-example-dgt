'use client';

import { Button, Input, Textarea } from "@heroui/react";
import { Icon } from '@iconify/react';

export default function ButtonsField({ value = [], onChange, maxButtons = 5, routeMode = false }) {
  // Ensure value is always an array
  const buttons = Array.isArray(value) ? value : [];

  const handleAddButton = () => {
    if (buttons.length >= maxButtons) return;
    
    const newButton = routeMode ? {
      label: `Rota ${buttons.length + 1}`,
      description: ''
    } : {
      label: `Botão ${buttons.length + 1}`
    };
    
    onChange([...buttons, newButton]);
  };

  const handleUpdateButton = (index, field, newValue) => {
    const updatedButtons = [...buttons];
    updatedButtons[index] = {
      ...updatedButtons[index],
      [field]: newValue
    };
    onChange(updatedButtons);
  };

  return (
    <div className="space-y-3">
      {buttons.map((button, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                size="sm"
                label={routeMode ? "Nome da Rota" : "Texto do Botão"}
                placeholder={routeMode ? "Digite o nome da rota" : "Digite o texto do botão"}
                value={button.label}
                onChange={(e) => handleUpdateButton(index, 'label', e.target.value)}
              />
            </div>
            
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="danger"
              onPress={() => {
                const newButtons = buttons.filter((_, i) => i !== index);
                onChange(newButtons);
              }}
            >
              <Icon icon="solar:trash-bin-trash-bold" className="text-base" />
            </Button>
          </div>

          {routeMode && (
            <Textarea
              size="sm"
              label="Descrição da Rota"
              placeholder="Descreva quando esta rota deve ser escolhida"
              value={button.description || ''}
              onChange={(e) => handleUpdateButton(index, 'description', e.target.value)}
            />
          )}
        </div>
      ))}

      {buttons.length < maxButtons && (
        <Button
          size="sm"
          variant="ghost"
          color="primary"
          startContent={<Icon icon="solar:add-circle-bold-duotone" className="text-base" />}
          onPress={handleAddButton}
          className="w-full"
        >
          {routeMode ? 'Adicionar Rota' : 'Adicionar Botão'}
        </Button>
      )}
    </div>
  );
} 