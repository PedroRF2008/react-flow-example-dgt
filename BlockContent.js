'use client';

import { Input, Select, SelectItem, Textarea, Button, Card, CardBody } from "@heroui/react";
import { FieldTypes, BlockTypes, BlockLibrary } from '../../lib/blocks/library';
import ButtonsField from './ButtonsField';
import { useReactFlow, getIncomers } from 'reactflow';
import RoutesField from './RoutesField';
import { useMemo, useState, useEffect } from 'react';
import HeadersField from './HeadersField';
import BodyField from './BodyField';
import { Icon } from "@iconify/react";
import toast from 'react-hot-toast';
import ConditionsField from './ConditionsField';
import QueryBuilder from './QueryBuilder';
import InteractDataField from './InteractDataField';
import ChecklistField from './ChecklistField';
import VariableInput from './VariableInput';
import { useVariableSuggestions } from './VariableSuggestionsModal';
import VariablesModal from './VariablesModal';
import { 
  openVariableSuggestions, 
  closeVariableSuggestions,
  showModal 
} from './VariableSuggestionsModal';
import { analyzeJsonStructure } from '../../lib/utils/jsonStructureAnalyzer';

const methodColors = {
  GET: 'success',
  POST: 'warning',
  PUT: 'primary',
  PATCH: 'secondary',
  DELETE: 'danger'
};

const methodIcons = {
  GET: 'solar:square-arrow-down-linear',
  POST: 'solar:add-square-linear',
  PUT: 'solar:pen-linear',
  PATCH: 'solar:pen-2-linear',
  DELETE: 'solar:trash-bin-trash-linear'
};

const StatusBadge = ({ status, statusText }) => {
  const getStatusColor = () => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    return 'danger';
  };

  return (
    <div className={`px-3 py-1 rounded-full border-1 border-${getStatusColor()} bg-${getStatusColor()}/10 flex items-center gap-2`}>
      <div className={`w-2 h-2 rounded-full bg-${getStatusColor()}`} />
      <span className={`text-sm font-medium text-${getStatusColor()}`}>
        {status} {statusText}
      </span>
    </div>
  );
};

const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, obj);
  lastObj[lastKey] = value;
  return obj;
};

