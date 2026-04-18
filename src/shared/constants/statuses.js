export const BOOKING_STATUS = {
    pending:   { label: 'Aguardando confirmação', tone: 'warning' },
    confirmed: { label: 'Confirmado',             tone: 'info'    },
    done:      { label: 'Realizado',              tone: 'success' },
    cancelled: { label: 'Cancelado',              tone: 'muted'   },
}

export const EXAM_STATUS = {
    requested:    { label: 'Solicitado',     tone: 'info'    },
    in_progress:  { label: 'Em andamento',   tone: 'warning' },
    completed:    { label: 'Concluído',      tone: 'success' },
    cancelled:    { label: 'Cancelado',      tone: 'muted'   },
}

export const EXAM_CATEGORIES = [
    { id: 'laboratorial', label: 'Laboratorial' },
    { id: 'imagem',       label: 'Imagem'       },
    { id: 'especializado',label: 'Especializado'},
]

export const EXAM_SUGGESTIONS = {
    laboratorial: [
        'Hemograma completo',
        'Bioquímico (ALT, FA, Creatinina, Ureia)',
        'Urinálise',
        'Parasitológico de fezes',
        'Glicemia',
        'T4 total',
        'Cortisol',
    ],
    imagem: [
        'Raio-X torácico',
        'Raio-X abdominal',
        'Ultrassonografia abdominal',
        'Ecocardiograma',
        'Ressonância magnética',
    ],
    especializado: [
        'Teste rápido Erliquiose / Cinomose',
        'PCR para Leishmaniose',
        'Citologia',
        'Biópsia',
    ],
}
