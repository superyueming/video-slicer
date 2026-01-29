import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home, Upload, Sparkles } from "lucide-react";

export default function Navbar() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">AI视频智能切片</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={location === "/" ? "default" : "ghost"}
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            任务列表
          </Button>
          <Button
            variant={location === "/upload" ? "default" : "ghost"}
            onClick={() => setLocation("/upload")}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            上传视频
          </Button>
        </div>
      </div>
    </nav>
  );
}
