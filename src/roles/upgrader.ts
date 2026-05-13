export function runUpgrader(creep: Creep): void {
  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    const source = chooseSource(creep);
    if (!source) {
      creep.say('no source');
      return;
    }

    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }

  const controller = Object.values(Game.spawns)[0]?.room.controller;
  if (!controller) {
    creep.say('no ctrl');
    return;
  }

  if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller, { visualizePathStyle: { stroke: '#33ccff' } });
  }
}

function chooseSource(creep: Creep): Source | undefined {
  const sources = Object.values(Game.spawns)[0]?.room.find(FIND_SOURCES) ?? [];
  if (creep.memory.sourceId) {
    const remembered = sources.find((source) => source.id === creep.memory.sourceId);
    if (remembered) return remembered;
  }

  const selected = sources[0];
  if (selected) creep.memory.sourceId = selected.id;
  return selected;
}
