export function runHarvester(creep: Creep): void {
  const source = chooseSource(creep);
  if (!source) {
    creep.say('no source');
    return;
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }

  const spawn = Object.values(Game.spawns)[0];
  if (spawn && creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

export function chooseSource(creep: Creep): Source | undefined {
  const sources = Object.values(Game.spawns)[0]?.room.find(FIND_SOURCES) ?? [];
  if (sources.length === 0) return undefined;

  if (creep.memory?.sourceId) {
    const remembered = sources.find((source) => source.id === creep.memory.sourceId);
    if (remembered) return remembered;
  }

  const assignmentCounts = new Map(sources.map((source) => [source.id, 0]));
  for (const otherCreep of Object.values(Game.creeps)) {
    if (otherCreep.name === creep.name) continue;
    const sourceId = otherCreep.memory?.sourceId;
    if (sourceId && assignmentCounts.has(sourceId)) {
      assignmentCounts.set(sourceId, (assignmentCounts.get(sourceId) ?? 0) + 1);
    }
  }

  const selected = sources.reduce((bestSource, source) => {
    const bestCount = assignmentCounts.get(bestSource.id) ?? 0;
    const sourceCount = assignmentCounts.get(source.id) ?? 0;
    return sourceCount < bestCount ? source : bestSource;
  });

  if (!creep.memory) creep.memory = {};
  creep.memory.sourceId = selected.id;
  return selected;
}
