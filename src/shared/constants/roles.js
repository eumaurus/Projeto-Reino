export const ROLE = {
    CLIENT:    'client',
    VET:       'vet',
    ADMIN:     'admin',
    RECEPTION: 'reception',
}

export const ROLE_LABEL = {
    client:    'Tutor',
    vet:       'Veterinário(a)',
    admin:     'Administrador(a)',
    reception: 'Recepção',
}

export const STAFF_ROLES = [ROLE.VET, ROLE.ADMIN, ROLE.RECEPTION]

export const isStaff     = (u) => STAFF_ROLES.includes(u?.role)
export const isClient    = (u) => u?.role === ROLE.CLIENT
export const isAdmin     = (u) => u?.role === ROLE.ADMIN
export const isVet       = (u) => u?.role === ROLE.VET
export const isReception = (u) => u?.role === ROLE.RECEPTION

/** Home route for each role after login */
export const homeForRole = (role) => {
    if (role === ROLE.ADMIN)     return '/admin'
    if (role === ROLE.VET)       return '/vet'
    if (role === ROLE.RECEPTION) return '/reception'
    return '/dashboard'
}
