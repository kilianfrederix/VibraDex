/**
 * Vibradex SDK
 *
 * Use this in your external apps to send diagnostic data to Vibradex
 * 
 * @example
 * ```typescript
 * import { VibranicClient } from '@vibranic/sdk'
 * 
 * const vibranic = new VibranicClient({
 *   hubUrl: 'https://central.vibranic.com',
 *   apiKey: 'your-api-key-here'
 * })
 * 
 * // Track an error
 * vibranic.trackError('Payment failed', {
 *   userId: '123',
 *   amount: 99.99
 * })
 * 
 * // Track a metric
 * vibranic.trackMetric('activeUsers', 1234)
 * ```
 */

export type DiagnosticEventType = 'error' | 'warning' | 'info' | 'debug'
export type DiagnosticSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface VibranicConfig {
    hubUrl: string
    apiKey: string
    batchSize?: number
    flushInterval?: number
    enabled?: boolean
}

export interface DiagnosticEvent {
    type: DiagnosticEventType
    severity: DiagnosticSeverity
    message: string
    details?: Record<string, any>
    stackTrace?: string
}

export interface Metric {
    metricKey: string
    value: number
    unit?: string
}

export class VibranicClient {
    private config: Required<VibranicConfig>
    private eventQueue: DiagnosticEvent[] = []
    private metricQueue: Metric[] = []
    private flushTimer?: NodeJS.Timeout

    constructor(config: VibranicConfig) {
        this.config = {
            batchSize: 10,
            flushInterval: 5000, // 5 seconds
            enabled: true,
            ...config
        }

        if (this.config.enabled) {
            this.startFlushTimer()
        }
    }

    /**
     * Track an error event
     */
    async trackError(
        message: string,
        details?: Record<string, any>,
        stackTrace?: string
    ): Promise<void> {
        return this.track({
            type: 'error',
            severity: 'high',
            message,
            details,
            stackTrace
        })
    }

    /**
     * Track a warning event
     */
    async trackWarning(
        message: string,
        details?: Record<string, any>
    ): Promise<void> {
        return this.track({
            type: 'warning',
            severity: 'medium',
            message,
            details
        })
    }

    /**
     * Track an info event
     */
    async trackInfo(
        message: string,
        details?: Record<string, any>
    ): Promise<void> {
        return this.track({
            type: 'info',
            severity: 'low',
            message,
            details
        })
    }

    /**
     * Track a custom diagnostic event
     */
    async track(event: DiagnosticEvent): Promise<void> {
        if (!this.config.enabled) return

        this.eventQueue.push(event)

        // Flush if batch size reached
        if (this.eventQueue.length >= this.config.batchSize) {
            await this.flushEvents()
        }
    }

    /**
     * Track a metric value
     */
    async trackMetric(
        metricKey: string,
        value: number,
        unit?: string
    ): Promise<void> {
        if (!this.config.enabled) return

        this.metricQueue.push({ metricKey, value, unit })

        // Flush if batch size reached
        if (this.metricQueue.length >= this.config.batchSize) {
            await this.flushMetrics()
        }
    }

    /**
     * Manually flush all queued events and metrics
     */
    async flush(): Promise<void> {
        await Promise.all([
            this.flushEvents(),
            this.flushMetrics()
        ])
    }

    /**
     * Stop the automatic flush timer
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer)
        }
    }

    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flush().catch(err => {
                console.error('Vibranic flush error:', err)
            })
        }, this.config.flushInterval)
    }

    private async flushEvents(): Promise<void> {
        if (this.eventQueue.length === 0) return

        const events = [...this.eventQueue]
        this.eventQueue = []

        try {
            const failedEvents: DiagnosticEvent[] = []
            
            for (const event of events) {
                const response = await fetch(`${this.config.hubUrl}/api/diagnostics/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.config.apiKey
                    },
                    body: JSON.stringify(event)
                })
                
                if (!response.ok) {
                    console.error(`Failed to send event: ${response.status} ${response.statusText}`)
                    if (response.status >= 500) {
                        failedEvents.push(event)
                    }
                }
            }
            
            if (failedEvents.length > 0) {
                this.eventQueue.push(...failedEvents)
            }
        } catch (error) {
            console.error('Failed to send diagnostic events:', error)
            this.eventQueue.push(...events)
        }
    }

    private async flushMetrics(): Promise<void> {
        if (this.metricQueue.length === 0) return

        const metrics = [...this.metricQueue]
        this.metricQueue = []

        try {
            const response = await fetch(`${this.config.hubUrl}/api/diagnostics/metrics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey
                },
                body: JSON.stringify(metrics)
            })
            
            if (!response.ok) {
                console.error(`Failed to send metrics: ${response.status} ${response.statusText}`)
                if (response.status >= 500) {
                    this.metricQueue.push(...metrics)
                }
            }
        } catch (error) {
            console.error('Failed to send metrics:', error)
            this.metricQueue.push(...metrics)
        }
    }
}

// Singleton instance for convenience
let defaultInstance: VibranicClient | null = null

export function initVibranic(config: VibranicConfig): VibranicClient {
    defaultInstance = new VibranicClient(config)
    return defaultInstance
}

export function getVibranic(): VibranicClient {
    if (!defaultInstance) {
        throw new Error('Vibranic not initialized. Call initVibranic() first.')
    }
    return defaultInstance
}
