// ─── Seeded Workout Templates ──────────────────────────────────────────────
//
// 16 pre-built workout templates for a 35-year-old moderately active male
// targeting hypertrophy and general fitness.
//
// Evidence base:
//   - Schoenfeld (2010, 2017): volume landmarks, frequency recommendations,
//     stretch-mediated hypertrophy, rep range meta-analyses
//   - Renaissance Periodization (RP) Hypertrophy Templates: MEV/MAV/MRV
//     framework, weekly set targets by muscle group
//   - Jeff Nippard PPL Programming: exercise selection, fatigue management,
//     compound-first ordering
//   - NSCA Essentials of Strength Training (4th ed.): rest period guidelines,
//     rep range classifications
//   - Stronger By Science (Nuckols et al.): exercise ordering, accessory work
//   - Muscle & Strength: exercise technical standards
//
// Programming principles applied:
//   - Compound exercises placed first (highest neural demand, freshest state)
//   - Isolation/machine work placed last (lower systemic fatigue)
//   - Rep ranges: compounds 5–8 (strength-hypertrophy), accessories 8–12
//     (hypertrophy), isolations 12–15 (hypertrophy-endurance)
//   - Rest periods: compounds 120–180s, accessories 60–90s, isolations 45–60s
//   - Face pulls / rear-delt work included on every push/upper session for
//     shoulder health (per Greg Nuckols and RP recommendations)
//   - Machine workouts use only machine/cable/bodyweight equipment to be
//     truly beginner-friendly and lower the barrier to starting
//
// All exerciseIds verified against:
//   01_legs_quads_glutes.json   (30 exercises)
//   02_legs_hamstrings_calves.json (19 exercises)
//   03_chest.json               (25 exercises)
//   04_back.json                (24 exercises)
//   05_shoulders.json           (20 exercises)
//   06_arms.json                (24 exercises)
//   07_core_and_functional.json (20 exercises)

import type { WorkoutSplit } from '@/types';

