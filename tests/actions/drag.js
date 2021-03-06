import test from '../test';
import * as helpers from '../helpers';
import interactions from '@interactjs/core/interactions';
import drag from '@interactjs/actions/drag';
import pointerUtils from '@interactjs/utils/pointerUtils';
import { extend } from '@interactjs/utils';


test('drag action init', t => {
  const scope = helpers.mockScope();

  drag.init(scope);

  t.ok(scope.actions.names.includes('drag'), '"drag" in actions.names');
  t.equal(scope.actions.methodDict.drag, 'draggable');
  t.equal(typeof scope.Interactable.prototype.draggable, 'function');

  t.end();
});

test('Interactable.draggable method', t => {
  const interactable = {
    options: {
      drag: {},
    },
    draggable: drag.draggable,
    setPerAction: () => calledSetPerAction = true,
    setOnEvents: () => calledSetOnEvents = true,
  };
  let calledSetPerAction = false;
  let calledSetOnEvents = false;

  t.equal(interactable.draggable(), interactable.options.drag,
    'interactable.draggable() returns interactable.options.drag object');

  interactable.draggable(true);
  t.ok(interactable.options.drag.enabled,
    'calling `interactable.draggable(true)` enables dragging');

  interactable.draggable(false);
  t.notOk(interactable.options.drag.enabled,
    'calling `interactable.draggable(false)` disables dragging');

  interactable.draggable({});
  t.ok(interactable.options.drag.enabled,
    'calling `interactable.draggable({})` enables dragging');
  t.ok(calledSetOnEvents,
    'calling `interactable.draggable({})` calls this.setOnEvents');
  t.ok(calledSetPerAction,
    'calling `interactable.draggable({})` calls this.setPerAction');


  interactable.draggable({ enabled: false });
  t.notOk(interactable.options.drag.enabled,
    'calling `interactable.draggable({ enabled: false })` disables dragging');

  const axisSettings = {
    lockAxis: ['x', 'y', 'xy', 'start'],
    startAxis: ['x', 'y', 'xy'],
  };

  for (const axis in axisSettings) {
    for (let i = 0; i < axisSettings[axis].length; i++) {
      const options = {};
      const value = axisSettings[axis][i];

      options[axis] = value;

      interactable.draggable(options);
      t.equal(interactable.options.drag[axis], value,
        '`' + axis + ': "' + value + '"` is set correctly');

      delete interactable.options.drag[axis];
    }
  }

  t.end();
});

test('drag axis', t => {
  const scope = helpers.mockScope();

  interactions.init(scope);
  drag.init(scope);

  const interaction = scope.interactions.new({});
  const element = {};
  const interactable = {
    options: {
      drag: {},
    },
    target: element,
  };
  const iEvent = { page: {}, client: {}, delta: {}, type: 'dragmove' };

  const opposites = { x: 'y', y: 'x' };
  const eventCoords = {
    page: { x: -1, y: -2 },
    client: { x: -3, y: -4 },
    delta: { x: -5, y: -6 },
  };
  const startPage   = { x: 0, y: 1 };
  const startClient = { x: 2, y: 3 };
  const deltaPage   = { x: 4, y: 5,  vx: 6,  vy: 7,  speed: 8  };
  const deltaClient = { x: 9, y: 10, vx: 11, vy: 12, speed: 13 };

  resetCoords();
  interaction.prepared = { name: 'drag', axis: 'xy' };
  interaction.target = interactable;

  const coords = helpers.newCoordsSet();
  for (const prop in coords) {
    interaction[prop + 'Coords'] = coords[prop];
  }

  t.test('xy (any direction)', tt => {
    scope.interactions.signals.fire('before-action-move', { interaction });

    tt.deepEqual(interaction.startCoords.page, startPage,
      'startCoords.page is not modified');
    tt.deepEqual(interaction.startCoords.client, startClient,
      'startCoords.client is not modified');
    tt.deepEqual(interaction.pointerDelta.page, deltaPage,
      'pointerDelta.page is not modified');
    tt.deepEqual(interaction.pointerDelta.client, deltaClient,
      'pointerDelta.client is not modified');

    scope.interactions.signals.fire('action-move', { iEvent, interaction });

    tt.deepEqual(iEvent.page, eventCoords.page, 'page coords are not modified');
    tt.deepEqual(iEvent.delta, eventCoords.delta, 'delta is not modified');

    tt.end();
  });

  for (const axis in opposites) {
    const opposite = opposites[axis];

    t.test(axis + '-axis', tt => {

      resetCoords();
      interaction.prepared.axis = axis;

      scope.interactions.signals.fire('action-move', { iEvent, interaction });

      tt.deepEqual(
        iEvent.delta,
        {
          [opposite]: 0,
          [axis]: eventCoords.delta[axis],
        },
        `opposite axis (${opposite}) delta is 0; target axis (${axis}) delta is not modified`);

      tt.deepEqual(
        iEvent.page,
        {
          [opposite]: startPage[opposite],
          [axis]: eventCoords.page[axis],
        },
        `page.${opposite} is startCoords value`
      );

      tt.equal(
        iEvent.page[axis],
        eventCoords.page[axis],
        `page.${axis} is not modified`
      );

      tt.equal(
        iEvent.client[opposite],
        startClient[opposite],
        `client.${opposite} is startCoords value`
      );
      tt.equal(
        iEvent.client[axis],
        eventCoords.client[axis],
        `client.${axis} is not modified`
      );

      tt.end();
    });
  }

  t.end();

  function resetCoords () {
    pointerUtils.copyCoords(iEvent, eventCoords);
    extend(iEvent.delta, eventCoords.delta);

    extend(interaction.startCoords.page  , startPage);
    extend(interaction.startCoords.client, startClient);

    extend(interaction.pointerDelta.page  , deltaPage);
    extend(interaction.pointerDelta.client, deltaClient);
  }

});
