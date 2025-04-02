// Level limits
const YMIN = 28;
const YMAX = 152;
const XMIN = 64;
const XMAX = 256;

// Player class
export default class Player {
	constructor(
		body, head, leftArm, rightArm, spr,
		sprl,kUp, kDown, kLeft, kRight, kHit
	) {
		// Body (collider)
		this.body = body
		// Body parts
		this.head = head;
		this.leftArm = leftArm;
		this.rightArm = rightArm;
		// Sprites
		this.spr = spr
		this.sprl = sprl
		// Key bindings
		this.kUp = kUp;
		this.kDown = kDown;
		this.kLeft = kLeft;
		this.kRight = kRight;
		this.kHit = kHit;
		// Can the player hit or get hit now?
		this.canHit = true;
		this.canGetHit = true;
	}
	
	getInput(runtime, keyboard, canFight, other) {
		// Player controls
		
		// If the player cannot fight, ignore
		if (!canFight || !this.canHit || !this.canGetHit) return;
		
		// Check for keypresses and execute the corresponding actions
		if (!keyboard.isKeyDown(this.kHit)) {
			// Move up
			if (keyboard.isKeyDown(this.kUp) && this.canMove("up", other)) {
				this.body.y -= 0.75 * 60 * runtime.dt;
				if (this.spr.animationName != "Walk") this.walkAnim();
			}
			
			// Move down
			if (keyboard.isKeyDown(this.kDown) && this.canMove("down", other)) {
				this.body.y += 0.75 * 60 * runtime.dt;
				if (this.spr.animationName != "Walk") this.walkAnim();
			}
			
			// Move left
			if (keyboard.isKeyDown(this.kLeft) && this.canMove("left", other)) {
				this.body.x -= 0.75 * 60 * runtime.dt;
				if (this.spr.animationName != "Walk") this.walkAnim();
			}
			
			// Move right
			if (keyboard.isKeyDown(this.kRight) && this.canMove("right", other)) {
				this.body.x += 0.75 * 60 * runtime.dt;
				if (this.spr.animationName != "Walk") this.walkAnim();
			}
			
			// If nothing is pressed, set animation to idle
			if (!keyboard.isKeyDown(this.kUp) && !keyboard.isKeyDown(this.kDown) &&
				!keyboard.isKeyDown(this.kLeft) && !keyboard.isKeyDown(this.kRight)) {
				this.spr.setAnimation("Idle");
				this.sprl.setAnimation("Idle");
			}
		// Throw a punch
		} else {
			this.hit(other);
		}
		
	}

	canMove(dir, other) {
		/* This method checks collision between the player and the ring limits
		 * (cond1) and between both players (cond2, cond3 & cond4). The way the
		 * between-players collision works (using "up" as an example) is:
		 *	- cond2 checks if the top part of this player is not overlapping
		 *    with the bottom part of the other player
		 *	- cond3 checks if the bottom part of this player is already past
		 *	  the bottom part of the other player. If so, of course this player
		 *    can move up, since there is no way the other player is above
		 *	- cond4 checks if the players are not overlapping on the x-axis,
		 *    if that is the case, both this player can freely move up.
		 * If any of the above conditions are true, this player can move up.
		 */
		
		if (dir == "up") {
			const cond1 = this.body.y - 16 > YMIN;
			const cond2 = this.body.y - 28 > other.body.y + 28;
			const cond3 = this.body.y + 28 < other.body.y + 28;
			const cond4 = Math.abs(this.body.x - other.body.x) > 31;
			return cond1 && (cond2 || cond3 || cond4);
		}
		if (dir == "down") {
			const cond1 = this.body.y + 16 < YMAX;
			const cond2 = this.body.y + 28 < other.body.y - 28;
			const cond3 = this.body.y - 28 > other.body.y - 28;
			const cond4 = Math.abs(this.body.x - other.body.x) > 31;
			return cond1 && (cond2 || cond3 || cond4);
		}
		if (dir == "left") {
			const cond1 = this.body.x - 16 > XMIN;
			const cond2 = this.body.x - 16 > other.body.x + 16;
			const cond3 = this.body.x + 16 < other.body.x + 16;
			const cond4 = Math.abs(this.body.y - other.body.y) > 54;
			return cond1 && (cond2 || cond3 || cond4);
		}
		if (dir == "right") {
			const cond1 = this.body.x + 16 < XMAX;
			const cond2 = this.body.x + 16 < other.body.x - 16;
			const cond3 = this.body.x - 16 > other.body.x - 16;
			const cond4 = Math.abs(this.body.y - other.body.y) > 54;
			return cond1 && (cond2 || cond3 || cond4);
		}
	}
	
