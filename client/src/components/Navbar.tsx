import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home, Upload, Sparkles, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          <h1 className="text-base sm:text-xl font-bold truncate">AI视频智能切片</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={location === "/" ? "default" : "ghost"}
            onClick={() => setLocation("/")}
            className="gap-2"
            size="sm"
            title="任务列表"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">任务列表</span>
          </Button>
          <Button
            variant={location === "/upload" ? "default" : "ghost"}
            onClick={() => setLocation("/upload")}
            className="gap-2"
            size="sm"
            title="上传视频"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">上传视频</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
            className="flex-shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </nav>
  );
}
