/**
 * Shared Screeps-like test fixtures.
 *
 * What these fixtures model:
 *   - Room structure with find() dispatch for all common FIND_* constants
 *   - Positions (x/y/roomName) with a working isNearTo() implementation
 *   - Basic energy stores (getFreeCapacity / getUsedCapacity)
 *   - Action spies on creeps: harvest, transfer, withdraw, pickup, build, repair,
 *     upgradeController, moveTo, say, attack, heal, rangedAttack
 *   - Spawn with spawnCreep spy and spawning flag
 *   - Controller with configurable level/progress
 *   - Extension and Tower structures
 *   - Dropped resources
 *   - mockGame() to wire up the Game global with creeps and spawns
 *
 * What these fixtures do NOT model:
 *   - Pathfinding or movement simulation
 *   - Tick engine or game loop
 *   - CPU usage or bucket
 *   - Visual range or FOV
 *   - Inter-room or shard interactions
 */

export interface MockRoomFixture {
  room: Room;
  spawn: StructureSpawn;
  createCalls: Array<{ x: number; y: number; structureType: string }>;
  spawnCalls: Array<{ body: BodyPartConstant[]; name: string; opts?: { memory?: CreepMemory } }>;
}

export interface MockRoomOptions {
  name?: string;
  controller?: StructureController;
  energyAvailable?: number;
  energyCapacityAvailable?: number;
  sources?: Source[];
  structures?: Structure[];
  constructionSites?: ConstructionSite[];
  droppedResources?: Resource<ResourceConstant>[];
}

export interface MockCreepOptions {
  name: string;
  role: CreepRole;
  room: Room;
  energyUsed?: number;
  freeCapacity?: number;
  calls?: string[];
}

export function mockPos(x?: number, y?: number, roomName = 'W1N1'): RoomPosition {
  return {
    x,
    y,
    roomName,
    isNearTo: (target: RoomObject) => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(target.pos.x) || !Number.isFinite(target.pos.y)) {
        return false;
      }

      return Math.max(Math.abs((x ?? 0) - (target.pos.x ?? 0)), Math.abs((y ?? 0) - (target.pos.y ?? 0))) <= 1;
    },
  };
}

export function mockSource(id = 'source1', x = 20, y = 20): Source {
  return { id, pos: mockPos(x, y) } as Source;
}

export function mockStructure(id: string, structureType: string, x: number, y: number): Structure {
  return { id, structureType, pos: mockPos(x, y), hits: 1000, hitsMax: 1000 } as Structure;
}

export function mockConstructionSite(id: string, structureType = STRUCTURE_ROAD, x = 21, y = 20): ConstructionSite {
  return { id, structureType, my: true, pos: mockPos(x, y) } as ConstructionSite;
}

export interface MockControllerOptions {
  id?: string;
  level?: number;
  progress?: number;
  progressTotal?: number;
  x?: number;
  y?: number;
  roomName?: string;
}

export function mockController(opts: MockControllerOptions = {}): StructureController {
  const { id = 'controller1', level = 1, progress = 0, progressTotal = 200, x = 25, y = 20, roomName = 'W1N1' } = opts;
  return {
    id,
    level,
    progress,
    progressTotal,
    my: true,
    structureType: 'controller',
    pos: mockPos(x, y, roomName),
  } as unknown as StructureController;
}

export interface MockDroppedResourceOptions {
  id?: string;
  resourceType?: ResourceConstant;
  amount?: number;
  x?: number;
  y?: number;
  roomName?: string;
}

export function mockDroppedResource(opts: MockDroppedResourceOptions = {}): Resource<ResourceConstant> {
  const { id = 'drop1', resourceType = RESOURCE_ENERGY, amount = 100, x = 22, y = 20, roomName = 'W1N1' } = opts;
  return {
    id,
    resourceType,
    amount,
    pos: mockPos(x, y, roomName),
  } as unknown as Resource<ResourceConstant>;
}

export interface MockExtensionOptions {
  id?: string;
  energy?: number;
  energyCapacity?: number;
  x?: number;
  y?: number;
  roomName?: string;
}

export function mockExtension(opts: MockExtensionOptions = {}): StructureExtension {
  const { id = 'ext1', energy = 0, energyCapacity = 50, x = 15, y = 15, roomName = 'W1N1' } = opts;
  return {
    id,
    structureType: STRUCTURE_EXTENSION,
    store: {
      getFreeCapacity: () => energyCapacity - energy,
      getUsedCapacity: () => energy,
    },
    hits: 1000,
    hitsMax: 1000,
    pos: mockPos(x, y, roomName),
  } as unknown as StructureExtension;
}

export interface MockTowerOptions {
  id?: string;
  energy?: number;
  energyCapacity?: number;
  x?: number;
  y?: number;
  roomName?: string;
  calls?: string[];
}

