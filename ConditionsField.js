'use client';

import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Icon } from '@iconify/react';
import { ConditionalOperators } from '../../lib/blocks/library';

export default function ConditionsField({ 
  value = [], 
  onChange, 
  maxConditions = 9,
  availableVariables = [] 
}) {
  const handleAddCondition = () => {
    if (value.length >= maxConditions) return;
    
    const newCondition = {
      leftValue: '',
      operator: '==',
      rightValue: ''
    };
    
    onChange([...value, newCondition]);
  };

  const handleUpdateCondition = (index, field, newValue) => {
    const updatedConditions = [...value];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: newValue
    };
    onChange(updatedConditions);
  };

  const handleRemoveCondition = (index) => {
    const updatedConditions = value.filter((_, i) => i !== index);
    onChange(updatedConditions);
  };

  return (
    <div className="space-y-4">
      {value.map((condition, index) => (
        <div 
          key={index}
          className="p-4 rounded-lg border border-default-200 space-y-3 bg-default-50"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-warning/20">
                <span className="text-xs font-medium text-warning">{index + 1}</span>
              </div>
              <h4 className="text-sm font-medium">Condição {index + 1}</h4>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => handleRemoveCondition(index)}
            >
              <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Valor Esquerdo"
              placeholder="Valor ou variável"
              value={condition.leftValue}
              onChange={(e) => handleUpdateCondition(index, 'leftValue', e.target.value)}
              size="sm"
            />

            <Select
              label="Operador"
              selectedKeys={[condition.operator]}
              onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
              size="sm"
            >
              {ConditionalOperators.map((op) => (
                <SelectItem 
                  key={op.key} 
                  value={op.key}
                  description={op.description}
                >
                  {op.label}
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Valor Direito"
              placeholder="Valor ou variável"
              value={condition.rightValue}
              onChange={(e) => handleUpdateCondition(index, 'rightValue', e.target.value)}
              size="sm"
            />
          </div>
        </div>
      ))}

      {value.length < maxConditions && (
        <Button
          size="sm"
          variant="flat"
          color="warning"
          startContent={<Icon icon="solar:add-circle-bold" />}
          onPress={handleAddCondition}
          className="w-full"
        >
          Adicionar Condição
        </Button>
      )}

      <div className="mt-4 p-3 rounded-lg bg-default-100 border border-default-200">
        <div className="flex items-center gap-2">
          <Icon icon="solar:routing-bold-duotone" className="text-danger" />
          <div>
            <p className="text-sm font-medium">Rota Else</p>
            <p className="text-xs text-default-500">
              Rota padrão quando nenhuma condição é atendida
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 