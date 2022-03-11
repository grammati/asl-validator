function transitionValidator(definition) {
  // retrieve all states
  const machineStates = Object.keys(definition.States);

  // retrieve all reachable states
  const states = Object.values(definition.States);
  const choiceStates = states.filter((state) => state.Type === 'Choice');
  const choiceNexts = choiceStates
    .flatMap((state) => state.Choices)
    .map((choice) => choice.Next);
  const choiceDefaults = choiceStates.map((state) => state.Default);
  const catchNexts = states
    .flatMap((state) => state.Catch || [])
    .map((_catch) => _catch.Next);
  const nexts = states.map((state) => state.Next);
  const startAt = definition.StartAt;
  const allTargets = [startAt, ...choiceNexts, ...choiceDefaults, ...catchNexts, ...nexts];
  const reachableStates = allTargets.filter((path) => typeof path === 'string');

  // check if all states are reachable
  const unreachable = machineStates.filter((state) => reachableStates.indexOf(state) === -1)
    .map((state) => ({
      'Error code': 'MISSING_TRANSITION_TARGET',
      Message: `State ${state} is not reachable`,
    }));

  // check if all 'Next', 'StartAt' and 'Default' states exist
  const inexistant = reachableStates.filter((state) => machineStates.indexOf(state) === -1)
    .map((state) => ({
      'Error code': 'MISSING_TRANSITION_TARGET',
      Message: `Missing 'StartAt'|'Next'|'Default' target: ${state}`,
    }));

  // check all nested, self-contained state machines
  const iterators = states
    .filter((state) => state.Type === 'Map')
    .map((state) => state.Iterator)
    .filter((iterator) => iterator !== undefined);
  const branches = states
    .filter((state) => state.Type === 'Parallel')
    .flatMap((state) => state.Branches || []);

  return unreachable
    .concat(inexistant)
    .concat(iterators.flatMap(transitionValidator))
    .concat(branches.flatMap(transitionValidator));
}

module.exports = transitionValidator;
