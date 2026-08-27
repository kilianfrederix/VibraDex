'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Info, Bug, Filter, ChevronRight } from "lucide-react"

type Event = {
  id: string
  type: string
  severity: string
  message: string
  timestamp: Date | string
  app: { id: string; name: string }
  details?: unknown
  stackTrace?: string | null
  userAgent?: string | null
  ipAddress?: string | null
}

type App = {
  id: string
  name: string
}

type EventsTableClientProps = {
  events: Event[]
  apps: App[]
}

const typeConfig: Record<string, { icon: typeof Info; color: string }> = {
  error: { icon: AlertCircle, color: "text-red-500" },
  warning: { icon: AlertTriangle, color: "text-yellow-500" },
  info: { icon: Info, color: "text-sky-500" },
  debug: { icon: Bug, color: "text-muted-foreground" },
}

const severityBar: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-emerald-500",
}

const severityBadge: Record<string, string> = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
}

// Stable pastel color per app name (no color stored on the app).
function appHue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

function relativeTime(value: Date | string): string {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// Render the small inline "key: value" chips from an event's details JSON.
function detailChips(details: unknown) {
  if (!details || typeof details !== "object") return []
  return Object.entries(details as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => {
      const raw = String(v)
      // shorten long ids so they don't dominate the row
      const value = raw.length > 24 ? `${raw.slice(0, 10)}…${raw.slice(-6)}` : raw
      return { k, value }
    })
}

export function EventsTableClient({ events, apps }: EventsTableClientProps) {
  const [severityFilter, setSeverityFilter] = useState<string | null>(null)
  const [appFilter, setAppFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const filteredEvents = events.filter(event => {
    if (severityFilter && event.severity !== severityFilter) return false
    if (appFilter && event.app.name !== appFilter) return false
    return true
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Events ({filteredEvents.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {[["all", null], ["high", "high"], ["medium", "medium"], ["low", "low"]].map(([label, val]) => (
                <Button
                  key={label as string}
                  variant={severityFilter === (val as string | null) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSeverityFilter(val as string | null)}
                  className="capitalize"
                >
                  {label}
                </Button>
              ))}
            </div>
            <select
              className="text-sm border rounded px-2 py-1 bg-background"
              value={appFilter || ""}
              onChange={(e) => setAppFilter(e.target.value || null)}
            >
              <option value="">All Apps</option>
              {apps.map(app => (
                <option key={app.id} value={app.name}>{app.name}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No events match your filters</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredEvents.map((event) => {
              const cfg = typeConfig[event.type] ?? typeConfig.info
              const TypeIcon = cfg.icon
              const chips = detailChips(event.details)
              const isOpen = expanded.has(event.id)
              const hue = appHue(event.app.name)

              return (
                <div key={event.id} className="overflow-hidden rounded-lg border bg-card">
                  <button
                    type="button"
                    onClick={() => toggle(event.id)}
                    className="flex w-full items-stretch gap-0 text-left transition-colors hover:bg-muted/40"
                  >
                    {/* severity color bar */}
                    <span className={`w-1 shrink-0 ${severityBar[event.severity] ?? "bg-muted"}`} />

                    <span className="flex flex-1 min-w-0 gap-3 p-3">
                      <TypeIcon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />

                      <span className="flex-1 min-w-0">
                        {/* top line: app · type · severity · time */}
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: `hsl(${hue} 65% 55%)` }}
                            />
                            {event.app.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                            {event.type}
                          </Badge>
                          <Badge variant="outline" className={severityBadge[event.severity] ?? ""}>
                            {event.severity}
                          </Badge>
                          <span
                            className="ml-auto text-xs text-muted-foreground shrink-0"
                            title={new Date(event.timestamp).toLocaleString()}
                          >
                            {relativeTime(event.timestamp)}
                          </span>
                        </span>

                        {/* message */}
                        <span className="mt-1 block text-sm text-foreground/90 line-clamp-2">
                          {event.message}
                        </span>

                        {/* detail chips */}
                        {chips.length > 0 && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {chips.map(({ k, value }) => (
                              <span
                                key={k}
                                className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                              >
                                <span className="font-medium text-foreground/70">{k}</span>
                                <span className="font-mono">{value}</span>
                              </span>
                            ))}
                          </span>
                        )}
                      </span>

                      <ChevronRight
                        className={`h-4 w-4 shrink-0 self-center text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                    </span>
                  </button>

                  {/* expanded detail */}
                  {isOpen && (
                    <div className="border-t bg-muted/20 px-4 py-3 text-xs space-y-3">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                        <span><span className="font-medium text-foreground/70">Time:</span> {new Date(event.timestamp).toLocaleString()}</span>
                        {event.ipAddress && <span><span className="font-medium text-foreground/70">IP:</span> {event.ipAddress}</span>}
                        {event.userAgent && <span className="max-w-full truncate"><span className="font-medium text-foreground/70">Agent:</span> {event.userAgent}</span>}
                      </div>
                      {event.details != null && (
                        <div>
                          <p className="font-medium text-foreground/70 mb-1">Details</p>
                          <pre className="overflow-x-auto rounded-md bg-background p-2 font-mono text-[11px]">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      {event.stackTrace && (
                        <div>
                          <p className="font-medium text-foreground/70 mb-1">Stack trace</p>
                          <pre className="overflow-x-auto rounded-md bg-background p-2 font-mono text-[11px] text-red-500/90">
                            {event.stackTrace}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
