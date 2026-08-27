'use client'

import { useState, useEffect } from 'react'
import { VibranicClient } from '@/lib/vibranic-sdk'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

// Initialize the SDK
const vibranic = new VibranicClient({
    hubUrl: 'http://localhost:3000', // Your Vibradex URL
    apiKey: 'vib_354a736c162143feafc88e84c059574f', // Replace with actual API key from DB
    batchSize: 5,
    flushInterval: 3000
})

export default function DemoApp() {
    const [counter, setCounter] = useState(0)
    const [todos, setTodos] = useState<string[]>([])
    const [newTodo, setNewTodo] = useState('')
    const [lastEvent, setLastEvent] = useState<string>('')

    // Track page view on mount
    useEffect(() => {
        vibranic.trackInfo('Demo app loaded')
        vibranic.trackMetric('pageViews', 1)
        setLastEvent('App loaded - info event sent')
    }, [])

    // Track counter metric periodically
    useEffect(() => {
        if (counter > 0) {
            vibranic.trackMetric('counterValue', counter)
            setLastEvent(`Tracked metric: counterValue = ${counter}`)
        }
    }, [counter])

    const handleIncrement = () => {
        setCounter(c => c + 1)
        vibranic.trackInfo('Counter incremented', { newValue: counter + 1 })
        setLastEvent('Counter incremented - info event sent')
    }

    const handleError = () => {
        const error = new Error('Simulated error from demo app')
        vibranic.trackError(
            'User triggered test error',
            { counter, todoCount: todos.length },
            error.stack
        )
        setLastEvent('❌ Error event sent!')
    }

    const handleWarning = () => {
        vibranic.trackWarning('Demo warning triggered', {
            counter,
            message: 'This is just a test warning'
        })
        setLastEvent('⚠️ Warning event sent!')
    }

    const addTodo = () => {
        if (newTodo.trim()) {
            setTodos([...todos, newTodo])
            setNewTodo('')
            vibranic.trackInfo('Todo added', { todo: newTodo })
            vibranic.trackMetric('todoCount', todos.length + 1)
            setLastEvent('Todo added - tracked event and metric')
        }
    }

    const sendBulkMetrics = () => {
        vibranic.trackMetric('activeUsers', Math.floor(Math.random() * 100))
        vibranic.trackMetric('responseTime', Math.random() * 500, 'ms')
        vibranic.trackMetric('errorRate', Math.random() * 5, 'percentage')
        setLastEvent('📊 Sent 3 metrics!')
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">Vibranic Demo App</h1>
                    <p className="text-muted-foreground">
                        This app sends diagnostic data to Vibradex
                    </p>
                </div>

                {/* Status Banner */}
                {lastEvent && (
                    <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium">{lastEvent}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Counter Demo */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Counter Demo</CardTitle>
                            <CardDescription>
                                Tracks metrics on every increment
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-6xl font-bold text-center py-8">
                                {counter}
                            </div>
                            <Button
                                onClick={handleIncrement}
                                className="w-full"
                                size="lg"
                            >
                                Increment Counter
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Todo Demo */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Todo List</CardTitle>
                            <CardDescription>
                                Each action sends an event
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newTodo}
                                    onChange={(e) => setNewTodo(e.target.value)}
                                    placeholder="Add a todo..."
                                    onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                                />
                                <Button onClick={addTodo}>Add</Button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {todos.map((todo, i) => (
                                    <div
                                        key={i}
                                        className="p-2 bg-muted rounded text-sm"
                                    >
                                        {todo}
                                    </div>
                                ))}
                                {todos.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No todos yet
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Test Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Diagnostic Events</CardTitle>
                        <CardDescription>
                            Send various types of events to Vibradex
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-4">
                        <Button
                            onClick={handleError}
                            variant="destructive"
                            className="w-full"
                        >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Send Error
                        </Button>
                        <Button
                            onClick={handleWarning}
                            variant="outline"
                            className="w-full border-yellow-500 text-yellow-600"
                        >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Send Warning
                        </Button>
                        <Button
                            onClick={sendBulkMetrics}
                            variant="outline"
                            className="w-full"
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Send Metrics
                        </Button>
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>✅ Every action in this app sends data to Vibradex</p>
                        <p>✅ Events are batched and sent automatically every 3 seconds</p>
                        <p>✅ Open Vibradex to see the events appear in real-time</p>
                        <p>✅ Check the "Demo App" page in the hub to view all diagnostics</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
