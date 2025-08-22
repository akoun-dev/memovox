"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Calendar, Clock, AlertCircle } from "lucide-react"

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: FilterState) => void
  onClearFilters: () => void
  activeFilters: FilterState
}

interface FilterState {
  priority: string
  status: string
  dateRange: string
  recurring: string
}

export function SearchFilter({ 
  onSearch, 
  onFilterChange, 
  onClearFilters, 
  activeFilters 
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...activeFilters, [key]: value }
    onFilterChange(newFilters)
  }

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== "all")

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(value => value !== "all").length
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Rechercher des tâches..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => handleSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priorité</label>
            <Select
              value={activeFilters.priority}
              onValueChange={(value) => handleFilterChange("priority", value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="HIGH">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Haute
                  </div>
                </SelectItem>
                <SelectItem value="MEDIUM">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Moyenne
                  </div>
                </SelectItem>
                <SelectItem value="LOW">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    Basse
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <Select
              value={activeFilters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="pending">En cours</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Période</label>
            <Select
              value={activeFilters.dateRange}
              onValueChange={(value) => handleFilterChange("dateRange", value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Récurrence</label>
            <Select
              value={activeFilters.recurring}
              onValueChange={(value) => handleFilterChange("recurring", value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="recurring">Récurrentes</SelectItem>
                <SelectItem value="non-recurring">Non récurrentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.priority !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Priorité: {activeFilters.priority === "HIGH" ? "Haute" : 
                       activeFilters.priority === "MEDIUM" ? "Moyenne" : "Basse"}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange("priority", "all")}
              />
            </Badge>
          )}
          {activeFilters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Statut: {activeFilters.status === "completed" ? "Terminées" :
                      activeFilters.status === "pending" ? "En cours" : "En retard"}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange("status", "all")}
              />
            </Badge>
          )}
          {activeFilters.dateRange !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Période: {activeFilters.dateRange === "today" ? "Aujourd'hui" :
                       activeFilters.dateRange === "week" ? "Cette semaine" :
                       activeFilters.dateRange === "month" ? "Ce mois" : "En retard"}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange("dateRange", "all")}
              />
            </Badge>
          )}
          {activeFilters.recurring !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Récurrence: {activeFilters.recurring === "recurring" ? "Récurrentes" : "Non récurrentes"}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange("recurring", "all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}