	hit(other) {
		// Throw a punch. The side depends on the position of both players
		
		// Choose closest arm to the other player's face
		let arm;
		
		if (this.body.y < other.body.y && this.body.angle == 0)
			arm = this.rightArm;
		else if (this.body.y < other.body.y && this.body.angle == Math.PI)
			arm = this.leftArm;
		else if (this.body.y > other.body.y && this.body.angle == 0)
			arm = this.leftArm;
		else if (this.body.y > other.body.y && this.body.angle == Math.PI)
			arm = this.rightArm;
		else
			arm = !Math.round(Math.random()) ? this.leftArm : this.rightArm;

 		arm.setAnimation("Hit");
		
		// Set sprites animation and move torso to the top of the layer
		if (arm == this.leftArm) this.spr.setAnimation("LeftHit");
		else this.spr.setAnimation("RightHit");
		this.sprl.setAnimation("Idle");
		this.spr.moveToTop();
		
		// Disable hitting
		this.canHit = false;
		
		// Delay before the player can throw another punch
		setTimeout(() => this.canHit = true, 500);
	}

	checkHit(other) {
		// Check if the player's punch hit something
		
		// Helper constants
		const p1L = this.leftArm;
		const p1R = this.rightArm;
		const p2H = other.head;
		const p2L = other.leftArm;
		const p2R = other.rightArm;
		const p2getHit = other.canGetHit;
		
		// Left arm hit one of the other player arms.
		if (p1L.animationName == "Hit" && p1L.animationFrame > 0 &&
		   (p1L.testOverlap(p2L) || p1L.testOverlap(p2R))) {
			p1L.setAnimation("Retract");
			this.spr.setAnimation("LeftRetract");
			this.sprl.setAnimation("Idle");
			return false;
		}
		
		// Right arm hit one of the other player arms.
		if (p1R.animationName == "Hit" && p1R.animationFrame > 0 &&
		   (p1R.testOverlap(p2L) || p1R.testOverlap(p2R))) {
			p1R.setAnimation("Retract");
			this.spr.setAnimation("RightRetract");
			this.sprl.setAnimation("Idle");
			return false;
		}
		
		// The other player just got punched in the face
		if ((p1L.testOverlap(p2H) && p1L.animationName == "Hit" ||
		     p1R.testOverlap(p2H) && p1R.animationName == "Hit") && p2getHit) {
			other.getHitBy(this);
			return true;
		}
	}
	
	getHitBy(other) {
		/* Get hit by the other player. There's a 50% chance that, when you get
		 * hit, your player will automatically move to a disfavorable position,
		 * so that the other player can connect punches */
		
		// Update canGetHit status and set a timer to update it again
		this.canGetHit = false;
		setTimeout(() => this.canGetHit = true, 400);
		
		// Compute the direction in which the player should move
		const direction = other.body.y < this.body.y ? -1 : 1;
		
		// Set animation based on direction
		if (direction == 1 && this.body.angle == 0)
			this.spr.setAnimation("RightGotHit");
		else if (direction == 1 && this.body.angle == Math.PI)
			this.spr.setAnimation("LeftGotHit");
		else if (direction == -1 && this.body.angle == 0)
			this.spr.setAnimation("LeftGotHit");
		else if (direction == -1 && this.body.angle == Math.PI)
			this.spr.setAnimation("RightGotHit");
			
		this.sprl.setAnimation("Idle");
		
		// Compute how far the player can travel
		let traveldist;
		if (direction == 1) {
			traveldist = Math.min(YMAX - 16, this.body.y + 40);
		} else {
			traveldist = Math.max(YMIN + 16, this.body.y - 40);
		}
		
		// Move the player
		if (Math.round(Math.random())) {
			this.body.behaviors.Tween.startTween(
				"y", traveldist, 0.3, "out-sine"
			);
		}
	}
	
	walkAnim() {
		this.spr.setAnimation("Walk");
		this.sprl.setAnimation("Walk");
	}
}