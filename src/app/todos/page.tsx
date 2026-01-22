"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2, Circle, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

interface Todo {
    id: string;
    content: string;
    completed: boolean;
    created_at: string;
}

export default function TodosPage() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [loading, setLoading] = useState(true);
    const { user } = useSupabaseAuth();
    const supabase = createClient();

    // Fetch todos
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchTodos = async () => {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setTodos(data);
            }
            setLoading(false);
        };

        fetchTodos();

        // Realtime subscription
        const channel = supabase
            .channel('todos-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'todos',
                filter: `user_id=eq.${user.id}`
            }, (payload: { eventType: string; new: Todo; old: Todo }) => {
                if (payload.eventType === 'INSERT') {
                    setTodos(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setTodos(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
                } else if (payload.eventType === 'DELETE') {
                    setTodos(prev => prev.filter(t => t.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim() || !user) return;

        const { error } = await supabase
            .from('todos')
            .insert({
                user_id: user.id,
                content: newTodo.trim(),
                completed: false
            });

        if (!error) {
            setNewTodo("");
            toast.success("Đã thêm công việc mới!");
        } else {
            toast.error("Lỗi: " + error.message);
        }
    };

    const handleToggleTodo = async (id: string, currentCompleted: boolean) => {
        const { error } = await supabase
            .from('todos')
            .update({ completed: !currentCompleted })
            .eq('id', id);

        if (error) {
            toast.error("Lỗi cập nhật công việc");
        }
    };

    const handleDeleteTodo = async (id: string) => {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (!error) {
            toast.success("Đã xóa công việc!");
        }
    };

    const completedCount = todos.filter(t => t.completed).length;
    const pendingCount = todos.filter(t => !t.completed).length;

    // Get today's date
    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Card className="w-full max-w-md text-center p-8">
                    <h2 className="text-xl font-bold mb-2">Đăng nhập để sử dụng Todo List</h2>
                    <p className="text-muted-foreground">Bạn cần đăng nhập để quản lý danh sách công việc của mình.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center py-6">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <CalendarDays className="h-5 w-5" />
                    <span className="text-sm">{today}</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Todo List
                </h1>
                <p className="text-muted-foreground mt-1">Quản lý công việc hàng ngày của bạn</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{completedCount}</div>
                        <div className="text-xs text-green-600/80">Hoàn thành</div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-500/10 border-orange-500/20">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
                        <div className="text-xs text-orange-600/80">Chờ xử lý</div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Todo Form */}
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleAddTodo} className="flex gap-2">
                        <Input
                            placeholder="Thêm công việc mới..."
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={!newTodo.trim()}>
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Todo List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Danh sách công việc</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : todos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Chưa có công việc nào</p>
                            <p className="text-sm">Thêm công việc đầu tiên của bạn!</p>
                        </div>
                    ) : (
                        todos.map((todo) => (
                            <div
                                key={todo.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${todo.completed
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-card hover:bg-secondary/50'
                                    }`}
                            >
                                <button
                                    onClick={() => handleToggleTodo(todo.id, todo.completed)}
                                    className="shrink-0"
                                >
                                    {todo.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                                    )}
                                </button>
                                <span className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {todo.content}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
