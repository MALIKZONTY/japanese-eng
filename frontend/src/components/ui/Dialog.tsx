import * as React from "react"
import { Button } from "./Button"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'destructive'
  children?: React.ReactNode
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  onConfirm,
  onCancel,
  variant = 'destructive',
  children
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl border border-border bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        
        {children}
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'default'} 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
