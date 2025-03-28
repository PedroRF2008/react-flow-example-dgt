import { ConnectionTypes } from './types';
import { getBlock } from './registry';

/**
 * Get output configuration for a block
 * @param {string} blockType - Type of block
 * @param {Object} blockData - Block data
 * @returns {Object|null} Output configuration 
 */
export function getOutputConfiguration(blockType, blockData) {
  const config = getBlock(blockType)?.connections?.output;
  if (!config) return null;

  switch (config.type) {
    case ConnectionTypes.DEFAULT:
      return {
        type: ConnectionTypes.DEFAULT,
        handles: [{ id: 'default', label: '' }]
      };

    case ConnectionTypes.NUMBERED:
      const numOutputs = config.getMaxOutputs(blockData);
      return {
        type: ConnectionTypes.NUMBERED,
        handles: Array.from({ length: numOutputs }, (_, i) => ({
          id: `output-${i}`,
          label: blockData.routes?.[i]?.label || 
                 blockData.buttons?.[i]?.label || 
                 `Output ${i + 1}`
        }))
      };

    case ConnectionTypes.INTEGRATION:
      return {
        type: ConnectionTypes.INTEGRATION,
        handles: [
          { id: 'success', label: 'Success' },
          { id: 'error', label: 'Error' }
        ]
      };

    case ConnectionTypes.CONDITIONAL:
      const conditions = blockData.conditions || [];
      return {
        type: ConnectionTypes.CONDITIONAL,
        handles: [
          ...conditions.map((c, i) => ({
            id: `output-${i}`,
            label: c.label || `Condition ${i + 1}`
          })),
          { id: 'else', label: 'Else' }
        ]
      };

    default:
      return null;
  }
}

/**
 * Validate if a connection is valid
 * @param {Object} connection - Connection parameters
 * @param {Object} sourceNode - Source node
 * @param {Object} targetNode - Target node
 * @param {Array} edges - Existing edges
 * @returns {Object} Validation result with isValid flag and message
 */
export function validateConnection(connection, sourceNode, targetNode, edges) {
  if (!sourceNode || !targetNode) {
    return { 
      isValid: false, 
      message: 'Nós de origem ou destino inválidos' 
    };
  }

  const sourceConfig = getBlock(sourceNode?.data?.blockType)?.connections?.output;
  if (!sourceConfig) {
    return { 
      isValid: false, 
      message: 'Configuração de bloco inválida' 
    };
  }

  // For integration type (success/error outputs)
  if (sourceConfig.type === ConnectionTypes.INTEGRATION) {
    // Check if there's already a connection from this specific handle (success or error)
    const hasExistingConnection = edges.some(edge => 
      edge.source === connection.source && 
      edge.sourceHandle === connection.sourceHandle
    );
    
    return { 
      isValid: !hasExistingConnection,
      message: hasExistingConnection ? 'Esta saída já possui uma conexão' : 'Conexão válida'
    };
  }

  // For numbered type
  if (sourceConfig.type === ConnectionTypes.NUMBERED || 
      sourceConfig.type === ConnectionTypes.CONDITIONAL) {
    // Check if there's already a connection from this specific handle
    const hasExistingConnection = edges.some(edge => 
      edge.source === connection.source && 
      edge.sourceHandle === connection.sourceHandle
    );
    
    return { 
      isValid: !hasExistingConnection,
      message: hasExistingConnection ? 'Esta saída já possui uma conexão' : 'Conexão válida'
    };
  }

  // For default type
  if (sourceConfig.type === ConnectionTypes.DEFAULT) {
    // Check if there's already a connection from this node
    const hasExistingConnection = edges.some(edge => 
      edge.source === connection.source
    );
    
    return { 
      isValid: !hasExistingConnection,
      message: hasExistingConnection ? 'Este bloco já possui uma conexão de saída' : 'Conexão válida'
    };
  }

  return { isValid: true, message: 'Conexão válida' };
} 