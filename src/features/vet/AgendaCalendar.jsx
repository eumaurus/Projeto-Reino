import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Button from '../../shared/components/ui/Button'
import { StatusBadge } from '../../shared/components/ui/Badge'
import { BOOKING_STATUS } from '../../shared/constants/statuses'
import { formatTime, monthLabel, weekdayName, todayISO, toISODate } from '../../shared/utils/dates'
import './agenda-calendar.css'

const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function buildMonthGrid(year, month) {
    const first = new Date(year, month, 1)
    const startWeekday = first.getDay()
    const lastDay = new Date(year, month + 1, 0).getDate()
    const cells = []

    // Prev-month filler
    const prevLastDay = new Date(year, month, 0).getDate()
    for (let i = startWeekday - 1; i >= 0; i--) {
        cells.push({ date: new Date(year, month - 1, prevLastDay - i), outside: true })
    }
    // Current month
    for (let d = 1; d <= lastDay; d++) {
        cells.push({ date: new Date(year, month, d), outside: false })
    }
    // Next-month filler to complete 6 rows
    const total = cells.length
    const remaining = (7 - (total % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
        cells.push({ date: new Date(year, month + 1, i), outside: true })
    }
    // Extend to 6 full rows (42 cells) if needed
    while (cells.length < 42) {
        const last = cells[cells.length - 1].date
        cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true })
    }
    return cells
}

export default function AgendaCalendar({ bookings, onPickDate, selectedDate }) {
    const today = new Date()
    const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() })

    const byDay = useMemo(() => {
        const map = new Map()
        for (const b of bookings) {
            const list = map.get(b.requestedDate) ?? []
            list.push(b)
            map.set(b.requestedDate, list)
        }
        return map
    }, [bookings])

    const cells = useMemo(() => buildMonthGrid(cursor.y, cursor.m), [cursor])

    const goPrev = () => setCursor(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 })
    const goNext = () => setCursor(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })
    const goToday= () => setCursor({ y: today.getFullYear(), m: today.getMonth() })

    const todayISOStr = todayISO()
    const selectedISO = selectedDate ? toISODate(selectedDate) : null

    return (
        <div className="agenda-calendar">
            <header>
                <div className="agenda-calendar-title">
                    <Calendar size={18} />
                    <strong>{monthLabel(new Date(cursor.y, cursor.m, 1))}</strong>
                </div>
                <div className="agenda-calendar-actions">
                    <Button variant="ghost" size="sm" onClick={goPrev} icon={ChevronLeft} aria-label="Mês anterior" />
                    <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
                    <Button variant="ghost" size="sm" onClick={goNext} icon={ChevronRight} aria-label="Próximo mês" />
                </div>
            </header>

            <div className="agenda-calendar-head">
                {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
            </div>

            <div className="agenda-calendar-grid">
                {cells.map((cell, i) => {
                    const iso = toISODate(cell.date)
                    const dayBookings = byDay.get(iso) ?? []
                    const isToday    = iso === todayISOStr
                    const isSelected = iso === selectedISO
                    return (
                        <button
                            key={i}
                            type="button"
                            className={[
                                'agenda-calendar-cell',
                                cell.outside && 'outside',
                                isToday && 'today',
                                isSelected && 'selected',
                                dayBookings.length > 0 && 'has-events',
                            ].filter(Boolean).join(' ')}
                            onClick={() => onPickDate?.(cell.date)}
                        >
                            <span className="agenda-calendar-day-num">{cell.date.getDate()}</span>
                            <div className="agenda-calendar-events">
                                {dayBookings.slice(0, 3).map(b => (
                                    <span key={b.id} className={`ev ev-${b.status}`}>
                                        {formatTime(b.requestedTime)} {b.service}
                                    </span>
                                ))}
                                {dayBookings.length > 3 && (
                                    <span className="ev ev-more">+ {dayBookings.length - 3}</span>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export function DayDetail({ date, bookings, onAction }) {
    if (!date) return null
    const iso = toISODate(date)
    const list = bookings.filter(b => b.requestedDate === iso)
    return (
        <div className="agenda-day-detail">
            <h3>
                <Calendar size={16} /> {weekdayName(date, true)}, {date.getDate().toString().padStart(2,'0')}/{(date.getMonth()+1).toString().padStart(2,'0')}/{date.getFullYear()}
                <span>{list.length} agendamento(s)</span>
            </h3>
            {list.length === 0 && (
                <p className="text-muted text-small">Nenhum compromisso neste dia.</p>
            )}
            {list.map(b => (
                <div key={b.id} className="agenda-day-detail-row">
                    <div>
                        <strong>{formatTime(b.requestedTime)} · {b.service}</strong>
                        <span>{b.pet?.name} · {b.owner?.name}</span>
                    </div>
                    <StatusBadge value={b.status} map={BOOKING_STATUS} />
                </div>
            ))}
        </div>
    )
}
