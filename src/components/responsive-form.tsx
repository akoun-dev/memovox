"use client"

import { useState, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Save, Loader2 } from "lucide-react"

interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "switch" | "date" | "time"
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  defaultValue?: any
  description?: string
}

interface ResponsiveFormProps {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  onCancel?: () => void
  isLoading?: boolean
  submitText?: string
  cancelText?: string
  title?: string
  description?: string
  className?: string
  values?: Record<string, any>
}

export function ResponsiveForm({
  fields,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = "Enregistrer",
  cancelText = "Annuler",
  title,
  description,
  className = "",
  values = {}
}: ResponsiveFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(values)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear error when field is changed
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} est requis`
      }
      
      // Email validation
      if (field.type === "email" && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = "Email invalide"
        }
      }
      
      // Number validation
      if (field.type === "number" && formData[field.name]) {
        if (isNaN(Number(formData[field.name]))) {
          newErrors[field.name] = "Veuillez entrer un nombre valide"
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? field.defaultValue ?? ""
    const error = errors[field.name]

    const fieldClasses = `
      w-full
      ${error ? "border-red-500 focus:border-red-500" : ""}
      transition-colors
      duration-200
    `

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={fieldClasses}
              rows={3}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )

      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            <Select value={value} onValueChange={(v) => handleFieldChange(field.name, v)}>
              <SelectTrigger className={fieldClasses}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )

      case "checkbox":
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              />
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground ml-6">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500 ml-6">{error}</p>}
          </div>
        )

      case "switch":
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
              <Switch
                id={field.name}
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={fieldClasses}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )
    }
  }

  return (
    <Card className={`${className}`}>
      {(title || description) && (
        <CardHeader className="pb-4">
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(renderField)}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <X className="h-4 w-4 mr-2" />
                {cancelText}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  En cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {submitText}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}