import type {
  LifespanExtensionState,
  AlchemyState,
  BloodlineState,
  KarmaState,
  SanctuaryState,
  LongevityTechnique,
  BloodlineType,
  KarmaAction,
} from '../types/lifespan';
import {
  HERB_MATERIALS,
  PILL_FORMULAS,
  LONGEVITY_TECHNIQUES,
  KARMA_ACTIONS,
  LIFESPAN_TREASURES,
  SANCTARY_UPGRADES,
  ALCHEMY_LEVEL_CONFIG,
  BLOODLINE_ABILITIES,
} from '../data/lifespanData';

// ==========================================
// 初始状态工厂函数
// ==========================================

export function createInitialLifespanState(baseLifespan: number): LifespanExtensionState {
  return {
    baseLifespan,
    currentLifespan: baseLifespan,
    totalExtensions: 0,
    extensionsBySource: {
      alchemy: 0,
      techniques: 0,
      karma: 0,
      bloodline: 0,
      sanctuary: 0,
      treasures: 0,
    },
    alchemy: createInitialAlchemyState(),
    techniques: createInitialTechniques(),
    karma: createInitialKarmaState(),
    bloodline: createInitialBloodlineState(),
    sanctuary: createInitialSanctuaryState(),
    treasures: createInitialTreasures(),
    lifespanHistory: [],
  };
}

function createInitialAlchemyState(): AlchemyState {
  return {
    level: 1,
    exp: 0,
    expToNext: 100,
    masteredFormulas: ['bu_shou_dan', 'yang_shen_wan'],
    craftingHistory: [],
    furnaceTier: 1,
  };
}

function createInitialTechniques(): LongevityTechnique[] {
  return LONGEVITY_TECHNIQUES.map((t) => ({ ...t }));
}

function createInitialKarmaState(): KarmaState {
  return {
    totalKarma: 0,
    goodDeeds: 0,
    evilDeeds: 0,
    karmaLevel: '凡人',
    accumulatedMerit: 0,
    lifespanFromKarma: 0,
    availableActions: ['charity', 'heal_sick', 'bully_weak'],
    actionCooldowns: {},
  };
}

function createInitialBloodlineState(): BloodlineState {
  return {
    type: null,
    name: '普通血脉',
    purity: 0,
    maxPurity: 100,
    awakeningLevel: 0,
    abilities: [],
    isInherited: false,
    parentBloodline: null,
    lifespanBonus: 0,
  };
}

function createInitialSanctuaryState(): SanctuaryState {
  return {
    level: 0,
    name: '未建立',
    spiritualEnergy: 0,
    maxSpiritualEnergy: 100,
    lifespanRegenPerYear: 0,
    herbGrowthRate: 0,
    cultivationSpeedBonus: 0,
    upgrades: SANCTARY_UPGRADES.map((u) => ({ ...u })),
    isEstablished: false,
  };
}

function createInitialTreasures() {
  return LIFESPAN_TREASURES.map((t) => ({ ...t }));
}

// ==========================================
// 炼丹系统
// ==========================================

