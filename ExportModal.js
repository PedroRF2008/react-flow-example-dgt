'use client';

import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody,
  Button,
  Card,
  CardBody,
  Spinner
} from "@heroui/react";
import { useEffect, useState } from "react";
import { MultiStepLoader } from '../ui/multi-step-loader';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import { Icon } from "@iconify/react";
import { useAuth } from "@/lib/auth";

// First, let's map our steps to progress percentages

// Define deployment steps
const DEPLOYMENT_STATES = [
  {
    text: "Inicializando instância...",
    icon: "solar:server-bold-duotone"
  },
  {
    text: "Autenticando acesso...",
    icon: "solar:shield-keyhole-bold-duotone"
  },
  {
    text: "Acessando Persona...",
    icon: "solar:user-circle-bold-duotone"
  },
  {
    text: "Criando Serviço...",
    icon: "solar:code-square-bold-duotone"
  },
  {
    text: "Implementando código...",
    icon: "solar:code-bold-duotone"
  },
  {
    text: "Criando Robô...",
    icon: "tabler:robot"
  },
  {
    text: "Criando Rota...",
    icon: "solar:route-bold-duotone"
  },
  {
    text: "Finalizando...",
    icon: "solar:check-circle-bold-duotone"
  }
];

const pulsingDotStyle = `
  @keyframes pulse-dot {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    35% {
      transform: scale(1.3);
      opacity: 0.8;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes pulse-wave {
    0% {
      transform: scale(1);
      opacity: 0.9;
    }
    50% {
      transform: scale(4);
      opacity: 0.2;
    }
    100% {
      transform: scale(6);
      opacity: 0;
    }
  }

  .pulse-dot {
    animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .pulse-wave {
    animation: pulse-wave 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
`;


const API_ENDPOINT = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:5001/projeto-alpha-digitro/us-central1/webAutomation'
  : 'https://us-central1-projeto-alpha-digitro.cloudfunctions.net/webAutomation';


// Map exact SSE messages to step indexes
const STEP_MAPPING = {
  'Initializing browser...': 0,                    // *Inicializando instância
  'Browser initialized, starting authentication...': 1, // *Autenticando acesso
  'Starting service deployment...': 2,             // *Acessando Persona
  'Step 1/3: Creating service...': 3,             // *Criando Serviço
  'Form filled - Name:': 4,                       // *Implementando código
  'Step 2/3: Creating bot...': 5,                 // *Criando Robô
  'Step 3/3: Creating route...': 6,               // *Criando Rota
  'Service deployment completed successfully': 7,  // *Finalizando
};

