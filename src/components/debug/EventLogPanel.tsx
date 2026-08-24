import { useAgentStore } from '@/stores/agentStore'

export function EventLogPanel() {
  const { eventLog, clearEventLog } = useAgentStore()

  return (
    <div className="border rounded-lg bg-gray-900 text-green-400 font-mono text-xs">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <span>事件日志</span>
        <button
          onClick={clearEventLog}
          className="text-gray-400 hover:text-white"
        >
          清空
        </button>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {eventLog.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-gray-500">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {' '}
            <span className="text-yellow-400">{log.event}</span>
          </div>
        ))}
        {eventLog.length === 0 && (
          <div className="text-gray-500">暂无事件</div>
        )}
      </div>
    </div>
  )
}
