export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMOptions {
  model: string
  temperature?: number
  maxTokens?: number
}

export interface LLMChatRequest {
  messages: LLMMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface LLMAdapter {
  generate(prompt: string, options?: LLMOptions): Promise<string>
  generateStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: LLMOptions
  ): Promise<string>
}

/** AI 供应商接口 */
export interface AIVendor {
  id: string
  name: string
  baseUrl: string
  chat(request: LLMChatRequest): Promise<string>
  chatStream(request: LLMChatRequest & { onChunk: (chunk: string) => void }): Promise<string>
}

/** 统一 LLM 适配器实现 */
export class UnifiedLLMAdapter implements LLMAdapter {
  private vendors: Map<string, AIVendor>
  private defaultVendor: string

  constructor(vendors: Map<string, AIVendor>, defaultVendor: string) {
    this.vendors = vendors
    this.defaultVendor = defaultVendor
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    const vendor = this.vendors.get(this.defaultVendor)
    if (!vendor) throw new Error(`Vendor not found: ${this.defaultVendor}`)

    return vendor.chat({
      messages: [{ role: 'user', content: prompt }],
      ...options
    })
  }

  async generateStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    options: LLMOptions = {}
  ): Promise<string> {
    const vendor = this.vendors.get(this.defaultVendor)
    if (!vendor) throw new Error(`Vendor not found: ${this.defaultVendor}`)

    return vendor.chatStream({
      messages: [{ role: 'user', content: prompt }],
      onChunk,
      ...options
    })
  }

  /** 设置默认供应商 */
  setDefaultVendor(vendorId: string): void {
    if (!this.vendors.has(vendorId)) {
      throw new Error(`Vendor not found: ${vendorId}`)
    }
    this.defaultVendor = vendorId
  }

  /** 获取当前默认供应商 */
  getDefaultVendor(): string {
    return this.defaultVendor
  }

  /** 检查供应商是否存在 */
  hasVendor(vendorId: string): boolean {
    return this.vendors.has(vendorId)
  }
}
