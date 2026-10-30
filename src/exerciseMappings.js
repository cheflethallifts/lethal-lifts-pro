// ==========================================
// MUSCLE HEAT MAP: DATA DICTIONARY + ENGINE
// ==========================================
// Muscle keys MUST be valid react-body-highlighter names. An unknown key makes
// the library throw during render, which white-screens the whole app.
export const VALID_MUSCLES = [
  'chest', 'front-deltoids', 'back-deltoids', 'triceps', 'biceps', 'forearm',
  'upper-back', 'trapezius', 'lower-back', 'abs', 'obliques',
  'quadriceps', 'hamstring', 'gluteal', 'calves', 'adductor'
];

export const MUSCLE_LABELS = {
  'chest': 'Chest',
  'front-deltoids': 'Front & Side Delts',
  'back-deltoids': 'Rear Delts',
  'triceps': 'Triceps',
  'biceps': 'Biceps',
  'forearm': 'Forearms',
  'upper-back': 'Lats & Upper Back',
  'trapezius': 'Traps',
  'lower-back': 'Lower Back',
  'abs': 'Abs',
  'obliques': 'Obliques',
  'quadriceps': 'Quads',
  'hamstring': 'Hamstrings',
  'gluteal': 'Glutes',
  'calves': 'Calves',
  'adductor': 'Inner & Outer Thigh'
};

// One muscle can be drawn by several polygons. Calves are split into three on
// the back view, and the thigh region has a different name on each view.
const POLYGON_ALIASES = {
  'calves': ['calves', 'left-soleus', 'right-soleus'],
  'adductor': ['adductor', 'abductors']
};

export const getMuscleFromPolygon = (polygonName) => {
  const parent = Object.keys(POLYGON_ALIASES).find(m => POLYGON_ALIASES[m].includes(polygonName));
  return parent || polygonName;
};

const target = (primary, secondary = []) => ({ primary, secondary });

const BENCH = target(['chest'], ['front-deltoids', 'triceps']);
const FLY = target(['chest'], ['front-deltoids']);
const HEAVY_ROW = target(['upper-back'], ['biceps', 'back-deltoids', 'trapezius', 'lower-back']);
const SUPPORTED_ROW = target(['upper-back'], ['biceps', 'back-deltoids', 'trapezius']);
const VERTICAL_PULL = target(['upper-back'], ['biceps', 'forearm']);
const LUNGE = target(['quadriceps', 'gluteal'], ['hamstring', 'adductor']);
const HINGE = target(['hamstring', 'gluteal'], ['lower-back', 'forearm']);
const OVERHEAD_PRESS = target(['front-deltoids'], ['triceps']);
// The body model has no side delt, so lateral raises light up the shoulder cap.
const LATERAL_RAISE = target(['front-deltoids'], ['trapezius']);
const SHRUG = target(['trapezius'], ['forearm']);
const CURL = target(['biceps'], ['forearm']);
const TRICEP_ISOLATION = target(['triceps']);
const ROTATION = target(['obliques'], ['abs']);

