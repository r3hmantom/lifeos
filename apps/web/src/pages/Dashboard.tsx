import { useEffect, useState } from "react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
import { Activity, Target, Trophy, Clock, CheckCircle2 } from "lucide-react"
import { goalsApi, scheduleApi } from "@/lib/api"
import type { ScheduleItem, Goal } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function Dashboard() {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [goals, setGoals] = useState<Goal[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0]
                const [scheduleRes, goalsRes] = await Promise.all([
                    scheduleApi.get(today),
                    goalsApi.getAll()
                ])
                setSchedule(scheduleRes.data.items || [])
                setGoals(goalsRes.data.data || [])
            } catch (error) {
                console.error("Failed to fetch dashboard data", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    // Calculate Time Distribution
    const typeDistribution = schedule.reduce((acc, item) => {
        const type = item.type || "Uncategorized"
        acc[type] = (acc[type] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const chartData = Object.entries(typeDistribution).map(([name, value], index) => ({
        name,
        value,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`
    }))

    // Calculate Stats
    const activeGoals = goals.filter(g => g.isActive).length
    const highPriorityGoals = goals.filter(g => g.isActive && g.priority === "High").length
    const completedTasks = schedule.filter(s => s.isCompleted).length
    const completionRate = schedule.length > 0 ? Math.round((completedTasks / schedule.length) * 100) : 0

    const chartConfig = {
        value: {
            label: "Items",
        },
        ...Object.fromEntries(
            Object.keys(typeDistribution).map((key, index) => [
                key,
                { label: key, color: `hsl(var(--chart-${(index % 5) + 1}))` }
            ])
        )
    }

    if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your Life OS
                    </p>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Progress</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">{completedTasks} of {schedule.length} tasks completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeGoals}</div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{highPriorityGoals}</div>
                        <p className="text-xs text-muted-foreground">Goals needing focus</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Focus Balance</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Object.keys(typeDistribution).length}</div>
                        <p className="text-xs text-muted-foreground">Categories today</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Time Distribution Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Activity Distribution</CardTitle>
                        <CardDescription>
                            Breakdown of your schedule by category type.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {chartData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No schedule data for today
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Goals List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Priorities</CardTitle>
                        <CardDescription>
                            Your high priority active goals.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {goals
                                .filter(g => g.isActive && g.priority === "High")
                                .slice(0, 5)
                                .map((goal) => (
                                    <div key={goal.id} className="flex items-center">
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary opacity-70" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{goal.title}</p>
                                            <p className="text-xs text-muted-foreground">{goal.focus}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                            {new Date(goal.deadline).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            {goals.filter(g => g.isActive && g.priority === "High").length === 0 && (
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    No high priority goals set.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}