export default function BlockContent({ fields, data, onDataChange, nodeId }) {
  const reactFlowInstance = useReactFlow();
  const nodes = reactFlowInstance.getNodes();
  const edges = reactFlowInstance.getEdges();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseBody, setResponseBody] = useState(null);
  const [preview, setPreview] = useState(data?.preview || null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { openModal, closeModal } = useVariableSuggestions();

  const getAvailableVariables = (nodes, currentNodeId) => {
    const variables = [];

    // Get all nodes that come before this one in the flow
    const getUpstreamNodes = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return [];
      visited.add(nodeId);

      const node = reactFlowInstance.getNode(nodeId);
      if (!node) return [];

      // Use the utility function to get incomers
      const incomers = getIncomers(node, nodes, edges);
      const upstreamNodes = [...incomers];

      for (const incomer of incomers) {
        upstreamNodes.push(...getUpstreamNodes(incomer.id, visited));
      }

      return upstreamNodes;
    };

    // Get all upstream nodes for the current node
    const upstreamNodes = getUpstreamNodes(currentNodeId);

    // Extract variables from upstream nodes
    upstreamNodes.forEach(node => {
      if (node.data?.variables) {
        Object.entries(node.data.variables).forEach(([key, value]) => {
          if (value.name) {
            const blockConfig = BlockLibrary[node.data.blockType];
            variables.push({
              name: value.name,
              type: value.type,
              structure: value.structure || null,
              blockIcon: blockConfig?.customIcon || blockConfig?.icon || 'solar:box-bold',
              blockLabel: blockConfig?.label || 'Desconhecido',
              blockColor: blockConfig?.color || 'default'
            });
          }
        });
      }
    });

    return variables;
  };

  const handleInputChange = (e, onChange, availableVariables) => {
    const value = e.target.value;
    const previousValue = e.target.defaultValue;
    
    // If user types $, show suggestions
    if (value.endsWith('$')) {
      openModal(availableVariables, (variable) => {
        // Replace the $ with the variable
        const newValue = value.slice(0, -1) + '${' + variable.name + '}';
        onChange(newValue);
      });
    } 
    // Close if user removes the $ or types something after it
    else if (previousValue?.endsWith('$')) {
      closeModal();
    }
    
    onChange(value);
  };

  const handleBlur = (e) => {
    // Check if the new focused element is within the modal
    const modalElement = document.querySelector('[data-variables-modal]');
    if (modalElement?.contains(e.relatedTarget)) {
      // If we're focusing something inside the modal, don't close it
      return;
    }

    closeModal();
  };

  const handleTest = async () => {
    setIsLoading(true);
    setResponse(null);
    setResponseBody(null);

    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: data.url,
          method: data.method,
          headers: data.headers,
          body: data.body
        })
      });

      const responseData = await response.json();
      
      setResponse({
        status: responseData.status,
        statusText: responseData.statusText
      });
      setResponseBody(responseData.data);

      // Store preview data
      const previewData = {
        status: responseData.status,
        statusText: responseData.statusText,
        body: responseData.data
      };

      // Update variables if responseVariable is set
      if (data.responseVariable && data.responseVariable.trim() !== '') {
        const newVariable = {
          name: data.responseVariable,
          type: 'object',
          structure: {
            type: 'object',
            isExpandable: true,
            properties: analyzeResponseStructure(responseData.data).properties
          }
        };

        const existingVariables = (data.variables || [])
          .filter(v => v.name === data.responseVariable);

        const updatedVariables = cleanupVariables([...existingVariables, newVariable]);

        onDataChange({ 
          ...data,
          preview: previewData,
          variables: updatedVariables
        });
      } else {
        onDataChange({ 
          ...data,
          preview: previewData,
          variables: []
        });
      }

      if (!responseData.status || responseData.status >= 400) {
        toast.error(`Error: ${responseData.status} - ${responseData.statusText}`);
      }

    } catch (error) {
      toast.error(error.message);
      setResponse({ status: 500, statusText: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSenseData = async () => {
    if (data.blockType !== BlockTypes.SENSEDATA) return;
    
    setIsTestingApi(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/sensedata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: data.endpoint,
          filters: data.filters,
          token: data.token
        })
      });

      const responseData = await response.json();
      setTestResult(responseData);

      // Analyze the response structure and store it
      if (responseData.data) {
        const structure = analyzeJsonStructure(responseData.data);
        
        // Update the node data with the structure
        onDataChange({
          ...data,
          variables: {
            ...data.variables,
            response: {
              ...data.variables.response,
              structure
            }
          }
        });
      }

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsTestingApi(false);
    }
  };

  const getObjectStructure = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return [];
    
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return [...acc, {
          key: currentPath,
          type: 'object',
          children: getObjectStructure(value, currentPath)
        }];
      }
      return [...acc, {
        key: currentPath,
        type: typeof value,
        value
      }];
    }, []);
  };

  const renderField = (field) => {
    if (!field || !field.key) return null;

    const value = data?.[field.key] ?? field.defaultValue ?? '';
    const availableVariables = getAvailableVariables(nodes, nodeId);
    
    try {
      switch (field.type) {
        case FieldTypes.TEXT:
          return (
            <div>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              {field.description && (
                <p className="text-xs text-default-500 mb-2">{field.description}</p>
              )}
              <Input
                value={value || ''}
                onChange={(e) => handleInputChange(
                  e,
                  (newValue) => onDataChange({ [field.key]: newValue }),
                  availableVariables
                )}
                onBlur={handleBlur}
                placeholder={field.placeholder}
                size="sm"
                variant="bordered"
                startContent={field.startContent}
                isRequired={field.required}
              />
            </div>
          );

        case FieldTypes.TEXTAREA:
          return (
            <div className="relative">
              <Textarea
                label={field.label}
                placeholder={field.placeholder}
                value={value || ''}
                onChange={(e) => handleInputChange(
                  e,
                  (newValue) => onDataChange({ [field.key]: newValue }),
                  availableVariables
                )}
                onBlur={handleBlur}
                isRequired={field.required}
                className="w-full"
              />
            </div>
          );

        case FieldTypes.MESSAGE:
          return (
            <div>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              {field.description && (
                <p className="text-xs text-default-500 mb-2">{field.description}</p>
              )}
              <Textarea
                value={value}
                onChange={(e) => handleInputChange(
                  e,
                  (newValue) => onDataChange({ [field.key]: newValue }),
                  availableVariables
                )}
                placeholder={field.placeholder}
                minRows={3}
                classNames={{
                  base: "w-full"
                }}
              />
            </div>
          );

        case FieldTypes.BUTTONS:
          return (
            <div>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              {field.description && (
                <p className="text-xs text-default-500 mb-2">{field.description}</p>
              )}
              <ButtonsField
                value={value}
                onChange={(newButtons) => onDataChange({ [field.key]: newButtons })}
                maxButtons={field.maxButtons}
              />
            </div>
          );

        case FieldTypes.NUMBER:
          return (
            <Input
              key={field.key}
              label={field.label}
              type="number"
              min={field.min}
              max={field.max}
              value={value.toString()}
              onValueChange={(newValue) => onDataChange({ [field.key]: Number(newValue) || 0 })}
            />
          );

        case FieldTypes.SELECT:
          return (
            <div>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              {field.description && (
                <p className="text-xs text-default-500 mb-2">{field.description}</p>
              )}
              <Select
                selectedKeys={[value]}
                onChange={(e) => onDataChange({ [field.key]: e.target.value })}
                size="sm"
                variant="bordered"
                isRequired={field.required}
              >
                {field.options.map((option) => (
                  <SelectItem 
                    key={option.key} 
                    value={option.key}
                    textValue={option.label}
                    description={option.details}
                  >
                    {field.renderOption ? field.renderOption(option) : option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          );

        case FieldTypes.ROUTES:
          return (
            <div>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              {field.description && (
                <p className="text-xs text-default-500 mb-2">{field.description}</p>
              )}
              <RoutesField
                value={value}
                onChange={(newRoutes) => onDataChange({ [field.key]: newRoutes })}
                maxRoutes={field.maxRoutes}
              />
            </div>
          );

        case FieldTypes.HEADERS:
          return (
            <div className="space-y-1">
              <div className="bg-default-50 p-4 rounded-xl border-1 border-default-200">
                <HeadersField
                  value={value}
                  onChange={(newHeaders) => onDataChange({ [field.key]: newHeaders })}
                  maxHeaders={field.maxHeaders}
                />
              </div>
            </div>
          );

        case FieldTypes.BODY:
          if (field.showIf && !field.showIf(data)) return null;
          
          const bodyProps = field.props ? field.props(data) : {};
          
          return (
            <div className="space-y-4">
              <div className="bg-default-50 p-4 rounded-xl border-1 border-default-200">
                <BodyField
                  value={value}
                  onChange={(newBody) => onDataChange({ [field.key]: newBody })}
                  availableVariables={availableVariables}
                  url={data?.url}
                  methodIcons={methodIcons}
                  methodColors={methodColors}
                  {...bodyProps}
                />
              </div>
            </div>
          );

        case FieldTypes.CONDITIONS:
          return (
            <div>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              {field.description && (
                <p className="text-xs text-default-500 mb-2">{field.description}</p>
              )}
              <ConditionsField
                value={value}
                onChange={(newConditions) => onDataChange({ [field.key]: newConditions })}
                maxConditions={field.maxConditions}
                availableVariables={availableVariables}
              />
            </div>
          );

        case FieldTypes.QUERY:
          return (
            <div>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              {field.description && (
                <p className="text-xs text-default-500 mb-2">{field.description}</p>
              )}
              <QueryBuilder
                endpoint={data.endpoint}
                value={value || []}
                onChange={(newValue) => onDataChange({ [field.key]: newValue })}
                availableVariables={availableVariables}
              />
            </div>
          );

        case FieldTypes.INTERACT_DATA:
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-danger">*</span>}
                </label>
              </div>
              {field.description && (
                <p className="text-xs text-default-500">{field.description}</p>
              )}
              <div className="bg-default-50 p-4 rounded-xl border-1 border-default-200">
                <InteractDataField
                  value={value || []}
                  onChange={(newValue) => onDataChange({ [field.key]: newValue })}
                  variables={availableVariables}
                />
              </div>
            </div>
          );

        case FieldTypes.CHECKLIST:
          return (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {field.label}
              </label>
              <ChecklistField
                value={data[field.key] || []}
                onChange={(newValue) => onDataChange({ [field.key]: newValue })}
                options={field.options}
                description={field.description}
              />
            </div>
          );

        case FieldTypes.VARIABLE_INPUT:
          const currentValue = field.key.split('.').reduce((acc, key) => acc?.[key], data);
          const availableVariables = getAvailableVariables(nodes, nodeId);
          
          return (
            <div>
              <VariableInput
                label={field.label}
                value={currentValue || ''}
                onChange={(newValue) => {
                  const newData = { ...data };
                  setNestedValue(newData, field.key, newValue);
                  onDataChange(newData);
                }}
                placeholder={field.placeholder}
                required={field.required}
                variableType={field.variableType}
                description={field.description}
                availableVariables={availableVariables}
              />
            </div>
          );

        default:
          return null;
      }
    } catch (error) {
      console.warn(`Error rendering field ${field.key}:`, error);
      return null;
    }
  };

  const renderTestSection = () => {
    if (!data?.method) return null;

    return (
      <div className="space-y-4 mt-4 pt-4 border-t border-default-200">
        <div className="flex items-center justify-between">
          <Button
            size="md"
            color={methodColors[data.method]}
            variant="shadow"
            startContent={<Icon icon="solar:play-circle-linear" className="text-xl" />}
            endContent={<Icon icon={methodIcons[data.method]} className="text-lg" />}
            isLoading={isLoading}
            onPress={handleTest}
            className="font-medium"
          >
            Testar Requisição {data.method}
          </Button>
          
          {response ? (
            <StatusBadge 
              status={response.status} 
              statusText={response.statusText} 
            />
          ) : (
            <div className="px-3 py-1 rounded-full border-1 border-default-200 bg-default-100">
              <span className="text-sm text-default-400">
                Aguardando requisição...
              </span>
            </div>
          )}
        </div>

        <Card className="bg-default-50">
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Resposta</span>
              {responseBody && (
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Icon icon="solar:copy-linear" />}
                  onPress={() => {
                    navigator.clipboard.writeText(JSON.stringify(responseBody, null, 2));
                    toast.success('Copiado para a área de transferência!');
                  }}
                >
                  Copiar
                </Button>
              )}
            </div>
            <div className="w-[500px] bg-default-100 rounded-lg">
              {responseBody || (data?.preview?.body) ? (
                <div className="overflow-x-auto">
                  <pre className="p-3 text-xs font-mono">
                    {JSON.stringify(responseBody || data.preview.body, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="text-center text-default-400">
                    <div className="bg-default-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon icon="solar:code-square-line-duotone" className="text-2xl" />
                    </div>
                    <p className="text-sm font-medium">Nenhuma resposta ainda</p>
                    <p className="text-xs text-default-400">
                      Teste a requisição para ver a resposta aqui
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <div>
          <Input
            label="Salvar Resposta na Variável"
            placeholder="Nome da variável para salvar a resposta"
            value={data.responseVariable || ''}
            onChange={(newValue) => onDataChange({ responseVariable: newValue })}
            size="sm"
            startContent={<Icon icon="solar:programming-linear" className="text-default-400" />}
            description={responseBody ? "Variável que armazenará a resposta" : "Esta variável armazenará a resposta após o teste"}
          />
        </div>
      </div>
    );
  };

  const content = useMemo(() => (
    <div className="space-y-4">
      {/* Render fields that should be shown */}
      {fields
        .filter(field => !field.showIf || field.showIf(data))
        .map(field => (
          <div key={field.key}>
            {renderField(field)}
          </div>
        ))
      }

      {/* API Request Test Section */}
      {data.blockType === BlockTypes.API_REQUEST && renderTestSection()}

      {/* SenseData Test Section */}
      {data.blockType === BlockTypes.SENSEDATA && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Testar Integração</h3>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              isLoading={isTestingApi}
              onPress={handleTestSenseData}
              isDisabled={!data.token || !data.endpoint || !data.filters?.length}
              startContent={!isTestingApi && <Icon icon="solar:play-bold" />}
            >
              Testar
            </Button>
          </div>

          {testResult && (
            <Card className="bg-default-50">
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge 
                    status={testResult.status} 
                    statusText={testResult.statusText} 
                  />
                </div>

                {testResult.data && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Resposta:</p>
                    <pre className="text-xs bg-default-100 p-3 rounded-lg overflow-auto max-h-[200px]">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}

                {testResult.error && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-danger">Erro:</p>
                    <pre className="text-xs bg-danger-50 text-danger p-3 rounded-lg">
                      {testResult.error}
                    </pre>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  ), [fields, data, response, responseBody]);

  useEffect(() => {
    if (data?.preview) {
      setResponse({
        status: data.preview.status,
        statusText: data.preview.statusText
      });
      setResponseBody(data.preview.body);
    }
  }, [data?.preview]);

  return content;
} 