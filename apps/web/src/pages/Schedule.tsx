import { useEffect, useState } from "react"
import { format, isWithinInterval } from "date-fns"
import { Calendar as CalendarIcon, Loader2, RefreshCw, Plus, Pencil, Trash2, Clock, Check, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { scheduleApi } from "@/lib/api"
import type { ScheduleItem } from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const scheduleFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time"),
    type: z.string().min(1, "Type is required"),
})

export default function Schedule() {
    const [date, setDate] = useState<Date>(new Date())
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [proposedSchedule, setProposedSchedule] = useState<ScheduleItem[] | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000) // Update every minute
        return () => clearInterval(timer)
    }, [])

    const form = useForm<z.infer<typeof scheduleFormSchema>>({
        resolver: zodResolver(scheduleFormSchema),
        defaultValues: {
            title: "",
            description: "",
            startTime: "09:00",
            endTime: "10:00",
            type: "work",
        },
    })

    useEffect(() => {
        if (editingItem) {
            form.reset({
                title: editingItem.title,
                description: editingItem.description || "",
                startTime: format(new Date(editingItem.startTime), "HH:mm"),
                endTime: format(new Date(editingItem.endTime), "HH:mm"),
                type: editingItem.type,
            })
        } else {
            form.reset({
                title: "",
                description: "",
                startTime: "09:00",
                endTime: "10:00",
                type: "work",
            })
        }
    }, [editingItem, form])

    useEffect(() => {
        fetchSchedule()
    }, [date])

    const fetchSchedule = async () => {
        setIsLoading(true)
        try {
            const formattedDate = format(date, "yyyy-MM-dd")
            const response = await scheduleApi.get(formattedDate)
            // Sort by start time
            const sorted = (response.data.items || []).sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            )
            setSchedule(sorted)
        } catch (error) {
            console.error("Failed to fetch schedule", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateSchedule = async () => {
        setIsGenerating(true)
        try {
            const formattedDate = format(date, "yyyy-MM-dd")
            const response = await scheduleApi.generate({
                date: formattedDate,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                preferences: {
                    startOfDay: "09:00",
                    endOfDay: "17:00"
                }
            })
            
            let rawItems: any[] = [];
            if (Array.isArray(response.data.schedule)) {
                rawItems = response.data.schedule;
            } else if (response.data.schedule && 'items' in response.data.schedule && Array.isArray((response.data.schedule as any).items)) {
                rawItems = (response.data.schedule as any).items;
            }

            const items = rawItems.map((d: any) => {
                 let start = d.startTime;
                 let end = d.endTime;

                 // If time is just HH:mm, append to selected date
                 if (start && !start.includes("T") && start.includes(":")) {
                     start = `${formattedDate}T${start}:00`;
                 }
                 
                 if (end && !end.includes("T") && end.includes(":")) {
                     end = `${formattedDate}T${end}:00`;
                 }

                 return {
                     id: d.id || crypto.randomUUID(),
                     title: d.title,
                     description: d.description,
                     startTime: start,
                     endTime: end,
                     type: d.type || "work",
                     isCompleted: false
                 } as ScheduleItem;
            });

            items.sort((a: ScheduleItem, b: ScheduleItem) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            setProposedSchedule(items)
            toast.success("Schedule generated. Please review and save.")
        } catch (error) {
            toast.error("Failed to generate schedule")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAcceptSchedule = async () => {
        if (!proposedSchedule) return
        setIsGenerating(true)
        try {
            await scheduleApi.batchCreate({
                date: format(date, "yyyy-MM-dd"),
                items: proposedSchedule
            })
            setSchedule(proposedSchedule)
            setProposedSchedule(null)
            toast.success("Schedule saved successfully")
        } catch (error) {
            toast.error("Failed to save schedule")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDiscardSchedule = () => {
        setProposedSchedule(null)
        toast.info("Proposed schedule discarded")
    }

    const onSubmit = async (values: z.infer<typeof scheduleFormSchema>) => {
        try {
            const baseDate = format(date, "yyyy-MM-dd")
            const startDateTime = `${baseDate}T${values.startTime}:00`
            const endDateTime = `${baseDate}T${values.endTime}:00`

            if (proposedSchedule) {
                const newItem = {
                    id: editingItem ? editingItem.id : crypto.randomUUID(),
                    ...values,
                    startTime: new Date(startDateTime).toISOString(),
                    endTime: new Date(endDateTime).toISOString(),
                    type: values.type,
                    isCompleted: false
                } as ScheduleItem

                if (editingItem) {
                    setProposedSchedule(proposedSchedule.map(i => i.id === editingItem.id ? { ...i, ...newItem } : i))
                    toast.success("Item updated in proposal")
                } else {
                    setProposedSchedule([...proposedSchedule, newItem])
                    toast.success("Item added to proposal")
                }
                setIsItemDialogOpen(false)
                setEditingItem(null)
                return;
            }

            if (editingItem) {
                await scheduleApi.update(editingItem.id, {
                    ...values,
                    startTime: new Date(startDateTime).toISOString(),
                    endTime: new Date(endDateTime).toISOString(),
                })
                toast.success("Item updated")
            } else {
                await scheduleApi.create({
                    ...values,
                    startTime: new Date(startDateTime).toISOString(),
                    endTime: new Date(endDateTime).toISOString(),
                    type: values.type,
                })
                toast.success("Item created")
            }
            setIsItemDialogOpen(false)
            setEditingItem(null)
            fetchSchedule()
        } catch (error) {
            toast.error("Failed to save item")
        }
    }

    const handleDelete = async (id: string) => {
        if (proposedSchedule) {
            setProposedSchedule(proposedSchedule.filter(item => item.id !== id))
            toast.success("Item removed from proposal")
            return
        }

        try {
            await scheduleApi.delete(id)
            toast.success("Item deleted")
            setSchedule(schedule.filter(item => item.id !== id))
        } catch (error) {
            toast.error("Failed to delete item")
        }
    }

    const toggleComplete = async (item: ScheduleItem) => {
        if (proposedSchedule) {
             setProposedSchedule(proposedSchedule.map(s => s.id === item.id ? { ...s, isCompleted: !item.isCompleted } : s))
             return
        }

        try {
            await scheduleApi.update(item.id, { isCompleted: !item.isCompleted })
            setSchedule(schedule.map(s => s.id === item.id ? { ...s, isCompleted: !item.isCompleted } : s))
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const openCreateDialog = () => {
        setEditingItem(null)
        setIsItemDialogOpen(true)
    }

    const openEditDialog = (item: ScheduleItem) => {
        setEditingItem(item)
        setIsItemDialogOpen(true)
    }

    const getColorForType = (type: string) => {
        // Hash the type string to get a consistent index
        let hash = 0;
        for (let i = 0; i < type.length; i++) {
            hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Palette of light, pleasant pastel colors
        const colors = [
            "bg-red-100 border-red-200 hover:bg-red-200/70",
            "bg-orange-100 border-orange-200 hover:bg-orange-200/70",
            "bg-amber-100 border-amber-200 hover:bg-amber-200/70",
            "bg-yellow-100 border-yellow-200 hover:bg-yellow-200/70",
            "bg-lime-100 border-lime-200 hover:bg-lime-200/70",
            "bg-green-100 border-green-200 hover:bg-green-200/70",
            "bg-emerald-100 border-emerald-200 hover:bg-emerald-200/70",
            "bg-teal-100 border-teal-200 hover:bg-teal-200/70",
            "bg-cyan-100 border-cyan-200 hover:bg-cyan-200/70",
            "bg-sky-100 border-sky-200 hover:bg-sky-200/70",
            "bg-blue-100 border-blue-200 hover:bg-blue-200/70",
            "bg-indigo-100 border-indigo-200 hover:bg-indigo-200/70",
            "bg-violet-100 border-violet-200 hover:bg-violet-200/70",
            "bg-purple-100 border-purple-200 hover:bg-purple-200/70",
            "bg-fuchsia-100 border-fuchsia-200 hover:bg-fuchsia-200/70",
            "bg-pink-100 border-pink-200 hover:bg-pink-200/70",
            "bg-rose-100 border-rose-200 hover:bg-rose-200/70"
        ];

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    const getCurrentTask = () => {
        const now = currentTime;
        const currentTask = schedule.find(item => 
            isWithinInterval(now, { start: new Date(item.startTime), end: new Date(item.endTime) })
        );
        return currentTask;
    }

    const currentTask = getCurrentTask();

    const displaySchedule = proposedSchedule || schedule

    return (
        <div className="space-y-6 h-full flex flex-col">
             <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-primary">
                                {format(currentTime, "h:mm a")}
                            </h2>
                            <p className="text-muted-foreground">
                                {format(currentTime, "EEEE, MMMM do")}
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 ml-8 border-l pl-8">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Current Activity
                        </p>
                        {currentTask ? (
                             <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    {currentTask.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                     <Badge variant="secondary">
                                        {format(new Date(currentTask.startTime), "h:mm a")} - {format(new Date(currentTask.endTime), "h:mm a")}
                                     </Badge>
                                     <Badge variant="outline">{currentTask.type}</Badge>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    Free Time
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    You have no scheduled tasks right now. Take a break or work on a goal!
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
                <div className="flex items-center gap-2">
                    <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreateDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingItem ? "Edit Item" : "Add Schedule Item"}</DialogTitle>
                                <DialogDescription>
                                    {editingItem ? "Update this schedule slot." : "Add a manual slot to your day."}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Meeting with team" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="startTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Time</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="endTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Time</FormLabel>
                                                    <FormControl>
                                                        <Input type="time" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="work">Work</SelectItem>
                                                        <SelectItem value="personal">Personal</SelectItem>
                                                        <SelectItem value="health">Health</SelectItem>
                                                        <SelectItem value="learning">Learning</SelectItem>
                                                        <SelectItem value="routine">Routine</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Optional details..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit">Save</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-60 justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    
                    {proposedSchedule ? (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleDiscardSchedule} className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10">
                                <X className="mr-2 h-4 w-4" />
                                Discard
                            </Button>
                            <Button onClick={handleAcceptSchedule} disabled={isGenerating} className="bg-green-600 hover:bg-green-700">
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Save Schedule
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={handleGenerateSchedule} disabled={isGenerating}>
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Generate AI Schedule
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {proposedSchedule && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-full">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-primary">AI Generated Schedule Proposal</p>
                            <p className="text-sm text-muted-foreground">Review the proposed schedule below. Click "Save Schedule" to apply these changes.</p>
                        </div>
                    </div>
                </div>
            )}

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader>
                    <CardTitle>Daily Timeline {proposedSchedule && <Badge variant="outline" className="ml-2 border-primary text-primary">Preview Mode</Badge>}</CardTitle>
                    <CardDescription>
                        Your schedule for {format(date, "MMMM do, yyyy")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : displaySchedule.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <p>No schedule items found for this day.</p>
                            <Button variant="link" onClick={handleGenerateSchedule}>
                                Generate one now
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="relative min-h-[1440px] w-full">
                                {/* Time slots background */}
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute left-0 w-full border-t border-border/30 flex"
                                        style={{ top: `${i * 60}px`, height: '60px' }}
                                    >
                                        <span className="w-16 text-xs text-muted-foreground text-right pr-2 -mt-2 bg-background/50">
                                            {format(new Date().setHours(i, 0), "h:00 a")}
                                        </span>
                                        <div className="flex-1 border-l border-border/30" />
                                    </div>
                                ))}

                                {displaySchedule.map((item) => {
                                    // Calculate height and position based on time
                                    const start = new Date(item.startTime);
                                    const end = new Date(item.endTime);
                                    const startHour = start.getHours() + start.getMinutes() / 60;
                                    const endHour = end.getHours() + end.getMinutes() / 60;
                                    const duration = endHour - startHour;
                                    
                                    // Assuming day starts at 00:00 and ends at 24:00 for simplicity, 
                                    // or better yet, dynamic range based on earliest/latest item + buffer
                                    // Let's use fixed height pixels per hour for a vertical scrollable timeline
                                    const pixelsPerHour = 60;
                                    const topOffset = startHour * pixelsPerHour;
                                    const height = Math.max(duration * pixelsPerHour, 40); // Minimum height
                                    
                                    const colorClass = item.isCompleted 
                                        ? "bg-muted/50 border-border hover:bg-muted/70" 
                                        : getColorForType(item.type);

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "absolute left-20 right-4 rounded-lg border p-2 shadow-sm transition-all overflow-hidden flex flex-col",
                                                colorClass
                                            )}
                                            style={{
                                                top: `${topOffset}px`,
                                                height: `${height}px`,
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-2 h-full">
                                                <div className="flex items-start gap-2 overflow-hidden">
                                                    <Checkbox
                                                        checked={item.isCompleted}
                                                        onCheckedChange={() => toggleComplete(item)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-medium text-muted-foreground/80 whitespace-nowrap">
                                                                {format(start, "h:mm a")} - {format(end, "h:mm a")}
                                                            </span>
                                                            <Badge 
                                                                variant="secondary" 
                                                                className="text-[10px] px-1 py-0 h-5 bg-background/50 hover:bg-background/80 border-black/5"
                                                            >
                                                                {item.type}
                                                            </Badge>
                                                        </div>
                                                        <h4 className={cn("font-semibold text-sm truncate leading-tight", item.isCompleted && "line-through text-muted-foreground")}>
                                                            {item.title}
                                                        </h4>
                                                        {duration > 0.7 && (
                                                            <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(item)}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
