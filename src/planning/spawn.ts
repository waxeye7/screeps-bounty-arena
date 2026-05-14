const WORKER_BODY_PATTERN: BodyPartConstant[] = ['work', 'carry', 'move'];
const BODY_PART_COSTS: Record<BodyPartConstant, number> = {
  work: 100,
  carry: 50,
  move: 50,
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

export function ensureContainerMiningEconomy(
  spawn: StructureSpawn,
  desiredMiners = 1,
  desiredHaulers = 1,
  requiredHarvesters = 2,
): void {
  if (spawn.spawning) return;

  const harvesters = countRole('harvester');
  if (harvesters < requiredHarvesters) return;

  if (!hasSourceSideContainer(spawn.room) && !hasDroppedEnergy(spawn.room)) return;

  if (countRole('miner') < desiredMiners) {
    spawn.spawnCreep(buildWorkerBody(spawn.room.energyAvailable ?? MIN_WORKER_ENERGY), `Miner${Game.time}`, {
      memory: { role: 'miner' },
    });
    return;
  }

  if (countRole('hauler') < desiredHaulers) {
    spawn.spawnCreep(buildWorkerBody(spawn.room.energyAvailable ?? MIN_WORKER_ENERGY), `Hauler${Game.time}`, {
      memory: { role: 'hauler' },
    });
  }
}

function countRole(role: CreepRole): number {
  return Object.values(Game.creeps).filter((creep) => creep.memory.role === role).length;
}

function hasSourceSideContainer(room: Room): boolean {
  const sources = room.find(FIND_SOURCES);
  return room
    .find(FIND_STRUCTURES)
    .some(
      (structure): structure is StructureContainer =>
        structure.structureType === STRUCTURE_CONTAINER && sources.some((source) => structure.pos.isNearTo(source)),
    );
}

function hasDroppedEnergy(room: Room): boolean {
  return room
    .find(FIND_DROPPED_RESOURCES)
    .some((resource) => resource.resourceType === RESOURCE_ENERGY && resource.amount > 0);
}