// Keys are lowercase and match the seeded `exercises` table.
const EXERCISE_TARGETS = {
  // Chest
  'barbell bench press': BENCH,
  'cable crossover': FLY,
  'decline barbell bench press': BENCH,
  'decline dumbbell press': BENCH,
  'dumbbell flyes': FLY,
  'dumbbell pullover': target(['chest'], ['upper-back', 'triceps']),
  'floor press': BENCH,
  'incline dumbbell press': BENCH,
  'machine chest press': BENCH,
  'pec deck fly': FLY,
  'push-ups': BENCH,
  'smith machine bench press': BENCH,

  // Back
  'barbell row': HEAVY_ROW,
  'chest-supported dumbbell row': SUPPORTED_ROW,
  'chin-ups': VERTICAL_PULL,
  'deadlift': target(['gluteal', 'hamstring', 'lower-back'], ['quadriceps', 'trapezius', 'upper-back', 'forearm']),
  'good mornings': target(['hamstring', 'lower-back'], ['gluteal']),
  'lat pulldown': VERTICAL_PULL,
  'lat pulldown (close grip)': VERTICAL_PULL,
  'pendlay row': HEAVY_ROW,
  'pull-ups': VERTICAL_PULL,
  'rack pull': target(['lower-back', 'trapezius'], ['gluteal', 'hamstring', 'upper-back', 'forearm']),
  'seated cable row': SUPPORTED_ROW,
  'single arm dumbbell row': target(['upper-back'], ['biceps', 'back-deltoids']),
  'straight arm pulldown': target(['upper-back'], ['triceps']),
  't-bar row': HEAVY_ROW,

  // Legs
  'barbell squat': target(['quadriceps', 'gluteal'], ['adductor', 'lower-back']),
  'bulgarian split squat': LUNGE,
  'cable pull-through': target(['gluteal', 'hamstring'], ['lower-back']),
  'calf raise': target(['calves']),
  'front squat': target(['quadriceps'], ['gluteal', 'adductor', 'lower-back']),
  'glute kickback': target(['gluteal'], ['hamstring']),
  'goblet squat': target(['quadriceps', 'gluteal'], ['adductor', 'abs']),
  'hack squat': target(['quadriceps'], ['gluteal', 'adductor']),
  'hip thrust': target(['gluteal'], ['hamstring']),
  'leg curl': target(['hamstring']),
  'leg extension': target(['quadriceps']),
  'leg press': target(['quadriceps'], ['gluteal', 'adductor']),
  'lying leg curl': target(['hamstring']),
  'reverse lunges': LUNGE,
  'romanian deadlift': HINGE,
  'seated calf raise': target(['calves']),
  'seated leg curl': target(['hamstring']),
  'standing calf raise': target(['calves']),
  'stiff-legged deadlift': HINGE,
  'sumo squat': target(['quadriceps', 'gluteal', 'adductor']),
  'trap bar deadlift': target(['gluteal', 'quadriceps'], ['hamstring', 'lower-back', 'trapezius', 'forearm']),
  'walking lunges': LUNGE,

  // Shoulders
  'arnold press': OVERHEAD_PRESS,
  'barbell shrug': SHRUG,
  'cable lateral raise': LATERAL_RAISE,
  'dumbbell front raise': target(['front-deltoids']),
  'dumbbell lateral raise': LATERAL_RAISE,
  'dumbbell shrug': SHRUG,
  'face pulls': target(['back-deltoids'], ['trapezius', 'upper-back']),
  'front raise': target(['front-deltoids']),
  'machine shoulder press': OVERHEAD_PRESS,
  'overhead press': OVERHEAD_PRESS,
  'push press': target(['front-deltoids'], ['triceps', 'quadriceps']),
  'reverse pec deck': target(['back-deltoids'], ['trapezius']),
  'seated dumbbell press': OVERHEAD_PRESS,
  'upright row': target(['front-deltoids', 'trapezius'], ['biceps']),

  // Arms
  'barbell curl': CURL,
  'bench dips': target(['triceps'], ['front-deltoids']),
  'cable curl': CURL,
  'cable tricep extension': TRICEP_ISOLATION,
  'close-grip bench press': target(['triceps'], ['chest', 'front-deltoids']),
  'concentration curl': CURL,
  'dips': target(['triceps'], ['chest', 'front-deltoids']),
  'dumbbell hammer curl': target(['biceps', 'forearm']),
  'dumbbell tricep extension': TRICEP_ISOLATION,
  'ez bar curl': CURL,
  'incline dumbbell curl': CURL,
  'overhead tricep extension': TRICEP_ISOLATION,
  'preacher curl': CURL,
  'reverse barbell curl': target(['forearm'], ['biceps']),
  'skullcrushers': TRICEP_ISOLATION,
  'tricep kickback': TRICEP_ISOLATION,
  'tricep pushdown (rope)': TRICEP_ISOLATION,
  'tricep pushdown (straight bar)': TRICEP_ISOLATION,

  // Core
  'ab wheel rollout': target(['abs'], ['obliques']),
  'bicycle crunches': target(['abs', 'obliques']),
  'cable crunch': target(['abs']),
  'crunches': target(['abs']),
  'decline crunch': target(['abs']),
  'hanging leg raise': target(['abs'], ['forearm']),
  "leg raises (captain's chair)": target(['abs']),
  'plank': target(['abs'], ['obliques']),
  'russian twist': ROTATION,
  'russian twists': ROTATION,
  'woodchoppers': ROTATION
};

