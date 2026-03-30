import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sun, Settings, Type, Contrast } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function SettingsDropdown() {
  const { theme, toggleTheme, highContrast, toggleHighContrast, fontSize, setFontSize } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Configurações">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Aparência
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Modo Escuro
            </span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              aria-label="Alternar tema"
            />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          Tamanho da Fonte
        </DropdownMenuLabel>
        <DropdownMenuItem className="flex-col items-start gap-2" onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs">12px</span>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              min={12}
              max={24}
              step={1}
              className="flex-1"
            />
            <span className="text-xs">24px</span>
          </div>
          <span className="text-xs text-muted-foreground">{fontSize}px</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Contrast className="h-4 w-4" />
          Acessibilidade
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between w-full">
            <span>Alto Contraste</span>
            <Switch
              checked={highContrast}
              onCheckedChange={toggleHighContrast}
              aria-label="Alternar alto contraste"
            />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
              <SettingsDropdown />
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
