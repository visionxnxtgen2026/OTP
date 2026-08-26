import React, { useEffect, useState } from 'react'
import { devApi } from '../services/api'
import type { VerificationLog } from '../services/api'
import { Search, RefreshCw, CheckCircle2, XCircle, Clock, Filter, AlertTriangle } from 'lucide-react'

export const VerificationLogsView: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([])
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<VerificationLog | null>(null)

  useEffect(() => {
    loadLogs()
    const interval = setInterval(loadLogs, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadLogs = async () => {
    try {
      const res = await devApi.getLogs()
      if (res.success && res.data) setLogs(res.data)
    } catch (err) {
      console.error('Failed to load logs:', err)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase()
    const matchesSearch =
      (log.requestId && log.requestId.toLowerCase().includes(term)) ||
      (log.applicationId && log.applicationId.toLowerCase().includes(term)) ||
      (log.mobileId && log.mobileId.includes(term)) ||
      (log.event && log.event.toLowerCase().includes(term))

    const matchesEvent = eventFilter === 'all' || log.event === eventFilter
    return matchesSearch && matchesEvent
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#102F2A] tracking-tight">Verification Logs</h2>
          <p className="text-xs text-[#64746E] mt-0.5">
            Real-time audit history of DDS Auth verification events
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 bg-[#F7F8F3] hover:bg-[#EEF2EC] border border-[#D8E0DA] text-[#102F2A] rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Request ID, Mobile, Event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D8E0DA] rounded-2xl text-xs sm:text-sm text-[#102F2A] focus:outline-hidden focus:border-[#123C35] shadow-2xs"
          />
          <Search className="w-4 h-4 text-[#64746E] absolute left-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64746E]" />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-[#D8E0DA] rounded-2xl text-xs font-semibold text-[#102F2A] shadow-2xs focus:outline-hidden"
          >
            <option value="all">All Events</option>
            <option value="REQUEST_CREATED">REQUEST_CREATED</option>
            <option value="USER_APPROVED">USER_APPROVED</option>
            <option value="USER_REJECTED">USER_REJECTED</option>
            <option value="MOBILE_NOT_REGISTERED">MOBILE_NOT_REGISTERED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white border border-[#D8E0DA] rounded-3xl shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[#64746E] text-xs">
            No verification log events found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F3] border-b border-[#D8E0DA] text-[11px] font-bold uppercase text-[#64746E] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Status / Event</th>
                  <th className="py-3.5 px-4 sm:px-6">Request ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Mobile Number</th>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E0DA]">
                {filteredLogs.map((log) => {
                  const isSuccess = log.event === 'USER_APPROVED'
                  const isPending = log.event === 'REQUEST_CREATED'
                  const isUnregistered = log.event === 'MOBILE_NOT_REGISTERED'
                  const isFail = !isSuccess && !isPending && !isUnregistered

                  return (
                    <tr key={log.id} className="hover:bg-[#F7F8F3] transition-colors">
                      <td className="py-3 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-[#EEF2EC] text-[#2F8F6B] border border-[#D8E0DA]'
                              : isPending
                              ? 'bg-[#EEF2EC] text-[#123C35] border border-[#D8E0DA]'
                              : isUnregistered
                              ? 'bg-amber-50 text-[#C48A32] border border-amber-200'
                              : 'bg-rose-50 text-[#C95A5A] border border-rose-200'
                          }`}
                        >
                          {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                          {isFail && <XCircle className="w-3 h-3" />}
                          {isUnregistered && <AlertTriangle className="w-3 h-3" />}
                          {isPending && <span className="w-1.5 h-1.5 rounded-full bg-[#123C35] animate-ping" />}
                          <span>{log.event}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 sm:px-6 font-mono text-[11px] text-[#102F2A]">
                        {log.requestId || '—'}
                      </td>

                      <td className="py-3 px-4 sm:px-6 font-mono text-[#102F2A]">
                        {log.mobileId || '—'}
                      </td>

                      <td className="py-3 px-4 sm:px-6 text-[#64746E]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#64746E]" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-semibold text-[#123C35] hover:text-[#6F9584] cursor-pointer transition-colors"
                        >
                          View JSON
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#D8E0DA] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102F2A]">Log Payload</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs text-[#64746E] hover:text-[#102F2A] cursor-pointer"
              >
                Close
              </button>
            </div>

            <pre className="p-4 bg-[#102F2A] text-[#DCE8E1] rounded-2xl font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-[#123C35]">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
