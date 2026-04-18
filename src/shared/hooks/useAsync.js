import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Simple async hook for fetching data.
 * Re-runs whenever `deps` change. Use `refetch` to force a reload.
 */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
    const [data, setData]    = useState(null)
    const [error, setError]  = useState(null)
    const [loading, setLoad] = useState(!!immediate)
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    const run = useCallback(async (...args) => {
        setLoad(true)
        setError(null)
        try {
            const result = await fn(...args)
            if (mounted.current) setData(result)
            return result
        } catch (e) {
            if (mounted.current) setError(e)
            throw e
        } finally {
            if (mounted.current) setLoad(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    useEffect(() => {
        if (immediate) run().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run])

    return { data, error, loading, refetch: run, setData }
}
