import { ensureBasicBuilders, ensureBasicHarvesters, ensureBasicUpgraders } from './planning/spawn';
import { maintainMemory } from './memory';
import { runBuilder } from './roles/builder';
import { runHarvester } from './roles/harvester';
import { runUpgrader } from './roles/upgrader';

export function loop(): void {
  maintainMemory();

  for (const spawn of Object.values(Game.spawns)) {
    ensureBasicHarvesters(spawn);
    ensureBasicUpgraders(spawn);
    ensureBasicBuilders(spawn);
  }

  for (const creep of Object.values(Game.creeps)) {
    switch (creep.memory.role) {
      case 'builder':
        runBuilder(creep);
        break;
      case 'upgrader':
        runUpgrader(creep);
        break;
      case 'harvester':
      default:
        runHarvester(creep);
        break;
    }
  }
}
