'use client';

import { Modal, ModalContent, ModalBody, Input, Button } from "@heroui/react";
import { BlockCategories, BlockLibrary } from '../../lib/blocks/library';
import { Icon } from "@iconify/react";
import { useState, useMemo } from 'react';
import { motion } from "framer-motion";
import { cn } from '../../lib/utils';

// Debug logs at the top level
console.log('BlockCategories:', BlockCategories);
console.log('BlockLibrary:', BlockLibrary);
console.log('BlockLibrary type:', typeof BlockLibrary);
console.log('BlockLibrary keys:', Object.keys(BlockLibrary));

// Add this helper component at the top of the file
const BlockIcon = ({ icon, className, block }) => {
  if (typeof icon === 'string' && icon.startsWith('/')) {
    // Map integration blocks to their brand background colors
    const brandBackgrounds = {
      'interact': 'bg-[#0066FF]/10',
      'sensedata': 'bg-[#10B981]/10',
      // Add other integration brand background colors here
    };

    const brandBg = brandBackgrounds[block.type.toLowerCase().split('_')[0]] || 'bg-default-100';

    return (
      <div className={cn(
        "w-full h-full rounded-lg flex items-center justify-center",
        brandBg
      )}>
        <img 
          src={icon} 
          alt="" 
          className={cn("w-7 h-7", className)}
          style={{ filter: 'var(--icon-filter)' }} 
        />
      </div>
    );
  }
  
  return <Icon icon={icon} className={className} />;
};

// Helper to get block color (for Tailwind classes)
const getBlockColor = (block) => {
  // If it's an integration block (has custom icon), use its specific color
  if (block.icon?.startsWith('/')) {
    // Map integration blocks to their brand colors
    const brandColors = {
      'interact': 'blue',
      'sensedata': 'emerald',
      // Add other integration brand colors here
    };
    return brandColors[block.type.toLowerCase().split('_')[0]] || 'default';
  }
  // Otherwise use category color
  return block.category?.color || 'default';
};

// Helper to get exact brand colors (for borders and special effects)
const getBrandColor = (block) => {
  if (block.icon?.startsWith('/')) {
    const brandColors = {
      'interact': '#0066FF',
      'sensedata': '#10B981',
      // Add other integration brand hex colors here
    };
    return brandColors[block.type.toLowerCase().split('_')[0]];
  }
  return null;
};

