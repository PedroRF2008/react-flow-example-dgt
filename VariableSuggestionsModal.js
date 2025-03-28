'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Input, ScrollShadow, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

// Create a context for the modal
const VariableSuggestionsContext = createContext();

export function VariableSuggestionsProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [variables, setVariables] = useState([]);
  const [callback, setCallback] = useState(null);

  const openModal = (vars, onSelect) => {
    console.log('Opening modal with vars:', vars);
    setVariables(vars);
    setCallback(() => onSelect);
    setIsOpen(true);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setIsOpen(false);
    setCallback(null);
  };

  return (
    <VariableSuggestionsContext.Provider value={{ openModal, closeModal }}>
      {children}
      <VariableSuggestionsModal 
        isOpen={isOpen} 
        onClose={closeModal}
        variables={variables}
        onSelect={(variable) => {
          if (callback) callback(variable);
          closeModal();
        }}
      />
    </VariableSuggestionsContext.Provider>
  );
}

// Export hooks and functions
export const useVariableSuggestions = () => useContext(VariableSuggestionsContext);

const getTypeConfig = (type) => ({
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
  array: {
    icon: 'solar:list-bold-duotone',
    label: 'Lista'
  }
}[type] || { icon: 'solar:text-square-bold-duotone', label: 'Texto' });

const BlockIcon = ({ icon, color }) => {
  // Check if the icon is a URL (for custom images/SVGs)
  const isCustomIcon = icon?.startsWith('http') || icon?.startsWith('/');

  return (
    <div className={`p-1 rounded-md bg-${color || 'default'}-100`}>
      {isCustomIcon ? (
        <img 
          src={icon} 
          alt="Block Icon" 
          className="w-4 h-4 object-contain"
        />
      ) : (
        <Icon 
          icon={icon || 'solar:box-bold'} 
          className={`text-sm text-${color || 'default'}-500`}
        />
      )}
    </div>
  );
};

function VariableSuggestionsModal({ isOpen, onClose, variables, onSelect }) {
  const [search, setSearch] = useState('');
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentPath, setCurrentPath] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setNavigationStack([]);
      setCurrentPath('');
    }
  }, [isOpen]);

  const getCurrentStructure = () => {
    if (navigationStack.length === 0) return null;
    
    let current = navigationStack[navigationStack.length - 1].structure;
    return current.type === 'array' ? current.items : current;
  };

  const handleSelect = (item) => {
    const structure = item.structure;
    
    if (structure && (structure.type === 'object' || structure.type === 'array')) {
      // Navigate into the object/array
      setNavigationStack([...navigationStack, item]);
      setCurrentPath(structure.path);
    } else {
      // Select the final value
      if (onSelect) {
        const fullPath = item.path || item.name;
        onSelect({
          ...item,
          name: fullPath // This will be used to create ${fullPath} in the input
        });
      }
      onClose();
    }
  };

  const handleBack = () => {
    setNavigationStack(stack => stack.slice(0, -1));
    const newStack = navigationStack.slice(0, -1);
    setCurrentPath(newStack.length > 0 ? newStack[newStack.length - 1].structure.path : '');
  };

  const getFilteredItems = () => {
    if (navigationStack.length === 0) {
      // Show root variables
      return variables.filter(v => 
        v.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const current = getCurrentStructure();
    if (!current?.properties && !current?.items) return [];

    const items = current.properties || [current.items];
    return Object.entries(items)
      .map(([key, value]) => ({
        name: key,
        path: value.path,
        type: value.type,
        structure: value,
        preview: value.preview
      }))
      .filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase())
      );
  };

  if (!isOpen) return null;

  const filteredItems = getFilteredItems();

  return (
    <AnimatePresence>
      <motion.div
        data-variables-modal
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed bottom-24 right-8 z-50 w-80 bg-background/80 backdrop-blur-md border border-default-200 rounded-lg shadow-xl"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-3 border-b border-default-200">
          <h3 className="text-sm font-medium">
            {navigationStack.length > 0 ? 'Navegando Variável' : 'Variáveis Disponíveis'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-default-100 rounded-lg transition-colors text-default-400 hover:text-default-600"
          >
            <Icon icon="solar:close-circle-bold-duotone" className="text-xl" />
          </button>
        </div>

        {/* Navigation breadcrumbs */}
        {navigationStack.length > 0 && (
          <div className="p-2 border-b border-default-200">
            <Breadcrumbs size="sm">
              <BreadcrumbItem onClick={() => setNavigationStack([])}>
                Variables
              </BreadcrumbItem>
              {navigationStack.map((item, index) => (
                <BreadcrumbItem 
                  key={item.path || item.name}
                  onClick={() => setNavigationStack(navigationStack.slice(0, index + 1))}
                >
                  {item.name}
                </BreadcrumbItem>
              ))}
            </Breadcrumbs>
          </div>
        )}

        {/* Search bar - moved below header */}
        <div className="p-3 border-b border-default-200">
          <Input
            placeholder="Buscar variável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Icon icon="solar:magnifer-linear" className="text-default-400" />}
            size="sm"
            variant="bordered"
            autoFocus
          />
        </div>

        {/* Items list */}
        <ScrollShadow className="max-h-64">
          <div className="p-1.5">
            {navigationStack.length > 0 && (
              <motion.button
                className="w-full p-2 hover:bg-default-100 rounded-lg transition-colors flex items-center gap-2 text-left text-default-500"
                onClick={handleBack}
              >
                <Icon icon="solar:arrow-left-linear" />
                <span>Voltar</span>
              </motion.button>
            )}

            {filteredItems.map((item, index) => {
              const typeConfig = getTypeConfig(item.type);
              
              return (
                <motion.button
                  key={item.path || item.name}
                  className="w-full p-2 hover:bg-default-100 rounded-lg transition-colors flex items-start gap-3 text-left"
                  onClick={() => handleSelect(item)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Type Icon */}
                  <div className="p-2 rounded-lg bg-default-100">
                    <Icon 
                      icon={typeConfig.icon}
                      className="text-xl text-default-600"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">
                        {item.name}
                      </span>
                      {item.preview && (
                        <span className="text-xs text-default-400">
                          {item.preview}
                        </span>
                      )}
                    </div>

                    {/* Show block info only for root variables */}
                    {!navigationStack.length && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <BlockIcon 
                          icon={item.blockIcon} 
                          color={item.blockColor}
                        />
                        <span className="text-xs text-default-400">
                          {item.blockLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Show navigation arrow for objects/arrays */}
                  {item.structure && (item.structure.type === 'object' || item.structure.type === 'array') && (
                    <Icon 
                      icon="solar:arrow-right-linear" 
                      className="text-default-400"
                    />
                  )}
                </motion.button>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="py-8 text-center text-default-400">
                <Icon 
                  icon="solar:emoji-sad-circle-linear" 
                  className="text-4xl mx-auto mb-2"
                />
                <p className="text-sm">Nenhuma variável encontrada</p>
              </div>
            )}
          </div>
        </ScrollShadow>
      </motion.div>
    </AnimatePresence>
  );
} 