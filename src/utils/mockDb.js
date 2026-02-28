// Mock Database using LocalStorage

const initializeDb = () => {
    if (!localStorage.getItem('db_initialized')) {
        const users = [
            {
                id: '1',
                name: 'João Silva',
                email: 'joao@example.com',
                document: '111.111.111-11',
                password: 'senha', // Senha super simples para teste
                phone: '(11) 98888-7777',
                role: 'client'
            },
            {
                id: '2',
                name: 'Maria Oliveira',
                email: 'maria@example.com',
                document: '222.222.222-22',
                password: 'senha',
                phone: '(11) 97777-6666',
                role: 'client'
            },
            {
                id: '3',
                name: 'Admin Reino Animal',
                email: 'admin@reinoanimal.com',
                document: '00.000.000/0001-00',
                password: 'admin',
                phone: '(11) 90000-0000',
                role: 'admin'
            },
            {
                id: '4',
                name: 'Veterinário de Teste',
                email: 'vet@reinoanimal.com',
                document: '333.333.333-33',
                password: 'vet',
                phone: '(11) 91111-1111',
                role: 'vet'
            }
        ];

        const pets = [
            {
                id: '1',
                ownerId: '1', // Pertence ao João
                name: 'Max',
                breed: 'Golden Retriever',
                species: 'Cão',
                age: '3 anos',
                image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=200&auto=format&fit=crop',
                nextVaccine: '15/10/2026',
                weight: '32kg',
                birthDate: '10/05/2023',
                upcomingAppointments: [
                    { date: '10/06/2026', time: '14:30', service: 'Banho e Tosa' }
                ],
                vaccines: [
                    { name: 'V10 (Polivalente)', date: '15/10/2025', nextDue: '15/10/2026', vet: 'Dra. Renata', status: 'valid' },
                    { name: 'Antirrábica', date: '15/10/2025', nextDue: '15/10/2026', vet: 'Dr. Renato', status: 'valid' }
                ]
            },
            {
                id: '2',
                ownerId: '1', // Pertence ao João
                name: 'Luna',
                breed: 'SRD',
                species: 'Gato',
                age: '1 ano',
                image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop',
                nextVaccine: '02/08/2026',
                weight: '4kg',
                birthDate: '01/08/2025',
                upcomingAppointments: [],
                vaccines: [
                    { name: 'V4', date: '02/08/2025', nextDue: '02/08/2026', vet: 'Dra. Renata', status: 'valid' }
                ]
            },
            {
                id: '3',
                ownerId: '2', // Pertence à Maria
                name: 'Thor',
                breed: 'Bulldog Francês',
                species: 'Cão',
                age: '2 anos',
                image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=200&auto=format&fit=crop',
                nextVaccine: '10/01/2026', // Expired
                weight: '12kg',
                birthDate: '15/12/2023',
                upcomingAppointments: [],
                vaccines: [
                    { name: 'V10 (Polivalente)', date: '10/01/2025', nextDue: '10/01/2026', vet: 'Dr. Renato', status: 'expired' }
                ]
            }
        ];

        localStorage.setItem('db_users', JSON.stringify(users));
        localStorage.setItem('db_pets', JSON.stringify(pets));
        localStorage.setItem('db_initialized', 'true');
    }
};

export const getDbUsers = () => {
    const defaultProfessionals = [
        {
            id: 'admin-fixed',
            name: 'Admin Reino Animal',
            email: 'admin@reinoanimal.com',
            document: '00.000.000/0001-00',
            password: 'admin',
            phone: '(11) 90000-0000',
            role: 'admin'
        },
        {
            id: 'vet-fixed',
            name: 'Veterinário de Teste',
            email: 'vet@reinoanimal.com',
            document: '333.333.333-33',
            password: 'vet',
            phone: '(11) 91111-1111',
            role: 'vet'
        }
    ];

    const storedUsers = JSON.parse(localStorage.getItem('db_users') || '[]');

    // Filter out any older versions of these professional users from the stored list to avoid duplicates
    const clientUsers = storedUsers.filter(u =>
        u.email !== 'admin@reinoanimal.com' && u.email !== 'vet@reinoanimal.com'
    );

    return [...defaultProfessionals, ...clientUsers];
};

export const getDbPets = () => {
    return JSON.parse(localStorage.getItem('db_pets') || '[]');
};

export const getPetsByOwnerId = (ownerId) => {
    const allPets = getDbPets();
    return allPets.filter(pet => pet.ownerId === ownerId);
};

export const getPetById = (petId) => {
    const allPets = getDbPets();
    return allPets.find(pet => pet.id === petId) || null;
};

export const savePet = (updatedPet) => {
    const allPets = getDbPets();
    const index = allPets.findIndex(p => p.id === updatedPet.id);
    if (index !== -1) {
        allPets[index] = updatedPet;
        localStorage.setItem('db_pets', JSON.stringify(allPets));
    } else {
        allPets.push(updatedPet);
        localStorage.setItem('db_pets', JSON.stringify(allPets));
    }
};

export const registerUser = (userData) => {
    const users = getDbUsers();

    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Este e-mail já está em uso.' };
    }

    // Check if document already exists
    if (users.find(u => u.document === userData.document)) {
        return { success: false, message: 'Este CPF/CNPJ já está cadastrado.' };
    }

    const newUser = {
        ...userData,
        id: Math.random().toString(36).substr(2, 9),
        role: 'client' // Default role
    };

    users.push(newUser);
    localStorage.setItem('db_users', JSON.stringify(users));
    return { success: true, user: newUser };
};

export const deleteUser = (userId) => {
    // Delete user
    const users = getDbUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('db_users', JSON.stringify(updatedUsers));

    // Delete their pets or unbind them
    const pets = getDbPets();
    const updatedPets = pets.filter(p => p.ownerId !== userId);
    localStorage.setItem('db_pets', JSON.stringify(updatedPets));

    return { success: true };
};

export const updateUserPassword = (userId, newPassword) => {
    const users = getDbUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].password = newPassword;
        localStorage.setItem('db_users', JSON.stringify(users));
        return { success: true };
    }
    return { success: false, message: 'Usuário não encontrado.' };
};

// Call to ensure it initializes at least once when the app imports this
initializeDb();
