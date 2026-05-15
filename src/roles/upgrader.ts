export function runUpgrader(creep: Creep): void {
  const controller = creep.room.controller ?? Object.values(Game.spawns)[0]?.room.controller;
  if (!controller) {
    creep.say('no ctrl');
    return;
  }

  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller, { visualizePathStyle: { stroke: '#33ccff' } });
    }
    return;
  }

  const source = chooseSource(creep);
  if (!source) {
    creep.say('no source');
    return;
  }

  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
  }
}

function chooseSource(creep: Creep): Source | undefined {
  const sources = creep.room.find(FIND_SOURCES);
  if (creep.memory?.sourceId) {
    const remembered = sources.find((source) => source.id === creep.memory.sourceId);
    if (remembered) return remembered;
  }

  const selected = sources[0];
  if (selected) {
    if (!creep.memory) creep.memory = {};
    creep.memory.sourceId = selected.id;
  }
  return selected;
}
