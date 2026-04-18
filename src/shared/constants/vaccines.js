// Catálogo oficial de vacinas do Reino Animal.
// `boosterMonths` é o intervalo padrão entre reforços (em meses).

export const VACCINES_DOG = [
    { id: 'v8',         name: 'V8 (Óctupla)',             boosterMonths: 12 },
    { id: 'v10',        name: 'V10 (Décupla)',            boosterMonths: 12 },
    { id: 'raiva-c',    name: 'Antirrábica',              boosterMonths: 12 },
    { id: 'gripe-inj',  name: 'Gripe canina (Injetável)', boosterMonths: 12 },
    { id: 'gripe-nasal',name: 'Gripe canina (Nasal)',     boosterMonths: 12 },
    { id: 'giardia',    name: 'Giárdia',                  boosterMonths: 12 },
    { id: 'leish',      name: 'Leishmaniose',             boosterMonths: 12 },
    { id: 'puppy',      name: 'Puppy (Parvo + Cinomose)', boosterMonths: 12 },
    { id: 'lepto',      name: 'Leptospirose',             boosterMonths: 6  },
    { id: 'lyme',       name: 'Lyme',                     boosterMonths: 12 },
]

export const VACCINES_CAT = [
    { id: 'v3',    name: 'V3 (Tríplice Felina)',          boosterMonths: 12 },
    { id: 'v4',    name: 'V4 (Quádrupla Felina)',         boosterMonths: 12 },
    { id: 'v5',    name: 'V5 (Quíntupla Felina)',         boosterMonths: 12 },
    { id: 'raiva-f',name: 'Antirrábica Felina',           boosterMonths: 12 },
    { id: 'felv',  name: 'FeLV (Leucemia Felina)',        boosterMonths: 12 },
    { id: 'clam',  name: 'Clamidiose',                    boosterMonths: 12 },
    { id: 'bord',  name: 'Bordetelose',                   boosterMonths: 12 },
    { id: 'derm',  name: 'Dermatofitose',                 boosterMonths: 12 },
    { id: 'pif',   name: 'PIF (Peritonite Infecciosa)',   boosterMonths: 12 },
    { id: 'fiv',   name: 'FIV (Imunodeficiência Felina)', boosterMonths: 12 },
]

export const vaccinesBySpecies = (species) => {
    const s = (species ?? '').toLowerCase()
    if (s.startsWith('cach') || s.startsWith('dog')) return VACCINES_DOG
    if (s.startsWith('gat')  || s.startsWith('cat')) return VACCINES_CAT
    return []
}

export const findVaccineMeta = (species, vaccineId) =>
    vaccinesBySpecies(species).find(v => v.id === vaccineId)

export const addMonths = (isoDate, months) => {
    const d = new Date(isoDate)
    d.setMonth(d.getMonth() + months)
    return d.toISOString().slice(0, 10)
}
