'use client';

import { BlockTypes } from './library';
import { getOutputConfiguration } from './connections';
import { ConnectionTypes } from './types';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

// Core helper functions
const Helpers = {
  sanitizeId: (id) => {
    if (!id) return 'unknown_id';
    return id.replace(/-/g, '_');
  },
  formatDelay: (delay) => delay > 0 ? `\n    sleep(${delay})` : '',
  
  // Text and variable processing
  processText: (text) => {
    return text?.replace(/\${([^}]+)}/g, (match, expression) => {
      // Remove any whitespace and return the expression wrapped in concatenation
      const cleanExpression = expression.trim();
      return `'..${cleanExpression}..'`;
    }) || '';
  },

  // JSON processing
  processJsonContent: (content) => {
    try {
      const jsonObj = typeof content === 'string' ? JSON.parse(content) : content;
      
      const processValue = (value) => {
        if (typeof value === 'string') return Helpers.processText(value);
        if (Array.isArray(value)) return value.map(processValue);
        if (typeof value === 'object' && value !== null) {
          return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, processValue(v)])
          );
        }
        return value;
      };

      return JSON.stringify(processValue(jsonObj), null, 4)
        .replace(/"/g, "'")
        .split('\n')
        .map((line, i) => i === 0 ? line : '        ' + line)
        .join('\n');
    } catch (e) {
      return "{}";
    }
  },

  // Form data processing
  encodeFormData: (formData) => {
    return formData.map(item => {
      const key = encodeURIComponent(item.key);
      const value = Helpers.processText(item.value);
      return `${key}='..${value}..'`;
    }).join('&');
  },

  // UI elements formatting
  formatButtonMenu: (buttons) => {
    if (!buttons?.length) return '';
    return `menu={${buttons.map(btn => `{'${btn.label}'}`).join(', ')}}`;
  },

  // Route handling
  getBlockRoutes: (node, edges) => {
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
};

