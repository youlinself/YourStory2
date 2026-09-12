import { useAgentStore } from '@/stores/agentStore'

export function EventLogPanel() {
  const { eventLog, clearEventLog } = useAgentStore()

  return (
    <div className="rounded-lg border border-border-emphasis bg-ink text-success font-mono text-xs">
      <div className="flex items-center justify-between p-2 border-b border-border-emphasis">
        <span>事件日志</span>
        <button
          onClick={clearEventLog}
          className="text-ink-faint hover:text-white"
        >
          清空
        </button>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {eventLog.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-ink-muted">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            <span className="text-warning">{log.event}</span>
          </div>
        ))}
        {eventLog.length === 0 && (
          <div className="text-ink-muted">暂无事件</div>
        )}
      </div>
    </div>
  )
}