export function craftPill(
  state: LifespanExtensionState,
  formulaId: string,
  herbInventory: Record<string, number>
): { success: boolean; newState: LifespanExtensionState; message: string; lifespanGain: number } {
  const formula = PILL_FORMULAS.find((f) => f.id === formulaId);
  if (!formula) {
    return { success: false, newState: state, message: '丹方不存在', lifespanGain: 0 };
  }

  if (!state.alchemy.masteredFormulas.includes(formulaId)) {
    return { success: false, newState: state, message: '尚未掌握此丹方', lifespanGain: 0 };
  }

  if (state.alchemy.level < formula.requiredAlchemyLevel) {
    return { success: false, newState: state, message: `炼丹等级不足，需要${formula.requiredAlchemyLevel}级`, lifespanGain: 0 };
  }

  for (const req of formula.requiredMaterials) {
    const available = herbInventory[req.herbId] || 0;
    if (available < req.count) {
      const herb = HERB_MATERIALS.find((h) => h.id === req.herbId);
      return {
        success: false,
        newState: state,
        message: `材料不足：需要${req.count}个${herb?.name || req.herbId}`,
        lifespanGain: 0,
      };
    }
  }

  const success = Math.random() < formula.successRate;
  const newState = { ...state };
  const alchemy = { ...state.alchemy };

  if (success) {
    const qualityRoll = Math.random();
    let quality: 'low' | 'normal' | 'high' | 'perfect';
    let qualityMultiplier: number;

    if (qualityRoll < 0.1) {
      quality = 'perfect';
      qualityMultiplier = 2.0;
    } else if (qualityRoll < 0.3) {
      quality = 'high';
      qualityMultiplier = 1.5;
    } else if (qualityRoll < 0.7) {
      quality = 'normal';
      qualityMultiplier = 1.0;
    } else {
      quality = 'low';
      qualityMultiplier = 0.5;
    }

    const lifespanGain = Math.floor(formula.lifespanExtension * qualityMultiplier);

    alchemy.craftingHistory = [
      ...alchemy.craftingHistory,
      {
        formulaId,
        name: formula.name,
        quality,
        lifespanExtension: lifespanGain,
        craftedAt: Date.now(),
      },
    ];

    const expGain = formula.grade * 20 * qualityMultiplier;
    alchemy.exp += Math.floor(expGain);

    const currentLevelConfig = ALCHEMY_LEVEL_CONFIG.find((c) => c.level === alchemy.level);
    if (currentLevelConfig && alchemy.exp >= currentLevelConfig.expToNext) {
      alchemy.level += 1;
      alchemy.exp -= currentLevelConfig.expToNext;
      const nextLevelConfig = ALCHEMY_LEVEL_CONFIG.find((c) => c.level === alchemy.level);
      alchemy.expToNext = nextLevelConfig?.expToNext || alchemy.expToNext * 2;

      const newFormulas = PILL_FORMULAS.filter(
        (f) => f.requiredAlchemyLevel === alchemy.level && !alchemy.masteredFormulas.includes(f.id)
      );
      alchemy.masteredFormulas = [
        ...alchemy.masteredFormulas,
        ...newFormulas.map((f) => f.id),
      ];
    }

    newState.alchemy = alchemy;
    newState.currentLifespan += lifespanGain;
    newState.totalExtensions += lifespanGain;
    newState.extensionsBySource.alchemy += lifespanGain;

    newState.lifespanHistory = [
      ...newState.lifespanHistory,
      {
        age: 0,
        previousLifespan: state.currentLifespan,
        newLifespan: newState.currentLifespan,
        source: '炼丹',
        detail: `炼制${quality === 'perfect' ? '完美' : quality === 'high' ? '优质' : quality === 'normal' ? '普通' : '劣质'}${formula.name}`,
        timestamp: Date.now(),
      },
    ];

    return {
      success: true,
      newState,
      message: `炼丹成功！获得${lifespanGain}年寿元`,
      lifespanGain,
    };
  } else {
    alchemy.exp += formula.grade * 5;
    newState.alchemy = alchemy;

    const lifespanLoss = Math.floor(formula.lifespanExtension * 0.1);
    newState.currentLifespan = Math.max(state.baseLifespan, newState.currentLifespan - lifespanLoss);

    return {
      success: false,
      newState,
      message: `炼丹失败！损失${lifespanLoss}年寿元`,
      lifespanGain: -lifespanLoss,
    };
  }
}

// ==========================================
// 养生功法系统
// ==========================================