// Block-specific compilers
const BlockCompilers = {
  [BlockTypes.MESSAGE]: (block, nextBlockId) => {
    const { message, buttons = [], delay = 0 } = block.data;
    const buttonMenu = Helpers.formatButtonMenu(buttons);
    const delayStr = Helpers.formatDelay(delay);
    const processedMessage = Helpers.processText(message);
    
    return `
${Helpers.sanitizeId(block.id)} = function()
    message{
        text='${processedMessage}'${buttonMenu ? ',\n        ' + buttonMenu : ''}
    }${delayStr}
    menu.next('${Helpers.sanitizeId(nextBlockId)}')
end`;
  },

  [BlockTypes.INPUT]: (block, nextBlockId) => {
    // Get the actual variable name from the variables object
    const variableName = block.data.variables?.response?.name || 'response';
    const { timeout = 900, delay = 0 } = block.data;
    
    return `
${Helpers.sanitizeId(block.id)} = function()
    ${variableName} = prompt{chat_timeout=${timeout}}${Helpers.formatDelay(delay)}
    menu.next('${Helpers.sanitizeId(nextBlockId)}')
end`;
  },

  [BlockTypes.BUTTON_NAVIGATION]: (block, routes) => {
    const { message, buttons = [], delay = 0 } = block.data;
    const buttonMenu = Helpers.formatButtonMenu(buttons);
    const delayStr = Helpers.formatDelay(delay);
    const processedMessage = Helpers.processText(message);
    
    const routeMapping = buttons.map((btn, index) => {
      const targetId = routes[index] || '';
      return `        ["${btn.label}"] = '${Helpers.sanitizeId(targetId)}'`;
    }).join(',\n');

    return `
${Helpers.sanitizeId(block.id)} = function()
    message{
        text='${processedMessage}'${buttonMenu ? ',\n        ' + buttonMenu : ''}
    }
    userChoice = prompt{chat_timeout=900}${delayStr}
    menu.route(userChoice, {
${routeMapping}
    })
end`;
  },

  [BlockTypes.AI_ROUTER]: (block, routes, projectId, apiKey) => {
    const { message, routes: routeConfigs = [], delay = 0 } = block.data;
    const delayStr = Helpers.formatDelay(delay);
    const processedMessage = Helpers.processText(message);
    
    const routeMapping = routeConfigs.map((route, index) => {
      const targetId = routes[index] || '';
      return `        ["${route.label}"] = '${Helpers.sanitizeId(targetId)}'`;
    }).join(',\n');

    return `
${Helpers.sanitizeId(block.id)} = function()
    message{
        text='${processedMessage}'
    }
    local userInput = prompt{chat_timeout=900}${delayStr}
    local body = {
        apiKey = "${apiKey}",
        operation = "ai_router",
        projectId = "${projectId}",
        blockId = "${block.id}",
        userInput = userInput
    }
    local request = {
        url = 'https://us-central1-projeto-alpha-digitro.cloudfunctions.net/aiBlocks',
        method = 'POST',
        timeout = 60000,
        body = utilits.encodeJSON(body)
    }
    request.headers = {}
    request.headers["Content-Type"] = 'application/json'
    local response = utilits.web(request)
    
    if response.statusCode >= 200 and response.statusCode < 300 then
        local responseData = utilits.decodeJSON(response.body)
        if responseData.success then
            local selectedRoute = responseData.data.selectedRoute
            menu.route(selectedRoute, {
${routeMapping}
            })
        else
            message{
                text='Erro no roteamento: ' .. (responseData.message or 'Erro desconhecido')
            }
            menu.next('${Helpers.sanitizeId(routes[0] || '')}')
        end
    else
        message{
            text='Erro na requisição: ' .. response.statusCode
        }
        menu.next('${Helpers.sanitizeId(routes[0] || '')}')
    end
end`;
  },

  [BlockTypes.API_REQUEST]: (block, routes) => {
    const { 
      url, 
      method, 
      headers = [], 
      body, 
      responseVariable,
      delay = 0 
    } = block.data;

    const successRoute = routes.success || '';
    const errorRoute = routes.error || '';
    const delayStr = Helpers.formatDelay(delay);
    
    const processedUrl = Helpers.processText(url);
    const headerStr = headers.length > 0 
      ? `\n    request.headers = {}\n    ${headers.map(h => 
        `request.headers["${h.key}"] = '${Helpers.processText(h.value)}'`
      ).join('\n    ')}`
      : '\n    request.headers = {}';

    let bodyStr = '';
    if (method !== 'GET' && body?.content) {
      if (body.type === 'json') {
        bodyStr = `\n    local body = ${Helpers.processJsonContent(body.content)}
    request.body = utilits.encodeJSON(body)`;
      } else if (body.type === 'formdata' && body.content.length > 0) {
        bodyStr = `\n    local body = '${Helpers.encodeFormData(body.content)}'
    request.body = body`;
      }
    }

    return `
${Helpers.sanitizeId(block.id)} = function()${delayStr}
    local request = {
        url = '${processedUrl}',
        method = '${method}',
        timeout = 30000
    }${headerStr}${bodyStr}
    
    local response = utilits.web(request)
    local statusCode = response.statusCode
    
    if statusCode >= 200 and statusCode < 300 then
        ${responseVariable} = utilits.decodeJSON(response.body)
        menu.next('${Helpers.sanitizeId(successRoute)}')
    else
        menu.next('${Helpers.sanitizeId(errorRoute)}')
    end
end`;
  },

  [BlockTypes.CONDITIONAL]: (block, routes) => {
    const { conditions = [], delay = 0 } = block.data;
    const delayStr = Helpers.formatDelay(delay);
    
    // Generate condition checks
    const conditionChecks = conditions.map((condition, index) => {
      const leftValue = Helpers.processText(condition.leftValue);
      const rightValue = Helpers.processText(condition.rightValue);
      const targetId = routes[index] || '';
      
      return `    if ${leftValue} ${condition.operator} ${rightValue} then
          menu.next('${Helpers.sanitizeId(targetId)}')
          return
      end`;
    }).join('\n');

    // Get else route (last route)
    const elseRoute = routes[routes.length - 1] || '';

    return `
${Helpers.sanitizeId(block.id)} = function()${delayStr}
${conditionChecks}
    -- No conditions matched, go to else route
    menu.next('${Helpers.sanitizeId(elseRoute)}')
end`;
  },

  [BlockTypes.SENSEDATA]: (block, routes) => {
    const { 
      endpoint,
      token,
      method = 'GET',
      delay = 0 
    } = block.data;

    // Get the actual variable name from the variables object
    const variableName = block.data.variables?.response?.name || 'response';

    const successRoute = routes.success || '';
    const errorRoute = routes.error || '';
    const processedEndpoint = Helpers.processText(endpoint);
    
    return `
${Helpers.sanitizeId(block.id)} = function()
    local consulta = {
        url = ${processedEndpoint},
        method = '${method}',
        timeout = 60000
    }
    consulta.headers = {}
    consulta.headers["Authorization"] = 'Bearer ${token}'
    
    local response = utilits.web(consulta)
    local statusCode = response.statusCode
    
    if statusCode >= 200 and statusCode < 300 then
        ${variableName} = utilits.decodeJSON(response.body)
        menu.next('${Helpers.sanitizeId(successRoute)}')
    else
        menu.next('${Helpers.sanitizeId(errorRoute)}')
    end
end`;
  },

  [BlockTypes.INTERACT_SERVICE]: (block) => {
    const { accessPoint, data = [], delay = 0 } = block.data;
    const delayStr = Helpers.formatDelay(delay);
    
    // Process additional data
    const dataStr = data.length > 0 
      ? `\n    ${data.map(item => 
        `    table.insert(dados, { ${item.key} = ${Helpers.processText(item.value)} })`
      ).join('\n')}`
      : '';

    return `
${Helpers.sanitizeId(block.id)} = function()${delayStr}
    dados = {}${dataStr}
    xfer{
        chat_destiny = '${accessPoint}',
        application = 'interact',
        form = dados
    }
end`;
  },

  [BlockTypes.IMAGE_INPUT]: (block, nextBlockId) => {
    const { variableName, timeout = 900, delay = 0 } = block.data;
    
    return `
${Helpers.sanitizeId(block.id)} = function()
    ${variableName} = prompt{chat_timeout=${timeout}, accept_file='true'}.url:gsub("http://192.168.44.154","https://sipcomercial.digitro.com.br")${Helpers.formatDelay(delay)}
    menu.next('${Helpers.sanitizeId(nextBlockId)}')
end`;
  },

  [BlockTypes.AUTO_ENERGY_READER]: (block, routes, projectId, apiKey) => {
    const { 
      imageUrl, 
      readResultVariable, 
      idResultVariable,
      delay = 0 
    } = block.data;

    const successRoute = routes.success || '';
    const errorRoute = routes.error || '';
    const delayStr = Helpers.formatDelay(delay);
    
    // Process the imageUrl to handle variables correctly
    const processedImageUrl = imageUrl.replace(/\${([^}]+)}/g, (match, expression) => {
      const cleanExpression = expression.trim();
      return `'..${cleanExpression}..'`;
    });
    
    return `
${Helpers.sanitizeId(block.id)} = function()${delayStr}
    local body = {
        apiKey = "${apiKey}",
        operation = "auto_energy_reader",
        imageUrl = '${processedImageUrl}'
    }
    local request = {
        url = 'https://us-central1-projeto-alpha-digitro.cloudfunctions.net/aiBlocks',
        method = 'POST',
        timeout = 60000,
        body = utilits.encodeJSON(body)
    }
    request.headers = {}
    request.headers["Content-Type"] = 'application/json'
    local response = utilits.web(request)
    
    if response.statusCode >= 200 and response.statusCode < 300 then
        local responseData = utilits.decodeJSON(response.body)
        if responseData.success and responseData.data.success then
            ${readResultVariable} = responseData.data.read_result
            ${idResultVariable} = responseData.data.id_result
            menu.next('${Helpers.sanitizeId(successRoute)}')
        else
            message{
                text='⚠️Lembre-se de tirar onde todos os dados do relógio estão enquadrados e visíveis'
            }
            menu.next('${Helpers.sanitizeId(errorRoute)}')
        end
    else
        message{
            text='Erro na requisição: ' .. response.statusCode
        }
        menu.next('${Helpers.sanitizeId(errorRoute)}')
    end
end`;
  },

  [BlockTypes.BACKGROUND_CHECK]: (node, routes) => {
    const { 
      cpf, 
      checks,
      variables: { response: { name: variableName } }, // Get the variable name correctly
      delay = 0 
    } = node.data;
    
    const blockId = Helpers.sanitizeId(node.id);
    
    return `
${blockId} = function()${Helpers.formatDelay(delay)}
    local body = {
        apiKey = API_KEY,
        operation = 'background_check',
        projectId = PROJECT_ID,
        blockId = '${node.id}',
        cpf = '${Helpers.processText(cpf)}',
        checks = {${checks.map(check => `'${check}'`).join(', ')}}
    }

    local request = {
        url = 'https://us-central1-projeto-alpha-digitro.cloudfunctions.net/aiBlocks',
        method = 'POST',
        timeout = 60000,
        body = utilits.encodeJSON(body)
    }

    request.headers = {}
    request.headers["Content-Type"] = 'application/json'

    local response = utilits.web(request)
    
    if response.statusCode >= 200 and response.statusCode < 300 then
        ${variableName} = utilits.decodeJSON(response.body).data
        menu.next('${Helpers.sanitizeId(routes.success)}')
    else
        menu.next('${Helpers.sanitizeId(routes.error)}')
    end
end`;
  },
};

