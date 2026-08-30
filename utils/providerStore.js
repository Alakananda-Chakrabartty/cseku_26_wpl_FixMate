/**
 * In-memory provider-application store — FOR DEVELOPMENT / DEMO ONLY.
 * Replace with real database queries before shipping, same as userStore.js.
 * Data resets on every server restart.
 */

const providers = new Map(); // key: id -> provider record
let nextId = 1;

function seed() {
  const seedData = [
    { fullName: 'Sonar Motors',           category: 'Mechanic',      submitted: 'Aug 27, 2026', initials: 'SM' },
    { fullName: 'BrightCoat Painters',    category: 'Painter',       submitted: 'Aug 26, 2026', initials: 'BC' },
    { fullName: 'SparkleShine Cleaners',  category: 'Cleaner',       submitted: 'Aug 25, 2026', initials: 'SS' },
    { fullName: 'FreezeCool AC',          category: 'AC Technician', submitted: 'Aug 24, 2026', initials: 'FC' },
    { fullName: 'PowerLine Electric',     category: 'Electrician',   submitted: 'Aug 23, 2026', initials: 'PW' }
  ];
  seedData.forEach(p => {
    const id = nextId++;
    providers.set(id, { id, ...p, status: 'pending', decidedAt: null });
  });
}
seed();

function getAllProviders() {
  return Array.from(providers.values());
}

function getProviderById(id) {
  return providers.get(Number(id)) || null;
}

function updateProviderStatus(id, status) {
  const provider = getProviderById(id);
  if (!provider) return null;
  provider.status = status;
  provider.decidedAt = new Date().toISOString();
  return provider;
}

module.exports = { getAllProviders, getProviderById, updateProviderStatus };