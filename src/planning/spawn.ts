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
const failedSpawnAttempts = new Map<string, number>();

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
  if (harvesters.length >= desiredCount || !hasVisibleSource(spawn.room)) return;

  trySpawnWorker(spawn, 'harvester', `Harvester${Game.time}`);
}

export function ensureBasicUpgraders(spawn: StructureSpawn, desiredCount?: number, requiredHarvesters = 3): void {
  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length < requiredHarvesters || spawn.spawning) return;

  if (desiredCount === undefined) {
    desiredCount = 1;
    const capacity = spawn.room.energyCapacityAvailable ?? 300;
    const energy = spawn.room.energyAvailable ?? 300;
    if (capacity > 300 && energy >= capacity * 0.8) {
      desiredCount += 1;
    }
    const constructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length === 0 && energy >= 300) {
      desiredCount += 1;
    }
  }

  const upgraders = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'upgrader');
  if (upgraders.length >= desiredCount) return;

  trySpawnWorker(spawn, 'upgrader', `Upgrader${Game.time}`);
}

export function ensureBasicBuilders(spawn: StructureSpawn, desiredCount?: number, requiredHarvesters = 3): void {
  const constructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES);
  if (constructionSites.length === 0 || spawn.spawning) return;

  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length < requiredHarvesters) return;

  if (desiredCount === undefined) {
    desiredCount = Math.min(3, Math.max(1, Math.ceil(constructionSites.length / 5)));
  }

  const builders = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'builder');
  if (builders.length >= desiredCount) return;

  trySpawnWorker(spawn, 'builder', `Builder${Game.time}`);
}

export function ensureBasicRepairers(spawn: StructureSpawn, desiredCount = 1, requiredHarvesters = 3): void {
  const damagedStructures = spawn.room.find(FIND_STRUCTURES).filter((structure) => structure.hits < structure.hitsMax);
  if (damagedStructures.length === 0 || spawn.spawning) return;

  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length < requiredHarvesters) return;

  const repairers = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'repairer');
  if (repairers.length >= desiredCount) return;

  trySpawnWorker(spawn, 'repairer', `Repairer${Game.time}`);
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
    trySpawnWorker(spawn, 'miner', `Miner${Game.time}`);
    return;
  }

  if (countRole('hauler') < desiredHaulers) {
    trySpawnWorker(spawn, 'hauler', `Hauler${Game.time}`);
  }
}

function countRole(role: CreepRole): number {
  return Object.values(Game.creeps).filter((creep) => creep.memory?.role === role).length;
}

const lastSpawnedRole = new Map<string, CreepRole>();
const starvationYields = new Map<string, number>();

export function resetSpawnPlannerForTests(): void {
  failedSpawnAttempts.clear();
  lastSpawnedRole.clear();
  starvationYields.clear();
}

function trySpawnWorker(spawn: StructureSpawn, role: CreepRole, name: string): boolean {
  if (spawn.spawning || isWorkerSpawnBlockedThisTick(spawn) || !hasEnoughEnergyForWorker(spawn)) return false;

  const spawnKey = spawnAttemptKey(spawn);

  // Anti-starvation: yield one tick if this role was the last one spawned
  if (lastSpawnedRole.get(spawnKey) === role && starvationYields.get(spawnKey) !== Game.time - 1) {
    starvationYields.set(spawnKey, Game.time);
    return false;
  }

  const result = spawn.spawnCreep(buildWorkerBody(spawn.room.energyAvailable ?? MIN_WORKER_ENERGY), name, {
    memory: { role },
  });

  if (result !== 0) {
    failedSpawnAttempts.set(spawnKey, Game.time);
    return false;
  }

  lastSpawnedRole.set(spawnKey, role);
  return true;
}

function isWorkerSpawnBlockedThisTick(spawn: StructureSpawn): boolean {
  return failedSpawnAttempts.get(spawnAttemptKey(spawn)) === Game.time;
}

function spawnAttemptKey(spawn: StructureSpawn): string {
  return spawn.name || spawn.id;
}

function hasEnoughEnergyForWorker(spawn: StructureSpawn): boolean {
  return (spawn.room.energyAvailable ?? MIN_WORKER_ENERGY) >= MIN_WORKER_ENERGY;
}

function hasVisibleSource(room: Room): boolean {
  return room.find(FIND_SOURCES).length > 0;
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

export function ensureEmergencyRecovery(spawn: StructureSpawn): boolean {
  if (spawn.spawning) return true; // Handled

  const creeps = Object.values(Game.creeps);
  const harvesters = creeps.filter(c => c.memory?.role === 'harvester');
  const miners = creeps.filter(c => c.memory?.role === 'miner');
  
  // Emergency condition: 0 harvesters and 0 miners (no energy income)
  if (harvesters.length === 0 && miners.length === 0) {
    if (!hasVisibleSource(spawn.room)) return true;

    trySpawnWorker(spawn, 'harvester', `RecoveryHarvester${Game.time}`);
    return true; // We are in an emergency state, block other spawns
  }
  
  return false; // Not an emergency
}
