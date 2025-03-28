'use client';

import { useState } from 'react';
import { Input, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

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
  image: {
    icon: 'solar:gallery-wide-bold-duotone',
    label: 'Imagem'
  }
}[type] || { icon: 'solar:text-square-bold-duotone', label: 'Texto' });

export default function VariablesModal({ 
  isOpen, 
  onClose, 
  onSelect,
  variables
}) {
  const [search, setSearch] = useState('');
  
  const filteredVariables = variables.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed bottom-24 right-8 z-50 w-80 bg-background/80 backdrop-blur-md border border-default-200 rounded-lg shadow-xl"
    >
      <div className="p-3 border-b border-default-200">
        <Input
          placeholder="Buscar variável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={
            <Icon icon="solar:magnifer-linear" className="text-default-400" />
          }
          size="sm"
          variant="bordered"
          autoFocus
        />
      </div>

      <ScrollShadow className="max-h-64">
        <div className="p-1.5">
          {filteredVariables.length > 0 ? (
            filteredVariables.map((variable, index) => {
              const typeConfig = getTypeConfig(variable.type);
              
              return (
                <motion.button
                  key={variable.name}
                  className="w-full p-2 hover:bg-default-100 rounded-lg transition-colors flex items-start gap-3 text-left"
                  onClick={() => onSelect(variable)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="p-2 rounded-lg bg-default-100">
                    <Icon 
                      icon={typeConfig.icon}
                      className="text-xl text-default-600"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">
                        {variable.name}
                      </span>
                      <span className="text-xs text-default-400">
                        {typeConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-default-400">
                      <Icon 
                        icon={variable.blockIcon} 
                        className="text-sm"
                      />
                      <span className="text-xs">
                        {variable.blockLabel}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })
          ) : (
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
  );
} 