export function cultivateTechnique(
  state: LifespanExtensionState,
  techniqueId: string,
  gold: number
): { success: boolean; newState: LifespanExtensionState; message: string; lifespanGain: number } {
  const techniqueIndex = state.techniques.findIndex((t) => t.id === techniqueId);
  if (techniqueIndex === -1) {
    return { success: false, newState: state, message: '功法不存在', lifespanGain: 0 };
  }

  const technique = { ...state.techniques[techniqueIndex] };

  if (!technique.isLearned) {
    if (technique.learnRequirements.gold && gold < technique.learnRequirements.gold) {
      return { success: false, newState: state, message: `金币不足，需要${technique.learnRequirements.gold}`, lifespanGain: 0 };
    }
    technique.isLearned = true;
    technique.isActive = true;
  }

  if (technique.currentLevel >= technique.maxLevel) {
    return { success: false, newState: state, message: '功法已满级', lifespanGain: 0 };
  }

  const cost = technique.cultivationCost * (technique.currentLevel + 1);
  if (gold < cost) {
    return { success: false, newState: state, message: `修炼需要${cost}金币`, lifespanGain: 0 };
  }

  const oldBonus = technique.currentLevel * technique.lifespanBonusPerLevel;
  technique.currentLevel += 1;
  const newBonus = technique.currentLevel * technique.lifespanBonusPerLevel;
  const lifespanGain = newBonus - oldBonus;

  const newState = { ...state };
  newState.techniques = [...state.techniques];
  newState.techniques[techniqueIndex] = technique;
  newState.currentLifespan += lifespanGain;
  newState.totalExtensions += lifespanGain;
  newState.extensionsBySource.techniques += lifespanGain;

  newState.lifespanHistory = [
    ...newState.lifespanHistory,
    {
      age: 0,
      previousLifespan: state.currentLifespan,
      newLifespan: newState.currentLifespan,
      source: '功法',
      detail: `${technique.name}提升至${technique.currentLevel}层`,
      timestamp: Date.now(),
    },
  ];

  return {
    success: true,
    newState,
    message: `${technique.name}提升至${technique.currentLevel}层，寿元+${lifespanGain}`,
    lifespanGain,
  };
}

export function getActiveTechniquesLifespanBonus(state: LifespanExtensionState): number {
  return state.techniques
    .filter((t) => t.isLearned && t.isActive)
    .reduce((sum, t) => sum + t.currentLevel * t.lifespanBonusPerLevel, 0);
}

// ==========================================
// 因果功德系统
// ==========================================

export function performKarmaAction(
  state: LifespanExtensionState,
  actionId: string,
  currentAge: number
): { success: boolean; newState: LifespanExtensionState; message: string; attributeChanges: Record<string, number> } {
  const action = KARMA_ACTIONS.find((a) => a.id === actionId);
  if (!action) {
    return { success: false, newState: state, message: '行为不存在', attributeChanges: {} };
  }

  if (currentAge < action.availableAtAge) {
    return { success: false, newState: state, message: `需要年龄达到${action.availableAtAge}岁`, attributeChanges: {} };
  }

  const cooldownKey = `${actionId}_cooldown`;
  const remainingCooldown = state.karma.actionCooldowns[cooldownKey] || 0;
  if (remainingCooldown > 0) {
    return { success: false, newState: state, message: `冷却中，还需${remainingCooldown}年`, attributeChanges: {} };
  }

  const newState = { ...state };
  const karma = { ...state.karma };

  karma.totalKarma += action.karmaChange;
  karma.actionCooldowns = { ...karma.actionCooldowns, [cooldownKey]: action.cooldown };

  if (action.type === 'good') {
    karma.goodDeeds += 1;
    karma.accumulatedMerit += action.karmaChange;
  } else if (action.type === 'evil') {
    karma.evilDeeds += 1;
  }

  if (karma.totalKarma >= 200) {
    karma.karmaLevel = '圣人';
  } else if (karma.totalKarma >= 100) {
    karma.karmaLevel = '贤者';
  } else if (karma.totalKarma >= 50) {
    karma.karmaLevel = '善人';
  } else if (karma.totalKarma >= 0) {
    karma.karmaLevel = '凡人';
  } else if (karma.totalKarma >= -50) {
    karma.karmaLevel = '小人';
  } else {
    karma.karmaLevel = '恶人';
  }

  if (action.lifespanChange !== 0) {
    newState.currentLifespan = Math.max(0, newState.currentLifespan + action.lifespanChange);
    if (action.lifespanChange > 0) {
      newState.totalExtensions += action.lifespanChange;
      newState.extensionsBySource.karma += action.lifespanChange;
      karma.lifespanFromKarma += action.lifespanChange;
    }

    newState.lifespanHistory = [
      ...newState.lifespanHistory,
      {
        age: currentAge,
        previousLifespan: state.currentLifespan,
        newLifespan: newState.currentLifespan,
        source: '功德',
        detail: `${action.name} (${action.type === 'good' ? '善行' : action.type === 'evil' ? '恶行' : '中立'})`,
        timestamp: Date.now(),
      },
    ];
  }

  newState.karma = karma;

  return {
    success: true,
    newState,
    message: `${action.name}完成，功德${action.karmaChange > 0 ? '+' : ''}${action.karmaChange}`,
    attributeChanges: action.attributeChanges,
  };
}

