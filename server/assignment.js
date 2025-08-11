// assignment.js (ESM)

export function categoriaDuracion(categoria) {
  // U13 = 60'; el resto = 90'
  return (categoria && categoria.toUpperCase() === "U13") ? 60 : 90;
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}

// distancia haversine (km)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// buffer de traslado: 30 km/h urbano -> minutos = km/30*60
function travelBufferMinutes(km) {
  return Math.ceil((km / 30) * 60);
}

/**
 * Verifica si el árbitro puede dirigir el partido:
 *  - dentro de su disponibilidad
 *  - sin solaparse con otros partidos del día
 *  - respetando buffer de viaje entre sedes
 */
export function canRefereeMatch(ref, match, clubs, availability, refereeAssignments) {
  // 1) Disponibilidad por día/hora
  const date = new Date(`${match.fecha}T${match.hora}:00`);
  const dow = date.getDay(); // 0=Dom, ... 6=Sáb
  const avails = availability.filter(
    (a) => a.refereeId === ref.id && a.dayOfWeek === dow
  );

  const startM = toMinutes(match.hora);
  const endM = startM + categoriaDuracion(match.categoria);

  const okAvail = avails.some((a) => {
    const fromM = toMinutes(a.from);
    const toM = toMinutes(a.to);
    return startM >= fromM && endM <= toM;
  });
  if (!okAvail) return false;

  // 2) No solape + considerar traslados
  const clubActual = clubs.find((c) => c.id === match.clubSedeId);
  const sameDay = refereeAssignments
    .filter((x) => x.refereeId === ref.id && x.fecha === match.fecha)
    .sort((a, b) => a.inicioM - b.inicioM);

  for (const prev of sameDay) {
    // solape directo
    const overlap = !(endM <= prev.inicioM || startM >= prev.finM);
    if (overlap) return false;

    // si empieza después del anterior: buffer desde la sede anterior
    if (startM >= prev.finM) {
      const km = haversineKm(prev.lat, prev.lon, clubActual.lat, clubActual.lon);
      const buffer = travelBufferMinutes(km);
      if (startM < prev.finM + buffer) return false;
    }

    // si termina antes del siguiente: buffer hacia la sede del siguiente
    if (endM <= prev.inicioM) {
      const km = haversineKm(clubActual.lat, clubActual.lon, prev.lat, prev.lon);
      const buffer = travelBufferMinutes(km);
      if (endM + buffer > prev.inicioM) return false;
    }
  }

  return true;
}

/**
 * Asigna automáticamente 2 árbitros por partido:
 *  - filtra elegibles con canRefereeMatch
 *  - prioriza menor carga ese día y “cercanía” a la sede (proxy simple)
 */
export function autoAssign(db) {
  const { clubs, referees, availability, matches, assignments } = db;

  // índice de agenda por árbitro
  const refSched = {}; // refId -> [{fecha, inicioM, finM, lat, lon}]
  for (const a of assignments) {
    const match = matches.find((m) => m.id === a.matchId);
    if (!match) continue;
    const startM = toMinutes(match.hora);
    const finM = startM + categoriaDuracion(match.categoria);
    const club = clubs.find((c) => c.id === match.clubSedeId);
    for (const rId of [a.referee1Id, a.referee2Id]) {
      if (!rId) continue;
      (refSched[rId] ||= []).push({
        fecha: match.fecha,
        inicioM: startM,
        finM,
        lat: club.lat,
        lon: club.lon,
      });
    }
  }

  const result = [];

  for (const match of matches) {
    const existing = assignments.find((a) => a.matchId === match.id);
    if (existing && existing.referee1Id && existing.referee2Id) continue;

    const startM = toMinutes(match.hora);
    const finM = startM + categoriaDuracion(match.categoria);
    const sede = clubs.find((c) => c.id === match.clubSedeId);

    // árbitros elegibles
    const eligibles = referees.filter((r) => {
      const sched = (refSched[r.id] || []);
      const mapped = sched.map((x) => ({
        refereeId: r.id,
        fecha: x.fecha,
        inicioM: x.inicioM,
        finM: x.finM,
        lat: x.lat,
        lon: x.lon,
      }));
      return canRefereeMatch(r, match, clubs, availability, mapped);
    });

    // puntuar por carga y “distancia” respecto al último partido del día
    const scored = eligibles
      .map((r) => {
        const sched = refSched[r.id] || [];
        const sameDay = sched.filter((x) => x.fecha === match.fecha);
        const last = sameDay.sort((a, b) => a.finM - b.finM).at(-1);
        // proxy de cercanía (euclidiana en grados; sirve para ordenar)
        const dist =
          last
            ? Math.hypot(last.lat - sede.lat, last.lon - sede.lon)
            : 0;
        return { r, carga: sameDay.length, dist };
      })
      .sort((a, b) => a.carga - b.carga || a.dist - b.dist);

    const toAssign = scored.slice(0, 2).map((x) => x.r.id);
    if (toAssign.length === 0) continue;

    if (existing) {
      existing.referee1Id = existing.referee1Id || toAssign[0];
      existing.referee2Id =
        existing.referee2Id || (toAssign.length > 1 ? toAssign[1] : existing.referee2Id);
    } else {
      assignments.push({
        id: `as-${match.id}`,
        matchId: match.id,
        referee1Id: toAssign.length > 0 ? toAssign[0] : null,
        referee2Id: toAssign.length > 1 ? toAssign[1] : null,
      });
    }

    // actualizar agenda en memoria
    for (const rid of toAssign) {
      (refSched[rid] ||= []).push({
        fecha: match.fecha,
        inicioM: startM,
        finM,
        lat: sede.lat,
        lon: sede.lon,
      });
    }

    result.push({ matchId: match.id, refereeIds: toAssign });
  }

  return result;
}
