import type { AutobiographyAgent } from '../AutobiographyAgent'
import type { ToolResult } from '../tools/ToolTypes'

export class LegacyAdapter {
  constructor(private agent: AutobiographyAgent) {}

  async handleMessage(sessionId: string, message: string): Promise<string> {
    const handle = this.agent.getHandle(sessionId)
    if (handle) {
      handle.followup({ content: message, timestamp: Date.now() })
      await handle.whenIdle()
      return handle.getLastResponse()
    }

    const result = await this.agent.handleMessage(sessionId, message)
    return result.response
  }

  async executeTool(sessionId: string, toolName: string, args: any): Promise<ToolResult> {
    return this.agent.executeTool(sessionId, toolName, args)
  }

  async createSession(chapterId: string, context: any) {
    return this.agent.createSession(chapterId, context)
  }

  getSession(sessionId: string) {
    return this.agent.getSession(sessionId)
  }
}
