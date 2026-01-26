"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RefreshCw, Coffee, Brain } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useCalendarSync } from "@/hooks/useCalendarSync";

export function TodosSidebar() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <div className="space-y-6">
            <PomodoroTimer />

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex justify-between items-center">
                        <span>Lịch làm việc</span>
                        <SyncButton />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border-0"
                    />
                </CardContent>
                <div className="px-4 pb-4 text-xs text-muted-foreground text-center">
                    Chọn ngày để xem lịch sử công việc
                </div>
            </Card>
        </div>
    );
}

function SyncButton() {
    const { syncToCalendar, isSyncing } = useCalendarSync();

    // Test sync
    const handleSync = () => {
        syncToCalendar({
            content: "Làm việc tập trung (Pomodoro)",
            date: new Date()
        });
    }

    return (
        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Sync Google"}
        </Button>
    )
}


function PomodoroTimer() {
    // 25 minutes = 25 * 60 = 1500 seconds
    // 5 minutes = 5 * 60 = 300 seconds
    const WORK_TIME = 25 * 60;
    const REST_TIME = 5 * 60;

    const [timeLeft, setTimeLeft] = useState(WORK_TIME);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'rest'>('work');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'work' ? WORK_TIME : REST_TIME);
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Timer finished
            const nextMode = mode === 'work' ? 'rest' : 'work';
            setMode(nextMode);
            setTimeLeft(nextMode === 'work' ? WORK_TIME : REST_TIME);

            // Play notification sound or toast
            if (mode === 'work') {
                toast.success("Đã xong phiên làm việc! Hãy nghỉ ngơi 5 phút ☕");
            } else {
                toast.info("Hết giờ nghỉ! Quay lại làm việc nào 🧠");
            }

            // Auto continue or stop? User asked for "run automatically"
            // So we keep isActive = true
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive, timeLeft, mode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((mode === 'work' ? WORK_TIME : REST_TIME) - timeLeft) / (mode === 'work' ? WORK_TIME : REST_TIME) * 100;

    return (
        <Card className={`border-2 ${mode === 'work' ? 'border-primary/20' : 'border-green-500/20'}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    {mode === 'work' ? <Brain className="h-4 w-4 text-primary" /> : <Coffee className="h-4 w-4 text-green-500" />}
                    {mode === 'work' ? "Deep Work" : "Nghỉ ngơi"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-4">
                    <div className="text-5xl font-mono font-bold tracking-wider mb-2">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${mode === 'work' ? 'bg-primary' : 'bg-green-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex justify-center gap-3">
                    <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        onClick={toggleTimer}
                        className={mode === 'rest' && !isActive ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {isActive ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                        {isActive ? "Tạm dừng" : "Bắt đầu"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetTimer}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
