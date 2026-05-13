const WORKER_BODY_PATTERN: BodyPartConstant[] = ['work', 'carry', 'move'];
const BODY_PART_COSTS: Record<BodyPartConstant, number> = {
  work: 100,
  carry: 50,
  move: 50,
  attack: 80,
  ranged_attack: 150,
  heal: 250,
};
const MIN_WORKER_ENERGY = 200;
const MAX_CREEP_BODY_PARTS = 50;

export function buildWorkerBody(availableEnergy: number): BodyPartConstant[] {
  const budget = Number.isFinite(availableEnergy) ? Math.floor(availableEnergy) : MIN_WORKER_ENERGY;
  let remainingEnergy = Math.max(MIN_WORKER_ENERGY, budget);
  const body: BodyPartConstant[] = [];

  while (body.length < MAX_CREEP_BODY_PARTS) {
    let addedPart = false;

    for (const part of WORKER_BODY_PATTERN) {
      const cost = BODY_PART_COSTS[part];
      if (remainingEnergy < cost || body.length >= MAX_CREEP_BODY_PARTS) {
        return body.length > 0 ? body : [...WORKER_BODY_PATTERN];
      }

      body.push(part);
      remainingEnergy -= cost;
      addedPart = true;
    }

    if (!addedPart) break;
  }

  return body.length > 0 ? body : [...WORKER_BODY_PATTERN];
}

export function ensureBasicHarvesters(spawn: StructureSpawn, desiredCount = 3): void {
  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length >= desiredCount || spawn.spawning) return;

  const name = `Harvester${Game.time}`;
  spawn.spawnCreep(buildWorkerBody(spawn.room.energyAvailable ?? MIN_WORKER_ENERGY), name, {
    memory: { role: 'harvester' },
  });
}

export function ensureBasicUpgraders(spawn: StructureSpawn, desiredCount = 1, requiredHarvesters = 3): void {
  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length < requiredHarvesters || spawn.spawning) return;

  const upgraders = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'upgrader');
  if (upgraders.length >= desiredCount) return;

  const name = `Upgrader${Game.time}`;
  spawn.spawnCreep(buildWorkerBody(spawn.room.energyAvailable ?? MIN_WORKER_ENERGY), name, {
    memory: { role: 'upgrader' },
  });
}

export function ensureBasicBuilders(spawn: StructureSpawn, desiredCount = 1, requiredHarvesters = 3): void {
  const constructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES);
  if (constructionSites.length === 0 || spawn.spawning) return;

  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length < requiredHarvesters) return;

  const builders = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'builder');
  if (builders.length >= desiredCount) return;

  const name = `Builder${Game.time}`;
  spawn.spawnCreep(buildWorkerBody(spawn.room.energyAvailable ?? MIN_WORKER_ENERGY), name, {
    memory: { role: 'builder' },
  });
}
