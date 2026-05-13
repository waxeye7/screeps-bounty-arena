export function ensureBasicHarvesters(spawn: StructureSpawn, desiredCount = 3): void {
  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length >= desiredCount || spawn.spawning) return;

  const name = `Harvester${Game.time}`;
  spawn.spawnCreep([WORK, CARRY, MOVE], name, {
    memory: { role: 'harvester' },
  });
}

export function ensureBasicUpgraders(spawn: StructureSpawn, desiredCount = 1, requiredHarvesters = 3): void {
  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length < requiredHarvesters) return;

  const upgraders = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'upgrader');
  if (upgraders.length >= desiredCount || spawn.spawning) return;

  const name = `Upgrader${Game.time}`;
  spawn.spawnCreep([WORK, CARRY, MOVE], name, {
    memory: { role: 'upgrader' },
  });
}
