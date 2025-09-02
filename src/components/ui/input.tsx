import * as React from 'react'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="bg-black text-white border border-zinc-700 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-white"
    />
  )
}
