declare global {
  var Game: GameGlobal;
  var Memory: MemoryGlobal;
  var WORK: BodyPartConstant;
  var CARRY: BodyPartConstant;
  var MOVE: BodyPartConstant;
  var ERR_NOT_IN_RANGE: -9;
  var FIND_SOURCES: 105;
  var FIND_MY_SPAWNS: 100;
  var FIND_MY_STRUCTURES: 107;
  var FIND_STRUCTURES: 108;
  var FIND_DROPPED_RESOURCES: 106;
  var FIND_CONSTRUCTION_SITES: 109;
  var STRUCTURE_SPAWN: 'spawn';
  var STRUCTURE_EXTENSION: 'extension';
  var STRUCTURE_CONTAINER: 'container';
  var RESOURCE_ENERGY: 'energy';

  type BodyPartConstant = 'work' | 'carry' | 'move';
  type ResourceConstant = 'energy';
  type CreepRole = 'harvester' | 'upgrader' | 'builder' | 'miner' | 'hauler';

  interface MemoryGlobal {
    creeps: Record<string, CreepMemory>;
  }

  interface CreepMemory {
    role?: CreepRole;
    sourceId?: string;
  }

  interface GameGlobal {
    creeps: Record<string, Creep>;
    spawns: Record<string, StructureSpawn>;
    time: number;
  }

  interface RoomObject {
    id: string;
    pos: RoomPosition;
  }

  interface RoomPosition {
    isNearTo(target: RoomObject): boolean;
  }

  interface Source extends RoomObject {}
  interface StructureController extends RoomObject {}

  interface Resource<TResource extends ResourceConstant = ResourceConstant> extends RoomObject {
    amount: number;
    resourceType: TResource;
  }

  interface Structure extends RoomObject {
    structureType: string;
  }

  interface EnergyStructure extends Structure {
    store: Store;
  }

  interface StructureContainer extends EnergyStructure {
    structureType: typeof STRUCTURE_CONTAINER;
  }

  interface StructureExtension extends EnergyStructure {
    structureType: typeof STRUCTURE_EXTENSION;
  }

  interface ConstructionSite extends RoomObject {
    my?: boolean;
    structureType?: string;
    progress?: number;
    total?: number;
  }

  interface Store {
    getFreeCapacity(resource?: ResourceConstant): number;
    getUsedCapacity(resource?: ResourceConstant): number;
  }

  interface Creep extends RoomObject {
    name: string;
    memory: CreepMemory;
    room: Room;
    store: Store;
    harvest(source: Source): 0 | -9;
    transfer(target: StructureSpawn | StructureExtension, resource: ResourceConstant): 0 | -9;
    withdraw(target: StructureContainer, resource: ResourceConstant): 0 | -9;
    pickup(target: Resource<ResourceConstant>): 0 | -9;
    build(target: ConstructionSite): 0 | -9;
    upgradeController(target: StructureController): 0 | -9;
    moveTo(target: RoomObject, opts?: { visualizePathStyle?: { stroke?: string } }): number;
    say(message: string): number;
  }

  interface Room {
    controller?: StructureController;
    energyAvailable?: number;
    energyCapacityAvailable?: number;
    find(type: typeof FIND_SOURCES): Source[];
    find(type: typeof FIND_MY_SPAWNS): StructureSpawn[];
    find(type: typeof FIND_MY_STRUCTURES): Structure[];
    find(type: typeof FIND_STRUCTURES): Structure[];
    find(type: typeof FIND_DROPPED_RESOURCES): Resource<ResourceConstant>[];
    find(type: typeof FIND_CONSTRUCTION_SITES): ConstructionSite[];
  }

  interface StructureSpawn extends EnergyStructure {
    structureType: typeof STRUCTURE_SPAWN;
    name: string;
    room: Room;
    spawning: unknown;
    spawnCreep(body: BodyPartConstant[], name: string, opts?: { memory?: CreepMemory }): number;
  }
}

export {};
