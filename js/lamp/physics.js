/** Original coupled-pendulum equations. No DOM or browser APIs. */
export function stepPendulum(state, dt) {
  const gravity = 2100;
  const cordLength = state.length;
  const glassOffset = state.massOffset;
  const socketMass = 0.75;
  const bodyInertia = 0.45;
  const difference = state.angle - state.tilt;
  // Two coupled pendulums: the socket has mass, and the rigid bulb has
  // rotational inertia around it. This keeps the top from moving freely.
  const cordMoment = (1 + socketMass) * cordLength ** 2;
  const coupling = cordLength * glassOffset * Math.cos(difference);
  const bulbMoment = (1 + bodyInertia) * glassOffset ** 2;
  const determinant = cordMoment * bulbMoment - coupling ** 2;
  const cordForce =
    -(1 + socketMass) * gravity * cordLength * Math.sin(state.angle) -
    cordLength * glassOffset * Math.sin(difference) * state.tiltVelocity ** 2 -
    cordMoment * 2.5 * state.angularVelocity;
  const bulbForce =
    -gravity * glassOffset * Math.sin(state.tilt) +
    cordLength * glassOffset * Math.sin(difference) * state.angularVelocity ** 2 -
    bulbMoment * 3.6 * state.tiltVelocity;
  const cordAcceleration = (cordForce * bulbMoment - bulbForce * coupling) / determinant;
  const bulbAcceleration = (bulbForce * cordMoment - cordForce * coupling) / determinant;
  state.angularVelocity += cordAcceleration * dt;
  state.tiltVelocity += bulbAcceleration * dt;
  state.angle += state.angularVelocity * dt;
  state.tilt += state.tiltVelocity * dt;
}
