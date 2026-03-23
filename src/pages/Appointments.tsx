import { useEffect, useState } from "react";
import { appointmentsApi, patientsApi, professionalsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Plus, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Appointment = {
  id: string;
  patient_id: string;
  professional_id: string;
  date: string;
  time_start: string;
  time_end: string | null;
  type: string;
  status: string;
  notes: string | null;
  patient_name?: string;
  professional_name?: string;
};

const emptyForm = {
  patient_id: "", professional_id: "", date: "", time_start: "", time_end: "", type: "consulta", status: "agendado", notes: "",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const { toast } = useToast();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchAll = async () => {
    try {
      const [apptRes, patRes, profRes] = await Promise.all([
        appointmentsApi.list({ dateFrom: format(weekStart, "yyyy-MM-dd"), dateTo: format(weekEnd, "yyyy-MM-dd") }),
        patientsApi.list(),
        professionalsApi.listActive(),
      ]);
      setAppointments(apptRes);
      setPatients(patRes);
      setProfessionals(profRes);
    } catch { }
  };

  useEffect(() => { fetchAll(); }, [selectedDate]);

  const handleSave = async () => {
    if (!form.patient_id || !form.professional_id || !form.date || !form.time_start) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const payload = {
      patient_id: form.patient_id,
      professional_id: form.professional_id,
      date: form.date,
      time_start: form.time_start,
      time_end: form.time_end || null,
      type: form.type,
      status: form.status,
      notes: form.notes || null,
    };

    try {
      if (editing) {
        await appointmentsApi.update(editing, payload);
        toast({ title: "Agendamento atualizado!" });
      } else {
        await appointmentsApi.create(payload);
        toast({ title: "Agendamento criado!" });
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchAll();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const statusColors: Record<string, string> = {
    agendado: "border-l-primary bg-primary/5",
    confirmado: "border-l-success bg-success/5",
    cancelado: "border-l-destructive bg-destructive/5",
    concluido: "border-l-muted-foreground bg-muted",
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await appointmentsApi.update(id, { status });
      fetchAll();
    } catch { }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agendamento</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Agendamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Profissional *</Label>
                <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !form.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.date ? format(parseISO(form.date), "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date ? parseISO(form.date) : undefined}
                      onSelect={(d) => d && setForm({ ...form, date: format(d, "yyyy-MM-dd") })}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hora Início *</Label>
                  <Input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Hora Fim</Label>
                  <Input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="retorno">Retorno</SelectItem>
                      <SelectItem value="exame">Exame</SelectItem>
                      <SelectItem value="procedimento">Procedimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button onClick={handleSave}>{editing ? "Atualizar" : "Agendar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayAppts = appointments.filter((a) => a.date === format(day, "yyyy-MM-dd"));
          const isToday = isSameDay(day, new Date());
          return (
            <Card key={day.toISOString()} className={cn("min-h-[200px]", isToday && "ring-2 ring-primary")}>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">
                  <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-xs", isToday && "bg-primary text-primary-foreground")}>
                    {format(day, "dd")}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {dayAppts.map((a) => (
                  <button
                    key={a.id}
                    className={cn("w-full text-left rounded-md border-l-4 p-2 text-xs cursor-pointer hover:shadow-sm transition-shadow", statusColors[a.status])}
                    onClick={() => {
                      setEditing(a.id);
                      setForm({
                        patient_id: a.patient_id, professional_id: a.professional_id,
                        date: a.date, time_start: a.time_start, time_end: a.time_end ?? "",
                        type: a.type, status: a.status, notes: a.notes ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    <p className="font-medium truncate">{a.time_start?.slice(0, 5)} {a.patient_name}</p>
                    <p className="text-muted-foreground truncate">Dr(a). {a.professional_name}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
