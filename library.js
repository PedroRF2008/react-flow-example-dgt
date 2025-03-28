'use client';

import { Icon } from "@iconify/react";
import { ConnectionTypes, OutputTypes } from './types';

// Block Categories
export const BlockCategories = {
  MESSAGING: {
    id: 'messaging',
    label: 'Mensagens',
    description: 'Blocos para enviar e receber mensagens',
    icon: 'tabler:message',
    color: 'primary',
  },
  INPUT: {
    id: 'input',
    label: 'Entrada',
    description: 'Blocos para coletar entrada do usuário',
    icon: 'solar:keyboard-linear',
    color: 'success',
  },
  INTEGRATIONS: {
    id: 'integrations',
    label: 'Integrações',
    description: 'Blocos para integração com sistemas externos',
    icon: 'gravity-ui:plug-connection',
  },
  MEDIA: {
    id: 'media',
    label: 'Mídia',
    description: 'Blocos para manipular conteúdo de mídia',
    icon: 'solar:gallery-wide-linear',
    color: 'secondary',
  },
  LOGIC: {
    id: 'logic',
    label: 'Lógica',
    description: 'Blocos para controle de fluxo e lógica',
    icon: 'solar:code-square-linear',
    color: 'warning',
  },
  AI: {
    id: 'ai',
    label: 'Inteligência Artificial',
    description: 'Blocos com recursos de IA',
    icon: 'carbon:ai-label',
    color: 'secondary',
  },
  UTILITIES: {
    id: 'utilities',
    label: 'Utilidades',
    description: 'Blocos para funcionalidades utilitárias',
    icon: 'solar:widget-linear',
    color: 'default',
  },
};

// Block Types
export const BlockTypes = {
  START: 'start',
  MESSAGE: 'message',
  INPUT: 'input',
  IMAGE_INPUT: 'image_input',
  AUTO_ENERGY_READER: 'auto_energy_reader',
  BUTTON_NAVIGATION: 'button_navigation',
  AI_ROUTER: 'ai_router',
  API_REQUEST: 'api_request',
  CONDITIONAL: 'conditional',
  SENSEDATA: 'sensedata',
  INTERACT_SERVICE: 'interact_service',
  BACKGROUND_CHECK: 'background_check',
};

// Field Types with their configurations
export const FieldTypes = {
  TEXT: 'text',
  MESSAGE: 'message',
  TEXTAREA: {
    type: 'textarea',
    component: 'Textarea',
    defaultValidation: (value) => typeof value === 'string',
  },
  NUMBER: {
    type: 'number',
    component: 'Input',
    defaultValidation: (value) => !isNaN(value),
  },
  SELECT: {
    type: 'select',
    component: 'Select',
    defaultValidation: (value, options) => {
      if (!options) return true;
      return options.some(opt => opt.key === value);
    },
  },
  BUTTONS: {
    type: 'buttons',
    component: 'ButtonsField',
    defaultValidation: (value) => Array.isArray(value),
  },
  ROUTES: {
    type: 'routes',
    component: 'RoutesField',
    defaultValidation: (value) => Array.isArray(value),
  },
  HEADERS: {
    type: 'headers',
    component: 'HeadersField',
    defaultValidation: (value) => Array.isArray(value),
  },
  INTERACT_DATA: 'interact_data',
  BODY: {
    type: 'body',
    component: 'BodyField',
    defaultValidation: (value) => {
      if (!value || !value.type) return false;
      if (value.type === 'json') return typeof value.content === 'string';
      if (value.type === 'formdata') return Array.isArray(value.content);
      return false;
    },
  },
  CONDITIONS: {
    type: 'conditions',
    component: 'ConditionsField',
    defaultValidation: (value) => Array.isArray(value),
  },
  QUERY: {
    type: 'query',
    component: 'QueryBuilder',
    defaultValidation: (value) => Array.isArray(value),
  },
  VARIABLE_INPUT: {
    type: 'variable_input',
    component: 'VariableInput',
    defaultValidation: (value) => typeof value === 'string' && value.length > 0,
  },
  CHECKLIST: 'checklist',
};

// Block Configuration Factory
const createBlockConfig = ({
  type,
  category,
  label,
  description,
  icon,
  color,
  requiredTier,
  defaultData = {},
  connections,
  fields = [],
  validate = () => true,
}) => ({
  type,
  category,
  label,
  description,
  icon,
  color,
  requiredTier,
  defaultData,
  connections,
  fields,
  validate,
});

