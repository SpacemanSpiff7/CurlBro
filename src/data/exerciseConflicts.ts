/**
 * Exercise Conflict Data
 *
 * Evidence base and methodology
 * ─────────────────────────────
 * Conflicts are derived from the following sources:
 *
 *   1. NSCA Essentials of Strength Training and Conditioning, 4th ed. (Haff & Triplett, 2016)
 *      – Chapter 17: Exercise Technique for Free Weights and Machines
 *      – Chapter 22: Resistance Training Program Design (exercise order, intra-session fatigue)
 *
 *   2. McGill, S. (2016). Low Back Disorders: Evidence-Based Prevention and Rehabilitation, 3rd ed.
 *      – Spinal compression limits and cumulative load; joint-sparing strategies.
 *      – Basis for all "spinal_compression" conflict categories.
 *
 *   3. Schoenfeld, B.J. (2010). The mechanisms of muscle hypertrophy and their application
 *      to resistance training. JSCR, 24(10), 2857–2872.
 *      Schoenfeld et al. (2017). Dose-response relationship between weekly resistance training
 *      volume and increases in muscle mass. JSCR, 31(12), 3508–3523.
 *
 *   4. Chiu, L.Z.F. & Barnes, J.L. (2003). The fitness-fatigue model revisited:
 *      implications for planning short- and long-term training. JSCR, 25(1), 42–51.
 *      – Basis for "fatigue_masking_performance" conflicts (stabilizer pre-fatigue).
 *
 *   5. Cools, A.M. et al. (2008). Rehabilitation of scapular muscle balance: which exercises
 *      to prescribe? American Journal of Sports Medicine, 36(10), 1966–1978.
 *      – Shoulder impingement and rotator cuff fatigue accumulation.
 *
 *   6. Kolber, M.J. et al. (2010). Shoulder injuries attributed to resistance training:
 *      a brief review. JSCR, 24(6), 1696–1704.
 *      – Anterior shoulder stress accumulation from repeated pressing.
 *
 *   7. Escamilla, R.F. & Andrews, J.R. (2009). Shoulder muscle recruitment patterns
 *      and related biomechanics during upper extremity sports. Sports Medicine, 39(7), 569–590.
 *      – Rotator cuff fatigue under repeated overhead load.
 *
 *   8. Willardson, J.M. (2007). Core stability training: applications to sports conditioning
 *      programs. JSCR, 21(3), 979–985.
 *      – Lumbar stabilizer fatigue and sequencing implications.
 *
 *   9. Marchetti, P.H. et al. (2013). Muscle activation differs between three different
 *      knee joint-angle positions during a maximal isometric leg press exercise.
 *      JSCR, 27(2), 356–359.
 *      – Knee joint stress accumulation from multiple high-load knee extension exercises.
 *
 *  10. Flanagan, S.P. & Comyns, T.M. (2008). The use of contact time and the reactive
 *      strength index to optimize fast stretch-shortening cycle training. JSCR, 22(1), 49.
 *      – Neuromuscular fatigue and plyometric/dynamic exercise sequencing.
 *
 * Conflict severity definitions
 * ──────────────────────────────
 *   'caution'  – Evidence indicates a meaningfully elevated injury risk or a severe
 *                performance degradation that compromises safety (e.g., form breakdown
 *                under fatigue with high spinal/joint load). These are not blanket
 *                prohibitions but strong recommendations to avoid or restructure the
 *                session. Athletes and advanced lifters who know their limits may
 *                manage these with reduced loading.
 *
 *   'warning'  – The combination is suboptimal: it increases fatigue, reduces output
 *                on the second exercise, or elevates joint stress in a way that is
 *                manageable for healthy individuals but worth flagging — especially
 *                for beginners, those with injury history, or anyone programming for
 *                long-term health.
 *
 * matchBy semantics
 * ──────────────────
 *   'id'       – Both exercise fields are exact exercise IDs from the database.
 *                The conflict is specific to those two exercises.
 *
 *   'pattern'  – Both fields are movement_pattern values as used in the exercise
 *                JSON files (e.g., 'hip_hinge', 'vertical_push'). Any exercise
 *                sharing both patterns in the same session triggers this conflict.
 *
 *   'tag'      – One or both fields are logical grouping tags (not stored in the
 *                exercise data, but described in this file's source rationale).
 *                The consuming code must map exercises to these tags using the
 *                exercise's properties (movement_pattern, primary_muscles, equipment,
 *                category). Tag definitions are documented inline with each conflict.
 */

export interface ExerciseConflict {
  /** The two exercise IDs or pattern/tag strings that conflict. */
  exercises: [string, string];

  /**
   * How to interpret the exercises tuple:
   *   'id'      – exact exercise IDs from the database
   *   'pattern' – movement_pattern field values
   *   'tag'     – logical grouping tags defined in this file
   */
  matchBy: 'id' | 'pattern' | 'tag';

