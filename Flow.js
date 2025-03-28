'use client';

import { useCallback, useState } from 'react';
import { 
  Background, 
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow
} from 'reactflow';
import { BlockCategories, BlockLibrary, BlockTypes } from '../../lib/blocks/library';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/hooks/useToast';
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import CustomEdge from './CustomEdge';
import BlockSelector from './BlockSelector';
import BlockContextMenu from './BlockContextMenu';
import dynamic from 'next/dynamic';

// Dynamically import ReactFlow with no SSR
const ReactFlow = dynamic(() => import('reactflow').then(mod => mod.ReactFlow), {
  ssr: false
});

// Define edge types
const edgeTypes = {
  default: CustomEdge
};

export default function Flow() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const { deleteElements } = useReactFlow();

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'default',
      animated: false
    }, eds));
  }, [setEdges]);

  // Create a function to close context menu
  const closeContextMenu = useCallback(() => {
    setActiveContextMenu(null);
  }, []);

  // Add these handler functions
  const handleNodeContextMenu = useCallback((e, node) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (node.data.blockType === BlockTypes.START) return;
    
    setActiveContextMenu({
      id: node.id,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  const handlePaneContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    closeContextMenu();
  }, [closeContextMenu]);

  const handleDuplicateNode = useCallback((node) => {
    const newNode = {
      ...node,
      id: `${node.data.blockType}-${Date.now()}`,
      position: {
        x: node.position.x + 15,
        y: node.position.y - 15
      }
    };
    setNodes(nodes => [...nodes, newNode]);
  }, [setNodes]);

  const handleDeleteNode = useCallback((node) => {
    deleteElements({ nodes: [node] });
  }, [deleteElements]);

  return (
    <div 
      className="w-full h-full" 
      onClick={closeContextMenu}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'default',
          animated: false
        }}
        onContextMenu={(e) => e.preventDefault()}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={closeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
      >
        <Background />
        <Controls />

        {activeContextMenu && (
          <BlockContextMenu
            x={activeContextMenu.x}
            y={activeContextMenu.y}
            onClose={closeContextMenu}
            onDelete={() => {
              const node = nodes.find(n => n.id === activeContextMenu.id);
              if (node) handleDeleteNode(node);
              closeContextMenu();
            }}
            onDuplicate={() => {
              const node = nodes.find(n => n.id === activeContextMenu.id);
              if (node) handleDuplicateNode(node);
              closeContextMenu();
            }}
          />
        )}
      </ReactFlow>

      <Modal 
        isOpen={showBlockSelector} 
        onClose={() => setShowBlockSelector(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>Adicionar Bloco</ModalHeader>
          <ModalBody className="p-0">
            <BlockSelector
              categories={Object.values(BlockCategories)}
              blocks={Object.values(BlockLibrary)}
              companyTier={company?.billingInfo?.planTier || 'silver'}
              onSelect={(blockType) => {
                setShowBlockSelector(false);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
} 