export function getKarmaLifespanBonus(karma: KarmaState): number {
  if (karma.accumulatedMerit >= 200) {
    return Math.floor(karma.accumulatedMerit / 20);
  } else if (karma.accumulatedMerit >= 50) {
    return Math.floor(karma.accumulatedMerit / 50);
  }
  return 0;
}

// ==========================================
// 血脉系统
// ==========================================

export function awakenBloodline(
  state: LifespanExtensionState,
  bloodlineType: BloodlineType
): { success: boolean; newState: LifespanExtensionState; message: string } {
  if (state.bloodline.type !== null) {
    return { success: false, newState: state, message: '已有觉醒的血脉' };
  }

  const abilities = BLOODLINE_ABILITIES[bloodlineType];
  if (!abilities) {
    return { success: false, newState: state, message: '血脉类型不存在' };
  }

  const newState = { ...state };
  newState.bloodline = {
    type: bloodlineType,
    name: getBloodlineName(bloodlineType),
    purity: 10,
    maxPurity: 100,
    awakeningLevel: 1,
    abilities: abilities.map((a) => ({ ...a })),
    isInherited: false,
    parentBloodline: null,
    lifespanBonus: 0,
  };

  return {
    success: true,
    newState,
    message: `成功觉醒${getBloodlineName(bloodlineType)}血脉！`,
  };
}

export function purifyBloodline(
  state: LifespanExtensionState,
  purityPoints: number
): { success: boolean; newState: LifespanExtensionState; message: string; lifespanGain: number } {
  if (state.bloodline.type === null) {
    return { success: false, newState: state, message: '没有觉醒的血脉', lifespanGain: 0 };
  }

  const newState = { ...state };
  const bloodline = { ...state.bloodline };
  bloodline.abilities = state.bloodline.abilities.map((a) => ({ ...a }));

  const oldPurity = bloodline.purity;
  bloodline.purity = Math.min(bloodline.maxPurity, bloodline.purity + purityPoints);

  let lifespanGain = 0;
  for (const ability of bloodline.abilities) {
    if (!ability.isActive && bloodline.purity >= ability.unlockAtPurity && oldPurity < ability.unlockAtPurity) {
      ability.isActive = true;
      if (ability.effect.type === 'lifespan') {
        lifespanGain += ability.effect.value;
      }
    }
  }

  if (lifespanGain > 0) {
    bloodline.lifespanBonus += lifespanGain;
    newState.currentLifespan += lifespanGain;
    newState.totalExtensions += lifespanGain;
    newState.extensionsBySource.bloodline += lifespanGain;

    newState.lifespanHistory = [
      ...newState.lifespanHistory,
      {
        age: 0,
        previousLifespan: state.currentLifespan,
        newLifespan: newState.currentLifespan,
        source: '血脉',
        detail: `${bloodline.name}纯度提升至${bloodline.purity}%`,
        timestamp: Date.now(),
      },
    ];
  }

  newState.bloodline = bloodline;

  return {
    success: true,
    newState,
    message: `${bloodline.name}纯度提升至${bloodline.purity}%`,
    lifespanGain,
  };
}

