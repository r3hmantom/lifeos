import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { timetableApi } from "@/lib/api"
import type { TimetableSlot } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    activity: z.string().min(1, "Activity is required"),
    isActive: z.boolean(),
})

export function TimetableManager() {
    const [slots, setSlots] = useState<TimetableSlot[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            time: "",
            activity: "",
            isActive: true,
        },
    })

    useEffect(() => {
        fetchSlots()
    }, [])

    const fetchSlots = async () => {
        setIsLoading(true)
        try {
            const response = await timetableApi.getAll()
            // Sort by time
            const sorted = response.data.data.sort((a, b) => a.time.localeCompare(b.time))
            setSlots(sorted)
        } catch (error) {
            toast.error("Failed to fetch timetable")
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsCreating(true)
        try {
            await timetableApi.create(values)
            toast.success("Slot created")
            form.reset({
                time: "",
                activity: "",
                isActive: true
            })
            fetchSlots()
        } catch (error) {
            toast.error("Failed to create slot")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await timetableApi.delete(id)
            toast.success("Slot deleted")
            setSlots(slots.filter(s => s.id !== id))
        } catch (error) {
            toast.error("Failed to delete slot")
        }
    }

    const handleToggleActive = async (slot: TimetableSlot) => {
        try {
            await timetableApi.update(slot.id, { isActive: !slot.isActive })
            setSlots(slots.map(s => s.id === slot.id ? { ...s, isActive: !s.isActive } : s))
        } catch (error) {
            toast.error("Failed to update slot")
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h3 className="font-medium text-sm">Add New Routine Slot</h3>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 items-end">
                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem className="w-full sm:w-32">
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <Input placeholder="09:00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="activity"
                            render={({ field }) => (
                                <FormItem className="flex-1 w-full">
                                    <FormLabel>Activity</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Morning Meeting" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-col gap-2 pb-2">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="m-0 cursor-pointer">Active</FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </form>
                </Form>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">Time</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead className="w-24">Status</TableHead>
                            <TableHead className="w-16"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : slots.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No routine slots defined. Add one above.
                                </TableCell>
                            </TableRow>
                        ) : (
                            slots.map((slot) => (
                                <TableRow key={slot.id}>
                                    <TableCell className="font-medium">{slot.time}</TableCell>
                                    <TableCell>{slot.activity}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={slot.isActive}
                                            onCheckedChange={() => handleToggleActive(slot)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(slot.id)}
                                            className="text-destructive hover:text-destructive/90"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
