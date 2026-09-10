import type { ToolDefinition, ToolParameters, ToolResult, ToolExecutionContext } from '../ToolTypes'

interface GenerateCharacterArgs {
  description: string
  role?: 'protagonist' | 'supporting' | 'antagonist' | 'extra'
  gender?: 'male' | 'female' | 'unknown'
  age?: number
}

const parameters: ToolParameters = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      description: '角色描述或灵感'
    },
    role: {
      type: 'string',
      enum: ['protagonist', 'supporting', 'antagonist', 'extra'],
      description: '角色类型：主角/配角/反派/群众'
    },
    gender: {
      type: 'string',
      enum: ['male', 'female', 'unknown'],
      description: '性别偏好'
    },
    age: {
      type: 'number',
      description: '年龄偏好'
    }
  },
  required: ['description']
}

export const generateCharacterTool: ToolDefinition = {
  name: 'novel_generate_character',
  description: '根据描述生成完整的角色设定',
  parameters,
  isConcurrencySafe: () => true,
  timeoutMs: 45000,

  execute: async (args: GenerateCharacterArgs, _context: ToolExecutionContext): Promise<ToolResult> => {
    const { description, role, gender, age } = args

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: 'description is required'
      }
    }

    const roleNames = {
      protagonist: '主角',
      supporting: '配角',
      antagonist: '反派',
      extra: '群众角色'
    }

    return {
      success: true,
      data: {
        prompt: {
          description,
          role: role ? roleNames[role] : '不限',
          gender: gender || '不限',
          age: age || '不限'
        }
      }
    }
  }
}