function getBloodlineName(type: BloodlineType): string {
  const names: Record<BloodlineType, string> = {
    dragon: '真龙血脉',
    phoenix: '凤凰血脉',
    turtle: '玄武血脉',
    tiger: '白虎血脉',
    void: '虚空血脉',
    celestial: '天仙血脉',
  };
  return names[type];
}

// ==========================================
// 洞天福地系统
// ==========================================

export function establishSanctuary(
  state: LifespanExtensionState,
  gold: number
): { success: boolean; newState: LifespanExtensionState; message: string } {
  if (state.sanctuary.isEstablished) {
    return { success: false, newState: state, message: '已有洞天福地' };
  }

  const cost = 500;
  if (gold < cost) {
    return { success: false, newState: state, message: `需要${cost}金币建立洞天福地` };
  }

  const newState = { ...state };
  newState.sanctuary = {
    ...state.sanctuary,
    level: 1,
    name: '初窥门径',
    spiritualEnergy: 50,
    maxSpiritualEnergy: 100,
    lifespanRegenPerYear: 0,
    herbGrowthRate: 0,
    cultivationSpeedBonus: 0,
    isEstablished: true,
  };

  return {
    success: true,
    newState,
    message: '成功建立洞天福地！',
  };
}

export function purchaseSanctuaryUpgrade(
  state: LifespanExtensionState,
  upgradeId: string,
  gold: number
): { success: boolean; newState: LifespanExtensionState; message: string; lifespanGain: number } {
  if (!state.sanctuary.isEstablished) {
    return { success: false, newState: state, message: '需要先建立洞天福地', lifespanGain: 0 };
  }

  const upgradeIndex = state.sanctuary.upgrades.findIndex((u) => u.id === upgradeId);
  if (upgradeIndex === -1) {
    return { success: false, newState: state, message: '升级项目不存在', lifespanGain: 0 };
  }

  const upgrade = state.sanctuary.upgrades[upgradeIndex];
  if (upgrade.isPurchased) {
    return { success: false, newState: state, message: '已购买此升级', lifespanGain: 0 };
  }

  if (upgrade.requiredUpgrade) {
    const required = state.sanctuary.upgrades.find((u) => u.id === upgrade.requiredUpgrade);
    if (!required?.isPurchased) {
      return { success: false, newState: state, message: '需要先购买前置升级', lifespanGain: 0 };
    }
  }

  if (gold < upgrade.cost) {
    return { success: false, newState: state, message: `金币不足，需要${upgrade.cost}`, lifespanGain: 0 };
  }

  const newState = { ...state };
  const sanctuary = { ...state.sanctuary };
  sanctuary.upgrades = [...state.sanctuary.upgrades];
  sanctuary.upgrades[upgradeIndex] = { ...upgrade, isPurchased: true };

  let lifespanGain = 0;
  if (upgrade.effect.type === 'lifespan_regen') {
    sanctuary.lifespanRegenPerYear += upgrade.effect.value;
    lifespanGain = upgrade.effect.value;
  } else if (upgrade.effect.type === 'herb_growth') {
    sanctuary.herbGrowthRate += upgrade.effect.value;
  } else if (upgrade.effect.type === 'cultivation_speed') {
    sanctuary.cultivationSpeedBonus += upgrade.effect.value;
  }

  if (lifespanGain > 0) {
    newState.currentLifespan += lifespanGain;
    newState.totalExtensions += lifespanGain;
    newState.extensionsBySource.sanctuary += lifespanGain;
  }

  sanctuary.level = sanctuary.upgrades.filter((u) => u.isPurchased).length;

  newState.sanctuary = sanctuary;

  return {
    success: true,
    newState,
    message: `成功升级：${upgrade.name}`,
    lifespanGain,
  };
}

