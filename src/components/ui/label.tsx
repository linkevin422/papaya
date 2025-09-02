import * as React from 'react'

export function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...props} className="text-sm font-medium text-white">
      {children}
    </label>
  )
}
