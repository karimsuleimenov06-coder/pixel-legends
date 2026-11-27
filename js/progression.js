// Leveling, stat points, skill tree logic, and derived-stat computation for the player.
window.PL = window.PL || {};

PL.Progression = {
  xpToNext(level) { return Math.round(40 * Math.pow(level, 1.5) + 24 * level); },

  xpRewardFor(def) { return def.xp; },

  applyXP(profile, amount) {
    profile.xp += amount;
    let leveledUp = false, levelsGained = 0;
    while (profile.xp >= this.xpToNext(profile.level)) {
      profile.xp -= this.xpToNext(profile.level);
      profile.level++;
      profile.unspentStatPoints += 3;
      profile.unspentSkillPoints += 1;
      leveledUp = true; levelsGained++;
    }
    return { leveledUp, levelsGained, newLevel: profile.level };
  },

  allocateStat(profile, attr) {
    if (profile.unspentStatPoints <= 0) return false;
    if (!(attr in profile.points)) return false;
    profile.points[attr]++;
    profile.unspentStatPoints--;
    return true;
  },

  aggregateSkillEffects(classId, profile) {
    const cls = PL.CLASSES[classId];
    const agg = {
      lightDmg: 0, heavyDmg: 0, maxHp: 0, crit: 0, moveSpeed: 0, energyMax: 0, energyRegen: 0,
      abilityCdQ: 0, abilityCdE: 0, abilityDmgQ: 0, abilityDmgE: 0, abilityRadiusQ: 0, abilityRadiusE: 0,
      lifesteal: 0, allyPower: 0, allyCount: 0
    };
    for (const nodeId of profile.skills) {
      const node = cls.skillTree.find(n => n.id === nodeId);
      if (!node) continue;
      for (const k in node.effect) agg[k] = (agg[k] || 0) + node.effect[k];
    }
    return agg;
  },

  canUnlockSkill(classId, profile, nodeId) {
    const cls = PL.CLASSES[classId];
    const node = cls.skillTree.find(n => n.id === nodeId);
    if (!node) return false;
    if (profile.skills.includes(nodeId)) return false;
    if (profile.unspentSkillPoints < node.cost) return false;
    return node.requires.every(r => profile.skills.includes(r));
  },

  unlockSkill(classId, profile, nodeId) {
    if (!this.canUnlockSkill(classId, profile, nodeId)) return false;
    const cls = PL.CLASSES[classId];
    const node = cls.skillTree.find(n => n.id === nodeId);
    profile.skills.push(nodeId);
    profile.unspentSkillPoints -= node.cost;
    return true;
  },

  computeStats(classId, profile) {
    const cls = PL.CLASSES[classId];
    const base = cls.base, growth = cls.growth, lvl = profile.level;
    const agg = this.aggregateSkillEffects(classId, profile);

    let maxHp = base.hp + growth.hp * (lvl - 1) + profile.points.vit * 8;
    let str = base.str + growth.str * (lvl - 1) + profile.points.str * 1.1;
    let def = base.def + growth.def * (lvl - 1) + profile.points.def * 0.9;
    let spd = base.spd + growth.spd * (lvl - 1) + profile.points.spd * 1.5;
    let crit = base.crit + growth.crit * (lvl - 1) + profile.points.crit * 1.0;
    let energyMax = base.energyMax;
    let energyRegen = base.energyRegen;

    maxHp *= (1 + agg.maxHp);
    spd *= (1 + agg.moveSpeed);
    crit += agg.crit * 100;
    energyMax *= (1 + agg.energyMax);
    energyRegen *= (1 + agg.energyRegen);

    return {
      maxHp: Math.round(maxHp), str, def, spd, crit: Math.min(75, crit),
      energyMax: Math.round(energyMax), energyRegen,
      lightDmgMult: 1 + agg.lightDmg, heavyDmgMult: 1 + agg.heavyDmg,
      lifestealBonus: agg.lifesteal, allyPower: 1 + agg.allyPower, allyCount: 1 + agg.allyCount,
      abilityMods: {
        q: { cdMult: Math.max(0.35, 1 + agg.abilityCdQ), dmgMult: 1 + agg.abilityDmgQ, radiusMult: 1 + agg.abilityRadiusQ },
        e: { cdMult: Math.max(0.35, 1 + agg.abilityCdE), dmgMult: 1 + agg.abilityDmgE, radiusMult: 1 + agg.abilityRadiusE }
      }
    };
  }
};