// Block Library Definition
export const BlockLibrary = {
  [BlockTypes.START]: createBlockConfig({
    type: BlockTypes.START,
    category: BlockCategories.LOGIC,
    label: 'Início',
    description: 'Bloco inicial do fluxo',
    icon: 'solar:play-circle-bold',
    color: 'success',
    connections: {
      input: 0,
      output: OutputTypes.DEFAULT
    },
  }),

  [BlockTypes.MESSAGE]: createBlockConfig({
    type: BlockTypes.MESSAGE,
    category: BlockCategories.MESSAGING,
    label: 'Enviar Mensagem',
    description: 'Enviar uma mensagem para o usuário',
    icon: 'solar:chat-square-linear',
    color: 'primary',
    defaultData: {
      message: '',
      delay: 0,
    },
    connections: {
      input: 1,
      output: OutputTypes.DEFAULT
    },
    fields: [
      {
        key: 'message',
        type: FieldTypes.TEXTAREA,
        label: 'Mensagem',
        placeholder: 'Digite sua mensagem',
        required: true,
        supportsVariables: true,
      },
      {
        key: 'buttons',
        type: FieldTypes.BUTTONS,
        label: 'Botões',
        description: 'Adicione até 5 botões de resposta',
        maxButtons: 5,
      }
    ],
    validate: (block) => Boolean(block.data?.message),
  }),

  [BlockTypes.INPUT]: createBlockConfig({
    type: BlockTypes.INPUT,
    category: BlockCategories.INPUT,
    label: 'Aguardar Entrada',
    description: 'Aguardar entrada do usuário',
    icon: 'solar:keyboard-linear',
    color: 'success',
    defaultData: {
      variables: {
        response: {
          name: '',
          type: 'text'
        }
      },
      timeout: 900,
    },
    connections: {
      input: 1,
      output: OutputTypes.DEFAULT
    },
    fields: [
      {
        key: 'variables.response.name',
        type: FieldTypes.VARIABLE_INPUT,
        label: 'Resposta do usuário',
        placeholder: 'Digite o nome da variável',
        required: true,
        variableType: 'text',
        description: 'Nome da variável que armazenará a resposta do usuário'
      },
      {
        key: 'timeout',
        type: FieldTypes.NUMBER,
        label: 'Timeout (segundos)',
        placeholder: 'Tempo limite em segundos',
        defaultValue: 900,
      }
    ],
    validate: (block) => Boolean(block.data?.variables?.response?.name),
  }),

  [BlockTypes.IMAGE_INPUT]: createBlockConfig({
    type: BlockTypes.IMAGE_INPUT,
    category: BlockCategories.INPUT,
    label: 'Aguardar Imagem',
    description: 'Aguardar envio de imagem do usuário',
    icon: 'solar:gallery-add-linear',
    color: 'success',
    defaultData: {
      variableName: '',
      timeout: 900,
    },
    connections: {
      input: 1,
      output: OutputTypes.DEFAULT
    },
    fields: [
      {
        key: 'variableName',
        type: FieldTypes.TEXT,
        label: 'Nome da Variável',
        placeholder: 'Digite o nome da variável',
        required: true,
      },
      {
        key: 'timeout',
        type: FieldTypes.NUMBER,
        label: 'Timeout (segundos)',
        placeholder: 'Tempo limite em segundos',
        defaultValue: 900,
      }
    ],
    validate: (block) => Boolean(block.data?.variableName),
  }),

  [BlockTypes.BUTTON_NAVIGATION]: createBlockConfig({
    type: BlockTypes.BUTTON_NAVIGATION,
    category: BlockCategories.LOGIC,
    label: 'Navegação com Botões',
    description: 'Criar diferentes caminhos baseados na escolha do usuário',
    icon: 'tabler:route-alt-left',
    color: 'warning',
    defaultData: {
      message: '',
      buttons: [],
      delay: 0,
    },
    connections: {
      input: 1,
      output: OutputTypes.NUMBERED
    },
    fields: [
      {
        key: 'message',
        type: FieldTypes.TEXTAREA,
        label: 'Mensagem',
        placeholder: 'Digite sua mensagem',
        required: true,
      },
      {
        key: 'buttons',
        type: FieldTypes.BUTTONS,
        label: 'Botões de Navegação',
        description: 'Adicione botões para criar diferentes caminhos',
        maxButtons: 5,
      }
    ],
    validate: (block) => Boolean(block.data?.message && block.data?.buttons?.length > 0),
  }),

  [BlockTypes.AI_ROUTER]: createBlockConfig({
    type: BlockTypes.AI_ROUTER,
    category: BlockCategories.AI,
    label: 'Roteamento por IA',
    description: 'Roteia o usuário com base em sua resposta usando IA',
    icon: 'octicon:ai-model-16',
    color: 'secondary',
    defaultData: {
      message: '',
      routes: [],
      delay: 0,
    },
    connections: {
      input: 1,
      output: OutputTypes.NUMBERED
    },
    fields: [
      {
        key: 'message',
        type: FieldTypes.TEXTAREA,
        label: 'Mensagem',
        placeholder: 'Digite a mensagem para o usuário',
        required: true,
      },
      {
        key: 'routes',
        type: FieldTypes.ROUTES,
        label: 'Rotas de IA',
        description: 'Adicione rotas e descreva quando cada uma deve ser escolhida',
        maxRoutes: 5,
      }
    ],
    validate: (block) => Boolean(block.data?.message && block.data?.routes?.length > 0),
  }),

  [BlockTypes.API_REQUEST]: createBlockConfig({
    type: BlockTypes.API_REQUEST,
    category: BlockCategories.UTILITIES,
    label: 'Requisição API',
    description: 'Fazer requisiçes HTTP para APIs externas',
    icon: 'icon-park-outline:api',
    color: 'default',
    defaultData: {
      url: '',
      method: 'GET',
      headers: [],
      body: { type: 'json', content: '' },
      responseVariable: '',
      preview: null,
    },
    connections: {
      input: 1,
      output: OutputTypes.INTEGRATION
    },
    fields: [
      {
        key: 'url',
        type: FieldTypes.TEXT,
        label: 'URL da API',
        placeholder: 'https://api.exemplo.com/endpoint',
        required: true,
      },
      {
        key: 'method',
        type: FieldTypes.SELECT,
        label: 'Método',
        required: true,
        options: [
          { key: 'GET', label: 'GET' },
          { key: 'POST', label: 'POST' },
          { key: 'PUT', label: 'PUT' },
          { key: 'PATCH', label: 'PATCH' },
          { key: 'DELETE', label: 'DELETE' },
        ],
        defaultValue: 'GET',
      },
      {
        key: 'headers',
        type: FieldTypes.HEADERS,
        label: 'Headers',
        description: 'Adicione headers para a requisição',
        maxHeaders: 10,
      },
      {
        key: 'body',
        type: FieldTypes.BODY,
        label: 'Body',
        description: 'Configure o corpo da requisição',
        showIf: (data) => data.method !== 'GET',
        props: (data) => ({
          method: data.method
        }),
      }
    ],
    validate: (block) => {
      const { url, method, responseVariable } = block.data || {};
      return Boolean(url && method && responseVariable);
    },
  }),

  [BlockTypes.CONDITIONAL]: createBlockConfig({
    type: BlockTypes.CONDITIONAL,
    category: BlockCategories.LOGIC,
    label: 'Condicionais',
    description: 'Criar diferentes caminhos baseados em condições',
    icon: 'solar:programming-linear',
    color: 'warning',
    defaultData: {
      conditions: [],
      delay: 0,
    },
    connections: {
      input: 1,
      output: OutputTypes.CONDITIONAL
    },
    fields: [
      {
        key: 'conditions',
        type: FieldTypes.CONDITIONS,
        label: 'Condições',
        description: 'Adicione condições para criar diferentes caminhos',
        maxConditions: 9,
      }
    ],
    validate: (block) => {
      return Array.isArray(block.data?.conditions) && block.data.conditions.length > 0;
    },
  }),

  [BlockTypes.SENSEDATA]: createBlockConfig({
    type: BlockTypes.SENSEDATA,
    category: BlockCategories.INTEGRATIONS,
    label: 'SenseData',
    description: 'Integração com a plataforma SenseData',
    icon: '/blockIcons/sensedata.svg',
    color: 'default',
    defaultData: {
      token: '',
      endpoint: 'customers',
      filters: [],
      variables: {
        response: {
          name: '',
          type: 'object',
          structure: null // This will store the JSON structure after testing
        }
      }
    },
    connections: {
      input: 1,
      output: OutputTypes.INTEGRATION
    },
    fields: [
      {
        key: 'variables.response.name',
        type: FieldTypes.VARIABLE_INPUT,
        label: 'Nome da Variável',
        placeholder: 'Digite o nome da variável',
        required: true,
        variableType: 'object',
        description: 'Nome da variável que armazenará a resposta'
      },
      {
        key: 'token',
        type: FieldTypes.TEXT,
        label: 'Token de Autorização',
        placeholder: 'Cole seu token aqui',
        required: true,
        description: 'Token de autenticação da API SenseData',
        startContent: (
          <div className="flex items-center gap-2 px-3 border-r border-default-200">
            <Icon icon="solar:key-minimalistic-square-linear" className="text-default-400" />
            <span className="text-xs text-default-500 font-mono">Bearer</span>
          </div>
        ),
      },
      {
        key: 'endpoint',
        type: FieldTypes.SELECT,
        label: 'Endpoint',
        required: true,
        description: 'Selecione o endpoint da API que deseja utilizar',
        options: [
          { 
            key: 'customers', 
            label: 'Clientes', 
            description: 'Consulta informações de clientes cadastrados no SenseData',
            icon: 'solar:users-group-rounded-linear',
            details: 'Retorna dados completos do cliente como nome, email, telefone e outras informações cadastradas.'
          },
        ],
        defaultValue: 'customers',
        renderOption: (option) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-default-100">
              <Icon icon={option.icon} className="text-xl text-default-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{option.label}</p>
              <p className="text-xs text-default-500">{option.description}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'filters',
        type: FieldTypes.QUERY,
        label: 'Filtros',
        description: 'Configure os filtros para a consulta',
        showIf: (data) => data.endpoint === 'customers',
      },
    ],
    validate: (block) => Boolean(
      block.data?.endpoint && 
      block.data?.token && 
      block.data?.variables?.response?.name
    ),
  }),

  [BlockTypes.INTERACT_SERVICE]: createBlockConfig({
    type: BlockTypes.INTERACT_SERVICE,
    category: BlockCategories.INTEGRATIONS,
    label: 'Serviço Interact',
    description: 'Encaminhar chat para o Interact',
    icon: '/blockIcons/interact.svg',
    color: 'primary',
    defaultData: {
      accessPoint: '',
      data: [],
      delay: 0,
    },
    connections: { input: 1, output: 0 },
    fields: [
      {
        key: 'accessPoint',
        type: FieldTypes.TEXT,
        label: 'Ponto de Acesso',
        placeholder: 'Digite o ponto de acesso do Interact',
        required: true,
        description: 'Ponto de acesso para onde o chat será encaminhado',
      },
      {
        key: 'data',
        type: FieldTypes.INTERACT_DATA,
        label: 'Dados',
        description: 'Dados adicionais para enviar ao Interact',
      }
    ],
    validate: (block) => {
      const { accessPoint } = block.data || {};
      return Boolean(accessPoint);
    },
  }),

  [BlockTypes.AUTO_ENERGY_READER]: createBlockConfig({
    type: BlockTypes.AUTO_ENERGY_READER,
    category: BlockCategories.AI,
    label: 'Leitor de Energia',
    description: 'Lê automaticamente o consumo de energia de um relógio através de uma imagem',
    icon: 'fluent:flash-sparkle-16-regular',
    color: 'secondary',
    defaultData: {
      imageUrl: '',
      readResultVariable: '',
      idResultVariable: '',
      delay: 0,
    },
    connections: {
      input: 1,
      output: OutputTypes.INTEGRATION
    },
    fields: [
      {
        key: 'imageUrl',
        type: FieldTypes.TEXT,
        label: 'URL da Imagem',
        placeholder: 'Variável contendo a URL da imagem',
        required: true,
        description: 'Nome da variável que contém a URL da imagem do relógio',
      },
      {
        key: 'readResultVariable',
        type: FieldTypes.TEXT,
        label: 'Variável do Consumo',
        placeholder: 'Nome da variável para salvar o consumo em kWh',
        required: true,
        description: 'Nome da variável que armazenará o resultado da leitura em kWh',
      },
      {
        key: 'idResultVariable',
        type: FieldTypes.TEXT,
        label: 'Variável da UC',
        placeholder: 'Nome da variável para salvar a Unidade Consumidora',
        required: true,
        description: 'Nome da variável que armazenará o número da Unidade Consumidora',
      }
    ],
    validate: (block) => {
      const { imageUrl, readResultVariable, idResultVariable } = block.data || {};
      return Boolean(imageUrl && readResultVariable && idResultVariable);
    },
  }),

  [BlockTypes.BACKGROUND_CHECK]: createBlockConfig({
    type: BlockTypes.BACKGROUND_CHECK,
    category: BlockCategories.AI,
    label: 'Consulta de Background',
    description: 'Consultar informações de background por CPF',
    icon: 'solar:user-id-bold-duotone',
    color: 'secondary',
    defaultData: {
      cpf: '',
      checks: [],
      variables: {
        response: {
          name: '',
          type: 'object',
          structure: {
            type: 'object',
            properties: {
              fullName: { 
                type: 'text', 
                description: 'Nome completo da pessoa',
                path: 'dados.fullName'
              },
              email: { 
                type: 'text', 
                description: 'Endereço de email',
                path: 'dados.email'
              },
              phone: { 
                type: 'text', 
                description: 'Número de telefone com DDD',
                path: 'dados.phone'
              },
              address: {
                type: 'object',
                path: 'dados.address',
                properties: {
                  street: { 
                    type: 'text', 
                    description: 'Nome da rua',
                    path: 'dados.address.street'
                  },
                  number: { 
                    type: 'text', 
                    description: 'Número do endereço',
                    path: 'dados.address.number'
                  },
                  complement: { 
                    type: 'text', 
                    description: 'Complemento do endereço',
                    path: 'dados.address.complement'
                  },
                  neighborhood: { 
                    type: 'text', 
                    description: 'Bairro',
                    path: 'dados.address.neighborhood'
                  },
                  city: { 
                    type: 'text', 
                    description: 'Cidade',
                    path: 'dados.address.city'
                  },
                  state: { 
                    type: 'text', 
                    description: 'Estado (UF)',
                    path: 'dados.address.state'
                  },
                  zipCode: { 
                    type: 'text', 
                    description: 'CEP',
                    path: 'dados.address.zipCode'
                  }
                }
              },
              motherName: { 
                type: 'text', 
                description: 'Nome da mãe',
                path: 'dados.motherName'
              },
              gender: { 
                type: 'text', 
                description: 'Gênero',
                path: 'dados.gender'
              },
              birthDate: { 
                type: 'text', 
                description: 'Data de nascimento',
                path: 'dados.birthDate'
              }
            }
          }
        }
      }
    },
    connections: {
      input: 1,
      output: OutputTypes.INTEGRATION
    },
    fields: [
      {
        key: 'cpf',
        type: FieldTypes.TEXT,
        label: 'CPF',
        placeholder: 'Digite o CPF',
        required: true,
      },
      {
        key: 'checks',
        type: FieldTypes.CHECKLIST,
        label: 'Dados para Consulta',
        description: 'Selecione os dados que deseja consultar',
        options: [
          { key: 'fullName', label: 'Nome Completo' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Telefone' },
          { key: 'address', label: 'Endereço Completo' },
          { key: 'motherName', label: 'Nome da Mãe' },
          { key: 'gender', label: 'Gênero' },
          { key: 'birthDate', label: 'Data de Nascimento' }
        ]
      },
      {
        key: 'variables.response.name',
        type: FieldTypes.VARIABLE_INPUT,
        label: 'Nome da Variável',
        placeholder: 'Digite o nome da variável',
        required: true,
        variableType: 'object',
        description: 'Nome da variável que armazenará a resposta',
        preview: `{
  "fullName": "Nome Completo da Pessoa",
  "email": "email@exemplo.com",
  "phone": "(00) 00000-0000",
  "address": {
    "street": "Nome da Rua",
    "number": "123",
    "complement": "Apto 101",
    "neighborhood": "Bairro",
    "city": "Cidade",
    "state": "UF",
    "zipCode": "00000-000"
  },
  "motherName": "Nome da Mãe",
  "gender": "Masculino/Feminino",
  "birthDate": "YYYY-MM-DD"
}`
      }
    ],
    validate: (block) => {
      const { cpf, checks, 'variables.response.name': responseVariable } = block.data || {};
      return Boolean(
        cpf && 
        checks?.length > 0 && 
        responseVariable
      );
    }
  }),
};

// Helper functions
export const getBlocksByCategory = () => {
  return Object.values(BlockLibrary)
    .filter(block => block.type !== BlockTypes.START)
    .reduce((acc, block) => {
      const categoryId = block.category.id;
      if (!acc[categoryId]) acc[categoryId] = [];
      acc[categoryId].push(block);
      return acc;
    }, {});
};

// Add this export function
export const validateBlock = (block) => {
  const blockConfig = BlockLibrary[block.data?.blockType];
  if (!blockConfig) return false;
  return blockConfig.validate(block);
};

// Add operator definitions
export const ConditionalOperators = [
  { key: '==', label: 'Igual a', description: 'Verifica se os valores são iguais' },
  { key: '~=', label: 'Diferente de', description: 'Verifica se os valores são diferentes' },
  { key: '>', label: 'Maior que', description: 'Verifica se o primeiro valor é maior' },
  { key: '<', label: 'Menor que', description: 'Verifica se o primeiro valor é menor' },
  { key: '>=', label: 'Maior ou igual a', description: 'Verifica se o primeiro valor é maior ou igual' },
  { key: '<=', label: 'Menor ou igual a', description: 'Verifica se o primeiro valor é menor ou igual' },
]; 