export default function ExportModal({ isOpen, onClose, projectId, projectName, luaCode }) {
  const [deploymentInfo, setDeploymentInfo] = useState(null);
  const [companyUrl, setCompanyUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const handleProgressUpdate = (message) => {
    // Check for key transition messages
    if (message.includes('Initializing browser')) {
      setCurrentStep(0);
    } else if (message.includes('Browser initialized')) {
      setCurrentStep(1);
    } else if (message.includes('Starting service deployment')) {
      setCurrentStep(2);
    } else if (message.includes('Step 1/3: Creating service')) {
      setCurrentStep(3);
    } else if (message.includes('Form filled - Name:')) {
      setCurrentStep(4);
    } else if (message.includes('Step 2/3: Creating bot')) {
      setCurrentStep(5);
    } else if (message.includes('Step 3/3: Creating route')) {
      setCurrentStep(6);
    } else if (message.includes('Service deployment completed')) {
      setCurrentStep(7);
    }
  };

  const fetchDeploymentInfo = async () => {
    if (!projectId) return;
    
    try {
      // First get project info which contains companyId
      const projectDoc = await getDoc(doc(firestore, 'projects', projectId));
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        setDeploymentInfo(projectData.deployment || null);
        
        // Now get company URL using companyId from project
        if (projectData.companyId) {
          const companyDoc = await getDoc(doc(firestore, 'companies', projectData.companyId));
          if (companyDoc.exists()) {
            setCompanyUrl(companyDoc.data().credentials?.pabx?.url);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeploymentInfo();
    }
  }, [isOpen, projectId]);

  const handleDeploy = async () => {
    setDeploying(true);
    setCurrentStep(0);

    try {
      // Get the current user's ID token
      const idToken = await getAuth().currentUser.getIdToken();

      const formattedCode = `-- Gerado automaticamente pelo Persona Plus
-- Projeto: ${projectId}
-- Data: ${new Date().toISOString()}

${luaCode}`;

      // Create EventSource for SSE
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          actionType: 'DEPLOY_SERVICE',
          actionData: {
            projectId,
            luaCode: formattedCode
          }
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const events = decoder.decode(value).split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line.replace('data: ', ''));
            } catch (e) {
              return null;
            }
          })
          .filter(event => event);

        for (const event of events) {
          switch (event.type) {
            case 'progress':
              handleProgressUpdate(event.message);
              break;

            case 'complete':
              // Update Firestore with minimal deployment info
              await updateDoc(doc(firestore, 'projects', projectId), {
                deployment: {
                  info: {
                    state: 'active',
                    timestamp: new Date().toISOString()
                  }
                }
              });
              
              setCurrentStep(100);
              await fetchDeploymentInfo();
              toast.success('Deployment realizado com sucesso!');
              break;

            case 'error':
              throw new Error(event.message);
          }
        }
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setCurrentStep(0);
      toast.error(`Erro no deployment: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const handleSync = async () => {
    setDeploying(true);
    setCurrentStep(0);

    try {
      // Get the current user's ID token
      const idToken = await getAuth().currentUser.getIdToken();

      const formattedCode = `-- Gerado automaticamente pelo Persona Plus
-- Projeto: ${projectId}
-- Data: ${new Date().toISOString()}

${luaCode}`;

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          actionType: 'EDIT_SERVICE',
          actionData: {
            luaCode: formattedCode,
            projectId
          }
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const events = decoder.decode(value).split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line.replace('data: ', ''));
            } catch (e) {
              return null;
            }
          })
          .filter(event => event);

        for (const event of events) {
          switch (event.type) {
            case 'start':
              setCurrentStep(STEP_MAPPING[event.data] || 5);
              break;

            case 'progress':
              handleProgressUpdate(event.message);
              break;

            case 'complete':
              setCurrentStep(100);
              await updateDoc(doc(firestore, 'projects', projectId), {
                deployment: {
                  info: {
                    ...deploymentInfo.info,
                    timestamp: new Date().toISOString()
                  }
                }
              });
              await fetchDeploymentInfo();
              toast.success('Código sincronizado com sucesso!');
              break;

            case 'error':
              throw new Error(event.data);
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      setCurrentStep(0);
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const handleUndeploy = async () => {
    setDeploying(true);
    setCurrentStep(0);

    try {
      // Get the current user's ID token
      const idToken = await getAuth().currentUser.getIdToken();

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          actionType: 'UNDEPLOY_SERVICE',
          actionData: {
            projectId
          }
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const events = decoder.decode(value).split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line.replace('data: ', ''));
            } catch (e) {
              return null;
            }
          })
          .filter(event => event);

        for (const event of events) {
          switch (event.type) {
            case 'start':
              setCurrentStep(STEP_MAPPING[event.data] || 5);
              break;

            case 'progress':
              handleProgressUpdate(event.message);
              break;

            case 'complete':
              setCurrentStep(100);
              await updateDoc(doc(firestore, 'projects', projectId), {
                deployment: {
                  info: {
                    state: 'none',
                    timestamp: null
                  }
                }
              });
              await fetchDeploymentInfo();
              toast.success('Serviço removido com sucesso!');
              break;

            case 'error':
              throw new Error(event.data);
          }
        }
      }
    } catch (error) {
      console.error('Undeploy error:', error);
      setCurrentStep(0);
      toast.error(`Erro ao remover serviço: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      // Check if the code exists
      if (!luaCode) {
        toast.error('Não há código para copiar');
        return;
      }

      // Use the newer clipboard API with proper error handling
      await navigator.clipboard.writeText(luaCode)
        .then(() => {
          toast.success('Código copiado para a área de transferência!');
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
          // Fallback method
          const textArea = document.createElement('textarea');
          textArea.value = luaCode;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            toast.success('Código copiado para a área de transferência!');
          } catch (e) {
            console.error('Fallback copy failed:', e);
            toast.error('Não foi possível copiar o código');
          }
          document.body.removeChild(textArea);
        });
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Erro ao copiar o código');
    }
  };

  const handleDownload = () => {
    try {
      const formattedCode = `-- Gerado automaticamente pelo Persona Plus
-- Projeto: ${projectName}
-- Data: ${new Date().toISOString()}

${luaCode}`;

      const blob = new Blob([formattedCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.lua`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Arquivo LUA baixado com sucesso!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const renderDeploymentContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8 min-h-[280px]">
          <Icon 
            icon="solar:refresh-circle-bold-duotone" 
            className="w-8 h-8 animate-spin text-primary"
          />
        </div>
      );
    }

    if (deploying) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[280px] py-8">
          <Spinner size="lg" color="primary" />
          <div className="text-center">
            <p className="text-default-600 font-medium">Realizando deploy...</p>
            <p className="text-small text-default-400">Isso pode levar alguns minutos</p>
          </div>
        </div>
      );
    }

    // For first time deployment
    if (!deploymentInfo || deploymentInfo.info?.state === 'none') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[280px] py-8">
          <Icon 
            icon="solar:server-bold-duotone"
            className="w-16 h-16 text-default-300"
          />
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-medium">
              Nenhum deploy configurado
            </h3>
            <p className="text-small text-default-500 max-w-sm">
              Clique no botão abaixo para fazer seu primeiro deploy!
            </p>
          </div>
          <Button
            color="primary"
            className="w-full max-w-sm"
            startContent={<Icon icon="solar:cloud-upload-bold-duotone" />}
            onPress={handleDeploy}
            isLoading={deploying}
          >
            {deploying ? 'Fazendo Deploy...' : 'Fazer Deploy'}
          </Button>
        </div>
      );
    }

    // For active deployment
    return (
      <div className="flex flex-col justify-center min-h-[280px] py-8">
        <div className="space-y-6">
          {/* Deployment Status */}
          <div className="rounded-lg border border-default-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-success pulse-dot"></div>
                  <div className="w-2 h-2 rounded-full bg-success/50 absolute top-0 left-0 pulse-wave"></div>
                  <div 
                    className="w-2 h-2 rounded-full bg-success/30 absolute top-0 left-0 pulse-wave" 
                    style={{ animationDelay: '1s' }}
                  ></div>
                </div>
                <div>
                  <h3 className="font-medium">Deploy Ativo</h3>
                  <p className="text-small text-default-500">
                    Último deploy: {new Date(deploymentInfo.info.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant="flat"
                color="success"
                startContent={<Icon icon="solar:refresh-circle-bold-duotone" />}
                onPress={handleSync}
                isLoading={deploying}
              >
                {deploying ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button
                variant="flat"
                color="warning"
                startContent={<Icon icon="solar:chat-round-dots-bold-duotone" />}
                onPress={() => {
                  if (!companyUrl) {
                    toast.error('URL do PABX não encontrada');
                    return;
                  }
                  const chatUrl = `${companyUrl}/interact_chatclient/chat.php?ci=Usuário&servico=${projectId}&aplicacao=persona`;
                  window.open(chatUrl, 'ChatPreview', 
                    'width=400,height=600,resizable=yes,scrollbars=yes,status=yes'
                  );
                }}
              >
                Testar
              </Button>
              <Button
                variant="flat"
                color="danger"
                startContent={<Icon icon="solar:trash-bin-trash-bold-duotone" />}
                onPress={handleUndeploy}
                isLoading={deploying}
              >
                {deploying ? 'Removendo...' : 'Remover'}
              </Button>
            </div>
          </div>
        </div>
        <style jsx>{pulsingDotStyle}</style>
      </div>
    );
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-row justify-between items-center">
                <span>Deploy do Fluxo</span>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={handleDownload}
                  title="Baixar arquivo LUA"
                >
                  <Icon icon="solar:download-bold-duotone" className="text-xl" />
                </Button>
              </ModalHeader>
              <ModalBody>
                <Card>
                  <CardBody className="gap-4">
                    {renderDeploymentContent()}
                  </CardBody>
                </Card>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <MultiStepLoader 
        loadingStates={DEPLOYMENT_STATES}
        loading={deploying}
        currentStep={currentStep}
      />
    </>
  );
} 