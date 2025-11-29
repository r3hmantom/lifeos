import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, RefreshCw } from "lucide-react"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TimetableManager } from "@/components/TimetableManager"

export default function Schedule() {
  const [date, setDate] = useState<Date>(new Date())
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTimetableOpen, setIsTimetableOpen] = useState(false)

  useEffect(() => {
    fetchSchedule()
  }, [date])

  const fetchSchedule = async () => {
    setIsLoading(true)
    try {
      const formattedDate = format(date, "yyyy-MM-dd")
      const response = await scheduleApi.get(formattedDate)
      setSchedule(response.data.items || [])
    } catch (error) {
      console.error("Failed to fetch schedule", error)
      // toast.error("Failed to fetch schedule") 
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

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
        <div className="flex items-center gap-2">
          <Dialog open={isTimetableOpen} onOpenChange={setIsTimetableOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Manage Routine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Routine</DialogTitle>
                <DialogDescription>
                  Set up your daily routine templates. These slots help generate your daily schedule.
                </DialogDescription>
              </DialogHeader>
              <TimetableManager />
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
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{item.title}</h4>
                        <Badge variant={item.isCompleted ? "secondary" : "outline"}>
                          {item.type}
                        </Badge>
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
