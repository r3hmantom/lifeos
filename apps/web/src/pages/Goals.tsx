import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Plus, Calendar as CalendarIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { goalsApi } from "@/lib/api"
import type { Goal } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    focus: z.string().min(1, "Focus area is required"),
    deadline: z.date(),
    priority: z.enum(["High", "Medium", "Low"]),
})

export default function Goals() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            focus: "",
            priority: "Medium",
        },
    })

    useEffect(() => {
        fetchGoals()
    }, [])

    const fetchGoals = async () => {
        try {
            const response = await goalsApi.getAll()
            setGoals(response.data.data)
        } catch (error) {
            console.error("Failed to fetch goals")
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await goalsApi.create({
                ...values,
                deadline: values.deadline.toISOString(),
            })
            toast.success("Goal created successfully")
            setIsOpen(false)
            form.reset()
            fetchGoals()
        } catch (error) {
            toast.error("Failed to create goal")
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High":
                return "destructive"
            case "Medium":
                return "default"
            case "Low":
                return "secondary"
            default:
                return "outline"
        }
    }

    const toggleActive = async (id: string, currentState: boolean) => {
        try {
            await goalsApi.update(id, { isActive: !currentState })
            setGoals(goals.map(g => g.id === id ? { ...g, isActive: !currentState } : g))
            toast.success("Goal status updated")
        } catch (error) {
            toast.error("Failed to update goal status")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await goalsApi.delete(id)
            setGoals(goals.filter(g => g.id !== id))
            toast.success("Goal deleted successfully")
        } catch (error) {
            toast.error("Failed to delete goal")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Goals</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Goal</DialogTitle>
                            <DialogDescription>
                                Set a new goal to track your progress.
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
                                                <Input placeholder="e.g., Learn React" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="focus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Focus Area</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Career" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Priority</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="High">High</SelectItem>
                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="deadline"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Deadline</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                date < new Date()
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full">Create Goal</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal) => (
                    <Card key={goal.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {goal.focus}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={goal.isActive}
                                    onCheckedChange={() => toggleActive(goal.id, goal.isActive)}
                                />
                                <Badge variant={getPriorityColor(goal.priority) as any}>
                                    {goal.priority}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{goal.title}</div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground">
                                    Deadline: {format(new Date(goal.deadline), "PPP")}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                                    onClick={() => handleDelete(goal.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