// ==========================================
// 宝物系统
// ==========================================

export function activateTreasure(
  state: LifespanExtensionState,
  treasureId: string,
  currentAge: number,
  currentRealm: string,
  currentKarma: number,
  currentGold: number,
  herbInventory: Record<string, number>
): { success: boolean; newState: LifespanExtensionState; message: string; lifespanGain: number } {
  const treasureIndex = state.treasures.findIndex((t) => t.id === treasureId);
  if (treasureIndex === -1) {
    return { success: false, newState: state, message: '宝物不存在', lifespanGain: 0 };
  }

  const treasure = state.treasures[treasureIndex];
  if (treasure.isActivated) {
    return { success: false, newState: state, message: '宝物已激活', lifespanGain: 0 };
  }

  if (currentAge < treasure.activationAge) {
    return { success: false, newState: state, message: `需要年龄达到${treasure.activationAge}岁`, lifespanGain: 0 };
  }

  const req = treasure.activationRequirements;
  if (req.realm && currentRealm !== req.realm) {
    return { success: false, newState: state, message: `需要${req.realm}境界`, lifespanGain: 0 };
  }
  if (req.karma && currentKarma < req.karma) {
    return { success: false, newState: state, message: `需要功德值${req.karma}`, lifespanGain: 0 };
  }
  if (req.gold && currentGold < req.gold) {
    return { success: false, newState: state, message: `需要${req.gold}金币`, lifespanGain: 0 };
  }
  if (req.herbs) {
    for (const herbId of req.herbs) {
      if (!herbInventory[herbId]) {
        const herb = HERB_MATERIALS.find((h) => h.id === herbId);
        return { success: false, newState: state, message: `需要${herb?.name || herbId}`, lifespanGain: 0 };
      }
    }
  }

  const newState = { ...state };
  newState.treasures = [...state.treasures];
  newState.treasures[treasureIndex] = { ...treasure, isActivated: true };

  newState.currentLifespan += treasure.lifespanExtension;
  newState.totalExtensions += treasure.lifespanExtension;
  newState.extensionsBySource.treasures += treasure.lifespanExtension;

  newState.lifespanHistory = [
    ...newState.lifespanHistory,
    {
      age: currentAge,
      previousLifespan: state.currentLifespan,
      newLifespan: newState.currentLifespan,
      source: '宝物',
      detail: `激活${treasure.name}`,
      timestamp: Date.now(),
    },
  ];

  return {
    success: true,
    newState,
    message: `成功激活${treasure.name}！寿元+${treasure.lifespanExtension}`,
    lifespanGain: treasure.lifespanExtension,
  };
}

// ==========================================
// 综合计算
// ==========================================

export function calculateTotalLifespanBonus(state: LifespanExtensionState): number {
  const techniqueBonus = getActiveTechniquesLifespanBonus(state);
  const karmaBonus = getKarmaLifespanBonus(state.karma);
  const bloodlineBonus = state.bloodline.lifespanBonus;
  const sanctuaryBonus = state.sanctuary.lifespanRegenPerYear;
  const treasureBonus = state.treasures
    .filter((t) => t.isActivated)
    .reduce((sum, t) => sum + t.lifespanExtension, 0);

  return techniqueBonus + karmaBonus + bloodlineBonus + sanctuaryBonus + treasureBonus;
}

export function getTotalExtensionsBySource(state: LifespanExtensionState): Record<string, number> {
  return { ...state.extensionsBySource };
}

// ==========================================
// 事件生成
// ==========================================

export interface LifespanEventChoice {
  id: string;
  text: string;
  description: string;
  icon: string;
  canChoose: boolean;
  requirementDescription?: string;
}

