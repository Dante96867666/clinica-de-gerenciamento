import { useEffect, useState } from "react";
import { sessionsApi, patientsApi, professionalsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

type Session = {
  id: string;
  patient_id: string;
  professional_id: string;
  date: string;
  duration_minutes: number | null;
  clinical_notes: string | null;
  status: string;
  patient_name?: string;
  professional_name?: string;
};

const emptyForm = { patient_id: "", professional_id: "", date: format(new Date(), "yyyy-MM-dd"), duration_minutes: "", clinical_notes: "", status: "realizada" };

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; full_name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    try {
      const [sessRes, patRes, profRes] = await Promise.all([
        sessionsApi.list(),
        patientsApi.list(),
        professionalsApi.listActive(),
      ]);
      setSessions(sessRes);
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
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      clinical_notes: form.clinical_notes || null,
      status: form.status,
    };

    try {
      if (editing) {
        await sessionsApi.update(editing, payload);
        toast({ title: "Sessão atualizada!" });
      } else {
        await sessionsApi.create(payload);
        toast({ title: "Sessão registrada!" });
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
      await sessionsApi.delete(id);
      toast({ title: "Sessão excluída!" });
      fetchAll();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const statusLabel: Record<string, string> = { realizada: "Realizada", cancelada: "Cancelada", faltou: "Faltou" };
  const statusColor: Record<string, string> = {
    realizada: "bg-success/10 text-success",
    cancelada: "bg-destructive/10 text-destructive",
    faltou: "bg-warning/10 text-warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Controle de Sessões</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Sessão</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Sessão" : "Nova Sessão"}</DialogTitle>
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
                  <Label>Duração (min)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="30" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="faltou">Faltou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Anotações Clínicas</Label>
                <Textarea value={form.clinical_notes} onChange={(e) => setForm({ ...form, clinical_notes: e.target.value })} rows={4} />
              </div>
              <Button onClick={handleSave}>{editing ? "Atualizar" : "Registrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma sessão encontrada.</TableCell></TableRow>
              ) : (
                sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{(() => {
                      if (!s.date) return "—";
                      // Handle ISO format (2024-03-20T00:00:00.000Z) or date-only format (2024-03-20)
                      const dateStr = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                      const d = new Date(dateStr + "T00:00:00");
                      return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy");
                    })()}</TableCell>
                    <TableCell className="font-medium">{s.patient_name}</TableCell>
                    <TableCell>{s.professional_name}</TableCell>
                    <TableCell>{s.duration_minutes ? `${s.duration_minutes} min` : "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[s.status] ?? ""}`}>
                        {statusLabel[s.status] ?? s.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => {
                          setEditing(s.id);
                          setForm({
                            patient_id: s.patient_id, professional_id: s.professional_id,
                            date: s.date, duration_minutes: s.duration_minutes?.toString() ?? "",
                            clinical_notes: s.clinical_notes ?? "", status: s.status,
                          });
                          setOpen(true);
                        }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
