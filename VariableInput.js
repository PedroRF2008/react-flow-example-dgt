'use client';

import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from 'react';
import VariablesModal from './VariablesModal';

const getVariableTypeConfig = (type) => {
  const types = {
    text: {
      icon: 'solar:text-square-bold-duotone',
      label: 'Texto'
    },
    number: {
      icon: 'solar:hashtag-square-bold-duotone',
      label: 'Número'
    },
    boolean: {
      icon: 'solar:check-square-bold-duotone',
      label: 'Booleano'
    },
    object: {
      icon: 'solar:widget-bold-duotone',
      label: 'Objeto'
    },
    image: {
      icon: 'solar:gallery-wide-bold-duotone',
      label: 'Imagem'
    }
  };

  return types[type] || types.text;
};

export default function VariableInput({ 
  value = '', 
  onChange,
  label,
  placeholder,
  required,
  variableType = 'text',
  description,
  isInvalid,
  errorMessage,
  availableVariables = []
}) {
  const [showVariables, setShowVariables] = useState(false);
  const typeConfig = getVariableTypeConfig(variableType);

  console.log('VariableInput rendered with:', {
    value,
    availableVariables,
    showVariables
  });

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          isRequired={required}
          isInvalid={isInvalid}
          errorMessage={errorMessage}
          startContent={
            <div className="flex items-center gap-1.5 pl-0.5 pr-2 border-r border-default-200">
              <Icon 
                icon={typeConfig.icon}
                className="text-default-500 text-lg"
              />
              <span className="text-xs font-medium text-default-500">
                {typeConfig.label}
              </span>
            </div>
          }
          classNames={{
            input: "pl-2 font-mono",
            inputWrapper: "h-unit-10 bg-default-50"
          }}
        />
      </div>

      {description && (
        <p className="text-xs text-default-500">{description}</p>
      )}
    </div>
  );
} 