export default function BlockLibraryModal({ isOpen, onClose, onSelectBlock }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Group blocks by category
  const groupedBlocks = useMemo(() => {
    // Filter out the START block and then apply search filter
    const blocks = Object.values(BlockLibrary)
      .filter(block => block.type !== 'start') // Remove START block
      .filter(block => {
        return block.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               block.description?.toLowerCase().includes(searchQuery.toLowerCase());
      });

    // If "All" is selected, group by category
    if (selectedCategory === 'all') {
      return blocks.reduce((acc, block) => {
        const categoryId = block.category?.id?.toUpperCase();
        if (!categoryId) return acc;
        
        if (!acc[categoryId]) acc[categoryId] = [];
        acc[categoryId].push(block);
        return acc;
      }, {});
    }

    // If specific category is selected, only show those blocks
    return {
      [selectedCategory]: blocks.filter(block => 
        block.category?.id === selectedCategory
      )
    };
  }, [searchQuery, selectedCategory]);

  return (
    <Modal 
      isOpen={isOpen} 
      size="5xl"
      hideCloseButton
      classNames={{
        base: "h-[90vh] max-h-[90vh] my-0",
        wrapper: "overflow-hidden h-screen items-center",
        body: "p-0",
      }}
      onClose={onClose}
    >
      <ModalContent>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r border-default-200 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:library-bold-duotone" className="text-2xl text-primary" />
              <h2 className="text-lg font-semibold">Biblioteca</h2>
            </div>
            
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left",
                selectedCategory === 'all' 
                  ? "bg-primary text-white"
                  : "hover:bg-default-100"
              )}
            >
              <Icon icon="solar:widget-bold-duotone" />
              Todos os Blocos
            </button>
            
            {Object.values(BlockCategories).map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left",
                  selectedCategory === category.id 
                    ? "bg-primary text-white"
                    : "hover:bg-default-100"
                )}
              >
                <Icon icon={category.icon} />
                {category.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header with search and custom close button */}
            <div className="p-4 border-b border-default-200 flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar blocos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<Icon icon="solar:magnifer-bold-duotone" />}
                  className="w-full"
                />
              </div>
              <Button
                isIconOnly
                variant="light"
                onPress={onClose}
                className="text-default-500"
              >
                <Icon icon="solar:close-circle-bold-duotone" className="text-xl" />
              </Button>
            </div>

            {/* Blocks Display */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {Object.entries(groupedBlocks).map(([categoryId, blocks]) => {
                  if (!blocks || blocks.length === 0) return null;
                  
                  // Get category using uppercase ID
                  const category = BlockCategories[categoryId.toUpperCase()];
                  if (!category) return null;
                  
                  return (
                    <motion.div
                      key={categoryId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <Icon 
                          icon={category.icon} 
                          className={`text-xl text-${category.color}-500`}
                        />
                        <h3 className="text-lg font-medium">{category.label}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {blocks.map(block => (
                          <motion.button
                            key={block.type}
                            onClick={() => {
                              onSelectBlock(block.type);
                              onClose();
                            }}
                            className={cn(
                              "group relative flex items-start gap-4 p-4 rounded-xl border",
                              "bg-default-50/50 transition-all duration-200 text-left",
                              "hover:scale-[1.02] hover:shadow-lg hover:shadow-default-200/20",
                              getBrandColor(block)
                                ? "border-default-200 hover:border-[var(--brand-color)]"
                                : `border-default-200 hover:border-${getBlockColor(block)}-500`,
                              getBrandColor(block)
                                ? "hover:bg-[var(--brand-color)]/5"
                                : `hover:bg-${getBlockColor(block)}-50/50`
                            )}
                            style={{
                              '--brand-color': getBrandColor(block)
                            }}
                            whileHover={{ 
                              scale: 1.02,
                              transition: { duration: 0.2, ease: "easeOut" }
                            }}
                          >
                            {/* Glow effect on hover */}
                            <div className={cn(
                              "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200",
                              `bg-${getBlockColor(block)}-500/5 group-hover:opacity-100`
                            )} />

                            <div className={cn(
                              "shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 z-10",
                              block.icon?.startsWith('/')
                                ? `bg-${getBlockColor(block)}-100 dark:bg-${getBlockColor(block)}-900/30 
                                   group-hover:bg-${getBlockColor(block)}-200 dark:group-hover:bg-${getBlockColor(block)}-800/40`
                                : cn(
                                    `bg-${block.category.color || 'default'}-100 dark:bg-${block.category.color || 'default'}-900/30`,
                                    `group-hover:bg-${block.category.color || 'default'}-200 dark:group-hover:bg-${block.category.color || 'default'}-800/40`
                                  ),
                              "group-hover:scale-110"
                            )}>
                              <BlockIcon 
                                icon={block.icon}
                                block={block}
                                className={cn(
                                  "transition-transform",
                                  block.icon?.startsWith('/')
                                    ? "w-7 h-7" // Custom size for image icons
                                    : cn(
                                        "text-2xl",
                                        `text-${getBlockColor(block)}-500 dark:text-${getBlockColor(block)}-400`
                                      )
                                )}
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0 z-10">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium transition-colors duration-200",
                                  `group-hover:text-${getBlockColor(block)}-600`
                                )}>
                                  {block.label}
                                </span>
                                <Icon 
                                  icon="solar:alt-arrow-right-bold-duotone" 
                                  className={cn(
                                    "text-lg opacity-0 group-hover:opacity-100 transition-all duration-200",
                                    "group-hover:translate-x-1",
                                    `text-${getBlockColor(block)}-500`
                                  )}
                                />
                              </div>
                              {block.description && (
                                <p className="text-sm text-default-500 mt-1 line-clamp-2">
                                  {block.description}
                                </p>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
} 