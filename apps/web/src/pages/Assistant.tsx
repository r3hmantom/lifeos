import { useState, useEffect, useRef } from "react"
import { Send, Bot, User as UserIcon, Calendar, Check, Loader2, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { assistantApi, goalsApi, memoriesApi, scheduleApi } from "@/lib/api"
import type { ChatMessage, Goal, Memory, ScheduleItem } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ProposedSchedule {
    date: string;
    items: ScheduleItem[];
}

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export default function Assistant() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "Hello! I'm your LifeOS assistant. I can help you plan your day based on your goals and memories. What would you like to do?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [goals, setGoals] = useState<Goal[]>([])
    const [memories, setMemories] = useState<Memory[]>([])
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
    const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([])
    const [proposedSchedule, setProposedSchedule] = useState<ProposedSchedule | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [goalsRes, memoriesRes] = await Promise.all([
                    goalsApi.getAll(),
                    memoriesApi.getAll()
                ])
                setGoals(goalsRes.data.data || [])
                setMemories(memoriesRes.data.data || [])

                // Auto-select active high priority items
                const activeHighGoals = (goalsRes.data.data || [])
                    .filter(g => g.isActive && g.priority === "High")
                    .map(g => g.id)
                setSelectedGoalIds(activeHighGoals)
            } catch (error) {
                console.error("Failed to fetch context data", error)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async () => {
        if (!input.trim()) return

        const userMessage: ChatMessage = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        setProposedSchedule(null) // Clear previous proposal if any

        try {
            const response = await assistantApi.chat({
                messages: [...messages, userMessage],
                context: {
                    date: format(new Date(), "yyyy-MM-dd"),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    selectedGoalIds,
                    selectedMemoryIds
                }
            })

            let responseData = response.data;
            let displayMessage = response.data.message;

            // Check for embedded JSON in markdown code blocks if intent is chat
            // or if the message contains a code block that looks like our protocol
            // Improved regex to be more lenient with whitespace and optional language tag
            const jsonMatch = response.data.message.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    // If the parsed JSON has an intent, use it as the source of truth for data
                    if (parsed.intent && parsed.intent !== "chat") {
                        responseData = parsed;
                        // Clean up the message to remove the JSON block for display purposes
                        displayMessage = response.data.message.replace(/```(?:json)?\s*[\s\S]*?\s*```/, "").trim();
                    }
                } catch (e) {
                    console.error("Failed to parse embedded JSON", e);
                }
            }

            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: displayMessage
            }
            setMessages(prev => [...prev, assistantMessage])

            if (responseData.intent === "schedule_generated") {
                const rawSchedule = responseData.data?.schedule;
                const today = format(new Date(), "yyyy-MM-dd");
                let items: ScheduleItem[] = [];

                // Helper to normalize item data
                const normalizeItem = (d: any) => {
                    let start = d.startTime;
                    let end = d.endTime;

                    // If time is just HH:mm, append to today's date
                    if (start && !start.includes("T") && start.includes(":")) {
                        const startDate = new Date(`${today}T${start}:00`);
                        if (!isNaN(startDate.getTime())) {
                            start = startDate.toISOString();
                        } else {
                            start = `${today}T${start}:00`; // Fallback
                        }
                    }

                    if (end && !end.includes("T") && end.includes(":")) {
                        const endDate = new Date(`${today}T${end}:00`);
                        if (!isNaN(endDate.getTime())) {
                            end = endDate.toISOString();
                        } else {
                            end = `${today}T${end}:00`; // Fallback
                        }
                    }

                    return {
                        id: d.id || generateUUID(),
                        title: d.title,
                        description: d.description,
                        startTime: start,
                        endTime: end,
                        type: d.type || "work",
                        isCompleted: false
                    } as ScheduleItem;
                };

                if (Array.isArray(rawSchedule)) {
                    items = rawSchedule.map(normalizeItem);
                } else if (rawSchedule?.items && Array.isArray(rawSchedule.items)) {
                    items = rawSchedule.items.map(normalizeItem);
                }

                if (items.length > 0) {
                    setProposedSchedule({
                        date: rawSchedule?.date || today,
                        items: items
                    })
                    toast.info("Schedule generated. Please review and save.")
                } else {
                    console.warn("No items found in schedule generation response", rawSchedule);
                }
            } else if (responseData.intent === "schedule_modified") {
                toast.info("Schedule proposal updated. Please review and save.")
                // If the backend returns the updated schedule, we could show it or just notify
                if (responseData.data?.schedule) {
                    setProposedSchedule({
                        ...responseData.data.schedule,
                        items: responseData.data.schedule.items || []
                    })
                } else if (responseData.data?.modifications) {
                    // Convert modifications to preview format
                    const today = format(new Date(), "yyyy-MM-dd");
                    const items = responseData.data.modifications
                        .filter((m: any) => m.action === "create" || m.action === "update")
                        .map((m: any) => {
                            const d = m.data;
                            // Handle simple time format HH:mm
                            let start = d.startTime;
                            let end = d.endTime;

                            // If time is just HH:mm, append to today's date
                            if (start && !start.includes("T") && start.includes(":")) {
                                const startDate = new Date(`${today}T${start}:00`);
                                if (!isNaN(startDate.getTime())) {
                                    start = startDate.toISOString();
                                } else {
                                    start = `${today}T${start}:00`; // Fallback
                                }
                            }

                            if (end && !end.includes("T") && end.includes(":")) {
                                const endDate = new Date(`${today}T${end}:00`);
                                if (!isNaN(endDate.getTime())) {
                                    end = endDate.toISOString();
                                } else {
                                    end = `${today}T${end}:00`; // Fallback
                                }
                            }

                            return {
                                id: d.id || generateUUID(),
                                title: d.title,
                                description: d.description,
                                startTime: start,
                                endTime: end,
                                type: d.type || "work",
                                isCompleted: false
                            } as ScheduleItem;
                        });

                    if (items.length > 0) {
                        setProposedSchedule({
                            date: today,
                            items: items
                        });
                    }
                }
            }

        } catch (error) {
            toast.error("Failed to get response from assistant")
            setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I encountered an error processing your request." }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveSchedule = async () => {
        if (!proposedSchedule) return

        try {
            await scheduleApi.batchCreate({
                date: proposedSchedule.date,
                items: proposedSchedule.items || []
            })
            toast.success("Schedule saved successfully!")
            setProposedSchedule(null)
            setMessages(prev => [...prev, { role: "assistant", content: "I've saved that schedule for you. You can view it in the Schedule tab." }])
        } catch (error) {
            toast.error("Failed to save schedule")
        }
    }

    const toggleGoal = (id: string) => {
        setSelectedGoalIds(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        )
    }

    const toggleMemory = (id: string) => {
        setSelectedMemoryIds(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        )
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 p-6 animate-in fade-in duration-500">
            {/* Chat Area */}
            <Card className="flex-1 flex flex-col shadow-md border-muted">
                <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>AI Planner</CardTitle>
                            <CardDescription>Chat to plan your day</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full p-4" ref={scrollRef}>
                        <div className="space-y-4 pb-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex gap-3 max-w-[80%]",
                                        msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {msg.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "rounded-lg p-3 text-sm",
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted/50 border border-border"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Thinking...
                                    </div>
                                </div>
                            )}

                            {/* Proposed Schedule Preview */}
                            {proposedSchedule && (
                                <div className="ml-11 max-w-[85%]">
                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Proposed Schedule for {proposedSchedule.date}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-xs space-y-2">
                                            {proposedSchedule.items?.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-background/50 p-2 rounded border border-border/50">
                                                    <Badge variant="outline" className="shrink-0">
                                                        {format(new Date(item.startTime), "HH:mm")} - {format(new Date(item.endTime), "HH:mm")}
                                                    </Badge>
                                                    <span className="font-medium truncate">{item.title}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                        <CardFooter>
                                            <Button size="sm" className="w-full" onClick={handleSaveSchedule}>
                                                <Check className="mr-2 h-4 w-4" />
                                                Accept & Save Schedule
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <div className="p-4 border-t bg-background">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>

            {/* Context Sidebar */}
            <div className="w-80 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Context</CardTitle>
                        <CardDescription>Select items to inform the AI</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full px-4">
                            <div className="space-y-6 pb-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-3 flex items-center text-muted-foreground">
                                        <ArrowRight className="h-3 w-3 mr-1" /> Active Goals
                                    </h4>
                                    <div className="space-y-2">
                                        {goals.filter(g => g.isActive).map(goal => (
                                            <div key={goal.id} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`goal-${goal.id}`}
                                                    checked={selectedGoalIds.includes(goal.id)}
                                                    onCheckedChange={() => toggleGoal(goal.id)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={`goal-${goal.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {goal.title}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {goal.priority} Priority • {goal.focus}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {goals.filter(g => g.isActive).length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">No active goals found.</p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="text-sm font-medium mb-3 flex items-center text-muted-foreground">
                                        <ArrowRight className="h-3 w-3 mr-1" /> Memories & Habits
                                    </h4>
                                    <div className="space-y-2">
                                        {memories.filter(m => m.isActive).map(memory => (
                                            <div key={memory.id} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`mem-${memory.id}`}
                                                    checked={selectedMemoryIds.includes(memory.id)}
                                                    onCheckedChange={() => toggleMemory(memory.id)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={`mem-${memory.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {memory.title}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        {memories.filter(m => m.isActive).length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">No active memories found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}