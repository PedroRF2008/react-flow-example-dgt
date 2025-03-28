'use client';

import { useState } from 'react';
import { Icon } from "@iconify/react";
import { useNodeArrangement } from '../../lib/hooks/useNodeArrangement';
import { useTheme } from '../../lib/hooks/useTheme';
import BlockLibraryModal from './BlockLibraryModal';
import { Dock, DockIcon } from '../magicui/dock';

export default function BlockToolbar({ onSave, onDrop, reactFlowInstance, isSaving }) {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const { arrangeNodes } = useNodeArrangement();
  const { theme, toggleTheme } = useTheme();

  const handleAutoAlign = () => {
    if (!reactFlowInstance) return;

    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();

    const arrangedNodes = arrangeNodes(nodes, edges);
    reactFlowInstance.setNodes(arrangedNodes);
    
    setTimeout(() => {
      reactFlowInstance.fitView({ 
        padding: 0.2,
        duration: 800,
      });
    }, 50);
  };

  const calculateCenterPosition = () => {
    if (!reactFlowInstance) return { x: 0, y: 0 };

    const { x, y, zoom } = reactFlowInstance.getViewport();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = (-x + viewportWidth / 2) / zoom;
    const centerY = (-y + viewportHeight / 2) / zoom;

    const nodes = reactFlowInstance.getNodes();
    if (nodes.length === 0) return { x: centerX, y: centerY };

    const occupiedPositions = new Set(
      nodes.map(node => `${Math.round(node.position.x)},${Math.round(node.position.y)}`)
    );

    const spacing = 200;
    let radius = 0;
    let angle = 0;
    
    while (radius < Math.max(viewportWidth, viewportHeight)) {
      const testX = centerX + radius * Math.cos(angle);
      const testY = centerY + radius * Math.sin(angle);
      
      const roundedPos = `${Math.round(testX)},${Math.round(testY)}`;
      if (!occupiedPositions.has(roundedPos)) {
        return { x: testX, y: testY };
      }

      angle += Math.PI / 4;
      if (angle >= Math.PI * 2) {
        angle = 0;
        radius += spacing;
      }
    }

    return { x: centerX, y: centerY };
  };

  const handleAddBlock = (blockType) => {
    const position = calculateCenterPosition();
    const fakeEvent = {
      clientX: position.x,
      clientY: position.y,
      dataTransfer: {
        getData: () => blockType,
      },
      target: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
        }),
      },
      preventDefault: () => {},
    };
    onDrop(fakeEvent);
  };

  return (
    <div className="relative">
      <Dock 
        className="bg-background/60 backdrop-blur-md border-1 border-default-200 p-1"
        iconSize={40}
        iconMagnification={50}
        iconDistance={20}
      >
        <DockIcon>
          <Icon 
            icon="solar:add-circle-bold-duotone" 
            className="size-full text-default-600 hover:text-primary transition-colors"
            onClick={() => setIsBlockModalOpen(true)}
          />
        </DockIcon>

        <DockIcon>
          <Icon 
            icon="solar:magic-stick-3-bold-duotone" 
            className="size-full text-default-600 hover:text-primary transition-colors"
            onClick={handleAutoAlign}
          />
        </DockIcon>

        <DockIcon>
          <Icon 
            icon={isSaving ? "solar:refresh-circle-bold-duotone" : "solar:diskette-bold-duotone"}
            className={`size-full text-default-600 hover:text-primary transition-colors ${
              isSaving ? 'animate-spin' : ''
            }`}
            onClick={onSave}
          />
        </DockIcon>

        <DockIcon>
          <Icon 
            icon={theme === "light" ? "solar:moon-bold-duotone" : "solar:sun-bold-duotone"}
            className="size-full text-default-600 hover:text-primary transition-colors"
            onClick={toggleTheme}
          />
        </DockIcon>
      </Dock>

      <BlockLibraryModal 
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSelectBlock={handleAddBlock}
      />
    </div>
  );
} 