  /** Severity of the conflict — see definitions above. */
  severity: 'warning' | 'caution';

  /** Short, user-facing message explaining the conflict. */
  reason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAG DEFINITIONS
// These tags must be mapped to exercise IDs by the consuming validation logic.
// ─────────────────────────────────────────────────────────────────────────────
//
//  'heavy_axial_spinal_load'
//    Exercises that impose significant compressive force on the lumbar spine
//    through an axial (vertical) loading vector. McGill (2016) documents peak
//    lumbar compressive forces of 6,000–10,000+ N during heavy barbell squats
//    and conventional deadlifts. Cumulative exposure within a session elevates
//    disc and facet joint stress even when individual sets are performed safely.
//    Maps to: barbell_back_squat, barbell_front_squat, conventional_deadlift,
//             sumo_deadlift, romanian_deadlift, stiff_leg_deadlift, rack_pull,
//             good_morning, barbell_row, pendlay_row, t_bar_row, overhead_press,
//             barbell_shrug
//
//  'heavy_overhead_press'
//    Any exercise that loads the glenohumeral joint in an elevated, overhead
//    position under significant barbell/dumbbell load. Fatigue of the rotator
//    cuff and scapular stabilizers from one such exercise compromises the
//    dynamic stabilization available to subsequent exercises.
//    Maps to: overhead_press, dumbbell_shoulder_press, arnold_press,
//             machine_shoulder_press, smith_machine_overhead_press
//
//  'horizontal_press'
//    Exercises that load the anterior shoulder in a horizontal pressing vector,
//    generating significant anterior deltoid and pectoralis minor activation.
//    Accumulation of anterior shoulder fatigue raises impingement risk for
//    subsequent overhead work.
//    Maps to: barbell_bench_press, dumbbell_bench_press, incline_barbell_press,
//             incline_dumbbell_press, decline_bench_press, decline_dumbbell_press,
//             machine_chest_press, incline_machine_press, smith_machine_bench_press,
//             smith_machine_incline_press, close_grip_bench_press, floor_press,
//             dip_chest, push_up (loaded/high-volume), landmine_press
//
//  'heavy_elbow_flexion'
//    High-load barbell/EZ-bar bilateral curl movements that substantially load
//    the distal bicep tendon and medial elbow structures. Stacking multiple
//    heavy bilateral curl variations in one session increases cumulative elbow
//    stress beyond what is recoverable intra-session.
//    Maps to: barbell_curl, ez_bar_curl
//
//  'heavy_elbow_extension'
//    High-load skull crusher / close-grip bench movements that substantially
//    load the olecranon, tricep tendon, and lateral elbow. Combining multiple
//    heavy compound elbow extension movements risks tricep tendon overload.
//    Maps to: skull_crusher, close_grip_bench_press, dip_tricep
//
//  'lumbar_stabilizer_intensive'
//    Exercises that require maximal isometric lumbar stabilizer co-contraction
//    throughout the set. Pre-fatiguing these stabilizers with one such exercise
//    compromises the spinal protection available during subsequent exercises of
//    the same type. Willardson (2007) specifically notes that the transversus
//    abdominis and multifidus fatigue rate is exercise-order-dependent.
//    Maps to: conventional_deadlift, barbell_back_squat, barbell_row, pendlay_row,
//             t_bar_row, good_morning, stiff_leg_deadlift, romanian_deadlift,
//             overhead_press (standing)
//
// ─────────────────────────────────────────────────────────────────────────────

export const EXERCISE_CONFLICTS: ExerciseConflict[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 1: SPINAL COMPRESSION STACKING
  // Rationale: McGill (2016) establishes that lumbar disc and facet joint
  // tolerance is dose-dependent within a session. Multiple high-axial-load
  // exercises in one session accumulate compressive stress beyond what the
  // passive and active spinal stabilizers can manage safely, especially as
  // the session progresses and stabilizer endurance decreases. The NSCA (4th
  // ed., Ch. 22) specifically recommends against pairing heavy squats and
  // heavy deadlifts in the same session for general population trainees.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Conventional deadlift + barbell back squat: The canonical spinal load
    // stacking combination. Both impose peak lumbar compressive forces in the
    // 6,000–10,000 N range (McGill, 2016). Doing both heavy in one session
    // is a primary cause of lower back fatigue injury in recreational lifters.
    // The NSCA explicitly cites this pairing as inadvisable for non-competitive
    // lifters (Essentials, 4th ed., p. 475).
    exercises: ['conventional_deadlift', 'barbell_back_squat'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Heavy deadlifts and heavy squats both impose peak lumbar compressive forces ' +
      '(~6,000–10,000 N). Combining them in one session stacks spinal load beyond what ' +
      'stabilizers can manage safely as fatigue sets in. NSCA guidelines advise against ' +
      'this pairing for general population trainees. If both are needed, reduce loading ' +
      'significantly on the second exercise, or separate them across different days.',
  },

  {
    // Sumo deadlift + barbell back squat: Same mechanism as conventional + squat.
    // Sumo slightly reduces lumbar moment arm vs. conventional, but the axial
    // compressive load at heavy intensity remains in the same dangerous range.
    exercises: ['sumo_deadlift', 'barbell_back_squat'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Sumo deadlifts and heavy barbell squats both generate high lumbar compressive ' +
      'forces. The more upright sumo torso reduces the lumbar moment arm slightly, but ' +
      'heavy loading still produces cumulative spinal stress that compounds across both ' +
      'exercises. Treat like conventional deadlift + squat: avoid heavy loading on both ' +
      'in the same session.',
  },

  {
    // Trap bar deadlift + barbell back squat: The trap bar reduces lumbar moment
    // arm vs. conventional (~15–20% per Swinton et al., 2011), making this the
    // least dangerous of the deadlift+squat pairings, but still a 'warning'
    // because at heavy loads it still accumulates meaningful spinal compression.
    exercises: ['trap_bar_deadlift', 'barbell_back_squat'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'The trap bar reduces lumbar moment arm vs. a straight bar, but at heavy loads ' +
      'it still accumulates spinal compressive stress when combined with barbell squats. ' +
      'Manageable for most healthy lifters at moderate loads; reduce weight on the ' +
      'second exercise if both are programmed.',
  },

  {
    // Conventional deadlift + barbell front squat: Front squats impose somewhat
    // less lumbar compression than back squats due to the more upright torso,
    // but the deadlift's own lumbar demand still makes this a caution pairing.
    exercises: ['conventional_deadlift', 'barbell_front_squat'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Front squats require an upright torso that reduces lumbar load vs. back squats, ' +
      'but a heavy conventional deadlift still substantially pre-fatigues lumbar ' +
      'stabilizers. The front squat\'s demanding position (wrists, elbows, upper back) ' +
      'also deteriorates rapidly when the posterior chain is already spent.',
  },

  {
    // Good mornings amplify lumbar shear because the barbell sits behind the
    // center of mass with a long moment arm — McGill identifies this as one
    // of the highest lumbar shear-stress exercises. Combining with any other
    // heavy spinal loading exercise is inadvisable.
    exercises: ['good_morning', 'barbell_back_squat'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Good mornings produce exceptionally high lumbar shear stress due to the barbell ' +
      'position behind the center of mass (McGill, 2016). Combined with barbell squats, ' +
      'cumulative lumbar shear and compression exceeds safe intra-session limits for most ' +
      'trainees. Separate these across different sessions.',
  },

  {
    exercises: ['good_morning', 'conventional_deadlift'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Good mornings generate among the highest lumbar shear stress of any barbell ' +
      'exercise. Adding a heavy conventional deadlift in the same session stacks severe ' +
      'lumbar stress. These should virtually never be programmed together at high intensity.',
  },

  {
    // Barbell row requires sustained isometric lumbar flexion/extension under load.
    // When performed after a heavy deadlift or squat, the lumbar stabilizers are
    // already fatigued, and form typically deteriorates — rounded back rowing
    // under load is a common mechanism of disc injury (McGill, 2016).
    exercises: ['conventional_deadlift', 'barbell_row'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Barbell rows require strong isometric lumbar stabilization in a hinged position. ' +
      'After heavy conventional deadlifts, the erector spinae and multifidus are already ' +
      'fatigued — this is the exact scenario in which form breaks down and lumbar rounding ' +
      'occurs under load. Use a chest-supported row instead, or do rows before deadlifts.',
  },

  {
    exercises: ['sumo_deadlift', 'barbell_row'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Same mechanism as conventional deadlift + barbell row. Sumo reduces but does not ' +
      'eliminate lumbar stabilizer fatigue. Bent-over rowing on pre-fatigued spinal ' +
      'stabilizers increases injury risk. Prefer chest-supported rows after any heavy deadlift.',
  },

  {
    // Pendlay rows are even more demanding on lumbar stabilizers than standard
    // bent-over rows because the torso must be parallel to the floor — the maximum
    // possible moment arm for the lumbar spine.
    exercises: ['conventional_deadlift', 'pendlay_row'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Pendlay rows require a horizontal torso — the maximum lumbar moment arm of any ' +
      'rowing variation. After heavy deadlifts, the erectors and multifidus are significantly ' +
      'fatigued. This combination is a high risk for lumbar form breakdown. Pendlay rows ' +
      'should come before deadlifts, or be replaced with chest-supported rows on deadlift days.',
  },

  {
    exercises: ['barbell_back_squat', 'barbell_row'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Heavy squats substantially fatigue lumbar stabilizers. Bent-over rows on fatigued ' +
      'erectors makes it harder to maintain a neutral spine under load. A warning rather ' +
      'than caution because the squat\'s lumbar demand is lower than a deadlift, but still ' +
      'consider chest-supported rows after heavy squat sessions.',
  },

  {
    // Overhead press (standing) + barbell back squat: Both require full-body
    // bracing. The standing OHP demands lumbar stabilization to prevent excessive
    // lordosis; doing it after squats (or before squats, causing shoulder fatigue
    // that carries over to squat reracking) creates compounding issues.
    exercises: ['overhead_press', 'barbell_back_squat'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'The standing overhead press requires significant lumbar bracing to prevent ' +
      'hyperextension, which compounds with the lumbar demand of heavy squats in the ' +
      'same session. Additionally, shoulder/upper back fatigue from pressing can affect ' +
      'bar position and rack/unrack safety on barbell squats. Program these on separate ' +
      'days or ensure adequate rest between them.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 2: SHOULDER IMPINGEMENT STACKING
  // Rationale: Cools et al. (2008) and Kolber et al. (2010) demonstrate that
  // subacromial impingement risk is elevated when rotator cuff stabilizers are
  // fatigued. The rotator cuff's job is to depress the humeral head during
  // overhead movement — when this mechanism is fatigued by prior horizontal
  // pressing, the humeral head rides higher in the glenoid, narrowing the
  // subacromial space. Escamilla & Andrews (2009) show that multiple overhead
  // pressing sessions in the same workout substantially increase impingement risk.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Heavy bench press (or any horizontal pressing) directly before overhead
    // pressing is the most common shoulder injury mechanism in recreational
    // lifting. The pectoralis minor tightens and internally rotates the shoulder
    // while the rotator cuff fatigues from stabilizing the first exercise —
    // both worsen the overhead impingement risk for the second exercise.
    exercises: ['barbell_bench_press', 'overhead_press'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Heavy bench press fatigues the rotator cuff stabilizers and tightens the anterior ' +
      'shoulder (pec minor), which narrows the subacromial space during subsequent overhead ' +
      'pressing. This is among the most frequently cited shoulder impingement mechanisms in ' +
      'recreational lifters (Kolber et al., 2010). If both must be in one session, do ' +
      'overhead press first, or separate them with a shoulder health exercise (face pulls) ' +
      'and significant rest.',
  },

  {
    exercises: ['incline_barbell_press', 'overhead_press'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Incline pressing has high anterior deltoid and rotator cuff involvement — more so ' +
      'than flat bench — because of the elevated pressing angle. Following with heavy ' +
      'overhead pressing stacks anterior shoulder stress and rotator cuff fatigue. ' +
      'Program these on separate days or always do overhead press first.',
  },

  {
    exercises: ['dip_chest', 'overhead_press'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Chest dips load the anterior shoulder and rotator cuff in a deep stretch position, ' +
      'creating significant glenohumeral stress. Transitioning to overhead pressing on ' +
      'fatigued rotator cuff stabilizers substantially elevates impingement risk. ' +
      'Perform overhead pressing before dips, or separate them across days.',
  },

  {
    // Two different overhead press variations in the same session.
    // Even with different equipment, the rotator cuff and scapular stabilizers
    // accumulate fatigue monotonically. The second pressing variation will be
    // performed with degraded shoulder stabilization.
    exercises: ['overhead_press', 'dumbbell_shoulder_press'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Performing two overhead press variations back-to-back accumulates rotator cuff ' +
      'and scapular stabilizer fatigue. The second exercise will be performed with ' +
      'reduced shoulder stability — increasing impingement risk and reducing force ' +
      'output. If both are included, treat the second as a lower-volume accessory with ' +
      'reduced loading, not a second primary pressing exercise.',
  },

  {
    exercises: ['overhead_press', 'arnold_press'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'The Arnold press\'s rotation component adds stress to the glenohumeral joint ' +
      'across the full pressing arc. After heavy barbell overhead press, the rotator ' +
      'cuff is fatigued and the shoulder is less able to manage the additional rotational ' +
      'demand. Risk of anterior shoulder impingement is elevated. Use one primary ' +
      'overhead pressing movement per session.',
  },

  {
    exercises: ['dumbbell_shoulder_press', 'arnold_press'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Two seated overhead pressing variations in one session leads to cumulative ' +
      'rotator cuff fatigue. The Arnold press\'s rotation demands are particularly ' +
      'stressful on a fatigued shoulder. Choose one primary overhead pressing movement.',
  },

  {
    // Upright rows with a narrow grip (already a controversial exercise) performed
    // after any overhead pressing is particularly problematic because:
    // 1. The shoulder is internally rotated at the top of the upright row
    // 2. Overhead pressing fatigue means reduced subacromial space protection
    // The data.notes for upright_row in the exercise file already calls out
    // this impingement mechanism.
    exercises: ['overhead_press', 'upright_row'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Upright rows require internal shoulder rotation at peak elevation — the exact ' +
      'position where impingement occurs. After overhead pressing, the supraspinatus ' +
      'and rotator cuff are already fatigued, dramatically increasing subacromial ' +
      'impingement risk. Upright rows should not follow overhead pressing in the same ' +
      'session. If included, do them first, use a wide grip, and stop at chest height.',
  },

  {
    exercises: ['barbell_bench_press', 'upright_row'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Horizontal pressing tightens the anterior shoulder and fatigues rotator cuff ' +
      'stabilizers, reducing the shoulder\'s ability to safely manage the internal ' +
      'rotation and elevation demands of upright rows. Use wide grip, stop at chest ' +
      'height, and consider whether upright rows add value if bench pressing is already ' +
      'in the session.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 3: ELBOW JOINT STRESS ACCUMULATION
  // Rationale: The elbow joint has limited tolerance for high-volume, high-load
  // stress within a single session. Medial elbow structures (UCL, flexor-pronator
  // mass) are loaded by heavy curl variations; lateral structures (common extensor
  // tendon, lateral epicondyle) are loaded by heavy tricep and pressing work.
  // Multiple heavy compound elbow-loading movements in one session is a primary
  // mechanism for acute and overuse elbow injury in strength athletes.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Two heavy barbell curl variations (both impose near-maximal bicep tendon
    // and medial elbow loading). The distal bicep tendon specifically is at risk
    // when subjected to repeated eccentric loading under heavy barbell loads —
    // combining barbell curl and EZ bar curl means essentially double the
    // tendon stress with minimal additional hypertrophic stimulus (they hit
    // similar portions of the bicep).
    exercises: ['barbell_curl', 'ez_bar_curl'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Barbell curls and EZ bar curls are mechanically near-identical heavy bilateral ' +
      'curl variations. Performing both in one session doubles elbow stress with minimal ' +
      'additional stimulus — they recruit the same muscle fibers through the same range ' +
      'of motion. Choose one heavy bilateral curl per session and complement it with a ' +
      'different curl variation (e.g., incline dumbbell curl for stretch emphasis, or ' +
      'hammer curl for brachialis development).',
  },

  {
    // Skull crushers + close-grip bench press: Both are heavy compound elbow
    // extension exercises with high olecranon and lateral elbow loading.
    // The tricep tendon and lateral epicondyle are subjected to repeated
    // high-force eccentric and concentric loading. This is a well-documented
    // overuse mechanism in powerlifters and bodybuilders.
    exercises: ['skull_crusher', 'close_grip_bench_press'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Skull crushers and close-grip bench press both impose high loads on the lateral ' +
      'elbow and tricep tendon. Combining heavy versions of both in the same session ' +
      'accumulates elbow extensor stress and is a common mechanism for lateral elbow ' +
      'pain (tricep tendinopathy, lateral epicondyle irritation). Choose one heavy ' +
      'compound tricep exercise and complement with lighter isolation work.',
  },

  {
    exercises: ['skull_crusher', 'dip_tricep'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Skull crushers and tricep dips both load the elbow in extension under significant ' +
      'load (bodyweight or added weight for dips; barbell for skull crushers). ' +
      'The combination accumulates lateral elbow and tricep tendon stress. ' +
      'If programming both, skull crushers should come first (as the barbell requires ' +
      'more precise control) with substantially reduced weight on dips afterward.',
  },

  {
    exercises: ['close_grip_bench_press', 'dip_tricep'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Close-grip bench press and tricep dips both impose heavy elbow extension loading. ' +
      'Dips add anterior shoulder stress on top of elbow stress. After close-grip pressing, ' +
      'both the elbow extensors and anterior shoulder are fatigued — weighted dips in this ' +
      'state significantly elevate injury risk at both joints.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 4: LUMBAR STABILIZER PRE-FATIGUE → SAFER EXERCISE DEGRADED
  // Rationale: Willardson (2007) and the NSCA (Ch. 22) emphasize that exercise
  // order should place exercises requiring the most neuromuscular precision and
  // stabilizer demand early in the session. Fatiguing lumbar stabilizers with
  // one heavy exercise before another that also requires them is a primary
  // injury risk mechanism documented in the NSCA and by McGill. The specific
  // concern is that the "active subsystem" (multifidus, erector spinae,
  // transversus abdominis) loses its ability to stiffened the spine, transferring
  // load to passive structures (discs, ligaments) which are far more injury-prone.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Stiff-leg deadlift has higher lumbar shear than RDL because of the more
    // rigid knee position. After conventional deadlifts, the lumbar stabilizers
    // are fatigued. SLDL on fatigued stabilizers with any meaningful load is
    // high-risk for disc injury — specifically at L4-L5 and L5-S1.
    exercises: ['conventional_deadlift', 'stiff_leg_deadlift'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Stiff-leg deadlifts produce higher lumbar shear stress than conventional deadlifts ' +
      'because the straighter knee position increases the lumbar moment arm. Programming ' +
      'both in one session means performing a high lumbar-shear exercise on already-fatigued ' +
      'spinal stabilizers. This is a significant disc injury risk. Use one or the other, not both.',
  },

  {
    exercises: ['conventional_deadlift', 'romanian_deadlift'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'RDLs require strong lumbar stabilization in a hinged position. After a heavy ' +
      'conventional deadlift session, the erectors and posterior chain are pre-fatigued — ' +
      'form quality during RDLs will degrade, and the risk of rounding under load increases. ' +
      'If both are in the program, RDLs should come first as a primer, or be used as a ' +
      'light accessory (not a heavy primary movement) after deadlifts.',
  },

  {
    exercises: ['sumo_deadlift', 'romanian_deadlift'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Same mechanism as conventional + RDL. Heavy sumo deadlifts pre-fatigue lumbar ' +
      'stabilizers and the posterior chain. RDLs require a precise hip hinge under load — ' +
      'this precision degrades with spinal stabilizer fatigue. Treat RDLs as light ' +
      'accessory work only if they follow any heavy deadlift variation.',
  },

  {
    exercises: ['barbell_back_squat', 'good_morning'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Good mornings require a large lumbar moment arm in a forward-leaning position — ' +
      'already a high lumbar-shear exercise on fresh legs. After heavy squats, the ' +
      'erectors and multifidus are significantly fatigued. Performing good mornings on ' +
      'pre-fatigued lumbar stabilizers substantially increases disc injury risk.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 5: ROTATOR CUFF AND SCAPULAR STABILIZER FATIGUE STACKING
  // Rationale: The rotator cuff (supraspinatus, infraspinatus, teres minor,
  // subscapularis) dynamically stabilizes the humeral head during all pressing
  // and pulling movements. When fatigued, the humeral head elevates abnormally
  // during overhead movement, compressing the supraspinatus tendon in the
  // subacromial space. Cools et al. (2008) identify this as the primary
  // mechanism for shoulder impingement in overhead athletes and lifters.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Pull-ups or chin-ups after heavy overhead pressing means performing a
    // challenging vertical pull with a rotator cuff and shoulder complex that
    // has already been loaded heavily. The dynamic shoulder stabilization
    // required for safe pull-up performance is compromised by fatigue.
    exercises: ['overhead_press', 'pull_up'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Heavy overhead pressing significantly fatigues the rotator cuff and scapular ' +
      'stabilizers. Pull-ups require these same structures for safe glenohumeral ' +
      'stabilization. Performing pull-ups after heavy overhead pressing means less ' +
      'shoulder stability, which can lead to impingement-type stress and shoulder pain, ' +
      'particularly at the top and bottom of the pull-up range. Do pull-ups before ' +
      'overhead pressing, or separate them with adequate rest.',
  },

  {
    exercises: ['overhead_press', 'chin_up'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Same mechanism as overhead press + pull-up. Chin-ups additionally load the biceps ' +
      'and medial elbow more heavily than pull-ups; combined with overhead pressing fatigue ' +
      'in the same session, shoulder and elbow stabilizer demand is compounded. Do chin-ups ' +
      'before overhead pressing.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 6: KNEE JOINT STRESS ACCUMULATION
  // Rationale: The patellofemoral joint and patellar tendon experience
  // compressive forces of 3–8x bodyweight during loaded knee extension
  // exercises (Escamilla, 2001, Medicine & Science in Sports & Exercise).
  // Multiple high-load knee extension exercises in one session can exceed
  // the patellar tendon's intra-session stress tolerance, particularly in
  // individuals with any history of anterior knee pain. Marchetti et al.
  // (2013) document patellofemoral compressive force accumulation across
  // repeated high-load knee extension exercise bouts.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Leg extensions after leg press or heavy squats: The quadriceps are already
    // heavily fatigued. Heavy leg extensions on pre-fatigued quads + a fatigued
    // patellar tendon significantly elevates the risk of patellar tendinopathy
    // and anterior knee pain. Note: light leg extensions as a pump/isolation
    // finisher are fine — the conflict is specifically with heavy loading.
    exercises: ['barbell_back_squat', 'leg_extension'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Heavy barbell squats generate substantial patellofemoral compressive stress. ' +
      'Following with heavy leg extensions on pre-fatigued quads and a patellar tendon ' +
      'that has already been loaded significantly increases anterior knee stress. ' +
      'Leg extensions are appropriate as a lighter finisher after squats, but should not ' +
      'be loaded heavily in the same session.',
  },

  {
    // Hack squat + leg extension: The hack squat machine drives the knee into
    // deep flexion with high compressive load. Adding heavy leg extensions
    // after accumulates patellofemoral stress across consecutive exercises.
    exercises: ['hack_squat_machine', 'leg_extension'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Hack squats produce high patellofemoral compressive forces in the bottom position. ' +
      'Adding heavy leg extensions afterward compounds anterior knee stress. Keep leg ' +
      'extensions at moderate load after hack squats, or use knee-sparing finishing ' +
      'exercises (leg curl supersets, hip thrust) instead.',
  },

  {
    // Leg press + hack squat: Both are machine-based loaded knee extension exercises
    // that produce high patellofemoral compressive forces. Stacking two heavy
    // machine quad presses in one session is a warning-level combination.
    exercises: ['leg_press', 'hack_squat_machine'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Leg press and hack squat both generate high patellofemoral compressive stress ' +
      'through loaded knee extension. Performing both heavily in one session accumulates ' +
      'anterior knee stress. If both are programmed, treat the second as moderate-weight ' +
      'volume work, not a second heavy primary exercise.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 7: GRIP / FOREARM FATIGUE → PULLING PERFORMANCE & SAFETY
  // Rationale: The forearm flexors provide the primary grip force in all pulling
  // exercises (deadlifts, rows, pull-ups, curls). Grip failure under a heavy
  // deadlift or barbell row is a safety concern — a compromised grip during
  // heavy pulling can cause bar drop, sudden weight shift, and acute injury.
  // The NSCA consistently places grip-intensive isolation work (wrist curls,
  // heavy preacher curls) at the END of sessions for exactly this reason
  // (Essentials, 4th ed., Ch. 22, p. 467).
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Wrist curls before any heavy pulling: Wrist curls directly fatigue the
    // wrist flexors and grip. Performing them before rows, deadlifts, or pull-ups
    // compromises the grip integrity needed for safe, heavy pulling.
    exercises: ['wrist_curl', 'conventional_deadlift'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Wrist curls directly fatigue the forearm flexors and grip. Performing them before ' +
      'heavy deadlifts means you will approach maximum pulls with a pre-fatigued grip — ' +
      'a safety hazard. A compromised grip on a heavy deadlift can cause bar drop and ' +
      'loss of control. Always perform wrist and forearm isolation work after all ' +
      'heavy pulling, not before.',
  },

  {
    exercises: ['wrist_curl', 'barbell_row'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Wrist curls fatigue the grip and wrist flexors. Heavy barbell rows rely on strong ' +
      'grip to maintain bar control through a full range of motion. Pre-fatiguing the ' +
      'forearm flexors before rows reduces grip reliability and forces earlier form ' +
      'compromise. Do wrist curls after rows, not before.',
  },

  {
    exercises: ['wrist_curl', 'pull_up'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Grip fatigue from wrist curls will limit pull-up performance and, more importantly, ' +
      'grip security at the top of the movement. Always perform grip/forearm isolation ' +
      'after pull-ups and other pulling work.',
  },

  {
    exercises: ['reverse_wrist_curl', 'conventional_deadlift'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Reverse wrist curls fatigue the wrist extensors and brachioradialis, which are ' +
      'active grip stabilizers during heavy deadlifts. Pre-fatiguing these before a heavy ' +
      'pull reduces grip security. Perform forearm isolation work after all heavy pulling.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY 8: PATTERN-LEVEL CONFLICTS
  // These use matchBy: 'pattern' and apply to any pair of exercises sharing
  // both movement patterns in the same session. They cover cases not captured
  // by specific exercise ID pairs above.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Two hip hinge exercises at heavy intensity: Any two exercises from the
    // hip_hinge pattern (deadlift variations, RDL, SLDL, good mornings,
    // kettlebell swings, rack pulls) performed at high intensity in the same
    // session accumulates lumbar stabilizer fatigue.
    exercises: ['hip_hinge', 'hip_hinge'],
    matchBy: 'pattern',
    severity: 'warning',
    reason:
      'Two heavy hip hinge movements (e.g., deadlift + RDL, sumo + conventional) in one ' +
      'session accumulates significant lumbar stabilizer fatigue and posterior chain stress. ' +
      'If both are programmed, perform the more demanding exercise first at full intensity ' +
      'and treat the second as lighter accessory volume. Consider whether both are necessary ' +
      'in the same session.',
  },

  {
    // Two vertical push patterns: overhead press + any other overhead pressing
    // variation. The rotator cuff and scapular stabilizer fatigue accumulates
    // regardless of equipment (barbell OHP + dumbbell shoulder press, etc.).
    exercises: ['vertical_push', 'vertical_push'],
    matchBy: 'pattern',
    severity: 'warning',
    reason:
      'Two overhead pressing movements in one session accumulates rotator cuff and ' +
      'scapular stabilizer fatigue. The second exercise will be performed with reduced ' +
      'shoulder stability. If both are programmed, ensure the second is a lighter ' +
      'accessory with reduced loading — treat it as additional volume, not a second ' +
      'primary pressing exercise.',
  },

  {
    // Two squat-pattern movements at high intensity: Any two squat-pattern exercises
    // (barbell back squat, front squat, hack squat, leg press, etc.) heavy in one
    // session significantly increases cumulative quadriceps and spinal stress.
    exercises: ['squat', 'squat'],
    matchBy: 'pattern',
    severity: 'warning',
    reason:
      'Two heavy squat-pattern exercises in one session (e.g., barbell back squat + hack ' +
      'squat) accumulates significant patellofemoral stress and quadriceps fatigue. The ' +
      'second exercise should be treated as moderate-load volume work, not a second ' +
      'heavy primary squat. Consider pairing one squat movement with a hip hinge or ' +
      'isolation exercise instead.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL CONFLICTS — newly added exercises
  // ═══════════════════════════════════════════════════════════════════════════

  {
    // Reverse-grip bench press places the shoulders in a vulnerable externally
    // rotated position under heavy load. Combining with overhead pressing
    // increases cumulative shoulder stress and impingement risk.
    // Noteboom et al. (2024) Frontiers in Physiology — grip-dependent shoulder joint forces
    exercises: ['reverse_grip_bench_press', 'overhead_press'],
    matchBy: 'id',
    severity: 'caution',
    reason:
      'Reverse-grip bench press places shoulders in a vulnerable position; combining with ' +
      'overhead pressing increases cumulative shoulder stress and impingement risk.',
  },

  {
    // Dumbbell skull crushers + close-grip bench press: Both are heavy compound
    // elbow extension exercises with high eccentric load on the elbow extensors.
    // Clinical consensus — cumulative elbow extensor loading
    exercises: ['dumbbell_skull_crusher', 'close_grip_bench_press'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Both exercises place high eccentric load on the elbow extensors. Combining them ' +
      'increases risk of elbow tendinopathy, especially at higher volumes.',
  },

  {
    // Dumbbell skull crushers + tricep dips: Both are heavy elbow extension
    // exercises. Skull crushers followed by dips create cumulative stress on
    // the elbow joint and triceps tendons.
    // Clinical consensus — cumulative elbow extensor loading
    exercises: ['dumbbell_skull_crusher', 'dip_tricep'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Both are heavy elbow extension exercises. Skull crushers followed by dips create ' +
      'cumulative stress on the elbow joint and triceps tendons.',
  },

  {
    // EZ-bar preacher curl + EZ-bar curl: Both are bilateral EZ-bar elbow
    // flexion exercises with similar loading patterns. Redundant pairing.
    // Marcolin et al. (2018) PeerJ — EZ bar vs straight bar curl equivalence
    exercises: ['ez_bar_preacher_curl', 'ez_bar_curl'],
    matchBy: 'id',
    severity: 'warning',
    reason:
      'Both are bilateral EZ-bar elbow flexion exercises with similar loading patterns. ' +
      'Redundant pairing — choose one for the workout to avoid excessive elbow flexor volume.',
  },

];

/**
 * Helper: return all conflicts that involve a given exercise ID.
 * For 'id' conflicts, checks both positions in the exercises tuple.
 * For 'pattern' and 'tag' conflicts, the consuming code must handle
 * the matching logic using exercise metadata.
 */
export function getConflictsForExercise(
  exerciseId: string,
): ExerciseConflict[] {
  return EXERCISE_CONFLICTS.filter(
    (c) => c.matchBy === 'id' && c.exercises.includes(exerciseId),
  );
}

/**
 * Helper: given two exercise IDs, return any direct ID-based conflicts between them.
 */
export function getConflictBetween(
  exerciseIdA: string,
  exerciseIdB: string,
): ExerciseConflict | undefined {
  return EXERCISE_CONFLICTS.find(
    (c) =>
      c.matchBy === 'id' &&
      ((c.exercises[0] === exerciseIdA && c.exercises[1] === exerciseIdB) ||
        (c.exercises[0] === exerciseIdB && c.exercises[1] === exerciseIdA)),
  );
}

/**
 * Helper: given two movement_pattern strings, return any pattern-level conflicts.
 */
export function getPatternConflict(
  patternA: string,
  patternB: string,
): ExerciseConflict | undefined {
  return EXERCISE_CONFLICTS.find(
    (c) =>
      c.matchBy === 'pattern' &&
      ((c.exercises[0] === patternA && c.exercises[1] === patternB) ||
        (c.exercises[0] === patternB && c.exercises[1] === patternA) ||
        // Self-conflict (same pattern twice): patternA === patternB
        (c.exercises[0] === patternA && c.exercises[1] === patternA && patternA === patternB)),
  );
}
