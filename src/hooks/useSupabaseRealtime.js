// src/hooks/useSupabaseRealtime.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRealtimeTable(table, query, channelName) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Initial fetch
        query().then(({ data, error }) => {
            if (!error) setData(data ?? [])
            setLoading(false)
        })

        // Realtime subscription
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table },
                (payload) => {
                    setData(prev => [...prev.slice(-199), payload.new]) // keep last 200 rows
                }
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    return { data, loading }
}