// Custom exercises get named freely ("Barbell Romanian Dead Lift"), so their
// names are matched against movement patterns. Order matters: the first match
// wins, so specific patterns must sit above general ones (leg curl above curl).
const NAME_PATTERNS = [
  // Legs and hinges
  [/\b(romanian|rdls?|stiff ?leg(ged)?|straight ?leg)\b/, HINGE],
  [/\bgood ?mornings?\b/, EXERCISE_TARGETS['good mornings']],
  [/\b(leg|hamstring|nordic) ?curls?\b/, target(['hamstring'])],
  [/\b(calf|calves)\b/, target(['calves'])],
  [/\bleg extensions?\b/, target(['quadriceps'])],
  [/\bleg press(es)?\b/, EXERCISE_TARGETS['leg press']],
  [/\b(hip thrusts?|glute bridges?|glute kickbacks?)\b/, target(['gluteal'], ['hamstring'])],
  [/\bpull ?throughs?\b/, EXERCISE_TARGETS['cable pull-through']],
  [/\b(ad|ab)ductions?\b/, target(['adductor'])],
  [/\b(back|hyper) ?extensions?\b/, target(['lower-back'], ['gluteal', 'hamstring'])],
  [/\brack pulls?\b/, EXERCISE_TARGETS['rack pull']],
  [/\b(trap|hex) bar\b/, EXERCISE_TARGETS['trap bar deadlift']],
  [/\bdead ?lifts?\b/, EXERCISE_TARGETS['deadlift']],
  [/\b(lunges?|split squats?|step ?ups?)\b/, LUNGE],
  [/\bsquats?\b/, EXERCISE_TARGETS['barbell squat']],

  // Arms
  [/\b(tricep|triceps|skull ?crushers?|push ?downs?|press ?downs?)\b/, TRICEP_ISOLATION],
  [/\bclose ?grip (bench|press)\b/, EXERCISE_TARGETS['close-grip bench press']],
  [/\bdips?\b/, EXERCISE_TARGETS['dips']],
  [/\b(reverse|wrist)( \w+)? curls?\b/, EXERCISE_TARGETS['reverse barbell curl']],
  [/\bhammer curls?\b/, EXERCISE_TARGETS['dumbbell hammer curl']],
  [/\b(curls?|biceps?)\b/, CURL],

  // Shoulders
  [/\b(face pulls?|rear delts?|reverse (fly|flyes|flies|pec deck))\b/, EXERCISE_TARGETS['reverse pec deck']],
  [/\b(lateral|side) raises?\b/, LATERAL_RAISE],
  [/\bfront raises?\b/, target(['front-deltoids'])],
  [/\bshrugs?\b/, SHRUG],
  [/\bupright rows?\b/, EXERCISE_TARGETS['upright row']],
  [/\bpush press(es)?\b/, EXERCISE_TARGETS['push press']],
  [/\b(shoulder|overhead|military|arnold) press(es)?\b/, OVERHEAD_PRESS],
  [/\bseated (dumbbell|db|barbell) press(es)?\b/, OVERHEAD_PRESS],
  [/\bohp\b/, OVERHEAD_PRESS],

  // Back
  [/\brows?\b/, SUPPORTED_ROW],
  [/\b(pull ?ups?|chin ?ups?|pull ?downs?)\b/, VERTICAL_PULL],
  [/\bpull ?overs?\b/, EXERCISE_TARGETS['dumbbell pullover']],

  // Chest
  [/\b(fly|flyes|flies|crossovers?|pec deck)\b/, FLY],
  [/\b(bench|chest press|push ?ups?)\b/, BENCH],
  [/\b(incline|decline|floor)( \w+)? press(es)?\b/, BENCH],

  // Core
  [/\b(twists?|wood ?chop(s|pers?)?)\b/, ROTATION],
  [/\bbicycles?\b/, EXERCISE_TARGETS['bicycle crunches']],
  [/\b(crunch(es)?|sit ?ups?|leg raises?|planks?|ab wheel)\b/, target(['abs'])]
];

export const inferTargetsFromName = (exerciseName) => {
  const words = normalizeExerciseName(exerciseName).replace(/[^a-z0-9]+/g, ' ');
  const match = NAME_PATTERNS.find(([pattern]) => pattern.test(words));
  return match ? match[1] : null;
};