export function mockTower(opts: MockTowerOptions = {}): StructureTower {
  const { id = 'tower1', energy = 500, energyCapacity = 1000, x = 30, y = 20, roomName = 'W1N1', calls = [] } = opts;
  return {
    id,
    structureType: STRUCTURE_TOWER,
    store: {
      getFreeCapacity: () => energyCapacity - energy,
      getUsedCapacity: () => energy,
    },
    hits: 3000,
    hitsMax: 3000,
    pos: mockPos(x, y, roomName),
    attack: (target: Creep | Structure) => {
      calls.push(`${id}:attack:${(target as { id: string }).id}`);
      return 0;
    },
    heal: (target: Creep) => {
      calls.push(`${id}:heal:${target.id}`);
      return 0;
    },
    repair: (target: Structure) => {
      calls.push(`${id}:repair:${target.id}`);
      return 0;
    },
  } as unknown as StructureTower;
}

export interface MockGameOptions {
  time?: number;
  creeps?: Creep[];
  spawns?: StructureSpawn[];
}

export function mockGame(opts: MockGameOptions = {}): void {
  const { time = 1, creeps = [], spawns = [] } = opts;
  globalThis.Game = {
    time,
    creeps: Object.fromEntries(creeps.map((c) => [c.name, c])),
    spawns: Object.fromEntries(spawns.map((s) => [s.name, s])),
  } as GameGlobal;
}

export function noControllerRoomFixture(options: Omit<MockRoomOptions, 'controller'> = {}): MockRoomFixture {
  return mockRoomFixture({ ...options, controller: undefined });
}

export function mockRoomFixture(options: MockRoomOptions = {}): MockRoomFixture {
  const name = options.name ?? 'W1N1';
  const controller = Object.hasOwn(options, 'controller')
    ? options.controller
    : ({ id: 'controller1', level: 2, pos: mockPos(25, 20, name) } as StructureController);
  const energyAvailable = options.energyAvailable ?? 300;
  const energyCapacityAvailable = options.energyCapacityAvailable ?? 300;
  const sources = options.sources ?? [mockSource()];
  const structures = options.structures ?? [];
  const constructionSites = options.constructionSites ?? [];
  const droppedResources = options.droppedResources ?? [];
  const createCalls: MockRoomFixture['createCalls'] = [];
  const spawnCalls: MockRoomFixture['spawnCalls'] = [];
  const spawn = {
    id: 'spawn1',
    name: 'Spawn1',
    pos: mockPos(10, 10, name),
    room: undefined,
    spawning: null,
    store: { getFreeCapacity: () => energyCapacityAvailable, getUsedCapacity: () => 0 },
    structureType: STRUCTURE_SPAWN,
    hits: 5000,
    hitsMax: 5000,
    spawnCreep: (body: BodyPartConstant[], creepName: string, opts?: { memory?: CreepMemory }) => {
      spawnCalls.push({ body, name: creepName, opts });
      return 0;
    },
  } as unknown as StructureSpawn;

  const room = {
    name,
    controller,
    energyAvailable,
    energyCapacityAvailable,
    find: (type: number) => {
      switch (type) {
        case FIND_SOURCES:
          return sources;
        case FIND_MY_SPAWNS:
          return [spawn];
        case FIND_STRUCTURES:
        case FIND_MY_STRUCTURES:
          return [spawn, ...structures];
        case FIND_CONSTRUCTION_SITES:
          return constructionSites;
        case FIND_DROPPED_RESOURCES:
          return droppedResources;
        default:
          return [];
      }
    },
    createConstructionSite: (x: number, y: number, structureType: string) => {
      createCalls.push({ x, y, structureType });
      return 0;
    },
  } as unknown as Room;

  spawn.room = room;
  return { room, spawn, createCalls, spawnCalls };
}

export function mockCreep({ name, role, room, energyUsed = 0, freeCapacity = 50, calls = [] }: MockCreepOptions): Creep {
  return {
    id: name,
    name,
    memory: { role },
    room,
    pos: mockPos(12, 12, room.name),
    hits: 100,
    hitsMax: 100,
    store: {
      getFreeCapacity: () => freeCapacity,
      getUsedCapacity: (resource?: ResourceConstant) => (resource === undefined || resource === RESOURCE_ENERGY ? energyUsed : 0),
    },
    harvest: () => {
      calls.push(`${name}:harvest`);
      return 0;
    },
    transfer: () => {
      calls.push(`${name}:transfer`);
      return 0;
    },
    withdraw: () => {
      calls.push(`${name}:withdraw`);
      return 0;
    },
    pickup: () => {
      calls.push(`${name}:pickup`);
      return 0;
    },
    build: () => {
      calls.push(`${name}:build`);
      return 0;
    },
    repair: () => {
      calls.push(`${name}:repair`);
      return 0;
    },
    upgradeController: () => {
      calls.push(`${name}:upgrade`);
      return 0;
    },
    moveTo: () => {
      calls.push(`${name}:move`);
      return 0;
    },
    say: (message: string) => {
      calls.push(`${name}:say:${message}`);
      return 0;
    },
    attack: (target: Creep | Structure) => {
      calls.push(`${name}:attack:${(target as { id: string }).id}`);
      return 0;
    },
    heal: (target: Creep) => {
      calls.push(`${name}:heal:${target.id}`);
      return 0;
    },
    rangedAttack: (target: Creep | Structure) => {
      calls.push(`${name}:rangedAttack:${(target as { id: string }).id}`);
      return 0;
    },
  } as unknown as Creep;
}
