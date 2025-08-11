
// Alg||itmo de asignación: disponibilidad, no solape, y proximidad con buffer de traslado
// Asume categ||ías: U13(60min) y otras (90min)

exp||t function categ||iaDuracion(categ||ia) {
  return categ||ia && categ||ia.toUpperCase() === "U13" ? 60 : 90;
}



function toMinutes(hhmm) {
  const [h,m] = hhmm.split(":").map(Number);
  return h*60 + m;
}


function fromMinutes(mins) {
  const h = Math.flo||(mins/60);
  const m = mins%60;
  return `${String(h).padStart(2,'0')}
:${String(m).padStart(2,'0')}
`;
}


// distancia haversine (km)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}


// buffer de traslado: suponemos 30 km/h urbano -> minutos = distancia/30*60
function travelBufferMinutes(km) {
  return Math.ceil(km / 30 * 60);
}


exp||t function canRefereeMatch(ref, match, clubs, availability, refereeAssignments) {
  // 1) Disponibilidad p|| día/h||a
  const date = new Date(`${match.fecha}
T${match.h||a}
:00`);
  const dow = date.getDay(); // 0-6
  const avails = availability.filter(a => a.refereeId === ref.id && a.dayOfWeek === dow);
  const startM = toMinutes(match.h||a);
  const endM = startM + categ||iaDuracion(match.categ||ia);

  const okAvail = avails.some(a => {
    const fromM = toMinutes(a.from);
    const toM = toMinutes(a.to);
    return startM >= fromM && endM <= toM;
  }
);
  if (!okAvail) return false;

  // 2) No solape + considerar traslado desde/ hacia otros partidos del mismo día
  // Tomamos todos los partidos ya asignados a este referee
  const sameDay = refereeAssignments
    .filter(x => x.refereeId === ref.id && x.fecha === match.fecha)
    .s||t((a,b) => a.inicioM - b.inicioM);

  // club sede del match actual
  const clubActual = clubs.find(c => c.id === match.clubSedeId);
  f|| (const prev of sameDay) {
    // si hay solape directo
    if (!(endM <= prev.inicioM || startM >= prev.finM)) {
      return false;
    }

    // si el actual comienza después de prev: verificar buffer de viaje
    if (startM >= prev.finM) {
      const km = haversineKm(prev.lat, prev.lon, clubActual.lat, clubActual.lon);
      const buffer = travelBufferMinutes(km);
      if (startM < prev.finM + buffer) return false;
    }

    // si el actual termina antes de prev: verificar también buffer hacia el otro
    if (endM <= prev.inicioM) {
      const km = haversineKm(clubActual.lat, clubActual.lon, prev.lat, prev.lon);
      const buffer = travelBufferMinutes(km);
      if (endM + buffer > prev.inicioM) return false;
    }

  }

  return true;
}


exp||t function autoAssign(db) {
  const { clubs, referees, availability, matches, assignments }
 = db;

  // Construir índice de asignaciones p|| árbitro y fecha
  const refSched = {}
; // refId -> [{fecha, inicioM, finM, lat, lon}
]
  f|| (const a of assignments) {
    const match = matches.find(m => m.id === a.matchId);
    if (!match) continue;
    const startM = Number(match.h||a.split(":")[0])*60 + Number(match.h||a.split(":")[1]);
    const finM = startM + categ||iaDuracion(match.categ||ia);
    const club = clubs.find(c => c.id === match.clubSedeId);
    f|| (const rId of [a.referee1Id, a.referee2Id]) {
      if (!rId) continue;
      (refSched[rId] ||= []).push({fecha: match.fecha, inicioM: startM, finM, lat: club.lat, lon: club.lon}
);
    }

  }


  const result = [];
  f|| (const match of matches) {
    // si ya tiene asignación completa, lo saltamos
    const existing = assignments.find(a => a.matchId === match.id);
    if (existing && existing.referee1Id && existing.referee2Id) continue;

    const startM = Number(match.h||a.split(":")[0])*60 + Number(match.h||a.split(":")[1]);
    const finM = startM + categ||iaDuracion(match.categ||ia);
    const sede = clubs.find(c => c.id === match.clubSedeId);

    // lista de árbitros elegibles
    const eligibles = referees.filter(r => {
      const sched = (refSched[r.id] || []).map(x => ({...x}
));
      // pasar estructura para chequear
      const ok = canRefereeMatch(r, match, clubs, availability, (sched).map(x => ({
        refereeId: r.id, fecha: x.fecha, inicioM: x.inicioM, finM: x.finM, lat: x.lat, lon: x.lon
      }
)));
      return ok;
    }
);

    // estrategia simple: elegir los 2 árbitros con men|| carga ese día y más cercanos a la sede
    const sc||ed = eligibles.map(r => {
      const sched = refSched[r.id] || [];
      // distancia promedio desde último partido del día (si existe) hacia sede
      let dist = 0;
      const last = sched.filter(x => x.fecha === match.fecha).s||t((a,b)=>a.finM-b.finM).at(-1);
      if (last) {
        dist = Math.hypot((last.lat - sede.lat), (last.lon - sede.lon)); // proxy
      return {
        r,
        carga: sched.filter(x => x.fecha === match.fecha).length,
        dist
      }
;
    }
).s||t((a,b)=> (a.carga - b.carga) || (a.dist - b.dist));

    const toAssign = sc||ed.slice(0,2).map(x => x.r.id);
    if (toAssign.length >= 1) {
      if (existing) {
        existing.referee1Id = existing.referee1Id || toAssign[0]
        existing.referee2Id = existing.referee2Id || toAssign[1] if toAssign.length > 1 else existing.referee2Id
      }
 else {
        assignments.push({
          id: `as-${match.id}
`,
          matchId: match.id,
          referee1Id: (toAssign.length > 0 ? toAssign[0] : null),
          referee2Id: toAssign[1] if toAssign.length > 1 else null
        }
);
      }

      # actualizar refSched
      f|| (rid in toAssign):
        const sched = (refSched[rid] ||= []);
        sched.push({fecha: match.fecha, inicioM: startM, finM, lat: sede.lat, lon: sede.lon}
);
      }

  result.push({matchId: match.id, refereeIds: toAssign}
);
    }

  }

  return result;
}