// Main compiler function
export async function compileLuaFlow(nodes = [], edges = [], project) {
  // Get company API key
  const companyDoc = await getDoc(doc(firestore, 'companies', project.companyId));
  const apiKey = companyDoc.data().apiKey;

  // Validate inputs
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    console.error('Invalid input to compileLuaFlow:', { nodes, edges });
    throw new Error('Invalid input to compiler: nodes and edges must be arrays');
  }

  // Filter out any invalid nodes
  const validNodes = nodes.filter(node => node && node.id);

  if (validNodes.length === 0) {
    console.warn('No valid nodes found to compile');
    return '-- No valid nodes found to compile\nreturn function() end';
  }

  try {
    const generateHeader = () => `before = function()\n    answer()\nend\n\n`;
    
    const generateStartFunction = (firstBlockId) => `
start = function()
    API_KEY = '${apiKey}'
    PROJECT_ID = '${project.id}'
    menu.next('${Helpers.sanitizeId(firstBlockId)}')
end
`;
    const generateFooter = () => `\n\nfinish = function()\n    drop()\nend`;

    const compileBlock = (node) => {
      if (node.data.blockType === BlockTypes.START) return '';
      
      // Get output configuration for the block
      const outputConfig = getOutputConfiguration(node.data.blockType, node.data);
      if (!outputConfig) return '';

      // Get routes based on connection type
      let routes;
      switch (outputConfig.type) {
        case ConnectionTypes.DEFAULT:
          routes = edges.find(edge => edge.source === node.id)?.target;
          break;

        case ConnectionTypes.NUMBERED:
        case ConnectionTypes.CONDITIONAL:
          routes = outputConfig.handles.map(handle => {
            const edge = edges.find(e => 
              e.source === node.id && 
              e.sourceHandle === handle.id
            );
            return edge?.target || '';
          });
          break;

        case ConnectionTypes.INTEGRATION:
          routes = {
            success: edges.find(e => 
              e.source === node.id && 
              e.sourceHandle === 'success'
            )?.target || '',
            error: edges.find(e => 
              e.source === node.id && 
              e.sourceHandle === 'error'
            )?.target || ''
          };
          break;

        default:
          routes = '';
      }

      return BlockCompilers[node.data.blockType](node, routes, project.id, apiKey);
    };

    // Find start block and first connection
    const startBlock = nodes.find(node => node.data.blockType === BlockTypes.START);
    const firstBlockId = Helpers.getBlockRoutes(startBlock, edges);

    // Compile flow
    const nodeOutputs = validNodes.map(compileBlock).filter(Boolean);

    return [
      generateHeader(),
      generateStartFunction(firstBlockId),
      ...nodeOutputs,
      generateFooter()
    ].join('');
  } catch (error) {
    console.error('Error during compilation:', error);
    throw error;
  }
} 