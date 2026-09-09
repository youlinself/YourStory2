export interface ServiceDefinition<T = unknown> {
  name: string
  version: string
  capabilities: string[]
  __brand?: T
}

export interface ServiceProvider<T = unknown> {
  readonly definition: ServiceDefinition<T>
  provide(): T
}

export interface ServiceConsumer<T = unknown> {
  readonly definition: ServiceDefinition<T>
  consume(service: T): void
}

export class CapabilityRegistry {
  private definitions: Map<string, ServiceDefinition> = new Map()
  private providers: Map<string, ServiceProvider> = new Map()
  private consumers: Map<string, ServiceConsumer[]> = new Map()

  registerDefinition<T>(definition: ServiceDefinition<T>): void {
    this.definitions.set(definition.name, definition)
  }

  getDefinition<T>(name: string): ServiceDefinition<T> | undefined {
    return this.definitions.get(name) as ServiceDefinition<T> | undefined
  }

  registerProvider<T>(provider: ServiceProvider<T>): void {
    this.providers.set(provider.definition.name, provider)
    this.notifyConsumers(provider.definition.name)
  }

  registerConsumer<T>(consumer: ServiceConsumer<T>): () => void {
    const consumers = this.consumers.get(consumer.definition.name) || []
    consumers.push(consumer as ServiceConsumer)
    this.consumers.set(consumer.definition.name, consumers)

    const provider = this.providers.get(consumer.definition.name)
    if (provider) {
      consumer.consume(provider.provide() as T)
    }

    return () => {
      const idx = consumers.indexOf(consumer as ServiceConsumer)
      if (idx >= 0) consumers.splice(idx, 1)
    }
  }

  getService<T>(name: string): T | undefined {
    const provider = this.providers.get(name)
    return provider?.provide() as T | undefined
  }

  hasService(name: string): boolean {
    return this.providers.has(name)
  }

  unregisterProvider(name: string): void {
    this.providers.delete(name)
  }

  private notifyConsumers(name: string): void {
    const provider = this.providers.get(name)
    const consumers = this.consumers.get(name) || []
    if (provider) {
      for (const consumer of consumers) {
        consumer.consume(provider.provide())
      }
    }
  }

  getAllServiceNames(): string[] {
    return Array.from(this.definitions.keys())
  }

  clear(): void {
    this.definitions.clear()
    this.providers.clear()
    this.consumers.clear()
  }
}
