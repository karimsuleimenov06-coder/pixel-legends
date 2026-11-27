// Base physics entity (position, gravity, health, knockback) shared by the player and enemies.
window.PL = window.PL || {};

PL.GRAVITY = 1500;

PL.Entity = class Entity {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.hp = 100; this.maxHp = 100;
    this.alive = true;
    this.invulnTimer = 0;
    this.hitFlash = 0;
    this.knockTimer = 0;
  }

  rect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }

  applyPhysics(dt, world) {
    this.vy += PL.GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const groundY = world.groundY;
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    const half = this.w / 2;
    this.x = PL.U.clamp(this.x, half, world.width - half);
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.knockTimer > 0) this.knockTimer -= dt;
  }

  isInvuln() { return this.invulnTimer > 0; }

  takeDamage(amount, opts) {
    opts = opts || {};
    if (!this.alive || (this.isInvuln() && !opts.ignoreInvuln)) return false;
    this.hp -= amount;
    this.hitFlash = 0.16;
    if (opts.knockback) {
      this.vx = opts.knockback * (opts.fromRight ? -1 : 1);
      this.vy = opts.knockUp || -260;
      this.knockTimer = 0.22;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.die(opts);
    }
    return true;
  }

  die() {}
};

// ---------------- Name tags ----------------
PL.Rig = {
  drawNameTag(ctx, cx, groundY, topOffset, text, color) {
    const img = PL.Pixel.text(text, color || '#ffe9a0');
    ctx.drawImage(img, Math.round(cx - img.width / 2), Math.round(groundY - topOffset - img.height));
  }
};
