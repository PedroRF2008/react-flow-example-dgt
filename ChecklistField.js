'use client';

import { Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";

const getOptionIcon = (key) => {
  const icons = {
    fullName: 'solar:user-id-bold-duotone',
    email: 'solar:letter-bold-duotone',
    phone: 'solar:phone-bold-duotone',
    address: 'solar:home-angle-2-bold-duotone',
    motherName: 'solar:users-group-two-rounded-bold-duotone',
    gender: 'solar:user-rounded-bold-duotone',
    birthDate: 'solar:calendar-date-bold-duotone'
  };
  return icons[key] || 'solar:document-bold-duotone';
};

export default function ChecklistField({ 
  value = [], 
  onChange, 
  options = [],
  description
}) {
  const handleToggleOption = (key) => {
    const newValue = value.includes(key)
      ? value.filter(k => k !== key)
      : [...value, key];
    
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {description && (
        <p className="text-sm text-default-500">{description}</p>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <div
            key={option.key}
            className={`
              p-3 rounded-lg border transition-colors cursor-pointer
              ${value.includes(option.key) 
                ? 'bg-secondary/10 border-secondary' 
                : 'bg-default-50 border-default-200 hover:border-secondary/50'}
            `}
            onClick={() => handleToggleOption(option.key)}
          >
            <div className="flex items-start gap-3">
              <div className={`
                p-2 rounded-lg 
                ${value.includes(option.key) 
                  ? 'bg-secondary/20' 
                  : 'bg-default-100'}
              `}>
                <Icon 
                  icon={getOptionIcon(option.key)} 
                  className={`text-xl ${
                    value.includes(option.key) 
                      ? 'text-secondary' 
                      : 'text-default-600'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    value.includes(option.key) 
                      ? 'text-secondary' 
                      : 'text-default-600'
                  }`}>
                    {option.label}
                  </span>
                  <Checkbox
                    isSelected={value.includes(option.key)}
                    className="pointer-events-none"
                    color="secondary"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 