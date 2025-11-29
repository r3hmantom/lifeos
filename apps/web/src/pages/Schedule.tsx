import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react"
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
    const [isLoading, setIsLoading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)

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
            setSchedule(response.data.schedule.items)
            toast.success("Schedule generated successfully")
        } catch (error) {
            toast.error("Failed to generate schedule")
        } finally {
            setIsGenerating(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof scheduleFormSchema>) => {
        try {
            const baseDate = format(date, "yyyy-MM-dd")
            const startDateTime = `${baseDate}T${values.startTime}:00`
            const endDateTime = `${baseDate}T${values.endTime}:00`

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
        try {
            await scheduleApi.delete(id)
            toast.success("Item deleted")
            setSchedule(schedule.filter(item => item.id !== id))
        } catch (error) {
            toast.error("Failed to delete item")
        }
    }

    const toggleComplete = async (item: ScheduleItem) => {
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

    return (
        <div className="space-y-6 h-full flex flex-col">
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
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader>
                    <CardTitle>Daily Timeline</CardTitle>
                    <CardDescription>
                        Your schedule for {format(date, "MMMM do, yyyy")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : schedule.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <p>No schedule items found for this day.</p>
                            <Button variant="link" onClick={handleGenerateSchedule}>
                                Generate one now
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="space-y-4 p-6">
                                {schedule.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-4 rounded-lg border p-4 shadow-sm"
                                    >
                                        <div className="flex flex-col items-center gap-1 min-w-20">
                                            <span className="text-sm font-medium">
                                                {format(new Date(item.startTime), "HH:mm")}
                                            </span>
                                            <div className="h-full w-px bg-border" />
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(item.endTime), "HH:mm")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 pt-1">
                                            <Checkbox 
                                                checked={item.isCompleted} 
                                                onCheckedChange={() => toggleComplete(item)}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={cn("font-semibold", item.isCompleted && "line-through text-muted-foreground")}>
                                                        {item.title}
                                                    </h4>
                                                    <Badge variant={item.isCompleted ? "secondary" : "outline"}>
                                                        {item.type}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
