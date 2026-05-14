import { beforeEach, describe, expect, it } from 'vitest';

import { loop } from '../src/main';
import { chooseExtensionConstructionPositions, planRcl2Extensions } from '../src/planning/extensions';
import { planEarlyRoads } from '../src/planning/roads';
import { ensureBasicBuilders, ensureBasicHarvesters, ensureBasicUpgraders } from '../src/planning/spawn';
import { runBuilder } from '../src/roles/builder';
import { runHarvester } from '../src/roles/harvester';
import { runUpgrader } from '../src/roles/upgrader';
import {
  mockConstructionSite,
  mockCreep,
  mockPos,
  mockRoomFixture,
  mockSource,
  noControllerRoomFixture,
} from './fixtures/rooms';

function installGame(fixture: ReturnType<typeof mockRoomFixture>, creeps: Record<string, Creep> = {}): void {
  globalThis.Game = {
    time: 1234,
    creeps,
    spawns: { [fixture.spawn.name]: fixture.spawn },
    rooms: { [fixture.room.name ?? 'W1N1']: fixture.room },
  } as GameGlobal;
  globalThis.Memory = { creeps: {}, rooms: {} };
}

describe('no-controller room edge cases', () => {
  beforeEach(() => {
    globalThis.Memory = { creeps: {}, rooms: {} };
  });

  it('provides a reusable no-controller room fixture', () => {
    const fixture = noControllerRoomFixture();

    expect(fixture.room.controller).toBeUndefined();
    expect(fixture.room.find(FIND_MY_SPAWNS)).toEqual([fixture.spawn]);
    expect(fixture.room.find(FIND_SOURCES)).toHaveLength(1);
  });

  it('keeps the main loop and spawn planners from throwing when the room has no controller', () => {
    const fixture = noControllerRoomFixture({
      constructionSites: [mockConstructionSite('site1', STRUCTURE_ROAD)],
      sources: [mockSource('source1', 16, 10)],
    });
    installGame(fixture);

    expect(() => loop()).not.toThrow();
    expect(fixture.spawnCalls).toHaveLength(1);

    expect(() => ensureBasicHarvesters(fixture.spawn)).not.toThrow();
    expect(() => ensureBasicUpgraders(fixture.spawn, 1, 0)).not.toThrow();
    expect(() => ensureBasicBuilders(fixture.spawn, 1, 0)).not.toThrow();
  });

  it('keeps upgrader, builder, and harvester roles safe in no-controller rooms', () => {
    const fixture = noControllerRoomFixture({
      constructionSites: [mockConstructionSite('site1', STRUCTURE_ROAD)],
      sources: [mockSource('source1', 18, 18)],
    });
    const calls: string[] = [];
    const upgrader = mockCreep({ name: 'Upgrader1', role: 'upgrader', room: fixture.room, energyUsed: 50, calls });
    const builder = mockCreep({ name: 'Builder1', role: 'builder', room: fixture.room, energyUsed: 50, calls });
    const harvester = mockCreep({ name: 'Harvester1', role: 'harvester', room: fixture.room, freeCapacity: 50, calls });
    installGame(fixture, { Upgrader1: upgrader, Builder1: builder, Harvester1: harvester });

    expect(() => runUpgrader(upgrader)).not.toThrow();
    expect(() => runBuilder(builder)).not.toThrow();
    expect(() => runHarvester(harvester)).not.toThrow();

    expect(calls).toContain('Upgrader1:say:no ctrl');
    expect(calls).toContain('Builder1:build');
    expect(calls).toContain('Harvester1:harvest');
  });

  it('lets road and extension planners skip missing-controller targets cleanly', () => {
    const fixture = noControllerRoomFixture({ sources: [mockSource('source1', 16, 10)] });
    installGame(fixture);

    expect(planRcl2Extensions(fixture.room)).toBe(0);
    expect(chooseExtensionConstructionPositions(fixture.room, 3)).toHaveLength(3);

    const roadSummary = planEarlyRoads(fixture.room, { maxNewSites: 10 });
    expect(roadSummary.targets).toBe(1);
    expect(roadSummary.created).toBeGreaterThan(0);
  });

  it('tolerates partial controller fixtures with missing coordinates', () => {
    const partialController = {
      id: 'controller-partial',
      level: 2,
      pos: mockPos(undefined, undefined),
    } as StructureController;
    const fixture = mockRoomFixture({ controller: partialController, sources: [mockSource('source1', 16, 10)] });
    installGame(fixture);

    expect(() => planRcl2Extensions(fixture.room)).not.toThrow();
    expect(() => planEarlyRoads(fixture.room, { maxNewSites: 10 })).not.toThrow();
  });
});
