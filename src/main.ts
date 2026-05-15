import { runTowerDefense } from './defense/towers';
import {
  ensureBasicBuilders,
  ensureBasicHarvesters,
  ensureBasicRepairers,
  ensureBasicUpgraders,
  ensureContainerMiningEconomy,
  ensureEmergencyRecovery,
} from './planning/spawn';
import { planRcl2Extensions } from './planning/extensions';
import { removeExpensiveRoadConstructionSites } from './planning/roads';
import { runBuilder } from './roles/builder';
import { runHauler } from './roles/hauler';
import { runHarvester } from './roles/harvester';
import { runMiner } from './roles/miner';
import { runRepairer } from './roles/repairer';
import { runUpgrader } from './roles/upgrader';
import { cleanupDeadCreeps, migrateRoomMemory } from './memory';

export function loop(): void {
  cleanupDeadCreeps();
  migrateRoomMemory();

  const rooms = new Set<Room>();

  for (const spawn of Object.values(Game.spawns)) {
    rooms.add(spawn.room);
    if (ensureEmergencyRecovery(spawn)) continue;
    ensureBasicHarvesters(spawn);
    ensureContainerMiningEconomy(spawn);
    ensureBasicUpgraders(spawn);
    planRcl2Extensions(spawn.room);
    ensureBasicBuilders(spawn);
    ensureBasicRepairers(spawn);
  }

  for (const room of rooms) {
    removeExpensiveRoadConstructionSites(room);
    runTowerDefense(room);
  }

  for (const creep of Object.values(Game.creeps)) {
    switch (creep.memory?.role) {
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
      case 'repairer':
        runRepairer(creep);
        break;
      case 'harvester':
      default:
        runHarvester(creep);
        break;
    }
  }
}
