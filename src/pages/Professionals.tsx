import { useEffect, useState } from "react";
import { professionalsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Professional = {
  id: string;
  full_name: string;
  specialty: string;
  crm: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
};

const emptyForm = { full_name: "", specialty: "", crm: "", phone: "", email: "", active: true };

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfessionals = async () => {
    try {
      const data = await professionalsApi.list();
      setProfessionals(data);
    } catch { setProfessionals([]); }
  };

  useEffect(() => { fetchProfessionals(); }, []);

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      specialty: form.specialty,
      crm: form.crm || null,
      phone: form.phone || null,
      email: form.email || null,
      active: form.active,
    };

    try {
      if (editing) {
        await professionalsApi.update(editing, payload);
        toast({ title: "Profissional atualizado!" });
      } else {
        await professionalsApi.create(payload);
        toast({ title: "Profissional cadastrado!" });
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchProfessionals();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await professionalsApi.delete(id);
      toast({ title: "Profissional excluído!" });
      fetchProfessionals();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profissionais</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Profissional</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome Completo *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Especialidade</Label>
                <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Clínico Geral" />
              </div>
              <div className="grid gap-2">
                <Label>CRM</Label>
                <Input value={form.crm} onChange={(e) => setForm({ ...form, crm: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Ativo</Label>
              </div>
              <Button onClick={handleSave}>{editing ? "Atualizar" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>CRM</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum profissional cadastrado.</TableCell></TableRow>
              ) : (
                professionals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.specialty || "—"}</TableCell>
                    <TableCell>{p.crm ?? "—"}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${p.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {p.active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => {
                          setEditing(p.id);
                          setForm({ full_name: p.full_name, specialty: p.specialty, crm: p.crm ?? "", phone: p.phone ?? "", email: p.email ?? "", active: p.active });
                          setOpen(true);
                        }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
