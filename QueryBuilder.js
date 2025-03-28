'use client';

import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Icon } from '@iconify/react';

const QueryOperators = [
  { key: 'equals', label: 'Igual a', icon: 'solar:equal-line-duotone' },
  { key: 'contains', label: 'Contém', icon: 'solar:text-field-focus-duotone' },
  { key: 'startsWith', label: 'Começa com', icon: 'solar:text-field-focus-duotone' },
  { key: 'endsWith', label: 'Termina com', icon: 'solar:text-field-focus-duotone' },
];

const QueryFields = {
  customers: [
    { 
      key: 'id', 
      label: 'ID do Cliente', 
      type: 'text',
      description: 'Identificador único do cliente',
      icon: 'solar:user-id-bold',
      operators: ['equals']
    },
    // Add more fields here later
  ]
};

export default function QueryBuilder({ 
  endpoint,
  value = [], 
  onChange,
  availableVariables = []
}) {
  const availableFields = QueryFields[endpoint] || [];

  const handleAddFilter = () => {
    const newFilter = {
      field: availableFields[0].key,
      operator: availableFields[0].operators[0],
      value: ''
    };
    
    onChange([...value, newFilter]);
  };

  const handleUpdateFilter = (index, field, newValue) => {
    const updatedFilters = [...value];
    updatedFilters[index] = {
      ...updatedFilters[index],
      [field]: newValue
    };
    onChange(updatedFilters);
  };

  const handleRemoveFilter = (index) => {
    const updatedFilters = value.filter((_, i) => i !== index);
    onChange(updatedFilters);
  };

  return (
    <div className="space-y-3">
      {value.map((filter, index) => {
        const fieldConfig = availableFields.find(f => f.key === filter.field);
        
        return (
          <div 
            key={index}
            className="p-3 rounded-lg border border-default-200 bg-default-50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon={fieldConfig?.icon} className="text-default-500" />
                <span className="text-sm font-medium">{fieldConfig?.label}</span>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => handleRemoveFilter(index)}
              >
                <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                size="sm"
                selectedKeys={[filter.operator]}
                onChange={(e) => handleUpdateFilter(index, 'operator', e.target.value)}
              >
                {fieldConfig?.operators.map((op) => {
                  const opConfig = QueryOperators.find(o => o.key === op);
                  return (
                    <SelectItem 
                      key={op} 
                      value={op}
                      startContent={
                        <Icon icon={opConfig.icon} className="text-default-500" />
                      }
                    >
                      {opConfig.label}
                    </SelectItem>
                  );
                })}
              </Select>

              <Input
                size="sm"
                placeholder="Valor ou variável"
                value={filter.value}
                onChange={(e) => handleUpdateFilter(index, 'value', e.target.value)}
              />
            </div>
          </div>
        );
      })}

      {value.length < availableFields.length && (
        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Icon icon="solar:filter-add-bold" />}
          onPress={handleAddFilter}
          className="w-full"
        >
          Adicionar Filtro
        </Button>
      )}
    </div>
  );
} 