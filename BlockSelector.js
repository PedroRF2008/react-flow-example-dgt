'use client';

import { useState, useRef, useMemo } from 'react';
import { Input, Card, CardBody, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { BlockTypes } from '../../lib/blocks/library';
import { cn } from '../../lib/utils';

// Add this helper function at the top of the file
const BlockIcon = ({ icon, color }) => {
  if (icon.startsWith('/')) {
    return (
      <img 
        src={icon} 
        alt="" 
        className="w-6 h-6"
        style={{ filter: 'var(--icon-filter)' }} 
      />
    );
  }
  
  return (
    <Icon 
      icon={icon} 
      className={cn(
        "text-xl",
        {
          "text-warning-500": color === 'warning',
          "text-secondary-500": color === 'secondary',
          "text-primary-500": color === 'primary',
          "text-success-500": color === 'success',
          "text-default-500": color === 'default'
        }
      )}
    />
  );
};

export default function BlockSelector({ categories, blocks, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const categoryRefs = useRef({});

  // Filter out START block and organize remaining blocks by category
  const blocksByCategory = useMemo(() => {
    const filteredBlocks = blocks.filter(block => block.type !== BlockTypes.START);
    const categorizedBlocks = {};
    
    categories.forEach(category => {
      const categoryBlocks = filteredBlocks.filter(
        block => block.category.id === category.id
      );
      if (categoryBlocks.length > 0) {
        categorizedBlocks[category.id] = categoryBlocks;
      }
    });
    
    return categorizedBlocks;
  }, [blocks, categories]);

  // Filter categories that have no blocks
  const availableCategories = useMemo(() => {
    return categories.filter(category => blocksByCategory[category.id]?.length > 0);
  }, [categories, blocksByCategory]);

  // Scroll to category
  const scrollToCategory = (categoryId) => {
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Title Bar */}
      <div className="px-6 py-3 border-b border-default-200 bg-default-50">
        <div className="flex items-center gap-2">
          <Icon icon="solar:widget-add-bold-duotone" className="text-xl text-primary" />
          <div>
            <h4 className="font-medium text-foreground">Biblioteca de Blocos</h4>
            <p className="text-xs text-default-500">Selecione um bloco para adicionar ao seu fluxo</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Table of Contents */}
        <div className="w-48 shrink-0 border-r border-default-200 p-4 bg-default-50">
          <h5 className="text-xs font-medium text-default-500 uppercase tracking-wider mb-3">
            Categorias
          </h5>
          <nav className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors
                  ${blocksByCategory[category.id]?.length > 0 
                    ? 'hover:bg-default-100 cursor-pointer text-foreground'
                    : 'text-default-400 cursor-not-allowed'
                  }`}
                onPress={() => scrollToCategory(category.id)}
                disabled={blocksByCategory[category.id]?.length === 0}
              >
                <Icon icon={category.icon} className={`text-${category.color}-500`} />
                <span>{category.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Search Bar */}
          <div className="sticky top-0 z-10 p-4 bg-background/80 border-b border-default-200">
            <Input
              placeholder="Pesquisar blocos..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="solar:magnifer-linear" className="text-default-400" />}
              size="sm"
              variant="bordered"
              classNames={{
                input: "text-sm",
                inputWrapper: "shadow-none",
              }}
            />
          </div>

          {/* Block List */}
          <div className="p-4 space-y-6">
            {categories.map((category) => {
              const categoryBlocks = blocksByCategory[category.id];
              if (!categoryBlocks?.length) return null;

              return (
                <motion.div
                  key={category.id}
                  ref={el => categoryRefs.current[category.id] = el}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon 
                      icon={category.icon} 
                      className={`text-${category.color}-500 text-xl`}
                    />
                    <h3 className="font-medium">{category.label}</h3>
                    <div className="flex-1 h-px bg-default-200" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {categoryBlocks.map((block) => {
                      return (
                        <Card
                          key={block.type}
                          isPressable
                          className={cn(
                            "border-1 border-default-200 relative transition-colors",
                            {
                              "hover:border-warning-500": block.color === 'warning',
                              "hover:border-secondary-500": block.color === 'secondary',
                              "hover:border-primary-500": block.color === 'primary',
                              "hover:border-success-500": block.color === 'success',
                              "hover:border-default-500": block.color === 'default'
                            }
                          )}
                          onPress={() => onSelect(block.type)}
                        >
                          <CardBody className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                {
                                  "bg-warning-100 hover:bg-warning-200": block.color === 'warning',
                                  "bg-secondary-100 hover:bg-secondary-200": block.color === 'secondary',
                                  "bg-primary-100 hover:bg-primary-200": block.color === 'primary',
                                  "bg-success-100 hover:bg-success-200": block.color === 'success',
                                  "bg-default-100 hover:bg-default-200": block.color === 'default'
                                }
                              )}>
                                <BlockIcon icon={block.icon} color={block.color} />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{block.label}</p>
                                <p className="text-xs text-default-500 mt-0.5">
                                  {block.description}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 