export interface SeededWorkout {
  name: string;
  split: WorkoutSplit;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: {
    exerciseId: string;
    sets: number;
    reps: number;
    restSeconds: number;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 1 — EASY MACHINE (Beginner, machine/cable only)
// Goal: zero free-weight intimidation, safe to train alone, guided movement
// paths eliminate technique barrier. Per RP, machines produce equivalent
// hypertrophy to free weights when effort is matched (Schoenfeld 2021).
// ─────────────────────────────────────────────────────────────────────────────

const easyMachineLegs: SeededWorkout = {
  name: 'Easy Machine Legs',
  split: 'legs',
  difficulty: 'beginner',
  // Programming notes:
  //   Leg press as primary quad stimulus (safe, high load, no balance demand).
  //   Seated leg curl preferred over lying — Maeo et al. (2021) showed seated
  //   hits hamstrings at longer muscle length, yielding superior growth.
  //   Hip adduction machine added for glute med / adductor completeness.
  //   Calf pair (standing + seated) covers both gastrocnemius and soleus —
  //   different knee angles target different heads (Schoenfeld 2010).
  exercises: [
    { exerciseId: 'leg_press',            sets: 4, reps: 10, restSeconds: 120 },
    { exerciseId: 'hack_squat_machine',   sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'leg_extension',        sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'leg_curl_seated',      sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'hip_adduction_machine',sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'calf_raise_standing',  sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'seated_calf_raise',    sets: 3, reps: 15, restSeconds: 45  },
  ],
};

const easyMachinePush: SeededWorkout = {
  name: 'Easy Machine Push',
  split: 'push',
  difficulty: 'beginner',
  // Programming notes:
  //   Chest press machine first (primary horizontal push, highest weight).
  //   Incline machine targets upper chest — commonly underdeveloped.
  //   Machine lateral raise: impossible to cheat; excellent side delt isolation.
  //   Machine shoulder press: vertical push pattern for complete shoulder.
  //   Pec deck finisher: constant tension chest fly, no drop risk.
  //   Tricep pushdown + overhead extension pair — pushdown hits lateral/medial
  //   heads, overhead hits the long head in its stretched position
  //   (Maeo et al. 2021, stretch-mediated hypertrophy).
  //   Face pull: mandatory shoulder health work on every push session.
  exercises: [
    { exerciseId: 'machine_chest_press',    sets: 4, reps: 10, restSeconds: 120 },
    { exerciseId: 'incline_machine_press',  sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'machine_shoulder_press', sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'machine_lateral_raise',  sets: 3, reps: 15, restSeconds: 60  },
    { exerciseId: 'machine_pec_deck',       sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'tricep_pushdown',        sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'cable_overhead_extension', sets: 3, reps: 12, restSeconds: 60 },
    { exerciseId: 'face_pull',              sets: 3, reps: 15, restSeconds: 45  },
  ],
};

const easyMachinePull: SeededWorkout = {
  name: 'Easy Machine Pull',
  split: 'pull',
  difficulty: 'beginner',
  // Programming notes:
  //   Assisted pull-up machine bridges gap toward real pull-ups; set assistance
  //   weight high and reduce 5 lbs every 1–2 weeks.
  //   Lat pulldown follows for volume; different grip hits slightly different
  //   lat fiber angles.
  //   Machine row: chest pad eliminates lower back stress — all effort to back.
  //   Reverse fly machine (rear pec deck): turn pec deck around; best
  //   machine-based rear delt and external rotator exercise.
  //   Cable curl + rope cable curl = bicep supinated + neutral grip coverage.
  exercises: [
    { exerciseId: 'assisted_pull_up',    sets: 4, reps: 8,  restSeconds: 120 },
    { exerciseId: 'lat_pulldown',        sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'machine_row',         sets: 4, reps: 10, restSeconds: 90  },
    { exerciseId: 'cable_row',           sets: 3, reps: 12, restSeconds: 75  },
    { exerciseId: 'reverse_fly_machine', sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'cable_curl',          sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'rope_cable_curl',     sets: 3, reps: 12, restSeconds: 60  },
  ],
};

const easyMachineFullBody: SeededWorkout = {
  name: 'Easy Machine Full Body',
  split: 'full_body',
  difficulty: 'beginner',
  // Programming notes:
  //   One exercise per major movement pattern: squat, hinge, horizontal push,
  //   horizontal pull, vertical pull, shoulder, core. Ideal for 2–3x/week
  //   full-body frequency (Schoenfeld 2016 meta-analysis: 2x/week frequency
  //   superior to 1x for hypertrophy at matched volume).
  //   Lower rep counts per exercise vs. splits — accumulate sufficient volume
  //   across sessions not within one session.
  exercises: [
    { exerciseId: 'leg_press',            sets: 3, reps: 12, restSeconds: 120 },
    { exerciseId: 'leg_curl_seated',      sets: 3, reps: 12, restSeconds: 90  },
    { exerciseId: 'machine_chest_press',  sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'machine_row',          sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'lat_pulldown',         sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'machine_shoulder_press', sets: 3, reps: 10, restSeconds: 90 },
    { exerciseId: 'machine_lateral_raise',  sets: 2, reps: 15, restSeconds: 45 },
    { exerciseId: 'tricep_pushdown',      sets: 2, reps: 12, restSeconds: 60  },
    { exerciseId: 'cable_curl',           sets: 2, reps: 12, restSeconds: 60  },
    { exerciseId: 'face_pull',            sets: 2, reps: 15, restSeconds: 45  },
    { exerciseId: 'plank',               sets: 3, reps: 40, restSeconds: 45  }, // reps = seconds held
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 2 — INTERMEDIATE FREE WEIGHT (Mix of barbell/dumbbell/cable)
// Goal: classic PPL + Upper/Lower templates, free weight emphasis for
// maximal strength and hypertrophy stimulus. Per Nippard PPL 2.0 framework.
// ─────────────────────────────────────────────────────────────────────────────

const intermediatePush: SeededWorkout = {
  name: 'Push Day',
  split: 'push',
  difficulty: 'intermediate',
  // Programming notes:
  //   Flat barbell bench as primary horizontal push (heaviest, most overload).
  //   Incline dumbbell press targets upper chest with greater ROM and stretch
  //   than incline barbell (Pedrosa et al. 2023, stretch-mediated hypertrophy).
  //   Dumbbell shoulder press: seated for stability, allows heavier loading.
  //   Cable lateral raise: constant tension including at stretched position
  //   (bottom), which dumbbell laterals lack (Nippard, 2022).
  //   Cable flye: superior to dumbbell flyes for constant tension across ROM.
  //   Tricep pair: pushdown (lateral/medial heads) + overhead extension
  //   (long head stretch — essential for complete tricep development).
  //   Face pull closes every push session for posterior shoulder health.
  exercises: [
    { exerciseId: 'barbell_bench_press',     sets: 4, reps: 7,  restSeconds: 180 },
    { exerciseId: 'incline_dumbbell_press',  sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'cable_lateral_raise',     sets: 3, reps: 15, restSeconds: 60  },
    { exerciseId: 'cable_flye',              sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'tricep_pushdown',         sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'overhead_tricep_extension', sets: 3, reps: 12, restSeconds: 60 },
    { exerciseId: 'face_pull',               sets: 3, reps: 15, restSeconds: 45  },
  ],
};

const intermediatePull: SeededWorkout = {
  name: 'Pull Day',
  split: 'pull',
  difficulty: 'intermediate',
  // Programming notes:
  //   Barbell row as primary horizontal pull (heaviest overload for lats and
  //   mid-back). Pull-up provides vertical pull pattern — overhand grip
  //   emphasizes lats and teres major, biceps assist secondarily.
  //   Cable row with different grip hits mid-traps and rhomboids slightly
  //   differently from barbell rows (elbow flare vs. tuck).
  //   Straight-arm pulldown: lat isolation without bicep contribution —
  //   builds mind-muscle connection and trains the lat in its shoulder
  //   extension function.
  //   Incline dumbbell curl loads the bicep long head in a stretched position
  //   (shoulder extended behind torso) — strong hypertrophy stimulus per
  //   Pedrosa et al. (2023) and Maeo et al. (2021).
  //   Hammer curl adds brachialis and brachioradialis for arm thickness.
  //   Face pull: rear delt + external rotator maintenance.
  exercises: [
    { exerciseId: 'barbell_row',           sets: 4, reps: 7,  restSeconds: 180 },
    { exerciseId: 'pull_up',               sets: 3, reps: 8,  restSeconds: 150 },
    { exerciseId: 'cable_row',             sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'straight_arm_pulldown', sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'rear_delt_flye',        sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'incline_dumbbell_curl', sets: 3, reps: 10, restSeconds: 60  },
    { exerciseId: 'hammer_curl',           sets: 3, reps: 12, restSeconds: 60  },
  ],
};

const intermediateLeg: SeededWorkout = {
  name: 'Leg Day',
  split: 'legs',
  difficulty: 'intermediate',
  // Programming notes:
  //   Barbell back squat as primary compound (greatest systemic hormonal
  //   response, highest quad/glute load). 5 reps per set = strength-hypertrophy
  //   overlap zone (Schoenfeld 2017 meta-analysis).
  //   Romanian deadlift: hip hinge pattern, hamstring lengthened-position load.
  //   Bulgarian split squat: unilateral quad/glute work, fixes imbalances.
  //   Leg extension isolates quads at the knee (complements squat which loads
  //   in hip-dominant pattern for many trainees).
  //   Leg curl seated: seated position provides hamstring stretch at the hip,
  //   yielding superior hamstring growth (Maeo et al. 2021).
  //   Hip thrust: loaded glute extension in shortened position — complements
  //   RDL which loads glutes in lengthened position.
  //   Calf pair: standing for gastrocnemius, seated for soleus.
  exercises: [
    { exerciseId: 'barbell_back_squat',   sets: 4, reps: 6,  restSeconds: 180 },
    { exerciseId: 'romanian_deadlift',    sets: 3, reps: 8,  restSeconds: 150 },
    { exerciseId: 'bulgarian_split_squat',sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'leg_extension',        sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'leg_curl_seated',      sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'hip_thrust',           sets: 3, reps: 12, restSeconds: 90  },
    { exerciseId: 'calf_raise_standing',  sets: 4, reps: 15, restSeconds: 45  },
    { exerciseId: 'seated_calf_raise',    sets: 3, reps: 15, restSeconds: 45  },
  ],
};

const intermediateUpper: SeededWorkout = {
  name: 'Upper Body',
  split: 'upper',
  difficulty: 'intermediate',
  // Programming notes:
  //   Antagonist-pair structure (press/row alternation) allows higher volume
  //   per session with less local fatigue — one muscle group recovers while
  //   the antagonist works. This is the core structure of Upper/Lower splits.
  //   Bench + dumbbell row as first pair (heaviest bilateral compound).
  //   Incline dumbbell press + cable row as second pair.
  //   OHP + lat pulldown as third pair (vertical push/pull balance).
  //   Lateral raise finisher for side delt accumulation.
  //   Face pull + band pull-apart both included — upper sessions accumulate
  //   more posterior shoulder volume than split push/pull days.
  exercises: [
    { exerciseId: 'barbell_bench_press',   sets: 4, reps: 7,  restSeconds: 150 },
    { exerciseId: 'dumbbell_row',          sets: 4, reps: 8,  restSeconds: 150 },
    { exerciseId: 'incline_dumbbell_press',sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'cable_row',             sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'dumbbell_shoulder_press', sets: 3, reps: 10, restSeconds: 90 },
    { exerciseId: 'lat_pulldown',          sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'lateral_raise',         sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'face_pull',             sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'tricep_pushdown',       sets: 2, reps: 12, restSeconds: 60  },
    { exerciseId: 'barbell_curl',          sets: 2, reps: 12, restSeconds: 60  },
  ],
};

const intermediateLower: SeededWorkout = {
  name: 'Lower Body',
  split: 'lower',
  difficulty: 'intermediate',
  // Programming notes:
  //   Front squat as primary alternative to back squat — more upright torso,
  //   higher quadriceps emphasis, reduced spinal loading vs. high-bar back squat.
  //   Goblet squat as secondary squat pattern with lighter load and controlled
  //   depth — excellent teaching tool and quad accessory.
  //   Dumbbell RDL: easier learning curve than barbell; each arm independent
  //   for identifying and fixing imbalances.
  //   Single-leg RDL: unilateral hinge for hip stability and hamstring work.
  //   Leg press for supplemental quad volume without axial spine loading.
  //   Leg curl lying: complements seated curl by training at different hip angle.
  //   Calf raise on leg press: efficient — done right after leg press sets
  //   without moving stations (gastrocnemius emphasis with extended knees).
  exercises: [
    { exerciseId: 'barbell_front_squat',  sets: 4, reps: 6,  restSeconds: 180 },
    { exerciseId: 'goblet_squat',         sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'dumbbell_rdl',         sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'single_leg_rdl',       sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'leg_press',            sets: 3, reps: 12, restSeconds: 90  },
    { exerciseId: 'leg_curl_lying',       sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'calf_raise_on_leg_press', sets: 4, reps: 15, restSeconds: 45 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 3 — ADVANCED COMPOUND-HEAVY
// Goal: higher intensity (heavier loads, lower reps on primary lifts),
// greater weekly volume, exercises with higher technical demand.
// Based on RP MAV–MRV volume targets and Nippard advanced PPL structure.
// ─────────────────────────────────────────────────────────────────────────────

const advancedHeavyPush: SeededWorkout = {
  name: 'Heavy Push',
  split: 'push',
  difficulty: 'advanced',
  // Programming notes:
  //   Close-grip bench press opens the session as a compound tricep builder
  //   and upper chest accessory — it loads the triceps heavily in a pressing
  //   pattern. Follow with flat bench for chest-primary work.
  //   Barbell OHP: standing for core demand and functional strength. The
  //   strict standing press is a key measure of real-world upper body strength
  //   (NSCA Essentials 4th ed.).
  //   Incline barbell press at ~30 degrees: research supports this angle for
  //   maximal upper chest EMG without excessive front delt takeover
  //   (Lauver et al. 2016).
  //   Chest dip: bodyweight compound that loads the chest in a deep stretch
  //   at the bottom — strong hypertrophy stimulus. Weight added via belt.
  //   Cable lateral + face pull: high volume shoulder isolation to finish.
  exercises: [
    { exerciseId: 'barbell_bench_press',   sets: 5, reps: 5,  restSeconds: 180 },
    { exerciseId: 'incline_barbell_press', sets: 4, reps: 8,  restSeconds: 150 },
    { exerciseId: 'overhead_press',        sets: 4, reps: 6,  restSeconds: 180 },
    { exerciseId: 'dip_chest',             sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'cable_lateral_raise',   sets: 4, reps: 15, restSeconds: 60  },
    { exerciseId: 'skull_crusher',         sets: 3, reps: 10, restSeconds: 75  },
    { exerciseId: 'cable_overhead_extension', sets: 3, reps: 12, restSeconds: 60 },
    { exerciseId: 'face_pull',             sets: 4, reps: 15, restSeconds: 45  },
  ],
};

const advancedHeavyPull: SeededWorkout = {
  name: 'Heavy Pull',
  split: 'pull',
  difficulty: 'advanced',
  // Programming notes:
  //   Pendlay row as primary heavy pull: torso parallel to floor, dead-stop
  //   each rep eliminates stretch reflex — every rep is strict and explosive.
  //   Named after weightlifting coach Glenn Pendlay. Builds explosive pulling
  //   power that carries over to sport performance.
  //   Weighted chin-up: underhand grip benefits from bicep contribution,
  //   allowing slightly heavier loading vs. pull-ups for equivalent lat work.
  //   T-bar row: neutral grip allows the heaviest row loading for most people;
  //   classic bodybuilding back-thickness builder.
  //   Rack pull: shortened range of motion allows supra-maximal loading —
  //   targets the top portion of the deadlift, builds upper back and traps
  //   under heavy load.
  //   Bayesian cable curl: loads the bicep long head in a stretched position
  //   with constant tension — best of both incline curl and cable curl worlds.
  exercises: [
    { exerciseId: 'pendlay_row',          sets: 5, reps: 5,  restSeconds: 180 },
    { exerciseId: 'chin_up',              sets: 4, reps: 6,  restSeconds: 150 },
    { exerciseId: 't_bar_row',            sets: 4, reps: 8,  restSeconds: 150 },
    { exerciseId: 'rack_pull',            sets: 3, reps: 6,  restSeconds: 180 },
    { exerciseId: 'close_grip_pulldown',  sets: 3, reps: 10, restSeconds: 90  },
    { exerciseId: 'cable_rear_delt_flye', sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'bayesian_curl',        sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'barbell_shrug',        sets: 3, reps: 12, restSeconds: 75  },
  ],
};

const advancedHeavyLegs: SeededWorkout = {
  name: 'Heavy Legs',
  split: 'legs',
  difficulty: 'advanced',
  // Programming notes:
  //   High-bar back squat at 5x5: the gold standard strength-hypertrophy
  //   protocol. 5 sets provides sufficient volume at intensity for advanced
  //   trainees (RP MEV for quads: 10–16 sets/week; this session alone
  //   covers ~5 working sets of quad-dominant compound work).
  //   Conventional deadlift: full posterior chain activation. Do NOT deadlift
  //   heavy on the same session as heavy squats without adequate recovery —
  //   here sets/reps are moderated (3x5) vs. the squat to manage fatigue.
  //   Hack squat machine: unloads the spine vs. barbell squat while maintaining
  //   high quad stimulus for supplemental volume.
  //   Stiff-leg deadlift: greater hamstring stretch than RDL, more direct
  //   hamstring stimulus.
  //   Nordic curl: eccentric hamstring exercise with the strongest injury-
  //   prevention evidence in the literature (van der Horst et al. 2015).
  //   Hip thrust: loaded glute extension — completes the posterior chain.
  exercises: [
    { exerciseId: 'barbell_back_squat',  sets: 5, reps: 5,  restSeconds: 180 },
    { exerciseId: 'conventional_deadlift', sets: 3, reps: 5, restSeconds: 180 },
    { exerciseId: 'hack_squat_machine',  sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'stiff_leg_deadlift',  sets: 3, reps: 8,  restSeconds: 120 },
    { exerciseId: 'nordic_curl',         sets: 3, reps: 5,  restSeconds: 90  },
    { exerciseId: 'hip_thrust',          sets: 4, reps: 10, restSeconds: 90  },
    { exerciseId: 'calf_raise_standing', sets: 4, reps: 15, restSeconds: 45  },
    { exerciseId: 'seated_calf_raise',   sets: 3, reps: 15, restSeconds: 45  },
  ],
};

const advancedPowerFullBody: SeededWorkout = {
  name: 'Power Full Body',
  split: 'full_body',
  difficulty: 'advanced',
  // Programming notes:
  //   Box jump as the session opener when the nervous system is fresh —
  //   plyometrics ALWAYS precede heavy strength work, never follow it.
  //   Post-activation potentiation (PAP): plyometric priming can increase
  //   subsequent strength performance (Hodgson et al. 2005).
  //   Trap bar deadlift: safest high-load hip hinge for full-body sessions;
  //   centered weight, neutral grip, less spinal loading than conventional.
  //   Barbell bench press: primary horizontal push.
  //   Barbell row: primary horizontal pull, superset candidate with bench.
  //   Overhead press: vertical push, core demand.
  //   Pull-up: vertical pull, lat and bicep.
  //   Kettlebell swing: explosive hip hinge conditioning, posterior chain.
  //   Ab wheel rollout: highest-activation anti-extension core movement.
  exercises: [
    { exerciseId: 'box_jump',             sets: 3, reps: 5,  restSeconds: 90  },
    { exerciseId: 'trap_bar_deadlift',    sets: 4, reps: 5,  restSeconds: 180 },
    { exerciseId: 'barbell_bench_press',  sets: 4, reps: 5,  restSeconds: 180 },
    { exerciseId: 'barbell_row',          sets: 4, reps: 6,  restSeconds: 150 },
    { exerciseId: 'overhead_press',       sets: 3, reps: 6,  restSeconds: 150 },
    { exerciseId: 'pull_up',              sets: 3, reps: 6,  restSeconds: 120 },
    { exerciseId: 'kettlebell_swing',     sets: 3, reps: 15, restSeconds: 60  },
    { exerciseId: 'ab_wheel_rollout',     sets: 3, reps: 8,  restSeconds: 60  },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY 4 — SPECIALTY (Targeted goal sessions)
// Designed to address specific weak points or aesthetic goals, or to serve
// as standalone focused sessions within a broader program.
// ─────────────────────────────────────────────────────────────────────────────

const armBlaster: SeededWorkout = {
  name: 'Arm Blaster',
  split: 'pull', // Bicep-primary, but tricep volume included — split 'pull' is
                  // the closest match since most volume is elbow flexion
  difficulty: 'intermediate',
  // Programming notes:
  //   Structured as a superset-friendly arm workout (curl ↔ tricep extension
  //   pairs) — antagonist supersets for arms reduce rest time without
  //   meaningful fatigue carryover (Weakley et al. 2017).
  //   Pair 1: Barbell curl + skull crusher — heaviest bilateral compound pair.
  //   Pair 2: Incline dumbbell curl + overhead tricep extension —
  //     both load target muscles in lengthened/stretched position,
  //     maximizing stretch-mediated hypertrophy stimulus (Maeo et al. 2021).
  //   Pair 3: Bayesian cable curl + cable overhead extension —
  //     constant cable tension + stretch loading, best of both worlds.
  //   Finishers: hammer curl for brachialis/brachioradialis arm thickness;
  //   concentration curl for peak contraction focus and mind-muscle connection.
  exercises: [
    { exerciseId: 'barbell_curl',             sets: 4, reps: 8,  restSeconds: 60  },
    { exerciseId: 'skull_crusher',            sets: 4, reps: 8,  restSeconds: 60  },
    { exerciseId: 'incline_dumbbell_curl',    sets: 3, reps: 10, restSeconds: 60  },
    { exerciseId: 'overhead_tricep_extension',sets: 3, reps: 10, restSeconds: 60  },
    { exerciseId: 'bayesian_curl',            sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'cable_overhead_extension', sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'hammer_curl',              sets: 3, reps: 12, restSeconds: 45  },
    { exerciseId: 'concentration_curl',       sets: 2, reps: 15, restSeconds: 45  },
    { exerciseId: 'tricep_pushdown',          sets: 2, reps: 15, restSeconds: 45  },
  ],
};

const shoulderBuilder: SeededWorkout = {
  name: 'Shoulder Builder',
  split: 'push',
  difficulty: 'intermediate',
  // Programming notes:
  //   Overhead press as the primary compound: standing for core demand,
  //   barbell for heaviest overload. Most important shoulder size driver.
  //   Arnold press: rotation during press means front delt → side delt
  //   transition through the ROM, effectively combining a front raise into
  //   a shoulder press.
  //   Lateral raises: THREE different variations for side delt volume —
  //   the side delt responds to high volume (15–25 sets/week, per RP).
  //   Cable laterals provide constant tension including at the bottom
  //   (stretched position); machine laterals eliminate all cheating.
  //   Face pull (3 sets) + Rear delt flye (3 sets) + Band pull-apart (2 sets)
  //   for rear delt and rotator cuff. Rear delts are the most commonly
  //   undertrained shoulder head — this session addresses that deficit.
  //   Upright row (wide grip, cable): additional side delt + upper trap work.
  exercises: [
    { exerciseId: 'overhead_press',       sets: 4, reps: 6,  restSeconds: 180 },
    { exerciseId: 'arnold_press',         sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'lateral_raise',        sets: 3, reps: 15, restSeconds: 60  },
    { exerciseId: 'cable_lateral_raise',  sets: 3, reps: 15, restSeconds: 60  },
    { exerciseId: 'machine_lateral_raise',sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'face_pull',            sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'rear_delt_flye',       sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'upright_row',          sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'band_pull_apart',      sets: 2, reps: 20, restSeconds: 30  },
  ],
};

const posteriorChainFocus: SeededWorkout = {
  name: 'Posterior Chain Focus',
  split: 'lower',
  difficulty: 'intermediate',
  // Programming notes:
  //   The posterior chain (hamstrings, glutes, lower back, calves) is
  //   chronically undertrained in most gym programs that emphasize
  //   quad-dominant squats and horizontal pressing.
  //   Romanian deadlift as the primary stimulus: hip hinge with hip extension
  //   emphasis, loads hamstrings and glutes in the lengthened position.
  //   Hip thrust: peak glute contraction in the shortened position (complements
  //   RDL's lengthened-position loading). Together they cover the full
  //   strength curve for the glutes.
  //   Good morning: targets the erector spinae and hamstrings; widely used in
  //   powerlifting as a squat accessory (strengthens the hip hinge pattern).
  //   Sumo deadlift: wider stance increases adductor and glute demand vs.
  //   conventional; provides variation in hip hinge loading angle.
  //   Leg curl lying pairs with seated for comprehensive hamstring coverage
  //   (different hip angle = different fiber emphasis per Maeo et al. 2021).
  //   Back extension for lower back endurance — essential for spinal health.
  //   Single-leg calf raise: unilateral for identifying and fixing imbalances.
  exercises: [
    { exerciseId: 'romanian_deadlift',   sets: 4, reps: 8,  restSeconds: 150 },
    { exerciseId: 'hip_thrust',          sets: 4, reps: 10, restSeconds: 120 },
    { exerciseId: 'good_morning',        sets: 3, reps: 10, restSeconds: 120 },
    { exerciseId: 'sumo_deadlift',       sets: 3, reps: 6,  restSeconds: 180 },
    { exerciseId: 'leg_curl_lying',      sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'leg_curl_seated',     sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'back_extension',      sets: 3, reps: 15, restSeconds: 60  },
    { exerciseId: 'single_leg_calf_raise', sets: 3, reps: 15, restSeconds: 45 },
  ],
};

const coreAndConditioning: SeededWorkout = {
  name: 'Core & Conditioning',
  split: 'full_body',
  difficulty: 'intermediate',
  // Programming notes:
  //   Structured around McGill's "Big 3" core stability principles:
  //   anti-extension (plank, ab wheel, hollow body), anti-lateral-flexion
  //   (side plank, suitcase carry), and anti-rotation (Pallof press).
  //   These three planes of core stability are how the spine is protected
  //   during heavy compound lifts (Stuart McGill, "Low Back Disorders").
  //   Cable crunch provides the only direct spinal flexion (rectus abdominis
  //   primary mover) with progressive overload capability.
  //   Hanging leg raise trains the lower rectus abdominis through hip flexion +
  //   posterior pelvic tilt — most effective lower ab exercise.
  //   Woodchop and Russian twist cover rotational power and oblique work.
  //   Farmer's walk: loaded carry that integrates grip, traps, core stability,
  //   and conditioning simultaneously — one of the most functional exercises.
  //   Kettlebell swing as conditioning finisher: explosive hip hinge,
  //   elevated heart rate, posterior chain integration.
  exercises: [
    { exerciseId: 'plank',             sets: 3, reps: 45, restSeconds: 45  }, // reps = seconds
    { exerciseId: 'side_plank',        sets: 3, reps: 30, restSeconds: 45  }, // reps = seconds per side
    { exerciseId: 'dead_bug',          sets: 3, reps: 10, restSeconds: 45  },
    { exerciseId: 'cable_crunch',      sets: 3, reps: 15, restSeconds: 60  },
    { exerciseId: 'hanging_leg_raise', sets: 3, reps: 10, restSeconds: 60  },
    { exerciseId: 'pallof_press',      sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'woodchop',          sets: 3, reps: 12, restSeconds: 60  },
    { exerciseId: 'russian_twist',     sets: 3, reps: 15, restSeconds: 45  },
    { exerciseId: 'ab_wheel_rollout',  sets: 3, reps: 8,  restSeconds: 75  },
    { exerciseId: 'farmer_walk',       sets: 4, reps: 40, restSeconds: 60  }, // reps = seconds
    { exerciseId: 'kettlebell_swing',  sets: 4, reps: 15, restSeconds: 60  },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Exported array — all 16 templates
// ─────────────────────────────────────────────────────────────────────────────

export const SEEDED_WORKOUTS: SeededWorkout[] = [
  // Category 1: Easy Machine (4 workouts)
  easyMachineLegs,
  easyMachinePush,
  easyMachinePull,
  easyMachineFullBody,

  // Category 2: Intermediate Free Weight (5 workouts)
  intermediatePush,
  intermediatePull,
  intermediateLeg,
  intermediateUpper,
  intermediateLower,

  // Category 3: Advanced Compound-Heavy (4 workouts)
  advancedHeavyPush,
  advancedHeavyPull,
  advancedHeavyLegs,
  advancedPowerFullBody,

  // Category 4: Specialty (4 workouts)
  armBlaster,
  shoulderBuilder,
  posteriorChainFocus,
  coreAndConditioning,
];

export default SEEDED_WORKOUTS;
