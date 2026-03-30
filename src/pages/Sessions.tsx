import { useEffect, useState } from "react";
import { appointmentsApi, patientsApi, professionalsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { format } from "date-fns";

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

const emptyForm = { patient_id: "", professional_id: "", date: format(new Date(), "yyyy-MM-dd"), time_start: "", time_end: "", type: "consulta", status: "agendado", notes: "" };

export default function Sessions() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; full_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    try {
      const [apptRes, patRes, profRes] = await Promise.all([
        appointmentsApi.list(),
        patientsApi.list(),
        professionalsApi.listActive(),
      ]);
      setAppointments(apptRes);
      setPatients(patRes);
      setProfessionals(profRes);
    } catch { }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.patient_id || !form.professional_id || !form.date) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
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

  const handleDelete = async (id: string) => {
    try {
      await appointmentsApi.delete(id);
      toast({ title: "Agendamento excluído!" });
      fetchAll();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      (a.patient_name?.toLowerCase().includes(term) ?? false) ||
      (a.professional_name?.toLowerCase().includes(term) ?? false)
    );
  });

  const statusLabel: Record<string, string> = { agendado: "Agendado", confirmado: "Confirmado", cancelado: "Cancelado", concluido: "Concluído" };
  const statusColor: Record<string, string> = {
    agendado: "bg-primary/10 text-primary",
    confirmado: "bg-success/10 text-success",
    cancelado: "bg-destructive/10 text-destructive",
    concluido: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Histórico de Sessões</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Profissional *</Label>
                <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data *</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
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
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} />
              </div>
              <Button onClick={handleSave}>{editing ? "Atualizar" : "Agendar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="relative max-w-md w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente ou profissional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum agendamento encontrado.</TableCell></TableRow>
              ) : (
                filteredAppointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{(() => {
                      if (!a.date) return "—";
                      const dateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date;
                      const d = new Date(dateStr + "T00:00:00");
                      return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy");
                    })()}</TableCell>
                    <TableCell>{a.time_start?.slice(0, 5) ?? "—"}</TableCell>
                    <TableCell className="font-medium">{a.patient_name}</TableCell>
                    <TableCell>{a.professional_name}</TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {a.type === "consulta" && "Consulta"}
                        {a.type === "retorno" && "Retorno"}
                        {a.type === "exame" && "Exame"}
                        {a.type === "procedimento" && "Procedimento"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[a.status] ?? ""}`}>
                        {statusLabel[a.status] ?? a.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => {
                          setEditing(a.id);
                          setForm({
                            patient_id: a.patient_id, professional_id: a.professional_id,
                            date: a.date, time_start: a.time_start, time_end: a.time_end ?? "",
                            type: a.type, notes: a.notes ?? "", status: a.status,
                          });
                          setOpen(true);
                        }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
