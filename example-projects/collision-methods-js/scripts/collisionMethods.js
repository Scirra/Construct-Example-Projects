
// Some useful collision handling methods. This script can be copied to another
// project and imported to easily make use of the same methods.

// Push 'moveInst' out of 'obstacleInst' at the given angle (in radians).
// Returns true if it pushed out successfully, otherwise false.
export function PushOutAngle(moveInst, obstacleInst, angle, stepDist = 1, maxDist = 500)
{
	// Convert the angle to a vector and call the vector method.
	const vecX = Math.cos(angle);
	const vecY = Math.sin(angle);
	
	return PushOutVector(moveInst, obstacleInst, vecX, vecY, stepDist, maxDist);
}

// Push 'moveInst' out of 'obstacleInst' along the given vector. The vector is
// assumed to be a unit vector, and it is multiplied by stepDist to alter how
// far 'moveInst' is stepped every iteration.
// Returns true if it pushed out successfully, otherwise false.
export function PushOutVector(moveInst, obstacleInst, vecX, vecY, stepDist = 1, maxDist = 500)
{
	// Save the starting position.
	const [startX, startY] = moveInst.getPosition();
	
	// Repeat up to the maximum distance, incrementing by the step distance.
	for (let i = 0; i < maxDist; i += stepDist)
	{
		// Set the position to an increasing distance along the given vector
		// from the starting position, each time testing if the instance
		// is no longer overlapping the specified obstacle.
		moveInst.setPosition(startX + (vecX * i), startY + (vecY * i));

		// If it is no longer overlapping, return true to indicate pushing
		// out was successful.
		if (!moveInst.testOverlap(obstacleInst))
			return true;
	}
	
	// Failed to push out: restore start position and return false.
	moveInst.setPosition(startX, startY);
	return false;
}

// Push 'inst' out of any solid at the given angle (in radians).
// Returns true if it pushed out successfully, otherwise false.
export function PushOutSolidAngle(inst, angle, stepDist = 1, maxDist = 500)
{
	// Convert the angle to a vector and call the vector method.
	const vecX = Math.cos(angle);
	const vecY = Math.sin(angle);
	
	return PushOutSolidVector(inst, vecX, vecY, stepDist, maxDist);
}

// Push 'inst' out of any solid along the given vector. The vector is
// assumed to be a unit vector, and it is multiplied by stepDist to alter how
// far 'inst' is stepped every iteration.
// Note that maxDist is applied individually to each solid encountered, so the
// total distance pushed could be greater.
// Returns true if it pushed out successfully, otherwise false.
export function PushOutSolidVector(inst, vecX, vecY, stepDist = 1, maxDist = 500)
{
	// Repeat until not overlapping a solid.
	while (true)
	{
		// Test if overlapping any solid.
		const solidInst = inst.testOverlapSolid();
		
		// Not overlapping a solid: pushing out has been successful,
		// so return true.
		if (!solidInst)
			return true;
		
		// Currently overlapping a solid. Attempt to push out of the
		// solid along the given vector. If this fails, then return
		// false from this method too to indicate failure. If it succeeds,
		// then it will repeat this loop and check if it is now overlapping
		// a different solid.
		if (!PushOutVector(inst, solidInst, vecX, vecY, stepDist, maxDist))
			return false;
	}
}