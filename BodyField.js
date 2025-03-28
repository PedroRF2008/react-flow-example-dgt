'use client';

import { Button, Input, Select, SelectItem, Textarea, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import toast from 'react-hot-toast';
import { useVariableSuggestion } from '../../lib/hooks/useVariableSuggestion';
import VariablesModal from './VariablesModal';

const EmptyState = ({ type }) => (
  <div className="text-center text-default-400 py-6">
    <div className="bg-default-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
      <Icon 
        icon={type === 'json' ? "vscode-icons:file-type-json" : "mdi:form-outline"} 
        className="text-2xl" 
      />
    </div>
    <p className="text-sm font-medium">
      {type === 'json' ? 'Nenhum JSON configurado' : 'Nenhum campo configurado'}
    </p>
    <p className="text-xs text-default-400">
      {type === 'json' 
        ? 'Digite o JSON para enviar na requisição' 
        : 'Adicione campos para enviar no formulário'
      }
    </p>
  </div>
);

const replaceVariables = (text, variables) => {
  if (!text) return text;
  return text.replace(/\{\{(.*?)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim();
    return variables[trimmedVar] || match;
  });
};

const BodyField = ({ 
  value = { type: 'json', content: '' }, 
  onChange, 
  method = 'GET', 
  url = '',
  methodIcons = {},
  methodColors = {},
  availableVariables = []
}) => {
  const [newFormData, setNewFormData] = useState({ key: '', value: '' });
  
  const {
    showVariables,
    setShowVariables,
    handleChange,
    handleVariableSelect
  } = useVariableSuggestion(
    (newValue) => onChange({ ...value, content: newValue }),
    value.content,
    availableVariables
  );

  const {
    showVariables: showKeyVariables,
    setShowVariables: setShowKeyVariables,
    handleChange: handleKeyChange,
    handleVariableSelect: handleKeyVariableSelect
  } = useVariableSuggestion(
    (newValue) => setNewFormData({ ...newFormData, key: newValue }),
    newFormData.key,
    availableVariables
  );

  const {
    showVariables: showValueVariables,
    setShowVariables: setShowValueVariables,
    handleChange: handleValueChange,
    handleVariableSelect: handleValueVariableSelect
  } = useVariableSuggestion(
    (newValue) => setNewFormData({ ...newFormData, value: newValue }),
    newFormData.value,
    availableVariables
  );

  const handleTypeChange = (e) => {
    const newType = e.target.value || value.type;
    onChange({
      type: newType,
      content: newType === 'json' ? '' : []
    });
  };

  const handleJsonChange = (jsonContent) => {
    onChange({
      ...value,
      content: jsonContent
    });
  };

  const handleAddFormData = () => {
    if (!newFormData.key || !newFormData.value) return;
    
    const updatedContent = [...(value.content || []), newFormData];
    onChange({
      ...value,
      content: updatedContent
    });
    setNewFormData({ key: '', value: '' });
  };

  const handleRemoveFormData = (index) => {
    const updatedContent = value.content.filter((_, i) => i !== index);
    onChange({
      ...value,
      content: updatedContent
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFormData();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon 
          icon={methodIcons[method]} 
          className={`text-xl text-${methodColors[method]}`}
        />
        <span className={`text-sm font-medium text-${methodColors[method]}`}>
          {method} Request Body
        </span>
      </div>

      <Select 
        label="Tipo do Body"
        selectedKeys={[value.type]}
        onChange={handleTypeChange}
        selectionMode="single"
        disallowEmptySelection
        size="sm"
        startContent={<Icon icon={value.type === 'json' ? 'vscode-icons:file-type-json' : 'mdi:form-outline'} />}
      >
        <SelectItem 
          key="json" 
          value="json"
          startContent={<Icon icon="vscode-icons:file-type-json" />}
        >
          Raw JSON
        </SelectItem>
        <SelectItem 
          key="formdata" 
          value="formdata"
          startContent={<Icon icon="mdi:form-outline" />}
        >
          Form Data
        </SelectItem>
      </Select>

      <Divider className="my-4" />

      <div className="min-h-[200px]">
        {value.type === 'json' ? (
          <div className="relative">
            <Textarea
              value={value.content}
              onChange={handleChange}
              placeholder="Digite o JSON..."
            />
            <VariablesModal
              isOpen={showVariables}
              onClose={() => setShowVariables(false)}
              onSelect={handleVariableSelect}
              variables={availableVariables}
            />
            <div className="absolute right-2 top-2">
              <Icon icon="vscode-icons:file-type-json" className="text-2xl opacity-50" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Form Data List */}
            <div className="space-y-2 bg-default-50 p-3 rounded-lg border-1 border-default-200">
              {Array.isArray(value.content) && value.content.length > 0 ? (
                value.content.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        size="sm"
                        value={item.key}
                        placeholder="Nome do Campo"
                        isReadOnly
                        startContent={<Icon icon="solar:key-linear" className="text-default-400" />}
                        classNames={{
                          input: "text-small font-medium",
                          base: "w-full"
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        size="sm"
                        value={item.value}
                        isReadOnly
                        startContent={<Icon icon="solar:text-linear" className="text-default-400" />}
                        classNames={{
                          input: "text-small",
                          base: "w-full"
                        }}
                      />
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => handleRemoveFormData(index)}
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="text-lg" />
                    </Button>
                  </div>
                ))
              ) : (
                <EmptyState type="formdata" />
              )}
            </div>

            {/* Add New Form Data */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  size="sm"
                  value={newFormData.key}
                  onChange={handleKeyChange}
                  placeholder="Nome do Campo"
                  startContent={<Icon icon="solar:key-linear" className="text-default-400" />}
                />
              </div>
              <div className="flex-1">
                <Input
                  size="sm"
                  value={newFormData.value}
                  onChange={handleValueChange}
                  placeholder="Valor do Campo"
                  startContent={<Icon icon="solar:text-linear" className="text-default-400" />}
                />
              </div>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                variant="light"
                onPress={handleAddFormData}
              >
                <Icon icon="solar:add-circle-linear" className="text-lg" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <VariablesModal
        isOpen={showKeyVariables}
        onClose={() => setShowKeyVariables(false)}
        onSelect={handleKeyVariableSelect}
        variables={availableVariables}
      />

      <VariablesModal
        isOpen={showValueVariables}
        onClose={() => setShowValueVariables(false)}
        onSelect={handleValueVariableSelect}
        variables={availableVariables}
      />
    </div>
  );
};

export default BodyField;