'use client';

import { BlockTypes } from './library';
import { getOutputConfiguration } from './connections';
import { ConnectionTypes } from './types';

/**
 * Create node data for a new block
 * @param {Object} blockConfig - Block configuration
 * @param {string} nodeId - Node ID
 * @param {Function} handleNodeChange - Function to handle node changes
 * @returns {Object} Node data
 */
export function createNodeData(blockConfig, nodeId, handleNodeChange) {
  return {
    id: nodeId,
    type: 'customNode',
    data: {
      ...blockConfig.defaultData,
      blockType: blockConfig.type,
      label: blockConfig.label,
      onChange: (newData) => handleNodeChange(nodeId, newData),
    },
  };
}

/**
 * Validate connections between nodes
 * @param {Object} sourceNode - Source node
 * @param {Object} targetNode - Target node
 * @param {Object} params - Connection parameters
 * @param {Array} edges - Existing edges
 * @param {Object} blockLibrary - Block library
 * @returns {Object} Validation result with isValid flag and message
 */
export function validateNodeConnections(sourceNode, targetNode, params, edges, blockLibrary) {
  const sourceBlock = blockLibrary[sourceNode.data.blockType];
  const targetBlock = blockLibrary[targetNode.data.blockType];

  // Check if blocks exist in library
  if (!sourceBlock || !targetBlock) {
    return {
      isValid: false,
      message: 'Bloco inválido'
    };
  }

  // Check if blocks have connection configurations
  if (!sourceBlock.connections || !targetBlock.connections) {
    return {
      isValid: false,
      message: 'Configuração de conexão inválida'
    };
  }

  // Prevent self-connections and connections to Start blocks
  if (sourceNode.id === targetNode.id || targetBlock.connections.input === 0) {
    return {
      isValid: false,
      message: 'Conexão inválida'
    };
  }

  // Get output configuration for source node
  const outputConfig = getOutputConfiguration(sourceNode.data.blockType, sourceNode.data);
  if (!outputConfig) {
    return {
      isValid: false,
      message: 'Configuração de saída inválida'
    };
  }

  // For integration type blocks (with success/error outputs)
  if (sourceBlock.connections.output.type === ConnectionTypes.INTEGRATION) {
    const sourceHandle = params.sourceHandle;
    
    if (!sourceHandle) {
      return {
        isValid: false,
        message: 'Conexão inválida'
      };
    }
    
    // Check if there's already a connection from this specific handle
    const existingConnections = edges.filter(edge => 
      edge.source === sourceNode.id && 
      edge.sourceHandle === sourceHandle
    );
    
    if (existingConnections.length > 0) {
      return {
        isValid: false,
        message: `Esta saída de ${sourceHandle === 'success' ? 'sucesso' : 'erro'} já possui uma conexão`
      };
    }
    
    return {
      isValid: true,
      message: 'Conexão válida'
    };
  }

  // For numbered type blocks (multiple numbered outputs)
  if (sourceBlock.connections.output.type === ConnectionTypes.NUMBERED) {
    const sourceHandle = params.sourceHandle;
    
    if (!sourceHandle) {
      return {
        isValid: false,
        message: 'Conexão inválida'
      };
    }
    
    // Check if there's already a connection from this specific numbered handle
    const existingConnections = edges.filter(edge => 
      edge.source === sourceNode.id && 
      edge.sourceHandle === sourceHandle
    );
    
    if (existingConnections.length > 0) {
      // Extract the number from the handle ID (e.g., "output-1" -> "1")
      const outputNumber = parseInt(sourceHandle.split('-')[1]) + 1;
      return {
        isValid: false,
        message: `A saída ${outputNumber} já possui uma conexão`
      };
    }
    
    return {
      isValid: true,
      message: 'Conexão válida'
    };
  }

  // For default type blocks (single output)
  if (sourceBlock.connections.output.type === ConnectionTypes.DEFAULT) {
    // Check if there's already a connection from this node
    const existingConnections = edges.filter(edge => 
      edge.source === sourceNode.id
    );
    
    if (existingConnections.length > 0) {
      return {
        isValid: false,
        message: 'Este bloco já possui uma conexão de saída'
      };
    }
    
    return {
      isValid: true,
      message: 'Conexão válida'
    };
  }

  // For other types of blocks
  return {
    isValid: true,
    message: 'Conexão válida'
  };
}

/**
 * Get block routes for node
 * @param {Object} node - Node to get routes for
 * @param {Array} edges - Existing edges
 * @returns {string|Array|Object} Route information
 */
export function getBlockRoutes(node, edges) {
  if (!node) return '';

  const outputConfig = getOutputConfiguration(node.data.blockType, node.data);
  if (!outputConfig) return '';

  switch (outputConfig.type) {
    case ConnectionTypes.DEFAULT:
      const nextEdge = edges.find(edge => edge.source === node.id);
      return nextEdge?.target || '';

    case ConnectionTypes.NUMBERED:
    case ConnectionTypes.CONDITIONAL:
      return outputConfig.handles.map(handle => {
        const edge = edges.find(e => 
          e.source === node.id && 
          e.sourceHandle === handle.id
        );
        return edge?.target || '';
      });

    case ConnectionTypes.INTEGRATION:
      return {
        success: edges.find(e => 
          e.source === node.id && 
          e.sourceHandle === 'success'
        )?.target || '',
        error: edges.find(e => 
          e.source === node.id && 
          e.sourceHandle === 'error'
        )?.target || ''
      };

    default:
      return '';
  }
}