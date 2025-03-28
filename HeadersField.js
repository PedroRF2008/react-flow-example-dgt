'use client';

import { Button, Input, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

const EmptyState = () => (
  <div className="text-center text-default-400 py-6">
    <div className="bg-default-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
      <Icon icon="solar:document-add-linear" className="text-2xl" />
    </div>
    <p className="text-sm font-medium">Nenhum header configurado</p>
    <p className="text-xs text-default-400">Adicione headers para personalizar sua requisição</p>
  </div>
);

const HeadersField = ({ value = [], onChange, maxHeaders = 10 }) => {
  const [newHeader, setNewHeader] = useState({ key: '', value: '' });

  const handleAddHeader = () => {
    if (!newHeader.key || !newHeader.value) return;
    
    const updatedHeaders = [...value, newHeader];
    onChange(updatedHeaders);
    setNewHeader({ key: '', value: '' });
  };

  const handleRemoveHeader = (index) => {
    const updatedHeaders = value.filter((_, i) => i !== index);
    onChange(updatedHeaders);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHeader();
    }
  };

  return (
    <div className="space-y-4">
      {/* Headers List */}
      <div className="space-y-2 bg-default-50 p-3 rounded-lg border-1 border-default-200">
        {value.length > 0 ? (
          value.map((header, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                size="sm"
                value={header.key}
                placeholder="Nome do Header"
                isReadOnly
                startContent={<Icon icon="solar:key-linear" className="text-default-400" />}
                classNames={{
                  input: "text-small font-medium"
                }}
              />
              <Input
                size="sm"
                value={header.value}
                placeholder="Valor do Header"
                isReadOnly
                startContent={<Icon icon="solar:text-linear" className="text-default-400" />}
                classNames={{
                  input: "text-small"
                }}
              />
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                onPress={() => handleRemoveHeader(index)}
              >
                <Icon icon="solar:trash-bin-trash-linear" className="text-lg" />
              </Button>
            </div>
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Add New Header Form */}
      {value.length < maxHeaders && (
        <>
          <Divider className="my-4" />
          <div className="flex gap-2 items-center">
            <Input
              size="sm"
              value={newHeader.key}
              onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
              placeholder="Nome do Header"
              onKeyPress={handleKeyPress}
              startContent={<Icon icon="solar:key-linear" className="text-default-400" />}
              classNames={{
                input: "text-small font-medium"
              }}
            />
            <Input
              size="sm"
              value={newHeader.value}
              onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
              placeholder="Valor do Header"
              onKeyPress={handleKeyPress}
              startContent={<Icon icon="solar:text-linear" className="text-default-400" />}
              classNames={{
                input: "text-small"
              }}
            />
            <Button
              isIconOnly
              size="sm"
              color="primary"
              variant="light"
              onPress={handleAddHeader}
            >
              <Icon icon="solar:add-circle-linear" className="text-lg" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default HeadersField;