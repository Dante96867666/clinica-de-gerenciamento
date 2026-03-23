import { useEffect, useState } from "react";
import { dashboardApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, ClipboardList, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [stats, setStats] = useState({ todayAppointments: 0, totalPatients: 0, totalSessions: 0 });
  const [todayList, setTodayList] = useState<any[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    dashboardApi.stats(today).then((data) => {
      setStats({
        todayAppointments: data.todayAppointments,
        totalPatients: data.totalPatients,
        totalSessions: data.totalSessions,
      });
      setTodayList(data.todayList ?? []);
    }).catch(() => {});
  }, [today]);

  const statusColors: Record<string, string> = {
    agendado: "bg-primary/10 text-primary",
    confirmado: "bg-success/10 text-success",
    cancelado: "bg-destructive/10 text-destructive",
    concluido: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões Realizadas</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Consultas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayList.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma consulta agendada para hoje.</p>
          ) : (
            <div className="space-y-3">
              {todayList.map((appt: any) => (
                <div key={appt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="font-medium">{appt.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Dr(a). {appt.professional_name} • {appt.time_start?.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[appt.status] ?? ""}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
