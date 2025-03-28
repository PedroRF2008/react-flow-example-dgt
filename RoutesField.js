'use client';

import { Button, Input, Textarea } from "@heroui/react";
import { Icon } from '@iconify/react';

export default function RoutesField({ value = [], onChange }) {
  const handleAddRoute = () => {
    const newRoute = {
      label: `Rota ${value.length + 1}`,
      description: '',
      conditions: []
    };
    onChange([...value, newRoute]);
  };

  const handleRouteChange = (index, field, newValue) => {
    const updatedRoutes = [...value];
    updatedRoutes[index] = {
      ...updatedRoutes[index],
      [field]: newValue
    };
    onChange(updatedRoutes);
  };

  const handleDeleteRoute = (index) => {
    const updatedRoutes = value.filter((_, i) => i !== index);
    onChange(updatedRoutes);
  };

  return (
    <div className="space-y-4">
      {Array.isArray(value) && value.map((route, index) => (
        <div 
          key={index}
          className="p-4 rounded-lg border border-default-200 space-y-3 bg-default-50"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20">
                <span className="text-xs font-medium text-secondary">{index + 1}</span>
              </div>
              <h4 className="text-sm font-medium">Rota {index + 1}</h4>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => handleDeleteRoute(index)}
            >
              <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
            </Button>
          </div>

          <Input
            label="Nome da Rota"
            placeholder="Ex: Atendimento Humano"
            value={route.label}
            onChange={(e) => handleRouteChange(index, 'label', e.target.value)}
            size="sm"
          />

          <Textarea
            label="Descrição"
            placeholder="Descreva as condições para esta rota..."
            value={route.description}
            onChange={(e) => handleRouteChange(index, 'description', e.target.value)}
            size="sm"
          />
        </div>
      ))}

      <Button
        size="sm"
        variant="flat"
        color="secondary"
        startContent={<Icon icon="solar:add-circle-bold" />}
        onPress={handleAddRoute}
        className="w-full"
      >
        Adicionar Rota
      </Button>
    </div>
  );
} 