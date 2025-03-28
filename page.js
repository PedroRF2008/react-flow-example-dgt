'use client';

import { useCallback, useEffect, useState, use, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Tooltip, Spinner } from "@heroui/react";
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../../../lib/firebase';
import { useAuth } from '../../../../../lib/auth';
import { BlockTypes } from '../../../../../lib/blocks/registry';
import BlockToolbar from '../../../../../components/flow-editor/BlockToolbar';
import CustomNode from '../../../../../components/flow-editor/CustomNode';
import CustomEdge from '../../../../../components/flow-editor/CustomEdge';
import { createNodeData } from '../../../../../lib/blocks/utils';
import { BlockLibrary } from '../../../../../lib/blocks/library';
import { useBlocks } from '../../../../../lib/hooks/useBlocks';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { compileLuaFlow } from '../../../../../lib/blocks/compiler';
import ExportModal from '../../../../../components/flow-editor/ExportModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useNodeArrangement } from '../../../../../lib/hooks/useNodeArrangement';
import { VariableSuggestionsProvider } from '../../../../../components/flow-editor/VariableSuggestionsModal';

const proOptions = { hideAttribution: true };

function Flow({ project, projectId }) {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { createBlock, validateConnection } = useBlocks();
  const reactFlowInstance = useReactFlow();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedCode, setExportedCode] = useState('');
  const searchParams = useSearchParams();
  const { arrangeNodes } = useNodeArrangement();
  const [hasAutoAligned, setHasAutoAligned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Memoize defaultEdgeOptions to prevent unnecessary re-renders
  const defaultEdgeOptions = useMemo(() => ({
    type: 'default',
    animated: true,
    style: {
      stroke: '#9ca3af',
      strokeWidth: 2,
    },
  }), []);

  // Memoize the node change handler
  const handleNodeChange = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Create new data object only if necessary
          const currentData = node.data;
          const hasChanges = Object.keys(newData).some(key => currentData[key] !== newData[key]);
          
          if (!hasChanges) return node;

          return {
            ...node,
            data: {
              ...currentData,
              ...newData,
              blockType: currentData.blockType,
              label: currentData.label,
              onChange: currentData.onChange,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Memoize nodeTypes to prevent unnecessary re-renders
  const nodeTypes = useMemo(() => ({
    customNode: (props) => (
      <CustomNode {...props} handleNodeChange={handleNodeChange} />
    ),
  }), [handleNodeChange]);

  // Optimize onConnect with memoization and early returns
  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(node => node.id === params.source);
    const targetNode = nodes.find(node => node.id === params.target);

    // Validate connection using our validation system
    const { isValid, message } = validateConnection(
      params,
      sourceNode,
      targetNode,
      edges
    );

    if (isValid) {
      setEdges((eds) => addEdge({
        ...params,
        type: 'default',
        animated: true,
        style: {
          stroke: '#9ca3af',
          strokeWidth: 2,
        }
      }, eds));
    } else {
      toast.error(message || 'Invalid connection');
    }
  }, [nodes, edges, setEdges, validateConnection]);

  // Optimize saveFlow with debouncing and loading state
  const saveFlow = useMemo(() => {
    let timeoutId;
    
    return async () => {
      if (!projectId) return;

      // Clear any pending save
      if (timeoutId) clearTimeout(timeoutId);

      // Debounce the save operation
      timeoutId = setTimeout(async () => {
        setIsSaving(true);
        try {
          const response = await fetch(`/api/projects/${projectId}/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nodes,
              edges,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save flow');
          }

          toast.success('Flow saved successfully');
        } catch (error) {
          console.error('Error saving flow:', error);
          toast.error('Failed to save flow: ' + error.message);
        } finally {
          setIsSaving(false);
        }
      }, 1000); // Debounce for 1 second
    };
  }, [projectId, nodes, edges]);

  // Optimize onDrop with memoization and performance improvements
  const onDrop = useCallback((event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const blockConfig = BlockLibrary[type];
    if (!blockConfig) return;

    const { left, top } = event.target.getBoundingClientRect();
    const position = {
      x: event.clientX - left,
      y: event.clientY - top,
    };

    const newNodeId = `${type}-${Date.now()}`;
    const newNode = {
      ...createNodeData(blockConfig, newNodeId, handleNodeChange),
      position,
      data: {
        ...blockConfig.defaultData,
        delay: 0,
        blockType: type,
        label: blockConfig.label,
        onChange: (newData) => handleNodeChange(newNodeId, newData),
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [handleNodeChange, setNodes]);

  const handleExport = useCallback(async () => {
    try {
      if (!nodes.length) {
        toast.error('Não há nós para exportar');
        return;
      }

      const luaCode = await compileLuaFlow(nodes, edges, project);
      setExportedCode(luaCode);
      setShowExportModal(true);
    } catch (error) {
      console.error('Error exporting flow:', error);
      toast.error('Erro ao exportar o fluxo');
    }
  }, [nodes, edges, project]);

  useEffect(() => {
    if (!projectId) return;

    // Create document reference outside the snapshot
    const projectRef = doc(firestore, 'projects', projectId);

    const unsubscribe = onSnapshot(projectRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        if (!data.flow || (!data.flow.nodes?.length && !data.flow.edges?.length)) {
          const startNode = {
            id: 'start',
            type: 'customNode',
            position: { x: 100, y: 200 },
            draggable: false,
            data: {
              blockType: BlockTypes.START,
              label: 'Início',
              onChange: (newData) => handleNodeChange('start', newData),
            },
          };
          setNodes([startNode]);
          setEdges([]);
          
          // Use the projectRef we created above
          await updateDoc(projectRef, {
            flow: {
              nodes: [{ ...startNode, data: { ...startNode.data, onChange: null } }],
              edges: [],
            },
            updatedAt: new Date(),
          });
          return;
        }
        
        // Add onChange handlers to existing nodes
        const nodesWithHandlers = data.flow?.nodes?.map(node => {
          const blockConfig = BlockLibrary[node.data.blockType];
          return {
            ...node,
            draggable: node.data.blockType !== BlockTypes.START,
            data: {
              ...node.data,
              delay: node.data.delay || 0,
              label: blockConfig?.label || node.data.label,
              onChange: (newData) => handleNodeChange(node.id, newData),
            },
          };
        }) || [];
        
        setNodes(nodesWithHandlers);
        setEdges(data.flow?.edges || []);
      } else {
        // Initialize new flow with Start block for new documents
        const startNode = {
          id: 'start',
          type: 'customNode',
          position: { x: 100, y: 200 },
          draggable: false,
          data: {
            blockType: BlockTypes.START,
            label: 'Início',
            onChange: (newData) => handleNodeChange('start', newData),
          },
        };
        setNodes([startNode]);
        setEdges([]);
      }
    });

    return () => unsubscribe();
  }, [projectId, handleNodeChange, setNodes, setEdges]);

  // Optimize onNodesChange with memoization and performance improvements
  const onNodesChange = useCallback((changes) => {
    const filteredChanges = changes.filter(change => {
      if (change.type === 'remove') {
        const node = nodes.find(n => n.id === change.id);
        return node?.data.blockType !== BlockTypes.START;
      }
      if (change.type === 'position' && change.dragging) {
        const node = nodes.find(n => n.id === change.id);
        return node?.data.blockType !== BlockTypes.START;
      }
      return true;
    });
    
    if (filteredChanges.length === 0) return;
    
    setNodes((nds) => applyNodeChanges(filteredChanges, nds));
  }, [nodes, setNodes]);

  const handleAutoAlign = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();
    
    const arrangedNodes = arrangeNodes(currentNodes, currentEdges);
    reactFlowInstance.setNodes(arrangedNodes);
    
    setTimeout(() => {
      reactFlowInstance.fitView({ 
        padding: 0.2,
        duration: 800,
      });
    }, 50);
  }, [reactFlowInstance, arrangeNodes]);

  useEffect(() => {
    const shouldAutoAlign = searchParams.get('autoAlign') === 'true';
    if (shouldAutoAlign && nodes.length > 0 && !hasAutoAligned && reactFlowInstance) {
      setHasAutoAligned(true);
      setTimeout(() => {
        handleAutoAlign();
      }, 100);
    }
  }, [nodes, searchParams, handleAutoAlign, hasAutoAligned, reactFlowInstance]);

  return (
    <div className="w-full h-screen relative">
      <div 
        className="absolute top-0 left-0 right-0 z-20 group hover:px-6 hover:py-4 px-4 py-2 
          bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm
          transition-all duration-200 ease-in-out"
      >
        <div className="flex items-center justify-between transition-all duration-200">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Tooltip content="Voltar para projetos" delay={300}>
              <Link href="/app/dashboard/projects">
                <Button
                  isIconOnly
                  variant="light"
                  className="text-default-600 hover:text-primary"
                >
                  <Icon icon="solar:arrow-left-linear" width={24} />
                </Button>
              </Link>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 transition-all duration-200">
            <h1 className="text-sm group-hover:text-lg font-medium transition-all duration-200">
              {project.name}
            </h1>
            <p className="text-sm text-default-500 opacity-0 group-hover:opacity-100 
              transition-opacity duration-200 absolute -bottom-5 whitespace-nowrap">
              {project.companyName}
            </p>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-2">
              <Button
                variant="flat"
                color="default"
                startContent={<Icon icon="solar:code-square-bold" className="text-lg" />}
                size="sm"
                onPress={handleExport}
              >
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={{
          default: CustomEdge,
        }}
        defaultEdgeOptions={defaultEdgeOptions}
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
        proOptions={proOptions}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <BlockToolbar 
          onSave={saveFlow} 
          onDrop={onDrop} 
          reactFlowInstance={reactFlowInstance}
          isSaving={isSaving}
        />
      </div>

      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        luaCode={exportedCode}
        projectId={projectId}
        projectName={project.name}
      />
    </div>
  );
}

export default function ProjectEditor({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const { user, company, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/app/login');
      return;
    }

    if (!projectId || !company) return;

    const unsubscribe = onSnapshot(doc(firestore, 'projects', projectId), (doc) => {
      if (!doc.exists()) {
        router.push('/app/dashboard/projects');
        return;
      }

      const data = doc.data();
      
      if (data.companyId !== company.id) {
        router.push('/app/dashboard/projects');
        return;
      }

      setProject({ 
        id: doc.id, 
        ...data,
        companyName: company?.name || 'Nome da Empresa',
        companyTier: company?.billingInfo?.planTier || 'silver'
      });
    });

    return () => unsubscribe();
  }, [projectId, company, user, loading, router]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <p className="text-default-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!project || !user || !company) return null;

  return (
    <ReactFlowProvider>
      <VariableSuggestionsProvider>
        <Flow project={project} projectId={projectId} />
      </VariableSuggestionsProvider>
    </ReactFlowProvider>
  );
} 