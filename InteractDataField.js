'use client';

import { useState } from 'react';
import { Button, Input } from "@heroui/react";
import { Icon } from '@iconify/react';

export default function InteractDataField({ value = [], onChange, variables = [] }) {
  const [newItem, setNewItem] = useState({ key: '', value: '' });

  const handleAddItem = () => {
    if (!newItem.key || !newItem.value) return;
    onChange([...value, newItem]);
    setNewItem({ key: '', value: '' });
  };

  const handleRemoveItem = (index) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing Data Items */}
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item.key}
            onChange={(e) => {
              const newValue = [...value];
              newValue[index] = { ...item, key: e.target.value };
              onChange(newValue);
            }}
            placeholder="Nome do Dado"
            className="flex-1"
            size="sm"
          />
          <Input
            value={item.value}
            onChange={(e) => {
              const newValue = [...value];
              newValue[index] = { ...item, value: e.target.value };
              onChange(newValue);
            }}
            placeholder="Valor do Dado"
            className="flex-1"
            size="sm"
          />
          <Button
            isIconOnly
            color="danger"
            variant="light"
            onPress={() => handleRemoveItem(index)}
            size="sm"
          >
            <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
          </Button>
        </div>
      ))}

      {/* Add New Item */}
      <div className="flex gap-2">
        <Input
          value={newItem.key}
          onChange={(e) => setNewItem({ ...newItem, key: e.target.value })}
          placeholder="Nome do Dado"
          className="flex-1"
          size="sm"
          onKeyPress={handleKeyPress}
        />
        <Input
          value={newItem.value}
          onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
          placeholder="Valor do Dado"
          className="flex-1"
          size="sm"
          onKeyPress={handleKeyPress}
        />
        <Button
          isIconOnly
          color="primary"
          variant="light"
          onPress={handleAddItem}
          size="sm"
          isDisabled={!newItem.key || !newItem.value}
        >
          <Icon icon="solar:add-circle-bold" className="text-lg" />
        </Button>
      </div>
    </div>
  );
} 