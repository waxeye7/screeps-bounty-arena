import {
  ensureBasicBuilders,
  ensureBasicHarvesters,
  ensureBasicUpgraders,
  ensureContainerMiningEconomy,
} from './planning/spawn';
import { runBuilder } from './roles/builder';
import { runHarvester } from './roles/harvester';
import { runHauler } from './roles/hauler';
import { runMiner } from './roles/miner';
import { runUpgrader } from './roles/upgrader';

export function loop(): void {
  cleanupDeadCreeps();

  for (const spawn of Object.values(Game.spawns)) {
    ensureBasicHarvesters(spawn);
    ensureContainerMiningEconomy(spawn);
    ensureBasicUpgraders(spawn);
    ensureBasicBuilders(spawn);
  }

  for (const creep of Object.values(Game.creeps)) {
    switch (creep.memory.role) {
      case 'builder':
        runBuilder(creep);
        break;
      case 'hauler':
        runHauler(creep);
        break;
      case 'miner':
        runMiner(creep);
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

function cleanupDeadCreeps(): void {
  for (const name of Object.keys(Memory.creeps)) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
}