export interface LifespanEventData {
  id: string;
  title: string;
  description: string;
  icon: string;
  choices: LifespanEventChoice[];
}

export function generateLifespanEvents(
  state: LifespanExtensionState,
  currentAge: number,
  currentRealm: string,
  _currentKarma: number
): LifespanEventData[] {
  const events: LifespanEventData[] = [];

  const undiscoveredFormula = PILL_FORMULAS.find(
    (f) => !state.alchemy.masteredFormulas.includes(f.id) &&
           f.requiredAlchemyLevel <= state.alchemy.level + 1
  );
  if (undiscoveredFormula && currentAge > 110) {
    events.push({
      id: 'discover_formula',
      title: '发现新丹方',
      description: '你在古籍中发现了新的丹方，是否尝试学习？',
      icon: '📜',
      choices: [
        {
          id: 'learn_formula',
          text: '学习丹方',
          description: `学习${undiscoveredFormula.name}，需要金币${undiscoveredFormula.grade * 50}`,
          icon: '✅',
          canChoose: true,
        },
        {
          id: 'ignore',
          text: '暂时不学',
          description: '继续保留精力修炼',
          icon: '❌',
          canChoose: true,
        },
      ],
    });
  }

  const unlearnedTechnique = state.techniques.find(
    (t) => !t.isLearned && currentRealm === t.requiredRealm
  );
  if (unlearnedTechnique && currentAge > 110) {
    const cost = unlearnedTechnique.learnRequirements.gold || 0;
    events.push({
      id: 'learn_technique',
      title: '获得功法',
      description: `你偶然获得一本功法：${unlearnedTechnique.name}`,
      icon: '📖',
      choices: [
        {
          id: 'learn',
          text: '学习功法',
          description: `花费${cost}金币学习`,
          icon: '✅',
          canChoose: cost > 0,
          requirementDescription: cost > 0 ? `需要${cost}金币` : undefined,
        },
        {
          id: 'sell',
          text: '出售换钱',
          description: '将功法出售换取金币',
          icon: '💰',
          canChoose: true,
        },
      ],
    });
  }

  if (state.bloodline.type === null && currentAge > 130) {
    const bloodlineOptions: BloodlineType[] = ['dragon', 'phoenix', 'turtle', 'tiger', 'void', 'celestial'];
    const availableBloodline = bloodlineOptions[Math.floor(Math.random() * bloodlineOptions.length)];
    events.push({
      id: 'bloodline_awakening',
      title: '血脉觉醒契机',
      description: '你感到体内有一股沉睡的力量在苏醒...',
      icon: '🧬',
      choices: [
        {
          id: 'awaken',
          text: '尝试觉醒',
          description: `觉醒${getBloodlineName(availableBloodline)}`,
          icon: '✨',
          canChoose: true,
        },
        {
          id: 'suppress',
          text: '压制血脉',
          description: '暂时压制，等待更好的时机',
          icon: '🔒',
          canChoose: true,
        },
      ],
    });
  }

  return events;
}

// ==========================================
// 年龄更新
// ==========================================

export function updateKarmaCooldowns(state: LifespanExtensionState): LifespanExtensionState {
  const newState = { ...state };
  const karma = { ...state.karma };
  const newCooldowns: Record<string, number> = {};

  for (const [key, value] of Object.entries(karma.actionCooldowns)) {
    if (value > 1) {
      newCooldowns[key] = value - 1;
    }
  }

  karma.actionCooldowns = newCooldowns;
  newState.karma = karma;

  return newState;
}

export function getAvailableKarmaActions(state: LifespanExtensionState, currentAge: number): KarmaAction[] {
  return KARMA_ACTIONS.filter(
    (a) => currentAge >= a.availableAtAge && !(state.karma.actionCooldowns[`${a.id}_cooldown`] > 0)
  );
}
