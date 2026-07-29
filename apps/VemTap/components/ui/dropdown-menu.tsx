"use client";

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
  className?: string
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if ((child.type as any).displayName === "DropdownMenuTrigger") {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: () => setOpen(!open)
            })
          }
          if ((child.type as any).displayName === "DropdownMenuContent") {
            return (
              <AnimatePresence>
                {open && React.cloneElement(child as React.ReactElement<any>, {
                  onClose: () => setOpen(false)
                })}
              </AnimatePresence>
            )
          }
        }
        return child
      })}
    </div>
  )
}

export function DropdownMenuTrigger({ children, onClick, asChild }: { children: React.ReactNode, onClick?: () => void, asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<any>;
    return React.cloneElement(childElement, {
        onClick: (e: any) => {
            if (onClick) onClick();
            if (childElement.props.onClick) childElement.props.onClick(e);
        }
    });
  }
  return <div onClick={onClick} className="cursor-pointer">{children}</div>
}
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export function DropdownMenuContent({ children, onClose, className, align = "end" }: { children: React.ReactNode, onClose?: () => void, className?: string, align?: "start" | "end" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className={cn(
        "absolute z-[400] min-w-[8rem] overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 shadow-xl",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const element = child as React.ReactElement<any>;
          return React.cloneElement(element, {
            onClick: (e: React.MouseEvent) => {
              if (element.props.onClick) element.props.onClick(e)
              if (onClose) onClose()
            }
          })
        }
        return child
      })}
    </motion.div>
  )
}
DropdownMenuContent.displayName = "DropdownMenuContent"

export function DropdownMenuItem({ children, onClick, className }: { children: React.ReactNode, onClick?: (e: React.MouseEvent) => void, className?: string }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none hover:bg-gray-50 hover:text-primary transition-colors",
        className
      )}
    >
      {children}
    </div>
  )
}
DropdownMenuItem.displayName = "DropdownMenuItem"

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-gray-100", className)} />
  )
}
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"
