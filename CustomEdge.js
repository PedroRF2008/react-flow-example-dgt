'use client';

import { useCallback, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, useReactFlow, getBezierPath } from 'reactflow';
import { Button } from "@heroui/react";
import { Icon } from '@iconify/react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleEdgeDelete = useCallback(() => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  }, [id, setEdges]);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider path for better hover detection */}
      <path
        d={edgePath}
        strokeWidth={20}
        fill="none"
        stroke="transparent"
        style={{ pointerEvents: 'stroke' }}
      />
      
      {/* Visible edge path */}
      <BaseEdge 
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isHovered ? 3 : 2,
          transition: 'stroke-width 0.2s'
        }}
      />

      {/* Delete button */}
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              zIndex: 1000,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              isIconOnly
              size="sm"
              className="w-6 h-6 min-w-unit-6 bg-white hover:bg-danger hover:text-white border-2 border-danger rounded-full shadow-lg flex items-center justify-center transition-all duration-200 group"
              onPress={handleEdgeDelete}
            >
              <Icon 
                icon="solar:close-circle-bold" 
                className="text-lg text-danger group-hover:text-white transition-colors duration-200" 
              />
            </Button>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
} 