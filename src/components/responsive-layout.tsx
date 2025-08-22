"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2 } from "lucide-react"

interface ResponsiveCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: {
    edit?: () => void
    delete?: () => void
    custom?: ReactNode
  }
  status?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  icon?: ReactNode
  className?: string
  onClick?: () => void
}

export function ResponsiveCard({
  title,
  subtitle,
  children,
  actions,
  status,
  icon,
  className = "",
  onClick
}: ResponsiveCardProps) {
  return (
    <Card 
      className={`w-full transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {icon && <div className="flex-shrink-0">{icon}</div>}
              <CardTitle className="text-base font-semibold truncate pr-2">
                {title}
              </CardTitle>
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {status && (
              <Badge variant={status.variant || "default"} className="text-xs">
                {status.label}
              </Badge>
            )}
            
            {actions && (actions.edit || actions.delete || actions.custom) && (
              <div className="flex items-center gap-1">
                {actions.edit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.edit?.()
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {actions.delete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.delete?.()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {actions.custom && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {actions.custom}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: string
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1 }, 
  gap = "gap-4", 
  className = "" 
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    gap
  ].filter(Boolean).join(" ")

  return (
    <div className={`grid ${gridClasses} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveListProps {
  children: ReactNode
  className?: string
}

export function ResponsiveList({ children, className = "" }: ResponsiveListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveStatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: "increase" | "decrease"
  }
  icon?: ReactNode
  className?: string
}

export function ResponsiveStatCard({ 
  title, 
  value, 
  change, 
  icon, 
  className = "" 
}: ResponsiveStatCardProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1">
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-xs font-medium ${
                  change.type === "increase" ? "text-green-600" : "text-red-600"
                }`}>
                  {change.type === "increase" ? "+" : "-"}{Math.abs(change.value)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}