export function runBuilder(creep: Creep): void {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
    const site = chooseConstructionSite(creep);
    if (!site) {
      creep.say('no site');
      return;
    }

    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' } });
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

function chooseConstructionSite(creep: Creep): ConstructionSite | undefined {
  const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
  return sites.find((site) => site.my) ?? sites[0];
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
