'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, useReactFlow, useEdges } from 'reactflow';
import { Card, CardBody, CardHeader, Button, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useBlocks } from '../../lib/hooks/useBlocks';
import { BlockTypes } from '../../lib/blocks/library';
import { getOutputConfiguration } from '../../lib/blocks/connections';
import { ConnectionTypes } from '../../lib/blocks/types';
import BlockFooter from './BlockFooter';
import BlockContent from './BlockContent';
import BlockSelector from './BlockSelector';
import BlockLibraryModal from './BlockLibraryModal';
import BlockContextMenu from './BlockContextMenu';

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
      className={`text-xl ${
        color ? `text-${color}` : 'text-default-600'
      }`}
    />
  );
};

export default function CustomNode({ id, data, isConnectable, handleNodeChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [localData, setLocalData] = useState(data);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const timeoutRef = useRef(null);
  const [activeOutputIndex, setActiveOutputIndex] = useState(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const connectionRef = useRef(false);
  const [contextMenu, setContextMenu] = useState(null);
  
  const { getEdges, deleteElements, setNodes, setEdges, getNodes, getViewport, screenToFlowPosition } = useReactFlow();
  const edges = useEdges();
  const { getBlockConfig, createBlock, getAllBlockConfigs } = useBlocks();
  
  // Get block configuration with fallback
  const blockConfig = getBlockConfig(data?.blockType) || {
    icon: 'solar:box-bold',
    color: 'default',
    label: 'Unknown Block',
    connections: { input: 1, output: 1 },
    fields: []
  };

  const outputConfig = getOutputConfiguration(data?.blockType, data);

  const blocks = getAllBlockConfigs();

  // Update local data when props change
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Cleanup timeout on unmount
  useEffect(() => {
    const currentTimeout = timeoutRef.current;
    return () => {
      if (currentTimeout) clearTimeout(currentTimeout);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovering(false);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleDataChange = useCallback((newData) => {
    // Preserve the original block type and other essential properties
    const updatedData = {
      ...localData,
      ...newData,
      blockType: data.blockType, // Preserve the block type
      label: data.label, // Preserve the label
      onChange: data.onChange // Preserve the onChange handler
    };
    
    setLocalData(updatedData);
    if (data.onChange) {
      data.onChange(updatedData);
    }
  }, [data, localData]);

  // Get connection limits from block config
  const connectionLimits = blockConfig?.connections || { input: 1, output: 1 };

  // Simplified connection check - just check if a specific output has a connection
  const hasConnectionForOutput = useCallback((outputIndex) => {
    return edges.some(edge => 
      edge.source === id && 
      edge.sourceHandle === `output-${outputIndex}`
    );
  }, [edges, id]);

  // Simplified target connection check
  const isTargetConnectable = useCallback(() => {
    if (!isConnectable) return false;
    // Only prevent connections to Start blocks
    return data.blockType !== BlockTypes.START;
  }, [isConnectable, data.blockType]);

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const handleDelayChange = useCallback((newDelay) => {
    handleDataChange({ delay: newDelay });
  }, [handleDataChange]);

  // Function to handle adding a new connected block
  const handleAddBlock = useCallback((blockType) => {
    const nodes = getNodes();
    const currentNode = nodes.find(n => n.id === id);
    
    const newPosition = {
      x: currentNode.position.x + 350,
      y: currentNode.position.y,
    };

    const newNode = createBlock(blockType, newPosition, handleNodeChange);
    if (!newNode) return;

    // For Start block, handle edge updates first
    if (data.blockType === BlockTypes.START) {
      connectionRef.current = true; // Set connection state immediately
      setShowBlockSelector(false);
      
      // Then update the nodes and edges
      setNodes((nds) => nds.concat(newNode));
      setEdges((eds) => {
        const filteredEdges = eds.filter(edge => edge.source !== id);
        const newEdge = {
          id: `${id}-${newNode.id}`,
          source: id,
          target: newNode.id,
          type: 'default'
        };
        return [...filteredEdges, newEdge];
      });
    } else {
      // For other blocks, proceed normally
      setNodes((nds) => nds.concat(newNode));
      const newEdge = {
        id: `${id}-${newNode.id}`,
        source: id,
        target: newNode.id,
        type: 'default',
        ...(data.blockType === BlockTypes.BUTTON_NAVIGATION && 
          activeOutputIndex !== null && {
            sourceHandle: `output-${activeOutputIndex}`
          }
        ),
        ...(data.blockType === BlockTypes.AI_ROUTER && 
          activeOutputIndex !== null && {
            sourceHandle: `output-${activeOutputIndex}`
          }
        )
      };
      setEdges((eds) => eds.concat(newEdge));
    }

    setShowAddBlock(false);
    setActiveOutputIndex(null);
  }, [id, setNodes, setEdges, handleNodeChange, getNodes, createBlock, data.blockType, activeOutputIndex]);

  // Modify the button click handler
  const handleAddButtonPress = (index = null) => {
    setActiveOutputIndex(index);
    setShowBlockSelector(true);
  };

  // Get actual output connections count based on buttons for navigation block
  const getMaxOutputs = () => {
    if (data.blockType === BlockTypes.BUTTON_NAVIGATION) {
      return data.buttons?.length || 0;
    }
    if (data.blockType === BlockTypes.AI_ROUTER) {
      return data.routes?.length || 0;
    }
    if (data.blockType === BlockTypes.CONDITIONAL) {
      // Add 1 for the else route
      return (data.conditions?.length || 0) + 1;
    }
    return blockConfig.connections.output;
  };

  // Add special styling for Start block
  const isStartBlock = data.blockType === BlockTypes.START;
  
  // Check if the Start block has a connection
  const hasStartConnection = useCallback(() => {
    const edges = getEdges();
    return edges.some(edge => edge.source === id);
  }, [getEdges, id]);

  // Add this section before the dynamic outputs section
  const hasSuccessErrorOutputs = (
    data.blockType === BlockTypes.API_REQUEST || 
    data.blockType === BlockTypes.SENSEDATA ||
    data.blockType === BlockTypes.AUTO_ENERGY_READER
  );

  // Render output handles based on configuration
  const renderOutputHandles = () => {
    if (!outputConfig) return null;

    // Special handling for integration type (success/error)
    if (outputConfig.type === ConnectionTypes.INTEGRATION) {
      return (
        <>
          {/* Success handle */}
          <div className="absolute -right-20 top-0 flex items-center gap-2 h-8">
            <span className="px-2 py-1 text-xs rounded-full bg-success-100 text-success-600 font-medium">
              Sucesso
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id="success"
              isConnectable={isConnectable}
              className="w-2 h-2 !bg-success-100 !border-success-500 !border-2 !transform-none !transition-none -mt-1"
            />
          </div>
          
          {/* Error handle */}
          <div className="absolute -right-20 top-8 flex items-center gap-2 h-8">
            <span className="px-2 py-1 text-xs rounded-full bg-danger-100 text-danger-600 font-medium">
              Erro
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id="error"
              isConnectable={isConnectable}
              className="w-2 h-2 !bg-danger-100 !border-danger-500 !border-2 !transform-none !transition-none -mt-1"
            />
          </div>
        </>
      );
    }

    // Default handle rendering for other types
    if (outputConfig.type === ConnectionTypes.NUMBERED) {
      return outputConfig.handles.map((handle, index) => (
        <div 
          key={handle.id}
          className={`absolute -right-10 flex items-center gap-2 h-8`}
          style={{ top: `${index * 30}px` }}
        >
          <span className={`px-2 py-1 text-xs rounded-full font-medium
            ${blockConfig.color === 'warning' ? 'bg-warning-100 text-warning-600' : ''}
            ${blockConfig.color === 'secondary' ? 'bg-secondary-100 text-secondary-600' : ''}
            ${blockConfig.color === 'primary' ? 'bg-primary-100 text-primary-600' : ''}
            ${blockConfig.color === 'success' ? 'bg-success-100 text-success-600' : ''}
            ${blockConfig.color === 'default' ? 'bg-default-100 text-default-600' : ''}
          `}>
            {index + 1}
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id={handle.id}
            isConnectable={isConnectable}
            className={`w-2 h-2 !border-2 !transform-none !transition-none -mt-1
              ${blockConfig.color === 'warning' ? '!bg-warning-100 !border-warning-500' : ''}
              ${blockConfig.color === 'secondary' ? '!bg-secondary-100 !border-secondary-500' : ''}
              ${blockConfig.color === 'primary' ? '!bg-primary-100 !border-primary-500' : ''}
              ${blockConfig.color === 'success' ? '!bg-success-100 !border-success-500' : ''}
              ${blockConfig.color === 'default' ? '!bg-default-100 !border-default-500' : ''}
            `}
          />
        </div>
      ));
    }
    
    // For conditional outputs
    if (outputConfig.type === ConnectionTypes.CONDITIONAL) {
      return outputConfig.handles.map((handle, index) => {
        const isElse = handle.id === 'else';
        return (
          <div 
            key={handle.id}
            className={`absolute -right-10 flex items-center gap-2 h-8`}
            style={{ top: `${index * 30}px` }}
          >
            <span className={`px-2 py-1 text-xs rounded-full font-medium
              ${isElse ? 'bg-danger-100 text-danger-600' : 'bg-warning-100 text-warning-600'}
            `}>
              {isElse ? 'Else' : index + 1}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={handle.id}
              isConnectable={isConnectable}
              className={`w-2 h-2 !border-2 !transform-none !transition-none -mt-1
                ${isElse ? '!bg-danger-100 !border-danger-500' : '!bg-warning-100 !border-warning-500'}
              `}
            />
          </div>
        );
      });
    }
    
    // For any other type of output
    return (
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          isConnectable={isConnectable}
          className="w-3 h-3 -mr-0.5"
        />
      </div>
    );
  };

  // Add input handle
  const renderInputHandle = () => (
    <div className="absolute left-0 top-1/2 -translate-y-1/2">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 -ml-0.5"
      />
    </div>
  );

  // Add back the context menu state and handlers
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't show context menu for Start block
    if (data.blockType === BlockTypes.START) return;

    // Just set a flag to show the menu
    setContextMenu(true);
  }, [data.blockType]);

  const handleDuplicate = useCallback(() => {
    const nodes = getNodes();
    const currentNode = nodes.find(n => n.id === id);
    
    if (!currentNode) return;

    const newNode = {
      id: `${data.blockType}-${Date.now()}`,
      type: 'customNode',
      position: {
        x: currentNode.position.x + 15,
        y: currentNode.position.y - 15
      },
      data: {
        ...data,
        onChange: handleNodeChange
      }
    };
    
    setNodes(nodes => [...nodes, newNode]);
  }, [data, id, getNodes, setNodes, handleNodeChange]);

  // Add this effect to handle clicks outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = (e) => {
      if (!e.target.closest('.context-menu')) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [contextMenu]);

  return (
    <div 
      className="relative" 
      onContextMenu={handleContextMenu}
    >
      {!isStartBlock && renderInputHandle()}

      <Card
        className={`card min-w-[200px] ${
          isStartBlock 
            ? 'bg-success-50 border-2 border-success-200 cursor-default' 
            : 'bg-content1 cursor-move'
        }`}
        shadow="sm"
        draggable={!isStartBlock}
        onDragStart={(e) => {
          if (isStartBlock) {
            e.preventDefault();
            return;
          }
          e.stopPropagation();
          const dragImage = new Image();
          dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          e.dataTransfer.setDragImage(dragImage, 0, 0);
        }}
      >
        <CardHeader className="flex justify-between items-center px-4 py-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <BlockIcon 
                icon={blockConfig.icon} 
                color={isStartBlock ? 'success' : blockConfig.color} 
              />
              <span className={`font-medium ${
                isStartBlock ? 'text-success' : 'text-default-700'
              }`}>
                {data.label || blockConfig.label}
              </span>
            </div>
            {/* Add delay indicator */}
            {data.delay > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Icon 
                  icon="solar:clock-circle-linear" 
                  className="text-xs text-default-400" 
                />
                <span className="text-xs text-default-400">
                  {data.delay}s de atraso
                </span>
              </div>
            )}
          </div>
          
          {/* Hide edit/delete buttons for Start block */}
          {!isStartBlock && (
            <div className="flex items-center gap-1 ml-3">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={toggleEditing}
                className={`text-default-600 hover:text-default-800 transition-all duration-200 ${
                  isEditing ? 'rotate-180' : ''
                }`}
              >
                <Icon 
                  icon="solar:alt-arrow-down-linear" 
                  className="w-4 h-4" 
                />
              </Button>
            </div>
          )}
        </CardHeader>

        {isEditing && (
          <CardBody 
            className="p-4 nodrag"
            onPress={(e) => e.stopPropagation()}
          >
            <BlockContent 
              fields={blockConfig?.fields}
              data={localData}
              onDataChange={handleDataChange}
              nodeId={id}
            />
            <BlockFooter 
              onDelete={handleDelete}
              delay={localData.delay || 0}
              onDelayChange={handleDelayChange}
            />
          </CardBody>
        )}
      </Card>

      {/* Output handle for Start block */}
      {isStartBlock && !outputConfig && (
        <>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Handle
              type="source"
              position={Position.Right}
              isConnectable={isConnectable && !hasStartConnection()}
              className="w-3 h-3 -mr-0.5"
            />
          </div>
          {!connectionRef.current && !hasStartConnection() && (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="absolute -right-12 top-1/2 -translate-y-1/2 min-w-unit-6 w-6 h-6 bg-success-100 hover:bg-success-200"
              onPress={() => handleAddButtonPress()}
            >
              <Icon 
                icon="solar:add-circle-bold" 
                className="text-success-600" 
              />
            </Button>
          )}
        </>
      )}

      {renderOutputHandles()}

      <BlockLibraryModal 
        isOpen={showBlockSelector}
        onClose={() => setShowBlockSelector(false)}
        onSelectBlock={handleAddBlock}
      />

      {contextMenu && (
        <div className="absolute left-0 top-full mt-1 z-[9999]">
          <BlockContextMenu
            onClose={() => setContextMenu(null)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </div>
      )}
    </div>
  );
} 