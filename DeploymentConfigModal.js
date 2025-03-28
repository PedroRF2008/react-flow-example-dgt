'use client';

import { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody,
  ModalFooter,
  Button,
  Input
} from "@heroui/react";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

export default function DeploymentConfigModal({ isOpen, onClose, projectId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    url: 'https://sipcomercial.digitro.com.br'
  });

  // Fetch current credentials when modal opens
  useEffect(() => {
    const fetchCredentials = async () => {
      if (!projectId || !isOpen) return;

      try {
        const projectDoc = await getDoc(doc(firestore, 'projects', projectId));
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          if (data.deployment?.credentials) {
            setFormData(prev => ({
              ...prev,
              username: data.deployment.credentials.username || '',
              password: data.deployment.credentials.password || '',
              url: data.deployment.credentials.url || 'https://sipcomercial.digitro.com.br'
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching credentials:', error);
        toast.error('Erro ao carregar credenciais existentes');
      }
    };

    fetchCredentials();
  }, [projectId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current document to preserve existing deployment data
      const projectDoc = await getDoc(doc(firestore, 'projects', projectId));
      const currentData = projectDoc.exists() ? projectDoc.data() : {};

      await updateDoc(doc(firestore, 'projects', projectId), {
        deployment: {
          // Preserve existing deployment data
          ...currentData.deployment,
          // Only update credentials
          credentials: {
            username: formData.username,
            password: formData.password,
            url: formData.url
          },
          // Initialize info mapping ONLY if it doesn't exist
          info: currentData.deployment?.info || {
            state: 'none',
            timestamp: ''
          }
        }
      });

      toast.success('Credenciais salvas com sucesso!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Erro ao salvar credenciais');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Configurar Credenciais</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Usuário"
              placeholder="Digite seu usuário"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              isRequired
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              isRequired
            />
            <Input
              label="URL"
              placeholder="URL do servidor"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              isRequired
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" type="submit" isLoading={loading}>
              Salvar
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 