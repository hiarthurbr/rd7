"use client"

import { getVendaPerdida } from "@/lib/erp"
import { useEffect } from "react"

export default function Page() {
    useEffect(() => {
        getVendaPerdida().then(console.log)
    }, [])
    
    return <h1>Teste</h1>
}