const MINIMUM_HARVESTER_BODY: BodyPartConstant[] = [WORK, CARRY, MOVE];
const HARVESTER_SEGMENT: BodyPartConstant[] = [WORK, CARRY, MOVE];
const HARVESTER_SEGMENT_COST = 200;
const MAX_HARVESTER_SEGMENTS = 4;

export function ensureBasicHarvesters(spawn: StructureSpawn, desiredCount = 3): void {
  const harvesters = Object.values(Game.creeps).filter((creep) => creep.memory.role === 'harvester');
  if (harvesters.length >= desiredCount || spawn.spawning) return;

  const name = `Harvester${Game.time}`;
  spawn.spawnCreep(buildHarvesterBody(spawn.room.energyAvailable), name, {
    memory: { role: 'harvester' },
  });
}

export function buildHarvesterBody(availableEnergy: number): BodyPartConstant[] {
  const segmentCount = Math.max(
    1,
    Math.min(MAX_HARVESTER_SEGMENTS, Math.floor(availableEnergy / HARVESTER_SEGMENT_COST)),
  );

  if (segmentCount === 1) return [...MINIMUM_HARVESTER_BODY];

  return Array.from({ length: segmentCount }).flatMap(() => HARVESTER_SEGMENT);
}