// Last resort for custom exercises when the name gives nothing away. Groups that
// span several muscles split the credit rather than guessing one winner.
const MUSCLE_GROUP_FALLBACKS = {
  'Chest': target(['chest']),
  'Back': target(['upper-back']),
  'Legs': target([], ['quadriceps', 'hamstring', 'gluteal']),
  'Shoulders': target(['front-deltoids']),
  'Arms': target([], ['biceps', 'triceps']),
  'Core': target(['abs'])
};

export const normalizeExerciseName = (name) => String(name || '').trim().toLowerCase();

export const getExerciseTargets = (exerciseName, masterExercises = []) => {
  const key = normalizeExerciseName(exerciseName);
  if (EXERCISE_TARGETS[key]) return EXERCISE_TARGETS[key];

  const inferred = inferTargetsFromName(exerciseName);
  if (inferred) return inferred;

  const match = masterExercises.find(ex => normalizeExerciseName(ex.name) === key);
  return (match && MUSCLE_GROUP_FALLBACKS[match.muscle_group]) || null;
};

// A set counts fully for primary movers and half for assisting muscles.
const PRIMARY_SET_CREDIT = 1;
const SECONDARY_SET_CREDIT = 0.5;

// Top of the commonly used 10-20 weekly hard set range, reached at 100 heat.
export const MAX_HEAT_WEEKLY_SETS = 16;
export const HEAT_LEVELS = 5;

export const toLocalDateString = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

// `Weight (lbs)` is ignored on purpose. Summing tonnage would pin legs at max
// heat and leave pull-ups, planks and other bodyweight work at zero.
// Pass `days` for a rolling window, or `startDate` + `endDate` (YYYY-MM-DD) for a fixed one.
export const calculateMuscleHeat = (globalHistory, masterExercises = [], { days = 7, startDate: fixedStart, endDate: fixedEnd, now = new Date() } = {}) => {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - (days - 1));
  const startDate = fixedStart || toLocalDateString(windowStart);
  const endDate = fixedEnd || toLocalDateString(now);

  // Heat is a weekly rate, so long ranges are averaged down to stay comparable.
  // Ranges under a week aren't scaled up, or one workout would max out the map.
  const rangeDays = Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000) + 1;
  const weeks = Math.max(1, rangeDays / 7);

  const muscles = {};
  const uncounted = new Set();
  let totalSets = 0;

  const addCredit = (muscle, credit, exerciseName) => {
    if (!muscles[muscle]) muscles[muscle] = { sets: 0, exercises: {} };
    muscles[muscle].sets += credit;
    muscles[muscle].exercises[exerciseName] = (muscles[muscle].exercises[exerciseName] || 0) + credit;
  };

  globalHistory.forEach(row => {
    const date = String(row.Date || '').slice(0, 10);
    if (date < startDate || date > endDate) return;

    // The tracker saves every prefilled set, so skipped sets arrive with no reps.
    if (!(parseFloat(row['Reps']) > 0)) return;

    const exerciseName = row['Exercise Name'];
    if (!exerciseName) return;

    const targets = getExerciseTargets(exerciseName, masterExercises);
    if (!targets) {
      uncounted.add(exerciseName);
      return;
    }

    totalSets += 1;
    targets.primary.forEach(m => addCredit(m, PRIMARY_SET_CREDIT, exerciseName));
    targets.secondary.forEach(m => addCredit(m, SECONDARY_SET_CREDIT, exerciseName));
  });

  Object.values(muscles).forEach(m => {
    m.weeklySets = Math.round((m.sets / weeks) * 10) / 10;
    m.score = Math.min(100, Math.round(((m.sets / weeks) / MAX_HEAT_WEEKLY_SETS) * 100));
    m.level = Math.max(1, Math.ceil((m.score / 100) * HEAT_LEVELS));
  });

  return { muscles, totalSets, weeks, uncounted: [...uncounted].sort() };
};

// The library reads `frequency` as a 1-based index into highlightedColors.
export const toHighlighterData = (muscles) => Object.keys(muscles).map(muscle => ({
  name: muscle,
  muscles: POLYGON_ALIASES[muscle] || [muscle],
  frequency: muscles[muscle].level
}));
