const endpoint = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';
const fields = 'idweb,objet,nomacheteur,code_departement_prestation,code_departement,descripteur_libelle,dateparution,datelimitereponse,nature,etat,sousnature';
const active = "(code_departement_prestation IN ('57') OR code_departement IN ('57')) AND nature = 'APPEL_OFFRE' AND datelimitereponse > now() AND dateparution <= now()";
const climate = /\b(?:cvc|chauffage\w*|chaufferie\w*|ventilation\w*|climatisation\w*|genie climatique|pompes? a chaleur|reseaux? de chaleur|installations? thermiques?)\b/;
const reference = /^\d{2}-\d{1,7}$/;
const paris = new Intl.DateTimeFormat('fr-FR', {timeZone:'Europe/Paris', dateStyle:'long', timeStyle:'short'});

function list(value) {
  return (Array.isArray(value) ? value : [value]).filter(Boolean).map(String);
}

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ');
}

function matchesScope(row) {
  const works = list(row.code_departement_prestation);
  const published = list(row.code_departement);
  const local = works.length ? works.includes('57') : published.length === 1 && published[0] === '57';
  const title = normalize(row.objet || '');
  if (!local || !title || !reference.test(row.idweb) || row.nature !== 'APPEL_OFFRE') return false;
  if (/annul|attribu|sans suite|preinformation/.test(normalize([row.etat, row.sousnature].join(' ')))) return false;
  if (/\b(?:assistance a maitrise d ouvrage|maitrise d oeuvre|genie civil|fourniture de combustible seul)\b/.test(title)) return false;
  return climate.test(title) || climate.test(normalize(list(row.descripteur_libelle).join(' ')));
}

async function query(where, select, fetcher, signal) {
  const rows = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const url = new URL(endpoint);
    url.search = new URLSearchParams({ where, select, order_by: 'dateparution DESC,idweb DESC', limit, offset });
    const response = await fetcher(url, {cache:'no-store', credentials:'omit', referrerPolicy:'no-referrer', signal});
    if (!response.ok) throw new Error('BOAMP HTTP ' + response.status);
    const {results, total_count} = await response.json();
    if (!Array.isArray(results) || !Number.isInteger(total_count) || total_count < 0) throw new Error('Réponse BOAMP inattendue');
    rows.push(...results);
    if (offset + results.length >= total_count) return rows;
    if (results.length !== limit) throw new Error('Réponse BOAMP incomplète');
  }
}

export async function getOffers(fetcher = fetch, signal) {
  const rows = await query(active, fields, fetcher, signal);
  const offers = new Map(rows.filter(matchesScope).map(row => [row.idweb, row]));
  const ids = [...offers.keys()];
  // A newer notice can cancel or shorten a call even when it has no future deadline of its own.
  for (let i = 0; i < ids.length; i += 25) {
    const group = ids.slice(i, i + 25).map(id => "'" + id + "'").join(',');
    const linked = await query('(annonce_lie IN (' + group + ') OR annonces_anterieures IN (' + group + ')) AND dateparution <= now()',
      'idweb,dateparution,nature,etat,annonce_lie,annonces_anterieures', fetcher, signal);
    for (const update of linked) {
      for (const id of [...list(update.annonce_lie), ...list(update.annonces_anterieures)]) {
        const original = offers.get(id);
        if (original && update.idweb !== id && update.dateparution >= original.dateparution &&
            (update.etat === 'RECTIFICATIF' || ['ANNULATION','ATTRIBUTION','APPEL_OFFRE'].includes(update.nature))) {
          offers.delete(id);
        }
      }
    }
  }
  const now = Date.now();
  return [...offers.values()].filter(row => Date.parse(row.datelimitereponse) > now)
    .sort((a, b) => Date.parse(a.datelimitereponse) - Date.parse(b.datelimitereponse) || a.idweb.localeCompare(b.idweb));
}

function card(row) {
  const fragment = document.querySelector('#offer-template').content.cloneNode(true);
  fragment.querySelector('.reference').textContent = 'BOAMP ' + row.idweb;
  fragment.querySelector('h2').textContent = row.objet;
  fragment.querySelector('.buyer').textContent = row.nomacheteur || 'Acheteur à vérifier dans l’avis';
  fragment.querySelector('.place').textContent = list(row.code_departement_prestation).includes('57')
    ? 'Moselle dans les lieux d’exécution' : 'Publié en Moselle · lieu d’exécution à confirmer';
  const deadline = fragment.querySelector('time');
  deadline.dateTime = row.datelimitereponse;
  deadline.textContent = paris.format(new Date(row.datelimitereponse));
  fragment.querySelector('a').href = 'https://www.boamp.fr/pages/avis/?q=' + encodeURIComponent('idweb:' + row.idweb);
  return fragment;
}

if (typeof document !== 'undefined') {
  const status = document.querySelector('#status');
  const results = document.querySelector('#results');
  const refresh = document.querySelector('#refresh');
  async function load() {
    if (refresh.disabled) return;
    refresh.disabled = true;
    results.replaceChildren();
    status.textContent = 'Consultation du BOAMP en cours…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const offers = await getOffers(fetch, controller.signal);
      results.replaceChildren(...offers.map(card));
      const count = offers.length === 0 ? 'Aucun avis correspondant avec une échéance future' :
        offers.length === 1 ? '1 avis avec une échéance future' : offers.length + ' avis avec une échéance future';
      status.textContent = count + ' · BOAMP consulté le ' + paris.format(new Date()) + ' (heure de Paris).';
    } catch {
      status.textContent = 'Impossible de consulter le BOAMP pour le moment. Réessayez ou ouvrez la recherche officielle ci-dessous.';
    } finally {
      clearTimeout(timeout);
      refresh.disabled = false;
    }
  }
  refresh.addEventListener('click', load);
  window.addEventListener('pageshow', event => { if (event.persisted) load(); });
  load();
}
