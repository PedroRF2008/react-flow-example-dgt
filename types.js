export const ConnectionTypes = {
  DEFAULT: 'default',
  NUMBERED: 'numbered',
  INTEGRATION: 'integration',
  CONDITIONAL: 'conditional'
};

export const OutputTypes = {
  // Default single output
  DEFAULT: {
    type: ConnectionTypes.DEFAULT,
    maxConnections: 1
  },
  
  // Numbered outputs (for AI Router, Button Navigation)
  NUMBERED: {
    type: ConnectionTypes.NUMBERED,
    getMaxOutputs: (data) => {
      if (data.routes) return data.routes.length;
      if (data.buttons) return data.buttons.length;
      return 0;
    },
    maxConnectionsPerOutput: 1
  },
  
  // Integration outputs (Success/Error)
  INTEGRATION: {
    type: ConnectionTypes.INTEGRATION,
    outputs: {
      success: { maxConnections: 1 },
      error: { maxConnections: 1 }
    }
  },
  
  // Conditional outputs
  CONDITIONAL: {
    type: ConnectionTypes.CONDITIONAL,
    getMaxOutputs: (data) => (data.conditions?.length || 0) + 1, // +1 for else route
    maxConnectionsPerOutput: 1
  }
};

export const FieldTypes = {
  // ... existing types ...
  CHECKLIST: 'checklist',
}; 