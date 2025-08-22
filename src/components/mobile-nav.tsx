"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  Brain, 
  Mic, 
  Settings, 
  User,
  Menu,
  X
} from "lucide-react"

interface MobileNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onSignOut: () => void
  onSettingsClick: () => void
}

export function MobileNav({ activeTab, onTabChange, onSignOut, onSettingsClick }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: Calendar, shortLabel: "Dashboard" },
    { id: "tasks", label: "Tâches", icon: CheckCircle, shortLabel: "Tâches" },
    { id: "appointments", label: "Rendez-vous", icon: Clock, shortLabel: "RDV" },
    { id: "summary", label: "Résumé quotidien", icon: Calendar, shortLabel: "Résumé" },
    { id: "calendar", label: "Calendrier", icon: Calendar, shortLabel: "Calendrier" },
    { id: "statistics", label: "Statistiques", icon: BarChart3, shortLabel: "Stats" },
    { id: "focus", label: "Focus", icon: Brain, shortLabel: "Focus" },
    { id: "voice-reminders", label: "Rappels vocaux", icon: Mic, shortLabel: "Vocal" }
  ]

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 w-10 p-0 bg-background/80 backdrop-blur-sm border-border"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">M</span>
                  </div>
                  <h1 className="text-lg font-bold">MemoVox</h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start h-12 px-4"
                      onClick={() => handleTabClick(item.id)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 px-4"
                  onClick={() => {
                    onSettingsClick()
                    setIsOpen(false)
                  }}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  <span className="font-medium">Paramètres</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onSignOut()
                    setIsOpen(false)
                  }}
                >
                  <User className="mr-3 h-5 w-5" />
                  <span className="font-medium">Déconnexion</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <nav className="flex justify-around p-1 overflow-x-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="flex-col gap-1 h-auto py-2 px-2 min-w-fit"
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.shortLabel}</span>
              </Button>
            )
          })}
        </nav>
      </div>
    </>
  )
}