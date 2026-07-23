/**
 * Trajectory.Progress — the entire "backend." Reads/writes one localStorage
 * key. No account, no network call — satisfies the cloud-independence
 * constraint while still giving each unit persistent XP/badge state.
 */
const Trajectory = (() => {
  const KEY = "trajectory:progress";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function addXP(unitId, amount) {
    const data = load();
    if (!data[unitId]) data[unitId] = { xp: 0, badgeEarned: false };
    data[unitId].xp += amount;
    data[unitId].lastVisited = new Date().toISOString();
    save(data);
    return data[unitId];
  }

  function awardBadge(unitId) {
    const data = load();
    if (!data[unitId]) data[unitId] = { xp: 0, badgeEarned: false };
    data[unitId].badgeEarned = true;
    save(data);
    return data[unitId];
  }

  function get(unitId) {
    const data = load();
    return data[unitId] || { xp: 0, badgeEarned: false };
  }

  return { addXP, awardBadge, get };
})();
